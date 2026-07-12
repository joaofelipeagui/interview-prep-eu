export type StarStatus = 'presente' | 'ausente' | 'fraco' | 'neutro'

export interface StarItem {
  label: string
  status: StarStatus
  text: string
}

export interface ParsedFeedback {
  score: number | null
  band: string
  strengths: string[]
  improvements: string[]
  starItems: StarItem[]
  starTip: string
  whatRecruiterWants: string
  englishNotes: string[]
  modelAnswer: string
}

type SectionKey = 'strengths' | 'improvements' | 'star' | 'recruiter' | 'english' | 'model'

// Headers matched loosely (see normalizeLine) so a stray "## " or "**" the model sometimes adds
// even when told to use plain fixed headers doesn't defeat matching. Both PT and EN header text
// are recognized (mapped to the same canonical key) so the parser self-detects whichever
// language the model actually responded in, instead of trusting a separate lang flag.
const SECTION_HEADERS: [RegExp, SectionKey][] = [
  [/^PONTOS FORTES/, 'strengths'],
  [/^STRENGTHS/, 'strengths'],
  [/^PONTOS A MELHORAR/, 'improvements'],
  [/^AREAS TO IMPROVE/, 'improvements'],
  [/^ESTRUTURA DA RESPOSTA \(STAR\)/, 'star'],
  [/^ANSWER STRUCTURE \(STAR\)/, 'star'],
  [/^O QUE O RECRUTADOR QUER OUVIR/, 'recruiter'],
  [/^WHAT THE RECRUITER WANTS TO HEAR/, 'recruiter'],
  [/^INGL[ÊE]S\s*[-–—]\s*CORRE[ÇC][ÕO]ES E MELHORIAS/, 'english'],
  [/^ENGLISH\s*[-–—]\s*CORRECTIONS AND IMPROVEMENTS/, 'english'],
  [/^RESPOSTA MODELO/, 'model'],
  [/^MODEL ANSWER/, 'model'],
]

const SCORE_LINE = /^(NOTA|SCORE):/

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '')
}

/** Strips markdown heading markers (#, ##, ...) and bold wrapping the model sometimes adds
 *  even when told to use plain fixed headers, so header matching isn't defeated by them. */
function normalizeLine(line: string): string {
  return stripBold(line.trim().replace(/^#+\s*/, ''))
}

function splitSections(feedback: string): { scoreLine: string; sections: Record<SectionKey, string> } {
  const lines = feedback.split('\n')
  let scoreLine = ''
  const starts: { key: SectionKey; index: number }[] = []

  lines.forEach((line, i) => {
    const trimmed = normalizeLine(line)
    if (SCORE_LINE.test(trimmed)) scoreLine = trimmed
    for (const [re, key] of SECTION_HEADERS) {
      if (re.test(trimmed)) starts.push({ key, index: i })
    }
  })

  const sections = {} as Record<SectionKey, string>
  for (let s = 0; s < starts.length; s++) {
    const bodyStart = starts[s].index + 1
    const bodyEnd = s + 1 < starts.length ? starts[s + 1].index : lines.length
    sections[starts[s].key] = lines.slice(bodyStart, bodyEnd).join('\n').trim()
  }
  return { scoreLine, sections }
}

function parseScore(scoreLine: string): { score: number | null; band: string } {
  // e.g. "NOTA: 7,3 — Atende bem (...)" or "SCORE: 7.3 — Meets expectations well (...)"
  const scoreMatch = scoreLine.match(/(?:NOTA|SCORE):\s*([\d]+(?:[.,]\d+)?)/i)
  const score = scoreMatch ? parseFloat(scoreMatch[1].replace(',', '.')) : null
  const bandMatch = scoreLine.match(/[-–—]\s*(.+)$/)
  const band = bandMatch ? bandMatch[1].trim() : ''
  return { score, band }
}

function extractBullets(body: string): string[] {
  return body
    .split('\n')
    .map(l => normalizeLine(l))
    .filter(l => /^[-*•]\s/.test(l))
    .map(l => l.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
}

const STAR_LABELS: [RegExp, string][] = [
  [/^situa[cç][aã]o/i, 'Situação'],
  [/^situation/i, 'Situation'],
  [/^tarefa/i, 'Tarefa'],
  [/^task/i, 'Task'],
  [/^a[cç][aã]o\b/i, 'Ação'],
  [/^action\b/i, 'Action'],
  [/^resultado/i, 'Resultado'],
  [/^result/i, 'Result'],
]

function extractStarItems(body: string): StarItem[] {
  const items: StarItem[] = []
  for (const rawLine of body.split('\n')) {
    const line = normalizeLine(rawLine)
    if (!/^[-*•]\s/.test(line)) continue
    const content = line.replace(/^[-*•]\s*/, '')
    for (const [re, label] of STAR_LABELS) {
      if (re.test(content)) {
        const status: StarStatus = /aus[eê]nte|absent/i.test(content)
          ? 'ausente'
          : /frac[oa]|parcial|weak|partial/i.test(content)
            ? 'fraco'
            : /presente|forte|present|strong/i.test(content)
              ? 'presente'
              : 'neutro'
        const colonIdx = content.indexOf(':')
        const text = colonIdx >= 0 ? content.slice(colonIdx + 1).trim() : content
        items.push({ label, status, text })
        break
      }
    }
  }
  return items
}

function extractStarTip(body: string): string {
  const match = body.match(/(?:dica de reestrutura[cç][aã]o|restructuring tip):?\**\s*([\s\S]*)/i)
  return match ? stripBold(match[1].trim()) : ''
}

function cleanParagraph(text: string): string {
  // Drop an occasional verbatim echo of the instruction line the model sometimes includes.
  return stripBold(
    text
      .split('\n')
      .filter(line => !/^(para cada componente|for each component)/i.test(line.trim()))
      .join('\n')
      .trim()
  )
}

export function parseFeedback(feedback: string): ParsedFeedback {
  const { scoreLine, sections } = splitSections(feedback)
  const { score, band } = parseScore(scoreLine)

  const starBody = sections.star ?? ''

  return {
    score,
    band,
    strengths: extractBullets(sections.strengths ?? ''),
    improvements: extractBullets(sections.improvements ?? ''),
    starItems: extractStarItems(starBody),
    starTip: extractStarTip(starBody),
    whatRecruiterWants: cleanParagraph(sections.recruiter ?? ''),
    englishNotes: extractBullets(sections.english ?? ''),
    modelAnswer: stripBold((sections.model ?? '').trim().replace(/^"|"$/g, '')),
  }
}
