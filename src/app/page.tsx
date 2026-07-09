'use client'

import { useState, useRef, useEffect } from 'react'
import { COUNTRIES, type CountryId } from '@/lib/countries'
import { PROFESSIONS, type ProfessionId, isProfessionComplete } from '@/lib/professions'
import { generateFeedbackPDF } from '@/lib/pdf'
import FeedbackCard from '@/components/FeedbackCard'
import { Loader2, ArrowRight, RotateCcw, Mic, Square, Download } from 'lucide-react'

type Stage = 'select' | 'question' | 'evaluating' | 'feedback'
type LimitScope = 'person' | 'global'

interface MinimalSpeechRecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}

interface MinimalSpeechRecognitionEvent {
  resultIndex: number
  results: ArrayLike<MinimalSpeechRecognitionResult>
}

interface MinimalSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const CLIENT_ID_KEY = 'interview_prep_client_id'
const CONSENT_KEY = 'interview_prep_consent'

function getOrCreateClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'kind of', 'sort of', 'i mean']

function countFillerWords(text: string): number {
  const lower = text.toLowerCase()
  let count = 0
  for (const filler of FILLER_WORDS) {
    const pattern = filler.replace(/\s+/g, '\\s+')
    const matches = lower.match(new RegExp(`\\b${pattern}\\b`, 'g'))
    if (matches) count += matches.length
  }
  return count
}

export default function Home() {
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [stage, setStage] = useState<Stage>('select')
  const [professionId, setProfessionId] = useState<ProfessionId>('management')
  const [customProfession, setCustomProfession] = useState('')
  const [countryId, setCountryId] = useState<CountryId | null>(null)
  const [askedSoFar, setAskedSoFar] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [paceWpm, setPaceWpm] = useState<number | null>(null)
  const [fillerWordCount, setFillerWordCount] = useState<number | null>(null)
  const [limitScope, setLimitScope] = useState<LimitScope | null>(null)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const baseAnswerRef = useRef('')
  const sessionTextRef = useRef('')
  const wordsAtStartRef = useRef(0)
  const recordStartRef = useRef(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    // Feature detection / localStorage reads need `window`, so they can only run post-mount —
    // this intentionally differs from the false-during-SSR initial render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechSupported(!!getSpeechRecognitionCtor())
    setConsentGiven(localStorage.getItem(CONSENT_KEY) === 'true')
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  function acceptConsent() {
    if (!consentChecked) return
    localStorage.setItem(CONSENT_KEY, 'true')
    setConsentGiven(true)
  }

  function toggleRecording() {
    const SR = getSpeechRecognitionCtor()
    if (!SR) return

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const recognition: MinimalSpeechRecognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    baseAnswerRef.current = answer.trim() ? answer.trim() + ' ' : ''
    sessionTextRef.current = ''
    wordsAtStartRef.current = baseAnswerRef.current.trim().split(/\s+/).filter(Boolean).length
    recordStartRef.current = Date.now()
    setPaceWpm(null)
    setFillerWordCount(null)
    setSpeechError('')

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscript += transcript
        else interimTranscript += transcript
      }
      if (finalTranscript) {
        baseAnswerRef.current += finalTranscript + ' '
        sessionTextRef.current += finalTranscript + ' '
      }
      setAnswer(baseAnswerRef.current + interimTranscript)
    }

    recognition.onerror = () => {
      recognitionRef.current = null
      setRecording(false)
      setSpeechError('Não foi possível capturar sua voz. Verifique a permissão do microfone e tente novamente.')
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setRecording(false)
      const seconds = (Date.now() - recordStartRef.current) / 1000
      const totalWords = baseAnswerRef.current.trim().split(/\s+/).filter(Boolean).length
      const newWords = totalWords - wordsAtStartRef.current
      if (seconds > 3 && newWords > 0) {
        setPaceWpm(Math.round((newWords / seconds) * 60))
        setFillerWordCount(countFillerWords(sessionTextRef.current))
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  const country = COUNTRIES.find(c => c.id === countryId)
  const profession = PROFESSIONS.find(p => p.id === professionId)
  const professionReady = isProfessionComplete(professionId, customProfession)

  async function startInterview(id: CountryId) {
    setCountryId(id)
    setAskedSoFar([])
    await fetchQuestion(id, [])
  }

  async function fetchQuestion(id: CountryId, asked: string[]) {
    const myRequestId = ++requestIdRef.current
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': getOrCreateClientId() },
        body: JSON.stringify({ type: 'question', payload: { countryId: id, professionId, customProfession, askedSoFar: asked } }),
      })
      const data = await res.json()
      if (myRequestId !== requestIdRef.current) return
      if (res.status === 429 && (data.scope === 'person' || data.scope === 'global')) {
        setLimitScope(data.scope)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar pergunta')
      setQuestion(data.question)
      setAnswer('')
      setPaceWpm(null)
      setFillerWordCount(null)
      setStage('question')
    } catch (e) {
      if (myRequestId === requestIdRef.current) {
        setError(e instanceof Error ? e.message : 'Erro inesperado')
      }
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false)
    }
  }

  async function submitAnswer() {
    if (!countryId || !answer.trim()) return
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setRecording(false)

    const myRequestId = ++requestIdRef.current
    setStage('evaluating')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': getOrCreateClientId() },
        body: JSON.stringify({ type: 'evaluate', payload: { countryId, professionId, customProfession, question, answer, paceWpm, fillerWordCount } }),
      })
      const data = await res.json()
      if (myRequestId !== requestIdRef.current) return
      if (res.status === 429 && (data.scope === 'person' || data.scope === 'global')) {
        setLimitScope(data.scope)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Falha ao avaliar resposta')
      setFeedback(data.feedback)
      setAskedSoFar(prev => [...prev, question])
      setStage('feedback')
    } catch (e) {
      if (myRequestId === requestIdRef.current) {
        setError(e instanceof Error ? e.message : 'Erro inesperado')
        setStage('question')
      }
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false)
    }
  }

  async function submitLead() {
    if (!leadEmail.trim()) return
    setLeadSubmitting(true)
    try {
      await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead', payload: { email: leadEmail.trim() } }),
      })
    } finally {
      setLeadSubmitted(true)
      setLeadSubmitting(false)
    }
  }

  function downloadFeedbackPdf() {
    if (!country || !feedback) return
    generateFeedbackPDF({
      countryLabel: country.label,
      professionLabel: professionId === 'other' ? customProfession : (profession?.label ?? ''),
      question,
      feedback,
    })
  }

  function nextQuestion() {
    if (!countryId) return
    fetchQuestion(countryId, askedSoFar)
  }

  function reset() {
    requestIdRef.current++
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setRecording(false)
    setStage('select')
    setCountryId(null)
    setAskedSoFar([])
    setQuestion('')
    setAnswer('')
    setFeedback('')
    setError('')
    setSpeechError('')
    setPaceWpm(null)
    setFillerWordCount(null)
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex-1 flex flex-col items-center w-full px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl">
          <header className="mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Simulador de Entrevista — Europa
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Treine entrevistas em inglês no estilo real de cada país, adaptado à sua profissão.
            </p>
          </header>

          {!consentGiven ? (
            <div className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
              <div className="text-lg font-medium text-black dark:text-zinc-50">Antes de começar</div>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-5">
                <li>Suas respostas (texto e transcrição de voz) são enviadas para a API da Anthropic apenas para gerar o feedback desta sessão — não são usadas para treinar modelos de IA.</li>
                <li>Se você usar &ldquo;Responder falando&rdquo;, o áudio é processado pelo próprio navegador (Web Speech API); nenhum áudio é enviado a servidores, só o texto transcrito.</li>
                <li>Guardamos um identificador anônimo do seu navegador e o IP apenas para controlar o limite de testes gratuitos — não identificamos você pessoalmente com isso.</li>
                <li>Se você deixar seu e-mail (caso o limite gratuito seja atingido), ele é usado só para avisos sobre esta ferramenta. Nunca é vendido ou compartilhado com terceiros.</li>
              </ul>
              <label className="flex items-start gap-2 text-sm text-black dark:text-zinc-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  className="mt-0.5"
                />
                Li e concordo com o uso das minhas respostas conforme descrito acima.
              </label>
              <button
                onClick={acceptConsent}
                disabled={!consentChecked}
                className="inline-flex items-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Começar <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {error}
                </div>
              )}

              {limitScope ? (
                <div className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 text-center">
                  <div className="text-lg font-medium text-black dark:text-zinc-50">
                    {limitScope === 'person'
                      ? 'Você já usou sua avaliação gratuita neste teste'
                      : 'Chegamos ao limite de testes gratuitos de hoje'}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {limitScope === 'person'
                      ? 'Deixe seu e-mail e eu aviso quando abrir mais vagas ou lançar a mentoria completa.'
                      : 'A demanda foi maior do que eu esperava! Deixe seu e-mail que eu aviso assim que reabrir.'}
                  </p>
                  {leadSubmitted ? (
                    <p className="text-sm text-green-600 dark:text-green-400">Combinado — vou te avisar. Obrigado pelo interesse!</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={e => setLeadEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      />
                      <button
                        onClick={submitLead}
                        disabled={leadSubmitting || !leadEmail.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
                      >
                        Avisar quando abrir
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {stage === 'select' && (
                    <div className="space-y-8">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">1. Sua profissão</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {PROFESSIONS.map(p => (
                            <button
                              key={p.id}
                              onClick={() => setProfessionId(p.id)}
                              className={`text-left rounded-xl border p-4 transition-colors bg-white dark:bg-zinc-950 ${
                                professionId === p.id
                                  ? 'border-black dark:border-white'
                                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                              }`}
                            >
                              <div className="text-base font-medium text-black dark:text-zinc-50">{p.flag} {p.label}</div>
                            </button>
                          ))}
                        </div>
                        {professionId === 'other' && (
                          <input
                            value={customProfession}
                            onChange={e => setCustomProfession(e.target.value)}
                            placeholder="Digite sua profissão/área (ex: UX Designer, Segurança da Informação...)"
                            className="mt-3 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                          />
                        )}
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">2. País do entrevistador</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {COUNTRIES.map(c => (
                            <button
                              key={c.id}
                              onClick={() => startInterview(c.id)}
                              disabled={loading || !professionReady}
                              className="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors disabled:opacity-40 bg-white dark:bg-zinc-950"
                            >
                              <div className="text-lg font-medium text-black dark:text-zinc-50">{c.flag} {c.label}</div>
                              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{c.summary}</div>
                            </button>
                          ))}
                        </div>
                        {!professionReady && (
                          <p className="mt-2 text-xs text-zinc-500">Digite sua profissão acima pra liberar a escolha do país.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {stage !== 'select' && country && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-sm text-black dark:text-zinc-50">
                            {country.flag} {country.label}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-sm text-black dark:text-zinc-50">
                            {profession?.flag} {professionId === 'other' ? customProfession : profession?.label}
                          </span>
                        </div>
                        <button
                          onClick={reset}
                          disabled={loading}
                          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40"
                        >
                          <RotateCcw size={14} /> reconfigurar
                        </button>
                      </div>

                      {loading && stage === 'question' && !question ? (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                          <Loader2 className="animate-spin" size={16} /> Gerando pergunta...
                        </div>
                      ) : (
                        <div className="rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5">
                          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Pergunta</div>
                          <p className="text-base leading-relaxed text-black dark:text-zinc-50">{question}</p>
                        </div>
                      )}

                      {stage === 'question' && (
                        <div className="space-y-3">
                          <textarea
                            value={answer}
                            onChange={e => { setAnswer(e.target.value); setPaceWpm(null); setFillerWordCount(null) }}
                            placeholder="Escreva ou grave sua resposta em inglês..."
                            rows={6}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
                          />
                          {speechSupported && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={toggleRecording}
                                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                                    recording
                                      ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
                                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
                                  }`}
                                >
                                  {recording ? <Square size={14} /> : <Mic size={14} />}
                                  {recording ? 'Parar gravação' : 'Responder falando'}
                                </button>
                                {recording && <span className="text-xs text-red-600 dark:text-red-400 animate-pulse">gravando...</span>}
                                {!recording && paceWpm !== null && (
                                  <span className="text-xs text-zinc-500">Ritmo estimado: {paceWpm} palavras/min</span>
                                )}
                                {!recording && fillerWordCount !== null && (
                                  <span className="text-xs text-zinc-500">
                                    {fillerWordCount === 0 ? 'Nenhuma muleta de linguagem detectada' : `${fillerWordCount} muleta${fillerWordCount > 1 ? 's' : ''} de linguagem (um, like...)`}
                                  </span>
                                )}
                              </div>
                              {speechError && (
                                <p className="text-xs text-red-600 dark:text-red-400">{speechError}</p>
                              )}
                            </div>
                          )}
                          <button
                            onClick={submitAnswer}
                            disabled={loading || !answer.trim()}
                            className="inline-flex items-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
                          >
                            Enviar resposta <ArrowRight size={16} />
                          </button>
                        </div>
                      )}

                      {stage === 'evaluating' && (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                          <Loader2 className="animate-spin" size={16} /> Avaliando resposta...
                        </div>
                      )}

                      {stage === 'feedback' && (
                        <div className="space-y-4">
                          <FeedbackCard feedback={feedback} />
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={nextQuestion}
                              disabled={loading}
                              className="inline-flex items-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
                            >
                              Próxima pergunta <ArrowRight size={16} />
                            </button>
                            <button
                              onClick={downloadFeedbackPdf}
                              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 px-4 py-2 text-sm font-medium transition-colors"
                            >
                              Baixar PDF <Download size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
