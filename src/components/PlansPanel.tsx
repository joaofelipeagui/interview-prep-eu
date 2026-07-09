'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLANS, type PlanId } from '@/lib/plans'
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react'

const PENDING_EMAIL_KEY = 'interview_prep_pending_email'

export interface VerifiedSubscription {
  active: boolean
  plan?: string
  paidUntil?: string
}

export default function PlansPanel({
  title,
  subtitle,
  knownEmail,
  onVerified,
}: {
  title: string
  subtitle: string
  knownEmail?: string
  onVerified: (email: string, sub: VerifiedSubscription) => void
}) {
  const [email, setEmail] = useState(knownEmail ?? '')
  const [buyingPlan, setBuyingPlan] = useState<PlanId | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [buyError, setBuyError] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [leadFallback, setLeadFallback] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  async function buy(plan: PlanId) {
    if (!email.trim()) {
      setBuyError('Digite seu e-mail primeiro.')
      return
    }
    setBuyError('')
    setBuyingPlan(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email: email.trim() }),
      })
      const data = await res.json()
      if (res.status === 503 && data.error === 'not_configured') {
        setLeadFallback(true)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar o pagamento.')
      localStorage.setItem(PENDING_EMAIL_KEY, email.trim().toLowerCase())
      window.location.assign(data.checkoutUrl)
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally {
      setBuyingPlan(null)
    }
  }

  async function verify() {
    if (!email.trim()) {
      setVerifyError('Digite seu e-mail primeiro.')
      return
    }
    setVerifyError('')
    setVerifying(true)
    try {
      const res = await fetch(`/api/subscription?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao verificar.')
      if (data.active) {
        onVerified(email.trim().toLowerCase(), data)
      } else {
        setVerifyError('Nenhuma assinatura ativa encontrada pra esse e-mail.')
      }
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally {
      setVerifying(false)
    }
  }

  async function submitLead() {
    try {
      await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead', payload: { email: email.trim() } }),
      })
    } finally {
      setLeadSubmitted(true)
    }
  }

  if (leadFallback) {
    return (
      <div className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 text-center">
        <div className="text-lg font-medium text-black dark:text-zinc-50">Pagamento ainda não está disponível</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Estamos configurando o checkout. Deixe seu e-mail que eu aviso assim que abrir.</p>
        {leadSubmitted ? (
          <p className="text-sm text-green-600 dark:text-green-400">Combinado — vou te avisar!</p>
        ) : (
          <button
            onClick={submitLead}
            className="inline-flex items-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium"
          >
            Avisar quando abrir
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="text-lg font-medium text-black dark:text-zinc-50">{title}</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map(plan => (
          <div key={plan.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-center space-y-2">
            <div className="text-sm font-medium text-zinc-500">{plan.label}</div>
            <div className="text-2xl font-bold text-black dark:text-zinc-50">R$ {plan.priceBRL}</div>
            <button
              onClick={() => buy(plan.id)}
              disabled={buyingPlan !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-3 py-2 text-sm font-medium disabled:opacity-40"
            >
              {buyingPlan === plan.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              Comprar
            </button>
          </div>
        ))}
      </div>
      {buyError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{buyError}</p>}

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-2">
        <p className="text-xs text-zinc-500">Já comprou um plano?</p>
        <button
          onClick={verify}
          disabled={verifying}
          className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white underline"
        >
          {verifying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Verificar acesso pelo e-mail
        </button>
        {verifyError && <p className="text-xs text-red-600 dark:text-red-400">{verifyError}</p>}
      </div>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
        <Link href="/termos" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">Termos de Uso e Política de Reembolso</Link>
      </p>
    </div>
  )
}
