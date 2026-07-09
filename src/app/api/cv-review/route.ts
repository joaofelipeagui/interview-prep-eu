import Anthropic, { APIError } from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { getCountry } from '@/lib/countries'
import { buildRoleContext } from '@/lib/professions'
import { LookupError, ValidationError } from '@/lib/errors'
import { getActiveSubscription } from '@/lib/subscriptions'
import { checkAndRecordCvAttempt } from '@/lib/usageStore'
import { recordFreeCvUsed } from '@/lib/analyticsStore'
import { extractTextFromFile } from '@/lib/extractCvText'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_CV_CHARS = 8000

function textFromMessage(msg: Anthropic.Message): string {
  const block = msg.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new Error('Claude returned no text content')
  }
  return block.text
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

async function hasActiveSubscription(req: NextRequest): Promise<boolean> {
  const email = req.headers.get('x-user-email')
  if (!email || !EMAIL_PATTERN.test(email.trim())) return false
  const sub = await getActiveSubscription(email.trim().toLowerCase())
  return sub !== null
}

export async function POST(req: NextRequest) {
  try {
    const subscribed = await hasActiveSubscription(req)

    if (!subscribed) {
      const clientId = req.headers.get('x-client-id')
      if (!clientId) throw new ValidationError('x-client-id header is required')
      const ip = clientIp(req)
      const usageResult = await checkAndRecordCvAttempt(ip, clientId)
      if (!usageResult.allowed) {
        return NextResponse.json({ error: 'limit_reached', scope: usageResult.scope }, { status: 429 })
      }
    }

    const formData = await req.formData()
    const countryId = formData.get('countryId')
    const professionId = formData.get('professionId')
    const customProfession = formData.get('customProfession')
    const file = formData.get('file')
    const pastedText = formData.get('cvText')

    if (typeof countryId !== 'string' || typeof professionId !== 'string') {
      throw new ValidationError('countryId and professionId are required')
    }

    let cvText: string
    if (file instanceof File && file.size > 0) {
      cvText = await extractTextFromFile(file)
    } else if (typeof pastedText === 'string' && pastedText.trim()) {
      cvText = pastedText.trim()
    } else {
      throw new ValidationError('cvText or file is required')
    }
    const trimmedCv = cvText.slice(0, MAX_CV_CHARS)

    const country = getCountry(countryId)
    const roleContext = buildRoleContext(professionId, typeof customProfession === 'string' ? customProfession : undefined)

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      system: `<role>You are a career document reviewer specialized in helping Brazilian candidates adapt their CV/resume for the hiring conventions of a specific European country.</role>\n<candidate_context>${roleContext}</candidate_context>\n<target_country>${country.label} — ${country.summary}</target_country>\n<instructions>\nReview the candidate's CV against the real hiring conventions and expectations of ${country.label} for their target profession/domain. Respond in Portuguese. Structure your response in this exact format with these exact headers:\n\nPONTOS FORTES:\n- [bullet points on what already works well in this CV]\n\nPONTOS A MELHORAR:\n- [bullet points, specific and actionable, tied to actual content in the CV]\n\nCONVENÇÕES DE ${country.label.toUpperCase()}:\n- [bullet points on country-specific CV format conventions this candidate should know — e.g. whether a photo/birthdate/marital status is expected or should be omitted, typical CV length, date format, common section ordering, language/tone norms. Ground this in real, well-known conventions for this country, not generic advice.]\n\nPALAVRAS-CHAVE E ATS:\n- [bullet points on keyword/ATS optimization relevant to the candidate's target profession — terms likely searched by recruiters/applicant tracking systems in this field, and whether the CV currently surfaces them]\n</instructions>`,
      messages: [{
        role: 'user',
        content: `<cv>${trimmedCv}</cv>`,
      }],
    })

    if (!subscribed) await recordFreeCvUsed()
    return NextResponse.json({ feedback: textFromMessage(msg).trim() })
  } catch (err) {
    console.error('CV review error:', err)

    if (err instanceof LookupError || err instanceof ValidationError) {
      return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
    }
    if (err instanceof APIError) {
      Sentry.captureException(err)
      return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Não foi possível processar sua solicitação. Tente novamente.' }, { status: 500 })
  }
}
