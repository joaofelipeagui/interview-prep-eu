import { NextRequest } from 'next/server'

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_KEY)
}

export function isAuthorizedAdmin(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  return Boolean(key) && key === process.env.ADMIN_KEY
}
