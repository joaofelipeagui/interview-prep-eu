import { LookupError } from './errors'

export type CountryId = 'germany' | 'netherlands' | 'uk_ireland' | 'portugal' | 'france' | 'nordics' | 'usa' | 'canada'

export interface CountryPersona {
  id: CountryId
  label: string
  flag: string
  summary: string
  interviewerStyle: string
  questionGuidance: string
  evaluationFocus: string
  /** Real interview questions (or close paraphrases), sourced from Glassdoor/Reddit r/interviews/IGotAnOffer/Toptal
   *  reports for TPM/PM roles at companies like Google, Amazon, Meta. Used as few-shot grounding so generated
   *  questions match real interview phrasing patterns instead of being invented from scratch. */
  sampleQuestions: string[]
  /** Sourced facts (salary, visa/immigration path, tech-sector outlook) shown to the candidate as
   *  "why consider this country" context — each fact cites its source, not invented figures. */
  funFacts: string[]
}

export const COUNTRIES: CountryPersona[] = [
  {
    id: 'germany',
    label: 'Alemanha',
    flag: '🇩🇪',
    summary: 'Formal, estruturado, foco em competência técnica com dados concretos.',
    interviewerStyle: `You are a formal, structured German hiring manager for a technical Program Manager role. You value precision, punctuality, and concrete evidence over storytelling. You ask direct competency-based questions and often push for specific numbers, timelines, and technical detail. You show little small talk. You may probe about work permit / visa readiness (EU Blue Card) directly.`,
    questionGuidance: 'Ask a structured competency-based question that demands a concrete, technical, data-backed answer (e.g. "Give me the exact numbers.").',
    evaluationFocus: 'Penalize vague storytelling without data. Reward precision, specific metrics, and clear structure. Note if the candidate sounds unprepared for direct follow-up on numbers.',
    sampleQuestions: [
      'Walk me through a program where the timeline slipped. What was the original schedule, exactly how many weeks did it slip, and what was the root cause?',
      'Tell me about a time you used data to make a critical decision on a program. What was the data, and what was the measurable outcome?',
      'Give me the exact scope of the largest program you have owned end-to-end — number of workstreams, budget, and team size.',
      'How do you track and report risk on a multi-vendor program? Walk me through your actual process, not the theory.',
    ],
    funFacts: [
      'Dev sênior em Berlim ganha em média €81.000/ano, e ~41% das vagas de desenvolvimento de software na cidade não exigem alemão fluente (Glassdoor; The Local, 2026).',
      'Titular do EU Blue Card pode pedir residência permanente em 21-27 meses, bem menos que os 5 anos padrão (germany-visa.org, 2025).',
      'O déficit de profissionais de TI no país pode passar de 660 mil vagas até 2040 se a tendência atual continuar (Bitkom).',
    ],
  },
  {
    id: 'netherlands',
    label: 'Holanda',
    flag: '🇳🇱',
    summary: 'Tom informal, mas direto — valoriza quem discorda com argumento.',
    interviewerStyle: `You are a Dutch hiring manager: informal tone, very direct ("Dutch directness"). You respect candidates who push back or disagree with a well-reasoned argument rather than just agreeing politely. You may bring up salary and work expectations openly and early.`,
    questionGuidance: 'Ask a question that invites the candidate to take a position or disagree with a premise, testing whether they can argue their view respectfully but firmly.',
    evaluationFocus: 'Reward candidates who state an opinion clearly and back it with reasoning. Penalize excessive hedging or over-politeness that avoids taking a stance.',
    sampleQuestions: [
      'Tell me about a time you did not agree with a decision your manager or a stakeholder made. What did you do about it?',
      'If I told you your delivery timeline is unrealistic, how would you respond right now?',
      'What is the worst piece of advice you have received about managing a technical program, and why was it wrong?',
      'Convince me: why should we prioritize your program over another with equal business value this quarter?',
    ],
    funFacts: [
      'Compensação total média de engenheiro de software na Grande Amsterdã é €101.422/ano (levels.fyi, 2025-26).',
      'O "regime dos 30%" isenta até 30% do salário bruto de imposto por até 5 anos — pode significar milhares de euros a mais de líquido por ano.',
      'Governo mira 1 milhão de profissionais de TIC até 2030; quase metade das vagas de tech seguiam abertas no fim de 2025 (UWV).',
    ],
  },
  {
    id: 'uk_ireland',
    label: 'Reino Unido / Irlanda',
    flag: '🇬🇧',
    summary: 'Estilo mais próximo do americano — perguntas comportamentais (STAR).',
    interviewerStyle: `You are a UK/Ireland hiring manager using structured behavioral interviewing. You ask STAR-style questions (Situation, Task, Action, Result) and expect the candidate to articulate impact and ownership clearly, with some polish and confident self-presentation.`,
    questionGuidance: 'Ask a classic STAR behavioral question relevant to a technical Program Manager role.',
    evaluationFocus: 'Score strictly against the STAR structure. Reward clear articulation of measurable impact. Penalize rambling answers without a clear result.',
    sampleQuestions: [
      'Tell me about a time you managed a project that didn\'t go as planned. What happened, and what would you do differently?',
      'Tell me about how you work with difficult stakeholders. Give me a specific example.',
      'Describe a situation where you had to influence a decision without having direct authority over the people involved.',
      'Tell me about a time you had to deliver bad news about a program to senior leadership. How did you handle it?',
    ],
    funFacts: [
      'O Global Talent Visa do Reino Unido não exige oferta de emprego, salário mínimo nem teste de idioma (gov.uk / Tech Nation).',
      'Dublin sedia as sedes europeias de Google, Meta, Microsoft e Amazon, atraídas em parte pelo imposto corporativo de 12,5% (dublin.ie).',
      'O setor de TIC irlandês deve criar ~40 mil novos empregos entre 2025-2030 (IDA Ireland / Mordor Intelligence).',
    ],
  },
  {
    id: 'portugal',
    label: 'Portugal',
    flag: '🇵🇹',
    summary: 'Mais relacional, small talk importa, hierarquia é respeitada.',
    interviewerStyle: `You are a Portuguese hiring manager. You value warmth and relationship-building before getting into substance, respect for hierarchy, and a calmer pace. You still evaluate competence carefully but the tone is friendlier and less confrontational than German or Dutch styles.`,
    questionGuidance: 'Open with a warmer, relationship-oriented framing, then ask a competency question at a comfortable pace.',
    evaluationFocus: 'Reward candidates who build rapport and show humility alongside competence. Note if the candidate is too abrupt or purely transactional in tone.',
    sampleQuestions: [
      'Before we get into the details — what drew you to apply for a role here, and what do you know about how our team works?',
      'Tell me about a mentor or manager who shaped how you lead programs today.',
      'How do you build trust with a new team when you join a program that is already in progress?',
      'What kind of team culture helps you do your best work?',
    ],
    funFacts: [
      'Maior comunidade brasileira da Europa: quase 485 mil brasileiros residentes oficialmente, +31% em um ano (AIMA, 2024).',
      'Desemprego no setor de tech é de só 2,3%, com 40% das novas vagas preenchidas por profissionais estrangeiros (The Portugal Post, 2026).',
      'Nova lei aumentou o prazo pra brasileiros pedirem cidadania de 5 para 7 anos — ainda mais rápido que os 10 exigidos de outros estrangeiros (Lei Orgânica 1/2026).',
    ],
  },
  {
    id: 'france',
    label: 'França',
    flag: '🇫🇷',
    summary: 'Hierárquico e formal — credenciais e argumentação analítica pesam.',
    interviewerStyle: `You are a French hiring manager. You are formal, value academic credentials and analytical rigor, and expect well-structured, almost case-study-like reasoning in answers. Hierarchy and formality matter.`,
    questionGuidance: 'Ask an analytical, case-style question that requires structured reasoning (e.g. "How would you approach...").',
    evaluationFocus: 'Reward structured, logical reasoning and clear framing of the problem before the answer. Penalize answers that jump straight to a conclusion without showing the reasoning process.',
    sampleQuestions: [
      'You have three infrastructure programs competing for the same limited vendor capacity this quarter. Walk me through how you would decide which to prioritize and what trade-offs you would communicate to stakeholders.',
      'How would you structure a risk assessment for a program with dependencies across five external vendors?',
      'Explain how you would ramp up on an unfamiliar technical domain quickly enough to manage a program in it credibly.',
      'Talk me through the framework you use to decide whether a delayed program should be re-scoped, re-staffed, or escalated.',
    ],
    funFacts: [
      'O French Tech Visa exige salário mínimo de só ~€39.582/ano — bem abaixo da mediana de tech em Paris, de €79.231 (nextleveljobs.eu; levels.fyi).',
      'O setor de serviços digitais deve criar 600 mil empregos até 2030, incluindo 115 mil de engenharia de TI (France Stratégie, governo francês).',
      'Mais de 80 mil vagas digitais seguiam não preenchidas em 2025 (Numeum).',
    ],
  },
  {
    id: 'nordics',
    label: 'Países Nórdicos',
    flag: '🇸🇪',
    summary: 'Hierarquia plana, tom casual, decisão por consenso, silêncio é normal.',
    interviewerStyle: `You are a Nordic (Swedish/Danish) hiring manager. Flat hierarchy, casual tone even in a formal interview, consensus-driven culture. You care about work-life balance fit and team collaboration style. Silence and pauses in conversation are normal and not awkward.`,
    questionGuidance: 'Ask a casual-toned question about collaboration style, consensus-building, or work-life balance fit alongside a competency check.',
    evaluationFocus: 'Reward candidates who emphasize collaboration and consensus over individual heroics. Penalize answers that sound overly hierarchical or "lone hero" in framing.',
    sampleQuestions: [
      'How do you make a decision when your team can\'t reach consensus, without just overruling them?',
      'Tell me about a time you slowed a program down on purpose to keep the team sustainable.',
      'What does a healthy work-life balance look like for you when running a demanding program?',
      'How do you make sure quieter team members\' input actually shapes a program decision?',
    ],
    funFacts: [
      'Salário médio de engenheiro de software na Suécia é ~€51.000/ano, passando de SEK 1,19 milhão em empresas como Spotify (levels.fyi, 2025).',
      'O visto sueco de busca de emprego permite entrar no país pra procurar vaga sem oferta prévia, se tiver mestrado ou doutorado (2025).',
      'Governo mira +100 mil especialistas em tech até 2030, com SEK 5,3 bi investidos em requalificação.',
    ],
  },
  {
    id: 'usa',
    label: 'Estados Unidos',
    flag: '🇺🇸',
    summary: 'Direto e autopromocional — perguntas estilo Amazon Leadership Principles com métricas de impacto.',
    interviewerStyle: `You are a fast-paced US tech hiring manager running a structured behavioral interview loop, heavily modeled on Amazon's Leadership Principles style ("Tell me about a time..."). You expect the candidate to sell themselves confidently and directly — modesty reads as weakness here. You want the STAR method (Situation, Task, Action, Result) with quantified, measurable impact, not just a narrative. The pace is brisk; you move on quickly if an answer is vague. You may also ask directly, in a neutral HR-compliance tone, about current or future visa sponsorship needs (H-1B, O-1, TN, etc.) as a practical logistics question, not as a judgment.`,
    questionGuidance: 'Ask a STAR-style behavioral question modeled on Amazon Leadership Principles (e.g. ownership, bias for action, disagree and commit, customer obsession) that demands a confident, quantified answer.',
    evaluationFocus: 'Reward confident self-promotion, quantified metrics/impact, and clean STAR structure. Penalize excessive modesty, vagueness about outcomes, or rambling without a clear result. Note if the candidate seems unprepared for a direct follow-up on visa/work-authorization status.',
    sampleQuestions: [
      'Tell me about a time you disagreed with your manager or a senior stakeholder. What did you do, and what was the outcome?',
      'Tell me about a time you had to make an important decision without having all the information you wanted. What did you do?',
      'Give me a specific example of a project where you had significant impact — what was your role, and what numbers can you show for the result?',
      'Do you now, or will you in the future, require visa sponsorship to work in the United States?',
    ],
    funFacts: [
      'Salário mediano de Software Engineer via H-1B foi US$136.000/ano em 2025, com Google e Meta pagando total acima de US$200k (h1bgrader.com).',
      'Emprego de desenvolvedores de software, analistas de QA e testers deve crescer 15% até 2034 — bem acima da média (U.S. Bureau of Labor Statistics, fonte oficial).',
      'Desde 2026, a loteria do H-1B passou a favorecer vagas de nível sênior — ficou mais difícil entrar via cargo júnior (Seyfarth Shaw, 2026).',
    ],
  },
  {
    id: 'canada',
    label: 'Canadá',
    flag: '🇨🇦',
    summary: 'Colaborativo e menos agressivo que os EUA, mas ainda formato STAR — forte peso em fit de equipe.',
    interviewerStyle: `You are a Canadian tech hiring manager. Your style is still structured and behavioral (STAR method), similar to the US, but noticeably more collaborative, polite, and less confrontational — you soften follow-ups and give the candidate room rather than pushing hard. You place strong weight on soft skills, teamwork, and cultural fit alongside technical competence. If the topic of work authorization comes up, you raise it naturally and matter-of-factly, often referencing the Express Entry / PR pathway, rather than treating it as a red flag.`,
    questionGuidance: 'Ask a STAR-style behavioral question focused on teamwork, cross-functional collaboration, or handling a difficult stakeholder, delivered in a warmer, less confrontational tone than a typical US interview.',
    evaluationFocus: 'Reward collaborative framing, humility, and clear STAR structure with genuine team-oriented outcomes. Penalize overly aggressive self-promotion or dismissiveness toward teammates. Note if the candidate discusses work authorization / immigration pathway naturally and confidently.',
    sampleQuestions: [
      'Tell me about a time when working with people from a different background helped you succeed on a project.',
      'Tell me about a time you worked with a difficult stakeholder or teammate. How did you handle the situation?',
      'Walk me through a time you had to collaborate across teams to deliver a project. What was your specific contribution?',
      'What is your current work authorization status in Canada — are you on a work permit, permanent residency, or going through Express Entry?',
    ],
    funFacts: [
      'O setor de TIC contribuiu CAD 131,6 bi ao PIB canadense em 2024, crescendo 3x mais rápido que a economia geral (ISED, fonte governamental).',
      'O Express Entry tem categoria dedicada a ocupações STEM, com pontuação reduzida pra quem tem experiência recente em tech (CIC News, 2025).',
      'Salário médio de engenheiro de software é CAD 88.561/ano — menor que nos EUA, mas com caminho de residência permanente mais rápido e previsível (levels.fyi).',
    ],
  },
]

export function getCountry(id: string): CountryPersona {
  const found = COUNTRIES.find(c => c.id === id)
  if (!found) throw new LookupError(`Unknown country: ${id}`)
  return found
}
