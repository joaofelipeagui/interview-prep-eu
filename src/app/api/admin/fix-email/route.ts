import { NextRequest, NextResponse } from 'next/server'
import { isAdminConfigured, isAuthorizedAdmin } from '@/lib/adminAuth'
import { updateSubscriptionEmail } from '@/lib/subscriptions'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { oldEmail, newEmail } = await req.json()
  if (typeof oldEmail !== 'string' || !EMAIL_PATTERN.test(oldEmail.trim())) {
    return NextResponse.json({ error: 'oldEmail inválido.' }, { status: 400 })
  }
  if (typeof newEmail !== 'string' || !EMAIL_PATTERN.test(newEmail.trim())) {
    return NextResponse.json({ error: 'newEmail inválido.' }, { status: 400 })
  }

  const updated = await updateSubscriptionEmail(oldEmail, newEmail)
  return NextResponse.json({ ok: true, updated })
}
