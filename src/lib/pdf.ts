import { jsPDF } from 'jspdf'

interface FeedbackPdfInput {
  countryLabel: string
  professionLabel: string
  question: string
  feedback: string
}

const PAGE_WIDTH = 210
const MARGIN = 20
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const PAGE_BOTTOM = 280
const LINE_HEIGHT = 5.5

const KNOWN_HEADERS = [
  'NOTA:',
  'PONTOS FORTES:',
  'PONTOS A MELHORAR:',
  'ESTRUTURA DA RESPOSTA (STAR):',
  'O QUE O RECRUTADOR QUER OUVIR:',
  'INGLÊS — CORREÇÕES E MELHORIAS:',
  'RESPOSTA MODELO:',
]

function isHeaderLine(line: string): boolean {
  const trimmed = line.trim()
  return KNOWN_HEADERS.some(h => trimmed.startsWith(h))
}

export function generateFeedbackPDF({ countryLabel, professionLabel, question, feedback }: FeedbackPdfInput) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_BOTTOM) {
      doc.addPage()
      y = MARGIN
    }
  }

  function writeWrapped(text: string, opts: { size?: number; bold?: boolean; indent?: number; gapAfter?: number } = {}) {
    const size = opts.size ?? 10.5
    const indent = opts.indent ?? 0
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines: string[] = doc.splitTextToSize(text, CONTENT_WIDTH - indent)
    for (const line of lines) {
      ensureSpace(LINE_HEIGHT)
      doc.text(line, MARGIN + indent, y)
      y += LINE_HEIGHT
    }
    y += opts.gapAfter ?? 0
  }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Feedback de Entrevista', MARGIN, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`${countryLabel} · ${professionLabel} · ${today}`, MARGIN, y)
  doc.setTextColor(0, 0, 0)
  y += 10

  // Question box
  ensureSpace(14)
  doc.setDrawColor(210, 210, 210)
  doc.setFillColor(248, 248, 248)
  const questionLines: string[] = doc.splitTextToSize(question, CONTENT_WIDTH - 8)
  const boxHeight = questionLines.length * LINE_HEIGHT + 10
  ensureSpace(boxHeight)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(120, 120, 120)
  doc.text('PERGUNTA', MARGIN + 4, y + 6)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  let qy = y + 11
  for (const line of questionLines) {
    doc.text(line, MARGIN + 4, qy)
    qy += LINE_HEIGHT
  }
  y += boxHeight + 8

  // Feedback body
  const rawLines = feedback.split('\n')
  for (const rawLine of rawLines) {
    const line = rawLine.trim()
    if (!line) {
      y += 2
      continue
    }
    if (isHeaderLine(line)) {
      ensureSpace(LINE_HEIGHT + 4)
      y += 3
      writeWrapped(line, { size: 11.5, bold: true, gapAfter: 1.5 })
    } else if (line.startsWith('- ')) {
      writeWrapped(`•  ${line.slice(2)}`, { indent: 3 })
    } else {
      writeWrapped(line)
    }
  }

  const countryFile = countryLabel.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').toLowerCase()
  doc.save(`feedback-entrevista-${countryFile}-${Date.now()}.pdf`)
}
