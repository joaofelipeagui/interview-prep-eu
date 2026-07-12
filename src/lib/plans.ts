export type PlanId = 'week' | 'month' | 'quarter'

export interface Plan {
  id: PlanId
  label: string
  labelEn: string
  days: number
  priceBRL: number
}

export const PLANS: Plan[] = [
  { id: 'week', label: '1 semana', labelEn: '1 week', days: 7, priceBRL: 19 },
  { id: 'month', label: '1 mês', labelEn: '1 month', days: 30, priceBRL: 29 },
  { id: 'quarter', label: '90 dias', labelEn: '90 days', days: 90, priceBRL: 59 },
]

export function getPlan(id: string): Plan {
  const found = PLANS.find(p => p.id === id)
  if (!found) throw new Error(`Unknown plan: ${id}`)
  return found
}
