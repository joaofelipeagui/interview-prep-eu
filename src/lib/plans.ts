export type PlanId = 'week' | 'month' | 'quarter'

export interface Plan {
  id: PlanId
  label: string
  days: number
  priceBRL: number
}

export const PLANS: Plan[] = [
  { id: 'week', label: '1 semana', days: 7, priceBRL: 19 },
  { id: 'month', label: '1 mês', days: 30, priceBRL: 29 },
  { id: 'quarter', label: '90 dias', days: 90, priceBRL: 59 },
]

export function getPlan(id: string): Plan {
  const found = PLANS.find(p => p.id === id)
  if (!found) throw new Error(`Unknown plan: ${id}`)
  return found
}
