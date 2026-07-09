import { promises as fs } from 'fs'
import path from 'path'
import { PLANS, type PlanId } from './plans'

const DATA_DIR = path.join(process.cwd(), 'data')
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json')

interface AnalyticsData {
  freeInterviewUsed: number
  freeCvUsed: number
  checkoutStarted: Record<PlanId, number>
  checkoutCompleted: Record<PlanId, number>
}

function emptyPlanCounts(): Record<PlanId, number> {
  return Object.fromEntries(PLANS.map(p => [p.id, 0])) as Record<PlanId, number>
}

function emptyAnalytics(): AnalyticsData {
  return { freeInterviewUsed: 0, freeCvUsed: 0, checkoutStarted: emptyPlanCounts(), checkoutCompleted: emptyPlanCounts() }
}

let cache: AnalyticsData | null = null
let queue: Promise<unknown> = Promise.resolve()

async function ensureLoaded(): Promise<AnalyticsData> {
  if (cache) return cache
  let loaded: AnalyticsData
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    loaded = {
      ...emptyAnalytics(),
      ...parsed,
      checkoutStarted: { ...emptyPlanCounts(), ...parsed.checkoutStarted },
      checkoutCompleted: { ...emptyPlanCounts(), ...parsed.checkoutCompleted },
    }
  } catch {
    loaded = emptyAnalytics()
  }
  cache = loaded
  return loaded
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(ANALYTICS_FILE, JSON.stringify(cache, null, 2))
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn)
  queue = result.then(() => undefined, () => undefined)
  return result
}

export function recordFreeInterviewUsed(): Promise<void> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    data.freeInterviewUsed += 1
    await persist()
  })
}

export function recordFreeCvUsed(): Promise<void> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    data.freeCvUsed += 1
    await persist()
  })
}

export function recordCheckoutStarted(plan: PlanId): Promise<void> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    data.checkoutStarted[plan] = (data.checkoutStarted[plan] ?? 0) + 1
    await persist()
  })
}

export function recordCheckoutCompleted(plan: PlanId): Promise<void> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    data.checkoutCompleted[plan] = (data.checkoutCompleted[plan] ?? 0) + 1
    await persist()
  })
}

export function getAnalytics(): Promise<AnalyticsData> {
  return enqueue(() => ensureLoaded())
}
