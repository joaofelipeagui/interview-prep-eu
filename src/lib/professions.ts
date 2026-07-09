import { LookupError } from './errors'

export type ProfessionId =
  | 'management'
  | 'product_manager'
  | 'networks'
  | 'data'
  | 'software'
  | 'security'
  | 'devops_sre'
  | 'tech_lead'
  | 'engineering_manager'
  | 'solutions_architect'
  | 'software_architect'
  | 'infra_architect'
  | 'data_architect'
  | 'it_director'
  | 'engineering_director'
  | 'infra_director'
  | 'data_director'
  | 'security_director'
  | 'other'

/** Groups roles in the UI picker — purely presentational, does not affect the prompt. */
export type ProfessionCategory = 'Execução técnica' | 'Gestão' | 'Liderança técnica' | 'Arquitetura' | 'Diretoria / Liderança sênior' | null

export interface Profession {
  id: ProfessionId
  label: string
  flag: string
  category: ProfessionCategory
  /** No trailing period — buildRoleContext appends punctuation uniformly. */
  domainContext: string
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'networks',
    label: 'Redes / Infraestrutura de TI',
    flag: '🌐',
    category: 'Execução técnica',
    domainContext: 'Network Engineer or Network/Infrastructure roles — routing and switching, SD-WAN, MPLS, DIA circuits, network security, cloud networking, enterprise WAN rollouts',
  },
  {
    id: 'data',
    label: 'Dados (Analytics / Engenharia / Ciência de Dados)',
    flag: '📊',
    category: 'Execução técnica',
    domainContext: 'Data Analyst, Data Engineer, or Data Scientist roles — SQL and Python, ETL/data pipelines, dashboards and reporting, data governance and quality, machine learning models in production',
  },
  {
    id: 'software',
    label: 'Programação / Engenharia de Software',
    flag: '💻',
    category: 'Execução técnica',
    domainContext: 'Software Engineer or Developer roles — backend/frontend systems, APIs, code architecture, testing, CI/CD, debugging production issues, code review',
  },
  {
    id: 'security',
    label: 'Segurança da Informação / Cibersegurança',
    flag: '🛡️',
    category: 'Execução técnica',
    domainContext: 'Information Security Analyst, Security Engineer, or Cybersecurity Analyst roles — threat detection and incident response, vulnerability management, security tooling (SIEM, IDS/IPS), compliance frameworks (ISO 27001, GDPR, NIS2), security awareness and risk assessment',
  },
  {
    id: 'devops_sre',
    label: 'DevOps / SRE / Cloud Engineering',
    flag: '♾️',
    category: 'Execução técnica',
    domainContext: 'DevOps Engineer, Site Reliability Engineer (SRE), or Cloud Engineer roles — CI/CD pipelines, infrastructure as code (Terraform, Ansible), container orchestration (Kubernetes, Docker), observability and on-call incident response, reliability and uptime (SLOs/error budgets), cloud cost optimization',
  },
  {
    id: 'management',
    label: 'Gestão de Projetos / Programas',
    flag: '📋',
    category: 'Gestão',
    domainContext: 'Program Manager or Project Manager roles — cross-functional delivery, stakeholder management, timelines and milestones, budget and risk management, vendor and cross-team coordination',
  },
  {
    id: 'product_manager',
    label: 'Product Manager / Product Owner',
    flag: '🚀',
    category: 'Gestão',
    domainContext: 'Product Manager or Product Owner roles — product strategy and vision, user research and discovery, prioritization frameworks (RICE, MoSCoW), defining and tracking success metrics/OKRs, working with design and engineering to ship features, stakeholder alignment on product direction',
  },
  {
    id: 'tech_lead',
    label: 'Tech Lead',
    flag: '🧭',
    category: 'Liderança técnica',
    domainContext: 'Tech Lead roles — hands-on technical leadership of a small engineering team, making and defending architecture decisions day-to-day, code review and mentoring, balancing individual contribution with unblocking teammates, translating product requirements into technical plans',
  },
  {
    id: 'engineering_manager',
    label: 'Gerente de Engenharia',
    flag: '👥',
    category: 'Liderança técnica',
    domainContext: 'Engineering Manager roles — people management (1:1s, performance, career growth), hiring and team building, sprint/delivery accountability without necessarily writing code day-to-day, balancing technical debt against roadmap pressure, being the bridge between individual contributors and senior leadership',
  },
  {
    id: 'solutions_architect',
    label: 'Arquiteto de Soluções',
    flag: '🧩',
    category: 'Arquitetura',
    domainContext: 'Solutions Architect roles — cross-functional system design bridging business and technical teams, trade-off analysis (build vs buy, cost vs scalability), technical roadmaps, presenting architecture decisions to both engineers and executives',
  },
  {
    id: 'software_architect',
    label: 'Arquiteto de Software',
    flag: '🏗️',
    category: 'Arquitetura',
    domainContext: 'Software Architect roles — system design and architecture patterns, scalability and reliability trade-offs, technology stack decisions, technical debt management, mentoring engineering teams, design and code reviews at scale',
  },
  {
    id: 'infra_architect',
    label: 'Arquiteto de Redes / Cloud',
    flag: '☁️',
    category: 'Arquitetura',
    domainContext: 'Infrastructure/Cloud/Network Architect roles — enterprise network and cloud architecture, high-availability and disaster-recovery design, capacity planning, security-by-design, multi-cloud and hybrid-cloud strategy, vendor and technology selection',
  },
  {
    id: 'data_architect',
    label: 'Arquiteto de Dados',
    flag: '🗄️',
    category: 'Arquitetura',
    domainContext: 'Data Architect roles — data platform and pipeline architecture, data modeling and governance frameworks, choosing between data warehouse/lake/lakehouse approaches, scalability and cost trade-offs, data security and compliance (GDPR)',
  },
  {
    id: 'it_director',
    label: 'Diretor de TI',
    flag: '🏢',
    category: 'Diretoria / Liderança sênior',
    domainContext: 'IT Director / Head of IT roles — technology strategy aligned to business goals, budget ownership and vendor negotiation, team and org design, risk and compliance oversight, presenting to C-level and board, managing multiple technical teams',
  },
  {
    id: 'engineering_director',
    label: 'Diretor de Engenharia',
    flag: '🎯',
    category: 'Diretoria / Liderança sênior',
    domainContext: 'Engineering Director / Head of Engineering roles — engineering strategy and technical vision, hiring and org scaling, budget and headcount planning, cross-team prioritization, balancing technical debt against delivery pressure, representing engineering to the executive team',
  },
  {
    id: 'infra_director',
    label: 'Diretor de Infraestrutura',
    flag: '🛠️',
    category: 'Diretoria / Liderança sênior',
    domainContext: 'Director of Infrastructure / IT Operations roles — infrastructure strategy and modernization roadmaps, uptime/SLA ownership, budget for infrastructure and cloud spend, vendor and outsourcing management, incident and crisis leadership, aligning infra investment with business risk',
  },
  {
    id: 'data_director',
    label: 'Diretor de Dados / Analytics',
    flag: '📈',
    category: 'Diretoria / Liderança sênior',
    domainContext: 'Director of Data / Head of Data & Analytics roles — data strategy and platform vision, building and scaling data teams, data governance and privacy accountability, demonstrating ROI of data initiatives to the business, balancing centralized vs federated data ownership',
  },
  {
    id: 'security_director',
    label: 'Diretor de Segurança / CISO',
    flag: '🔐',
    category: 'Diretoria / Liderança sênior',
    domainContext: 'Director of Security / CISO roles — security strategy and risk governance at board level, budget ownership for security programs, regulatory compliance accountability (GDPR, NIS2), incident response leadership during breaches, building and scaling security teams, translating technical risk into business risk for executives',
  },
  {
    id: 'other',
    label: 'Outra profissão',
    flag: '✏️',
    category: null,
    domainContext: '',
  },
]

export function getProfession(id: string): Profession {
  const found = PROFESSIONS.find(p => p.id === id)
  if (!found) throw new LookupError(`Unknown profession: ${id}`)
  return found
}

/** Groups PROFESSIONS by category, preserving array order, for a scannable picker UI. */
export function groupProfessions(): { category: ProfessionCategory; items: Profession[] }[] {
  const groups: { category: ProfessionCategory; items: Profession[] }[] = []
  for (const profession of PROFESSIONS) {
    const last = groups[groups.length - 1]
    if (last && last.category === profession.category) {
      last.items.push(profession)
    } else {
      groups.push({ category: profession.category, items: [profession] })
    }
  }
  return groups
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
