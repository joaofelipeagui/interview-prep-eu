export interface ParsedCvFeedback {
  strengths: string[]
  improvements: string[]
  conventions: string[]
  atsKeywords: string[]
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '')
}

/** Strips markdown heading markers (#, ##, ...) and bold wrapping the model sometimes adds
 *  even when told to use plain fixed headers, so header matching isn't defeated by them. */
function normalizeLine(line: string): string {
  return stripBold(line.trim().replace(/^#+\s*/, ''))
}

function extractBullets(body: string): string[] {
  return body
    .split('\n')
    .map(l => normalizeLine(l))
    .filter(l => /^[-*•]\s/.test(l))
    .map(l => l.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
}

export function parseCvFeedback(feedback: string): ParsedCvFeedback {
  const lines = feedback.split('\n')
  const starts: { key: 'strengths' | 'improvements' | 'conventions' | 'atsKeywords'; index: number }[] = []

  lines.forEach((line, i) => {
    const trimmed = normalizeLine(line)
    if (trimmed.startsWith('PONTOS FORTES')) starts.push({ key: 'strengths', index: i })
    else if (trimmed.startsWith('PONTOS A MELHORAR')) starts.push({ key: 'improvements', index: i })
    else if (/^CONVEN[ÇC][ÕO]ES DE/i.test(trimmed)) starts.push({ key: 'conventions', index: i })
    else if (trimmed.startsWith('PALAVRAS-CHAVE')) starts.push({ key: 'atsKeywords', index: i })
  })

  const sections: Record<string, string> = {}
  for (let s = 0; s < starts.length; s++) {
    const bodyStart = starts[s].index + 1
    const bodyEnd = s + 1 < starts.length ? starts[s + 1].index : lines.length
    sections[starts[s].key] = lines.slice(bodyStart, bodyEnd).join('\n').trim()
  }

  return {
    strengths: extractBullets(sections.strengths ?? ''),
    improvements: extractBullets(sections.improvements ?? ''),
    conventions: extractBullets(sections.conventions ?? ''),
    atsKeywords: extractBullets(sections.atsKeywords ?? ''),
  }
}
