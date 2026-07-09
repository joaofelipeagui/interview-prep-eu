'use client'

import { useState } from 'react'
import { COUNTRIES, type CountryId } from '@/lib/countries'
import { PROFESSIONS, type ProfessionId, isProfessionComplete } from '@/lib/professions'
import CvFeedbackCard from './CvFeedbackCard'
import { Loader2, ArrowRight, RotateCcw } from 'lucide-react'

export default function CvReviewPanel({ userEmail }: { userEmail: string }) {
  const [professionId, setProfessionId] = useState<ProfessionId>('management')
  const [customProfession, setCustomProfession] = useState('')
  const [countryId, setCountryId] = useState<CountryId | null>(null)
  const [cvText, setCvText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const country = COUNTRIES.find(c => c.id === countryId)
  const professionReady = isProfessionComplete(professionId, customProfession)
  const canSubmit = professionReady && countryId && cvText.trim().length > 100

  async function submit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cv-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ cvText, countryId, professionId, customProfession }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao revisar o currículo.')
      setFeedback(data.feedback)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFeedback('')
    setError('')
  }

  if (feedback) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-sm text-black dark:text-zinc-50">
            {country?.flag} {country?.label}
          </span>
          <button onClick={reset} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            <RotateCcw size={14} /> revisar outro currículo
          </button>
        </div>
        <CvFeedbackCard feedback={feedback} countryLabel={country?.label ?? ''} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

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
            placeholder="Digite sua profissão/área"
            className="mt-3 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        )}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">2. País de destino</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COUNTRIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCountryId(c.id)}
              className={`text-left rounded-xl border p-4 transition-colors bg-white dark:bg-zinc-950 ${
                countryId === c.id
                  ? 'border-black dark:border-white'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <div className="text-lg font-medium text-black dark:text-zinc-50">{c.flag} {c.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">3. Cole seu currículo</div>
        <textarea
          value={cvText}
          onChange={e => setCvText(e.target.value)}
          placeholder="Cole o texto do seu currículo aqui..."
          rows={10}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
        />
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit || loading}
        className="inline-flex items-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {loading ? 'Analisando currículo...' : 'Revisar currículo'}
      </button>
    </div>
  )
}
