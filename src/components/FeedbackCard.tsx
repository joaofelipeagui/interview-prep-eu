import { parseFeedback, type StarStatus } from '@/lib/parseFeedback'
import { translations, type Locale } from '@/lib/i18n'
import { CheckCircle2, AlertTriangle, Target, Lightbulb, Languages, Quote } from 'lucide-react'

function scoreColors(score: number | null) {
  if (score === null) return { ring: 'ring-zinc-300 dark:ring-zinc-700', text: 'text-zinc-700 dark:text-zinc-300', pill: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' }
  if (score < 3) return { ring: 'ring-red-400 dark:ring-red-700', text: 'text-red-600 dark:text-red-400', pill: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' }
  if (score < 5) return { ring: 'ring-orange-400 dark:ring-orange-700', text: 'text-orange-600 dark:text-orange-400', pill: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' }
  if (score < 7) return { ring: 'ring-amber-400 dark:ring-amber-700', text: 'text-amber-600 dark:text-amber-400', pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' }
  if (score < 8.5) return { ring: 'ring-teal-400 dark:ring-teal-700', text: 'text-teal-600 dark:text-teal-400', pill: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' }
  return { ring: 'ring-emerald-400 dark:ring-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
}

function starDotColor(status: StarStatus) {
  switch (status) {
    case 'presente': return 'bg-emerald-500'
    case 'fraco': return 'bg-amber-500'
    case 'ausente': return 'bg-red-500'
    default: return 'bg-zinc-400'
  }
}

function SectionCard({ icon, title, accent, children }: { icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 border-l-4 ${accent}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</div>
      </div>
      {children}
    </div>
  )
}

export default function FeedbackCard({ feedback, locale }: { feedback: string; locale: Locale }) {
  const T = translations[locale]
  const parsed = parseFeedback(feedback)
  const colors = scoreColors(parsed.score)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 flex items-center gap-4">
        <div className={`flex-shrink-0 w-16 h-16 rounded-full ring-4 ${colors.ring} flex items-center justify-center`}>
          <span className={`text-lg font-bold ${colors.text}`}>{parsed.score !== null ? (locale === 'en' ? parsed.score.toFixed(1) : parsed.score.toString().replace('.', ',')) : '—'}</span>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{T.fbScoreLabel}</div>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${colors.pill}`}>{parsed.band || T.fbEvaluationFallback}</span>
        </div>
      </div>

      {parsed.strengths.length > 0 && (
        <SectionCard icon={<CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />} title={T.fbStrengths} accent="border-l-emerald-400 dark:border-l-emerald-700">
          <ul className="space-y-2">
            {parsed.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-black dark:text-zinc-50 leading-relaxed">
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {parsed.improvements.length > 0 && (
        <SectionCard icon={<AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />} title={T.fbImprovements} accent="border-l-amber-400 dark:border-l-amber-700">
          <ul className="space-y-2">
            {parsed.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-black dark:text-zinc-50 leading-relaxed">
                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {parsed.starItems.length > 0 && (
        <SectionCard icon={<Target size={16} className="text-indigo-600 dark:text-indigo-400" />} title={T.fbStarStructure} accent="border-l-indigo-400 dark:border-l-indigo-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {parsed.starItems.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${starDotColor(item.status)}`} />
                <div>
                  <span className="font-medium text-black dark:text-zinc-50">{item.label}: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{item.text}</span>
                </div>
              </div>
            ))}
          </div>
          {parsed.starTip && (
            <div className="mt-4 rounded-lg bg-indigo-50 dark:bg-indigo-950 px-3 py-2 text-sm text-indigo-900 dark:text-indigo-200">
              <span className="font-medium">{T.fbRestructureTip} </span>{parsed.starTip}
            </div>
          )}
        </SectionCard>
      )}

      {parsed.whatRecruiterWants && (
        <SectionCard icon={<Lightbulb size={16} className="text-blue-600 dark:text-blue-400" />} title={T.fbRecruiterWants} accent="border-l-blue-400 dark:border-l-blue-700">
          <p className="text-sm text-black dark:text-zinc-50 leading-relaxed whitespace-pre-wrap">{parsed.whatRecruiterWants}</p>
        </SectionCard>
      )}

      {parsed.englishNotes.length > 0 && (
        <SectionCard icon={<Languages size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />} title={T.fbEnglishNotes} accent="border-l-fuchsia-400 dark:border-l-fuchsia-700">
          <ul className="space-y-2">
            {parsed.englishNotes.map((s, i) => (
              <li key={i} className="text-sm text-black dark:text-zinc-50 leading-relaxed">{s}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      {parsed.modelAnswer && (
        <SectionCard icon={<Quote size={16} className="text-zinc-600 dark:text-zinc-400" />} title={T.fbModelAnswer} accent="border-l-zinc-400 dark:border-l-zinc-600">
          <p className="text-sm italic text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{parsed.modelAnswer}</p>
        </SectionCard>
      )}
    </div>
  )
}
