import { parseCvFeedback } from '@/lib/parseCvFeedback'
import { translations, type Locale } from '@/lib/i18n'
import { CheckCircle2, AlertTriangle, Globe2, Search } from 'lucide-react'

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

export default function CvFeedbackCard({ feedback, countryLabel, locale }: { feedback: string; countryLabel: string; locale: Locale }) {
  const T = translations[locale]
  const parsed = parseCvFeedback(feedback)

  return (
    <div className="space-y-4">
      {parsed.strengths.length > 0 && (
        <SectionCard icon={<CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />} title={T.cvfStrengths} accent="border-l-emerald-400 dark:border-l-emerald-700">
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
        <SectionCard icon={<AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />} title={T.cvfImprovements} accent="border-l-amber-400 dark:border-l-amber-700">
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

      {parsed.conventions.length > 0 && (
        <SectionCard icon={<Globe2 size={16} className="text-blue-600 dark:text-blue-400" />} title={`${T.cvfConventionsOf} ${countryLabel}`} accent="border-l-blue-400 dark:border-l-blue-700">
          <ul className="space-y-2">
            {parsed.conventions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-black dark:text-zinc-50 leading-relaxed">
                <Globe2 size={15} className="mt-0.5 flex-shrink-0 text-blue-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {parsed.atsKeywords.length > 0 && (
        <SectionCard icon={<Search size={16} className="text-fuchsia-600 dark:text-fuchsia-400" />} title={T.cvfKeywords} accent="border-l-fuchsia-400 dark:border-l-fuchsia-700">
          <ul className="space-y-2">
            {parsed.atsKeywords.map((s, i) => (
              <li key={i} className="text-sm text-black dark:text-zinc-50 leading-relaxed">{s}</li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}
