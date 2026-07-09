import { NextRequest, NextResponse } from 'next/server'
import { getActiveSubscription } from '@/lib/subscriptions'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email || !EMAIL_PATTERN.test(email.trim())) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }

  const sub = await getActiveSubscription(email.trim().toLowerCase())
  if (!sub) return NextResponse.json({ active: false })
  return NextResponse.json({ active: true, plan: sub.plan, paidUntil: sub.paidUntil })
}
