import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutPreference, isMercadoPagoConfigured } from '@/lib/mercadoPago'
import { getPlan } from '@/lib/subscriptions'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json()

    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }
    try {
      getPlan(plan)
    } catch {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
    }
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }

    const checkoutUrl = await createCheckoutPreference(plan, email.trim().toLowerCase())
    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('Checkout error:', err)
    const message = err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
