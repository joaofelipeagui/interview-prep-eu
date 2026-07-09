import { NextRequest, NextResponse } from 'next/server'
import { isAdminConfigured, isAuthorizedAdmin } from '@/lib/adminAuth'
import { getAnalytics } from '@/lib/analyticsStore'
import { getUsageSummary } from '@/lib/usageStore'

export async function GET(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [analytics, usage] = await Promise.all([getAnalytics(), getUsageSummary()])
  return NextResponse.json({ analytics, usage })
}
