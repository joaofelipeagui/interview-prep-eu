import { getPlan, type PlanId } from './plans'

const MP_API = 'https://api.mercadopago.com'

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN)
}

function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3001'
}

export async function createCheckoutPreference(plan: PlanId, email: string): Promise<string> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!token) {
    throw new Error('Mercado Pago não está configurado (falta MERCADO_PAGO_ACCESS_TOKEN).')
  }
  const { label, priceBRL } = getPlan(plan)
  const externalReference = `${plan}::${email}::${Date.now()}`

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: `Simulador de Entrevista — Acesso ${label}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: priceBRL,
        },
      ],
      payer: { email },
      external_reference: externalReference,
      back_urls: {
        success: `${appUrl()}/?checkout=success`,
        pending: `${appUrl()}/?checkout=pending`,
        failure: `${appUrl()}/?checkout=failure`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl()}/api/checkout/webhook`,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Mercado Pago preference error:', res.status, body)
    throw new Error('Não foi possível iniciar o pagamento. Tente novamente.')
  }

  const data = await res.json()
  return data.init_point as string
}

export interface MercadoPagoPayment {
  status: string
  externalReference: string | null
  payerEmail: string | null
}

export async function fetchPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!token) throw new Error('Mercado Pago não está configurado.')

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Mercado Pago payment lookup error:', res.status, body)
    throw new Error('Falha ao consultar pagamento.')
  }
  const data = await res.json()
  return {
    status: data.status,
    externalReference: data.external_reference ?? null,
    payerEmail: data.payer?.email ?? null,
  }
}
