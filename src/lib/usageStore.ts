import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const USAGE_FILE = path.join(DATA_DIR, 'usage.json')
const LEADS_FILE = path.join(DATA_DIR, 'leads.json')

/** Total number of full (question + evaluate) attempts the free budget can absorb.
 *  Sized against a fixed ~US$5 budget at roughly $0.03/evaluate call — not a daily reset. */
export const GLOBAL_EVALUATE_CAP = 140

/** Separate, much cheaper ceiling on question-only generation, to block pure spam of the cheap endpoint. */
const GLOBAL_QUESTION_CAP = 500

/** Free CV review attempts share the same ~US$5 budget as evaluate calls (similar token cost per call) —
 *  kept deliberately smaller than GLOBAL_EVALUATE_CAP since it's on top of, not instead of, that spend. */
export const GLOBAL_CV_CAP = 30

interface UsageData {
  globalEvaluateCount: number
  globalQuestionCount: number
  globalCvCount: number
  usedIps: string[]
  usedClientIds: string[]
  usedCvIps: string[]
  usedCvClientIds: string[]
}

const EMPTY_USAGE: UsageData = {
  globalEvaluateCount: 0,
  globalQuestionCount: 0,
  globalCvCount: 0,
  usedIps: [],
  usedClientIds: [],
  usedCvIps: [],
  usedCvClientIds: [],
}

let cache: UsageData | null = null
let queue: Promise<unknown> = Promise.resolve()

async function ensureLoaded(): Promise<UsageData> {
  if (cache) return cache
  let loaded: UsageData
  try {
    const raw = await fs.readFile(USAGE_FILE, 'utf-8')
    loaded = { ...EMPTY_USAGE, ...JSON.parse(raw) }
  } catch {
    loaded = { ...EMPTY_USAGE }
  }
  cache = loaded
  return loaded
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(USAGE_FILE, JSON.stringify(cache, null, 2))
}

/** Serializes all reads/writes through one promise chain so concurrent requests can't race the file. */
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn)
  queue = result.then(() => undefined, () => undefined)
  return result
}

export type PersonUsageResult = { allowed: true } | { allowed: false; scope: 'person' | 'global' }

export function hasPersonAlreadyUsedAttempt(ip: string, clientId: string): Promise<boolean> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    return data.usedIps.includes(ip) || data.usedClientIds.includes(clientId)
  })
}

export function isGlobalEvaluateCapReached(): Promise<boolean> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    return data.globalEvaluateCount >= GLOBAL_EVALUATE_CAP
  })
}

/** Checks the person/global gates and, only if allowed, atomically records the attempt. */
export function checkAndRecordEvaluateAttempt(ip: string, clientId: string): Promise<PersonUsageResult> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    if (data.usedIps.includes(ip) || data.usedClientIds.includes(clientId)) {
      return { allowed: false, scope: 'person' }
    }
    if (data.globalEvaluateCount >= GLOBAL_EVALUATE_CAP) {
      return { allowed: false, scope: 'global' }
    }
    data.globalEvaluateCount += 1
    data.usedIps.push(ip)
    data.usedClientIds.push(clientId)
    await persist()
    return { allowed: true }
  })
}

/** Cheap secondary budget for question generation. Returns false once exhausted (caller should block). */
export function checkAndRecordQuestionAttempt(): Promise<boolean> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    if (data.globalQuestionCount >= GLOBAL_QUESTION_CAP) return false
    data.globalQuestionCount += 1
    await persist()
    return true
  })
}

/** Checks the person/global gates for a free CV review and, only if allowed, atomically records the attempt.
 *  Tracked separately from the interview attempt so a person gets one free try at each feature. */
export function checkAndRecordCvAttempt(ip: string, clientId: string): Promise<PersonUsageResult> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    if (data.usedCvIps.includes(ip) || data.usedCvClientIds.includes(clientId)) {
      return { allowed: false, scope: 'person' }
    }
    if (data.globalCvCount >= GLOBAL_CV_CAP) {
      return { allowed: false, scope: 'global' }
    }
    data.globalCvCount += 1
    data.usedCvIps.push(ip)
    data.usedCvClientIds.push(clientId)
    await persist()
    return { allowed: true }
  })
}

/** Aggregate counts only — deliberately omits the IP/clientId lists to avoid exposing them, even to admin tooling. */
export function getUsageSummary(): Promise<{
  globalEvaluateCount: number
  globalEvaluateCap: number
  globalQuestionCount: number
  globalCvCount: number
  globalCvCap: number
}> {
  return enqueue(async () => {
    const data = await ensureLoaded()
    return {
      globalEvaluateCount: data.globalEvaluateCount,
      globalEvaluateCap: GLOBAL_EVALUATE_CAP,
      globalQuestionCount: data.globalQuestionCount,
      globalCvCount: data.globalCvCount,
      globalCvCap: GLOBAL_CV_CAP,
    }
  })
}

export function recordLead(email: string): Promise<void> {
  return enqueue(async () => {
    let leads: string[] = []
    try {
      const raw = await fs.readFile(LEADS_FILE, 'utf-8')
      leads = JSON.parse(raw)
    } catch {
      leads = []
    }
    if (!leads.includes(email)) leads.push(email)
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2))
  })
}
