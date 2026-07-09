'use client'

import { useState, useRef, useEffect } from 'react'
import { COUNTRIES, type CountryId } from '@/lib/countries'
import { PROFESSIONS, groupProfessions, type ProfessionId, isProfessionComplete } from '@/lib/professions'
import { generateFeedbackPDF } from '@/lib/pdf'
import FeedbackCard from '@/components/FeedbackCard'
import PlansPanel, { type VerifiedSubscription } from '@/components/PlansPanel'
import CvReviewPanel from '@/components/CvReviewPanel'
import { getOrCreateClientId } from '@/lib/clientId'
import { Loader2, ArrowRight, RotateCcw, Mic, Square, Download } from 'lucide-react'

type Stage = 'select' | 'question' | 'evaluating' | 'feedback'
type LimitScope = 'person' | 'global'
type Mode = 'interview' | 'cv'

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

const CONSENT_KEY = 'interview_prep_consent'
const USER_EMAIL_KEY = 'interview_prep_user_email'
const PENDING_EMAIL_KEY = 'interview_prep_pending_email'

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

interface Subscription {
  email: string
  active: boolean
  plan?: string
  paidUntil?: string
}

export default function Home() {
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [mode, setMode] = useState<Mode>('interview')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [checkoutBanner, setCheckoutBanner] = useState('')
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

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const baseAnswerRef = useRef('')
  const sessionTextRef = useRef('')
  const wordsAtStartRef = useRef(0)
  const recordStartRef = useRef(0)
  const requestIdRef = useRef(0)

  async function checkSubscription(email: string): Promise<Subscription> {
    const res = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`)
    const data = await res.json()
    return { email, active: Boolean(data.active), plan: data.plan, paidUntil: data.paidUntil }
  }

  useEffect(() => {
    // Feature detection / localStorage reads need `window`, so they can only run post-mount —
    // this intentionally differs from the false-during-SSR initial render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechSupported(!!getSpeechRecognitionCtor())
    setConsentGiven(localStorage.getItem(CONSENT_KEY) === 'true')

    const params = new URLSearchParams(window.location.search)
    const checkoutStatus = params.get('checkout')
    const pendingEmail = localStorage.getItem(PENDING_EMAIL_KEY)
    const knownEmail = localStorage.getItem(USER_EMAIL_KEY) ?? pendingEmail

    if (knownEmail) {
      checkSubscription(knownEmail).then(sub => {
        setSubscription(sub)
        if (sub.active) {
          localStorage.setItem(USER_EMAIL_KEY, knownEmail)
          localStorage.removeItem(PENDING_EMAIL_KEY)
        }
        if (checkoutStatus === 'success') {
          setCheckoutBanner(sub.active
            ? 'Pagamento confirmado! Seu acesso já está liberado.'
            : 'Pagamento recebido — pode levar alguns segundos para confirmar. Clique em "Verificar acesso" daqui a pouco se ainda não liberou.')
        }
      })
    } else if (checkoutStatus === 'success') {
      setCheckoutBanner('Pagamento recebido! Se você informou seu e-mail na compra, verifique o acesso abaixo.')
    }

    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  function acceptConsent() {
    if (!consentChecked) return
    localStorage.setItem(CONSENT_KEY, 'true')
    setConsentGiven(true)
  }

  function handleSubscriptionVerified(email: string, sub: VerifiedSubscription) {
    localStorage.setItem(USER_EMAIL_KEY, email)
    localStorage.removeItem(PENDING_EMAIL_KEY)
    setSubscription({ email, active: sub.active, plan: sub.plan, paidUntil: sub.paidUntil })
    setLimitScope(null)
    setCheckoutBanner('')
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
  const subscribed = subscription?.active === true

  function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-client-id': getOrCreateClientId() }
    if (subscribed && subscription) headers['x-user-email'] = subscription.email
    return headers
  }

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
        headers: authHeaders(),
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
        headers: authHeaders(),
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
              Vagas Remotas / Relocation
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
                <li>Se você comprar acesso, seu e-mail é usado só para liberar e verificar sua compra. Nunca é vendido ou compartilhado com terceiros.</li>
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
              <div className="flex justify-center gap-2 mb-6">
                <button
                  onClick={() => setMode('interview')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    mode === 'interview' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  🎤 Simulador de Entrevista
                </button>
                <button
                  onClick={() => setMode('cv')}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    mode === 'cv' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  📄 Revisão de Currículo
                </button>
              </div>

              {checkoutBanner && (
                <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                  {checkoutBanner}
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {error}
                </div>
              )}

              {mode === 'cv' ? (
                <CvReviewPanel userEmail={subscribed ? subscription?.email : undefined} onSubscribed={handleSubscriptionVerified} />
              ) : limitScope ? (
                <PlansPanel
                  title={limitScope === 'person' ? 'Você já usou sua avaliação gratuita neste teste' : 'Chegamos ao limite de testes gratuitos de hoje'}
                  subtitle="Escolha um plano pra continuar praticando sem limite, e desbloquear a revisão de currículo."
                  knownEmail={subscription?.email}
                  onVerified={handleSubscriptionVerified}
                />
              ) : (
                <>
                  {stage === 'select' && (
                    <div className="space-y-8">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">1. Sua profissão</div>
                        <div className="space-y-4">
                          {groupProfessions().map(group => (
                            <div key={group.category ?? 'other'}>
                              {group.category && (
                                <div className="text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">{group.category}</div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {group.items.map(p => (
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
                            </div>
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
                          {subscribed && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm">
                              ✓ acesso ilimitado
                            </span>
                          )}
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
