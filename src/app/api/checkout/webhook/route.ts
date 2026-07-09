import { NextRequest, NextResponse } from 'next/server'
import { fetchPayment } from '@/lib/mercadoPago'
import { recordSubscription, type PlanId } from '@/lib/subscriptions'

export async function POST(req: NextRequest) {
  try {
    let paymentId: string | null = req.nextUrl.searchParams.get('data.id')

    if (!paymentId) {
      try {
        const body = await req.json()
        paymentId = body?.data?.id ? String(body.data.id) : null
      } catch {
        // no JSON body — fine, we already checked query params
      }
    }

    if (!paymentId) {
      // Mercado Pago also pings this URL with unrelated topics (merchant_order, etc). Acknowledge and ignore.
      return NextResponse.json({ ok: true })
    }

    const payment = await fetchPayment(paymentId)
    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true, status: payment.status })
    }

    const ref = payment.externalReference
    if (!ref) {
      console.error('Approved payment with no external_reference:', paymentId)
      return NextResponse.json({ ok: true })
    }

    const [plan, email] = ref.split('::')
    if (!plan || !email) {
      console.error('Malformed external_reference:', ref)
      return NextResponse.json({ ok: true })
    }

    await recordSubscription(email, plan as PlanId, paymentId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    // Still return 200 so Mercado Pago doesn't hammer retries for an error on our side we already logged.
    return NextResponse.json({ ok: false })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
