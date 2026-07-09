import { promises as fs } from 'fs'
import path from 'path'
import { getPlan, type PlanId } from './plans'

const DATA_DIR = path.join(process.cwd(), 'data')
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json')

export type { PlanId } from './plans'
export { PLANS, getPlan } from './plans'

interface Subscription {
  email: string
  plan: PlanId
  paidUntil: string
  paymentId: string
  createdAt: string
}

let cache: Subscription[] | null = null
let queue: Promise<unknown> = Promise.resolve()

async function ensureLoaded(): Promise<Subscription[]> {
  if (cache) return cache
  let loaded: Subscription[]
  try {
    const raw = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8')
    loaded = JSON.parse(raw)
  } catch {
    loaded = []
  }
  cache = loaded
  return loaded
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(cache, null, 2))
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn)
  queue = result.then(() => undefined, () => undefined)
  return result
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function recordSubscription(email: string, plan: PlanId, paymentId: string): Promise<Subscription> {
  return enqueue(async () => {
    const subs = await ensureLoaded()
    const { days } = getPlan(plan)
    const normalized = normalizeEmail(email)

    // If they already have an active (or recent) subscription, extend from the later of now/current paidUntil
    // instead of overwriting, so stacking plans (e.g. buying another month before the first expires) accumulates.
    const existing = subs
      .filter(s => s.email === normalized)
      .sort((a, b) => new Date(b.paidUntil).getTime() - new Date(a.paidUntil).getTime())[0]
    const base = existing && new Date(existing.paidUntil).getTime() > Date.now()
      ? new Date(existing.paidUntil)
      : new Date()
    const paidUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)

    const record: Subscription = {
      email: normalized,
      plan,
      paidUntil: paidUntil.toISOString(),
      paymentId,
      createdAt: new Date().toISOString(),
    }
    subs.push(record)
    await persist()
    return record
  })
}

export function getActiveSubscription(email: string): Promise<Subscription | null> {
  return enqueue(async () => {
    const subs = await ensureLoaded()
    const normalized = normalizeEmail(email)
    const active = subs
      .filter(s => s.email === normalized && new Date(s.paidUntil).getTime() > Date.now())
      .sort((a, b) => new Date(b.paidUntil).getTime() - new Date(a.paidUntil).getTime())[0]
    return active ?? null
  })
}
