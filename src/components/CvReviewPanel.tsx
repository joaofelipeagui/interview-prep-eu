'use client'

import { useState } from 'react'
import { COUNTRIES, type CountryId } from '@/lib/countries'
import { PROFESSIONS, CATEGORY_LABELS_EN, groupProfessions, type ProfessionId, isProfessionComplete } from '@/lib/professions'
import { getOrCreateClientId } from '@/lib/clientId'
import { generateCvFeedbackPDF } from '@/lib/pdf'
import { translations, type Locale } from '@/lib/i18n'
import CvFeedbackCard from './CvFeedbackCard'
import PlansPanel, { type VerifiedSubscription } from './PlansPanel'
import { Loader2, ArrowRight, RotateCcw, Upload, X, FileText, ChevronDown, Download } from 'lucide-react'

interface BlockedState {
  title: string
  subtitle: string
}

export default function CvReviewPanel({
  locale,
  userEmail,
  onSubscribed,
}: {
  locale: Locale
  userEmail?: string
  onSubscribed: (email: string, sub: VerifiedSubscription) => void
}) {
  const T = translations[locale]
  const [professionId, setProfessionId] = useState<ProfessionId>('management')
  const [customProfession, setCustomProfession] = useState('')
  const [countryId, setCountryId] = useState<CountryId | null>(null)
  const [cvText, setCvText] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [blocked, setBlocked] = useState<BlockedState | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    const defaultCategory = PROFESSIONS.find(p => p.id === 'management')?.category
    return new Set(defaultCategory ? [defaultCategory] : [])
  })

  const country = COUNTRIES.find(c => c.id === countryId)
  const profession = PROFESSIONS.find(p => p.id === professionId)
  const countryLabel = country ? (locale === 'en' ? country.labelEn : country.label) : ''
  const professionLabel = professionId === 'other' ? customProfession : ((locale === 'en' ? profession?.labelEn : profession?.label) ?? '')
  const professionReady = isProfessionComplete(professionId, customProfession)
  const canSubmit = professionReady && countryId && (cvFile !== null || cvText.trim().length > 100)

  function downloadPdf() {
    if (!country || !feedback) return
    generateCvFeedbackPDF({ countryLabel, professionLabel, feedback, locale })
  }

  function toggleCategory(category: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setCvFile(file)
    setCvText('')
  }

  async function submit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const body = new FormData()
      if (cvFile) body.append('file', cvFile)
      else body.append('cvText', cvText)
      body.append('countryId', countryId as string)
      body.append('professionId', professionId)
      if (customProfession) body.append('customProfession', customProfession)
      body.append('lang', locale)

      const headers: Record<string, string> = { 'x-client-id': getOrCreateClientId() }
      if (userEmail) headers['x-user-email'] = userEmail
      const res = await fetch('/api/cv-review', {
        method: 'POST',
        headers,
        body,
      })
      const data = await res.json()
      if (res.status === 429 && (data.scope === 'person' || data.scope === 'global')) {
        setBlocked({
          title: data.scope === 'person' ? T.cvFreeLimitPersonTitle : T.cvFreeLimitGlobalTitle,
          subtitle: T.cvFreeLimitSubtitle,
        })
        return
      }
      if (!res.ok) throw new Error(data.error || T.cvErrorGeneric)
      setFeedback(data.feedback)
    } catch (e) {
      setError(e instanceof Error ? e.message : T.genericError)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFeedback('')
    setError('')
    setCvFile(null)
    setCvText('')
  }

  if (blocked) {
    return <PlansPanel locale={locale} title={blocked.title} subtitle={blocked.subtitle} knownEmail={userEmail} onVerified={onSubscribed} />
  }

  if (feedback) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-sm text-black dark:text-zinc-50">
            {country?.flag} {countryLabel}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <Download size={14} /> {T.downloadPdf}
            </button>
            <button onClick={reset} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
              <RotateCcw size={14} /> {T.cvReviewAnother}
            </button>
          </div>
        </div>
        <CvFeedbackCard feedback={feedback} countryLabel={countryLabel} locale={locale} />
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
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">{T.cvStepCountry}</div>
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
              <div className="text-lg font-medium text-black dark:text-zinc-50">{c.flag} {locale === 'en' ? c.labelEn : c.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">{T.cvStepProfession}</div>
        <div className="space-y-2">
          {groupProfessions().map(group => {
            const key = group.category ?? 'other'
            const isExpanded = !group.category || expandedCategories.has(group.category)
            return (
              <div key={key}>
                {group.category && (
                  <button
                    onClick={() => toggleCategory(group.category!)}
                    className="w-full flex items-center justify-between py-1.5 text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {locale === 'en' ? (CATEGORY_LABELS_EN[group.category] ?? group.category) : group.category}
                    <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 mb-3">
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
                        <div className="text-base font-medium text-black dark:text-zinc-50">{p.flag} {locale === 'en' ? p.labelEn : p.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {professionId === 'other' && (
          <input
            value={customProfession}
            onChange={e => setCustomProfession(e.target.value)}
            placeholder={T.cvOtherProfessionPlaceholder}
            className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        )}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">{T.cvStepResume}</div>

        <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <Upload size={14} />
          {T.cvUploadLabel}
          <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} className="hidden" />
        </label>

        {cvFile ? (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm">
            <span className="inline-flex items-center gap-2 text-black dark:text-zinc-50 truncate">
              <FileText size={14} className="shrink-0" /> {cvFile.name}
            </span>
            <button onClick={() => setCvFile(null)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : (
          <textarea
            value={cvText}
            onChange={e => setCvText(e.target.value)}
            placeholder={T.cvPastePlaceholder}
            rows={10}
            className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
          />
        )}
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit || loading}
        className="inline-flex items-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {loading ? T.cvAnalyzing : T.cvReview}
      </button>
    </div>
  )
}
