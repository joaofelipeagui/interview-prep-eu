import Anthropic, { APIError } from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getCountry } from '@/lib/countries'
import { buildRoleContext } from '@/lib/professions'
import { LookupError, ValidationError } from '@/lib/errors'
import {
  checkAndRecordEvaluateAttempt,
  checkAndRecordQuestionAttempt,
  hasPersonAlreadyUsedAttempt,
  isGlobalEvaluateCapReached,
  recordLead,
} from '@/lib/usageStore'
import { getActiveSubscription } from '@/lib/subscriptions'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MAX_ASKED_SO_FAR = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function textFromMessage(msg: Anthropic.Message): string {
  const block = msg.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new Error('Claude returned no text content')
  }
  return block.text
}

function validateAskedSoFar(value: unknown): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every(q => typeof q === 'string')) {
    throw new ValidationError('askedSoFar must be an array of strings')
  }
  return value.slice(-MAX_ASKED_SO_FAR)
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

function requireClientId(req: NextRequest): string {
  const clientId = req.headers.get('x-client-id')
  if (!clientId) throw new ValidationError('x-client-id header is required')
  return clientId
}

/** Paying subscribers (verified by an active, non-expired plan tied to their email) skip the free-tier gates entirely. */
async function hasActiveSubscription(req: NextRequest): Promise<boolean> {
  const email = req.headers.get('x-user-email')
  if (!email || !EMAIL_PATTERN.test(email.trim())) return false
  const sub = await getActiveSubscription(email.trim().toLowerCase())
  return sub !== null
}

export async function POST(req: NextRequest) {
  try {
    const { type, payload } = await req.json()

    if (type === 'lead') {
      const { email } = payload
      if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
        throw new ValidationError('email must be a valid address')
      }
      await recordLead(email.trim().toLowerCase())
      return NextResponse.json({ ok: true })
    }

    if (type === 'question') {
      const { countryId, professionId, customProfession, askedSoFar } = payload
      const ip = clientIp(req)
      const clientId = requireClientId(req)
      const subscribed = await hasActiveSubscription(req)

      if (!subscribed) {
        if (await hasPersonAlreadyUsedAttempt(ip, clientId)) {
          return NextResponse.json({ error: 'limit_reached', scope: 'person' }, { status: 429 })
        }
        if (await isGlobalEvaluateCapReached()) {
          return NextResponse.json({ error: 'limit_reached', scope: 'global' }, { status: 429 })
        }
        if (!(await checkAndRecordQuestionAttempt())) {
          return NextResponse.json({ error: 'limit_reached', scope: 'global' }, { status: 429 })
        }
      }

      const country = getCountry(countryId)
      const roleContext = buildRoleContext(professionId, customProfession)
      const recentAsked = validateAskedSoFar(askedSoFar)

      const examples = country.sampleQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')

      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: `<role>${country.interviewerStyle}</role>\n<candidate_context>${roleContext}</candidate_context>\n<real_example_questions_for_this_style>\nThese are real interview questions reported by candidates in this style/region (sourced from Glassdoor, Reddit r/interviews, and interview-prep sites). Use them ONLY as a reference for tone, phrasing, and level of specificity — do not repeat them verbatim, and adapt the topic to the candidate's stated profession/domain in candidate_context above.\n${examples}\n</real_example_questions_for_this_style>\n<instructions>${country.questionGuidance} Ask ONE question only, in English, in character, in a phrasing style consistent with the real examples above, but about the candidate's actual profession/domain. Do not add preamble or explanation — return only the interview question itself.</instructions>`,
        messages: [{
          role: 'user',
          content: recentAsked.length
            ? `Questions already asked in this session:\n${recentAsked.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nAsk a new, different question.`
            : 'Ask the first question of this interview.',
        }],
      })

      return NextResponse.json({ question: textFromMessage(msg).trim() })
    }

    if (type === 'evaluate') {
      const { countryId, professionId, customProfession, question, answer, paceWpm, fillerWordCount } = payload
      const ip = clientIp(req)
      const clientId = requireClientId(req)
      const subscribed = await hasActiveSubscription(req)

      if (!subscribed) {
        const usageResult = await checkAndRecordEvaluateAttempt(ip, clientId)
        if (!usageResult.allowed) {
          return NextResponse.json({ error: 'limit_reached', scope: usageResult.scope }, { status: 429 })
        }
      }

      const country = getCountry(countryId)
      const roleContext = buildRoleContext(professionId, customProfession)

      const deliveryNotes: string[] = []
      if (typeof paceWpm === 'number') {
        deliveryNotes.push(`spoke at approximately ${paceWpm} words per minute (natural, confident interview pace is roughly 110-150 wpm; worth flagging if notably fast >170, which can read as nervous/rushed, or slow <90, which can read as hesitant)`)
      }
      if (typeof fillerWordCount === 'number') {
        deliveryNotes.push(`used approximately ${fillerWordCount} verbal filler(s) ("um", "uh", "like", "you know", "kind of", "sort of", "I mean") in this spoken answer (worth flagging as a delivery habit if this is more than roughly 1 filler per 20 words)`)
      }
      const paceNote = deliveryNotes.length
        ? `\n<speaking_delivery>The candidate spoke this answer aloud (voice input). They ${deliveryNotes.join('; and ')}. Weave a brief, constructive comment about this into PONTOS A MELHORAR if it's notable — don't invent a dedicated section for it.</speaking_delivery>`
        : ''

      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: `<role>${country.interviewerStyle}</role>\n<candidate_context>${roleContext}</candidate_context>\n<evaluation_focus>${country.evaluationFocus}</evaluation_focus>${paceNote}\n<scoring_rubric>\nScore on a continuous 1.1-10.0 scale, ALWAYS with exactly one decimal place (e.g. 6,4 or 8,7 — use a comma as the decimal separator, Brazilian Portuguese convention), using this internationally recognized structured-interview scorecard convention (the same style used in behavioral/competency-based hiring loops), mapped to these decimal bands:\n1,1-2,9 = Não atende às expectativas (vaga, sem estrutura, sem evidência concreta)\n3,0-4,9 = Abaixo do esperado (estrutura fraca, faltam detalhes ou métricas)\n5,0-6,9 = Atende parcialmente (estrutura razoável, mas incompleta ou genérica)\n7,0-8,4 = Atende bem (clara, estruturada, com evidência concreta)\n8,5-10,0 = Excede expectativas (excepcional, estruturada, quantificada, memorável)\nUse the decimal precision deliberately to differentiate answers that would otherwise tie on an integer scale — do not default to round numbers.\n</scoring_rubric>\n<instructions>\nEvaluate the candidate's answer to your interview question on THREE independent dimensions: (1) interview substance/style fit for this country, judged against the candidate's stated profession/domain in candidate_context, (2) how well the answer is STRUCTURED using the STAR framework (Situation, Task, Action, Result) — the internationally recognized standard for structuring behavioral interview answers, applicable as a communication baseline regardless of this country's additional style expectations, and (3) English language quality (grammar, vocabulary, naturalness) regardless of country. Respond in Portuguese (the candidate is Brazilian preparing in English but wants feedback in Portuguese). Structure your response in this exact format with these exact headers:\n\nNOTA: [score with one decimal, comma separator, e.g. 7,3] — [band label from the rubric above]\n\nPONTOS FORTES:\n- [bullet points, interview substance/style]\n\nPONTOS A MELHORAR:\n- [bullet points, specific to this country's interview style; include a pace comment here if speaking_pace was provided and notable]\n\nESTRUTURA DA RESPOSTA (STAR):\nPara cada componente, diga se está presente, ausente ou fraco, com um comentário de uma linha:\n- Situação (contexto): ...\n- Tarefa (objetivo/responsabilidade): ...\n- Ação (o que você especificamente fez): ...\n- Resultado (impacto mensurável): ...\nDica de reestruturação: [one concrete, specific tip on how to reorganize THIS answer into a tighter STAR flow]\n\nO QUE O RECRUTADOR QUER OUVIR:\n[Explain, generically (not tied to the candidate's specific facts), the underlying rubric this question is actually testing for in this country's interview culture — what themes, structure, and signals a strong answer would hit (e.g. "for this style of question, interviewers listen for X, Y, Z, in this order, because..."). This is the hidden scoring criteria, written as coaching, not as a rewritten answer.]\n\nINGLÊS — CORREÇÕES E MELHORIAS:\n- [for each notable grammar, word-choice, or unnatural-phrasing issue found in the candidate's actual words: quote the original snippet, then \"→\" the corrected/more natural version, then a one-line reason in Portuguese. If the English was already strong, say so briefly instead of inventing issues.]\n\nRESPOSTA MODELO:\n[a stronger rewritten version of the answer, in English, same length or shorter, structured clearly in STAR order, that would perform better with this specific interviewer style AND uses correct, natural English]\n</instructions>`,
        messages: [{
          role: 'user',
          content: `<question>${question}</question>\n\n<candidate_answer>${answer}</candidate_answer>`,
        }],
      })

      return NextResponse.json({ feedback: textFromMessage(msg).trim() })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err) {
    console.error('Interview API error:', err)

    if (err instanceof LookupError || err instanceof ValidationError) {
      return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
    }
    if (err instanceof APIError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
    return NextResponse.json({ error: 'Não foi possível processar sua solicitação. Tente novamente.' }, { status: 500 })
  }
}
