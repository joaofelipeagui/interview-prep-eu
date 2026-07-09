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

// Headers matched loosely (see normalizeLine) so a stray "## " or "**" the model
// sometimes adds even when told to use plain fixed headers doesn't defeat matching.
// The English-corrections header specifically tolerates -, – or — as the separator.
const SECTION_HEADERS: [RegExp, string][] = [
  [/^PONTOS FORTES/, 'PONTOS FORTES'],
  [/^PONTOS A MELHORAR/, 'PONTOS A MELHORAR'],
  [/^ESTRUTURA DA RESPOSTA \(STAR\)/, 'ESTRUTURA DA RESPOSTA (STAR)'],
  [/^O QUE O RECRUTADOR QUER OUVIR/, 'O QUE O RECRUTADOR QUER OUVIR'],
  [/^INGL[ÊE]S\s*[-–—]\s*CORRE[ÇC][ÕO]ES E MELHORIAS/, 'INGLÊS — CORREÇÕES E MELHORIAS'],
  [/^RESPOSTA MODELO/, 'RESPOSTA MODELO'],
]

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '')
}

/** Strips markdown heading markers (#, ##, ...) and bold wrapping the model sometimes adds
 *  even when told to use plain fixed headers, so header matching isn't defeated by them. */
function normalizeLine(line: string): string {
  return stripBold(line.trim().replace(/^#+\s*/, ''))
}

function splitSections(feedback: string): { notaLine: string; sections: Record<string, string> } {
  const lines = feedback.split('\n')
  let notaLine = ''
  const starts: { key: string; index: number }[] = []

  lines.forEach((line, i) => {
    const trimmed = normalizeLine(line)
    if (trimmed.startsWith('NOTA:')) notaLine = trimmed
    for (const [re, key] of SECTION_HEADERS) {
      if (re.test(trimmed)) starts.push({ key, index: i })
    }
  })

  const sections: Record<string, string> = {}
  for (let s = 0; s < starts.length; s++) {
    const bodyStart = starts[s].index + 1
    const bodyEnd = s + 1 < starts.length ? starts[s + 1].index : lines.length
    sections[starts[s].key] = lines.slice(bodyStart, bodyEnd).join('\n').trim()
  }
  return { notaLine, sections }
}

function parseNota(notaLine: string): { score: number | null; band: string } {
  // e.g. "NOTA: 7,3 — Atende bem (clara, estruturada...)" or "NOTA: 9/10 - Excede expectativas"
  const scoreMatch = notaLine.match(/NOTA:\s*([\d]+(?:[.,]\d+)?)/i)
  const score = scoreMatch ? parseFloat(scoreMatch[1].replace(',', '.')) : null
  const bandMatch = notaLine.match(/[-–—]\s*(.+)$/)
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
  [/^tarefa/i, 'Tarefa'],
  [/^a[cç][aã]o\b/i, 'Ação'],
  [/^resultado/i, 'Resultado'],
]

function extractStarItems(body: string): StarItem[] {
  const items: StarItem[] = []
  for (const rawLine of body.split('\n')) {
    const line = normalizeLine(rawLine)
    if (!/^[-*•]\s/.test(line)) continue
    const content = line.replace(/^[-*•]\s*/, '')
    for (const [re, label] of STAR_LABELS) {
      if (re.test(content)) {
        const status: StarStatus = /aus[eê]nte/i.test(content)
          ? 'ausente'
          : /frac[oa]|parcial/i.test(content)
            ? 'fraco'
            : /presente|forte/i.test(content)
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
  const match = body.match(/dica de reestrutura[cç][aã]o:?\**\s*([\s\S]*)/i)
  return match ? stripBold(match[1].trim()) : ''
}

function cleanParagraph(text: string): string {
  // Drop an occasional verbatim echo of the instruction line the model sometimes includes.
  return stripBold(
    text
      .split('\n')
      .filter(line => !/^para cada componente/i.test(line.trim()))
      .join('\n')
      .trim()
  )
}

export function parseFeedback(feedback: string): ParsedFeedback {
  const { notaLine, sections } = splitSections(feedback)
  const { score, band } = parseNota(notaLine)

  const starBody = sections['ESTRUTURA DA RESPOSTA (STAR)'] ?? ''

  return {
    score,
    band,
    strengths: extractBullets(sections['PONTOS FORTES'] ?? ''),
    improvements: extractBullets(sections['PONTOS A MELHORAR'] ?? ''),
    starItems: extractStarItems(starBody),
    starTip: extractStarTip(starBody),
    whatRecruiterWants: cleanParagraph(sections['O QUE O RECRUTADOR QUER OUVIR'] ?? ''),
    englishNotes: extractBullets(sections['INGLÊS — CORREÇÕES E MELHORIAS'] ?? ''),
    modelAnswer: stripBold((sections['RESPOSTA MODELO'] ?? '').trim().replace(/^"|"$/g, '')),
  }
}
