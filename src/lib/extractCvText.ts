import path from 'path'
import { pathToFileURL } from 'url'
import { ValidationError } from './errors'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MIN_EXTRACTED_CHARS = 50

let workerConfigured = false

/** pdf-parse (via pdfjs-dist) tries to load its worker script through a dynamic import that
 *  Turbopack's server bundle can't resolve. Since this only ever runs in Node, point it straight
 *  at the worker file on disk instead of leaving it to pdf.js's default bundler-relative lookup. */
function configurePdfWorker(PDFParseCtor: { setWorker(src?: string): string }) {
  if (workerConfigured) return
  const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs')
  PDFParseCtor.setWorker(pathToFileURL(workerPath).href)
  workerConfigured = true
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ValidationError('Arquivo muito grande (máximo 5MB)')
  }

  const name = file.name.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  let text: string
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const { PDFParse } = await import('pdf-parse')
    configurePdfWorker(PDFParse)
    const parser = new PDFParse({ data: buffer })
    try {
      text = (await parser.getText()).text
    } finally {
      await parser.destroy()
    }
  } else if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    text = (await mammoth.extractRawText({ buffer })).value
  } else if (name.endsWith('.doc')) {
    throw new ValidationError('Formato .doc antigo não é suportado — salve como .docx ou PDF e envie de novo.')
  } else {
    throw new ValidationError('Formato de arquivo não suportado — envie um PDF ou Word (.docx).')
  }

  if (text.trim().length < MIN_EXTRACTED_CHARS) {
    throw new ValidationError('Não conseguimos extrair texto desse arquivo — se for um PDF escaneado (imagem), cole o texto do currículo manualmente.')
  }

  return text.trim()
}
