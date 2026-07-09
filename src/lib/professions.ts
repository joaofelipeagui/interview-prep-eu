import { LookupError } from './errors'

export type ProfessionId = 'management' | 'networks' | 'data' | 'software' | 'other'

export interface Profession {
  id: ProfessionId
  label: string
  flag: string
  /** No trailing period — buildRoleContext appends punctuation uniformly. */
  domainContext: string
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'management',
    label: 'Gestão / Program & Project Management',
    flag: '📋',
    domainContext: 'Program Manager, Project Manager, or Product Manager roles — cross-functional delivery, stakeholder management, roadmaps, prioritization, budget and risk management, vendor coordination',
  },
  {
    id: 'networks',
    label: 'Redes / Infraestrutura de TI',
    flag: '🌐',
    domainContext: 'Network Engineer or Network/Infrastructure roles — routing and switching, SD-WAN, MPLS, DIA circuits, network security, cloud networking, enterprise WAN rollouts',
  },
  {
    id: 'data',
    label: 'Dados (Analytics / Engenharia / Ciência de Dados)',
    flag: '📊',
    domainContext: 'Data Analyst, Data Engineer, or Data Scientist roles — SQL and Python, ETL/data pipelines, dashboards and reporting, data governance and quality, machine learning models in production',
  },
  {
    id: 'software',
    label: 'Programação / Engenharia de Software',
    flag: '💻',
    domainContext: 'Software Engineer or Developer roles — backend/frontend systems, APIs, code architecture, testing, CI/CD, debugging production issues, code review',
  },
  {
    id: 'other',
    label: 'Outra profissão',
    flag: '✏️',
    domainContext: '',
  },
]

export function getProfession(id: string): Profession {
  const found = PROFESSIONS.find(p => p.id === id)
  if (!found) throw new LookupError(`Unknown profession: ${id}`)
  return found
}

/** True once enough info is known to build a role context — false only for 'other' before custom text is entered. */
export function isProfessionComplete(professionId: string, customProfession?: string): boolean {
  return professionId !== 'other' || Boolean(customProfession?.trim())
}

export function buildRoleContext(professionId: string, customProfession?: string): string {
  if (!isProfessionComplete(professionId, customProfession)) {
    throw new LookupError('customProfession is required when professionId is "other"')
  }
  const domain = professionId === 'other'
    ? `roles in: ${customProfession!.trim()}`
    : getProfession(professionId).domainContext
  return `The candidate is targeting ${domain}. Applying to companies in Europe.`
}
