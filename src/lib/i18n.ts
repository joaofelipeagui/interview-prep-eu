export type Locale = 'pt' | 'en'

export const LOCALE_KEY = 'interview_prep_locale'

interface Dict {
  headerTitle: string
  headerSubtitle: string
  consentTitle: string
  consentBullets: string[]
  consentCheckbox: string
  consentButton: string
  modeInterview: string
  modeCv: string
  stepCountry: string
  stepProfession: string
  whyConsider: string
  otherProfessionPlaceholder: string
  startInterview: string
  unlimitedAccess: string
  reconfigure: string
  generatingQuestion: string
  questionLabel: string
  answerPlaceholder: string
  stopRecording: string
  speakAnswer: string
  recordingLabel: string
  paceEstimate: string
  noFillerWords: string
  fillerWordsCount: string
  fillerWordsCountPlural: string
  speechError: string
  sendAnswer: string
  evaluatingAnswer: string
  nextQuestion: string
  downloadPdf: string
  personLimitTitle: string
  globalLimitTitle: string
  plansSubtitle: string
  errorGeneratingQuestion: string
  errorEvaluating: string
  genericError: string
  paymentConfirmed: string
  paymentReceivedCheck: string
  paymentReceivedGeneric: string
  cvStepCountry: string
  cvStepProfession: string
  cvStepResume: string
  cvUploadLabel: string
  cvPastePlaceholder: string
  cvOtherProfessionPlaceholder: string
  cvAnalyzing: string
  cvReview: string
  cvReviewAnother: string
  cvFreeLimitPersonTitle: string
  cvFreeLimitGlobalTitle: string
  cvFreeLimitSubtitle: string
  cvErrorGeneric: string
  fbScoreLabel: string
  fbEvaluationFallback: string
  fbStrengths: string
  fbImprovements: string
  fbStarStructure: string
  fbRestructureTip: string
  fbRecruiterWants: string
  fbEnglishNotes: string
  fbModelAnswer: string
  cvfStrengths: string
  cvfImprovements: string
  cvfConventionsOf: string
  cvfKeywords: string
  plansNotConfiguredTitle: string
  plansNotConfiguredSubtitle: string
  notifyMeButton: string
  notifyMeConfirmed: string
  emailFirst: string
  paymentStartFailed: string
  unexpectedError: string
  emailPlaceholder: string
  buy: string
  alreadyBought: string
  verifyAccess: string
  noActiveSubscription: string
  verifyFailed: string
  termsLink: string
}

export const translations: Record<Locale, Dict> = {
  pt: {
    headerTitle: 'Simulador de Entrevistas | Vagas Remotas & Relocation',
    headerSubtitle: 'Treine entrevistas em inglês no estilo real de cada país, adaptado à sua profissão.',
    consentTitle: 'Antes de começar',
    consentBullets: [
      'Suas respostas (texto e transcrição de voz) são enviadas para a API da Anthropic apenas para gerar o feedback desta sessão — não são usadas para treinar modelos de IA.',
      'Se você usar "Responder falando", o áudio é processado pelo próprio navegador (Web Speech API); nenhum áudio é enviado a servidores, só o texto transcrito.',
      'Guardamos um identificador anônimo do seu navegador e o IP apenas para controlar o limite de testes gratuitos — não identificamos você pessoalmente com isso.',
      'Se você comprar acesso, seu e-mail é usado só para liberar e verificar sua compra. Nunca é vendido ou compartilhado com terceiros.',
    ],
    consentCheckbox: 'Li e concordo com o uso das minhas respostas conforme descrito acima.',
    consentButton: 'Começar',
    modeInterview: '🎤 Simulador de Entrevista',
    modeCv: '📄 Revisão de Currículo',
    stepCountry: '1. País do entrevistador',
    stepProfession: '2. Sua profissão',
    whyConsider: 'Por que considerar',
    otherProfessionPlaceholder: 'Digite sua profissão/área (ex: UX Designer, Segurança da Informação...)',
    startInterview: 'Começar entrevista',
    unlimitedAccess: '✓ acesso ilimitado',
    reconfigure: 'reconfigurar',
    generatingQuestion: 'Gerando pergunta...',
    questionLabel: 'Pergunta',
    answerPlaceholder: 'Escreva ou grave sua resposta em inglês...',
    stopRecording: 'Parar gravação',
    speakAnswer: 'Responder falando',
    recordingLabel: 'gravando...',
    paceEstimate: 'Ritmo estimado',
    noFillerWords: 'Nenhuma muleta de linguagem detectada',
    fillerWordsCount: 'muleta de linguagem (um, like...)',
    fillerWordsCountPlural: 'muletas de linguagem (um, like...)',
    speechError: 'Não foi possível capturar sua voz. Verifique a permissão do microfone e tente novamente.',
    sendAnswer: 'Enviar resposta',
    evaluatingAnswer: 'Avaliando resposta...',
    nextQuestion: 'Próxima pergunta',
    downloadPdf: 'Baixar PDF',
    personLimitTitle: 'Você já usou sua avaliação gratuita neste teste',
    globalLimitTitle: 'Chegamos ao limite de testes gratuitos de hoje',
    plansSubtitle: 'Escolha um plano pra continuar praticando sem limite, e desbloquear a revisão de currículo.',
    errorGeneratingQuestion: 'Falha ao gerar pergunta',
    errorEvaluating: 'Falha ao avaliar resposta',
    genericError: 'Erro inesperado',
    paymentConfirmed: 'Pagamento confirmado! Seu acesso já está liberado.',
    paymentReceivedCheck: 'Pagamento recebido — pode levar alguns segundos para confirmar. Clique em "Verificar acesso" daqui a pouco se ainda não liberou.',
    paymentReceivedGeneric: 'Pagamento recebido! Se você informou seu e-mail na compra, verifique o acesso abaixo.',
    cvStepCountry: '1. País de destino',
    cvStepProfession: '2. Sua profissão',
    cvStepResume: '3. Seu currículo',
    cvUploadLabel: 'Enviar PDF ou Word (.docx)',
    cvPastePlaceholder: '...ou cole o texto do seu currículo aqui',
    cvOtherProfessionPlaceholder: 'Digite sua profissão/área',
    cvAnalyzing: 'Analisando currículo...',
    cvReview: 'Revisar currículo',
    cvReviewAnother: 'revisar outro currículo',
    cvFreeLimitPersonTitle: 'Você já usou sua revisão de currículo gratuita',
    cvFreeLimitGlobalTitle: 'Chegamos ao limite de revisões gratuitas de hoje',
    cvFreeLimitSubtitle: 'Escolha um plano pra revisar quantos currículos quiser, e destravar o simulador de entrevista sem limite.',
    cvErrorGeneric: 'Falha ao revisar o currículo.',
    fbScoreLabel: 'Nota',
    fbEvaluationFallback: 'Avaliação',
    fbStrengths: 'Pontos fortes',
    fbImprovements: 'Pontos a melhorar',
    fbStarStructure: 'Estrutura da resposta (STAR)',
    fbRestructureTip: 'Dica de reestruturação:',
    fbRecruiterWants: 'O que o recrutador quer ouvir',
    fbEnglishNotes: 'Inglês — correções e melhorias',
    fbModelAnswer: 'Resposta modelo',
    cvfStrengths: 'Pontos fortes',
    cvfImprovements: 'Pontos a melhorar',
    cvfConventionsOf: 'Convenções de',
    cvfKeywords: 'Palavras-chave e ATS',
    plansNotConfiguredTitle: 'Pagamento ainda não está disponível',
    plansNotConfiguredSubtitle: 'Estamos configurando o checkout. Deixe seu e-mail que eu aviso assim que abrir.',
    notifyMeButton: 'Avisar quando abrir',
    notifyMeConfirmed: 'Combinado — vou te avisar!',
    emailFirst: 'Digite seu e-mail primeiro.',
    paymentStartFailed: 'Não foi possível iniciar o pagamento.',
    unexpectedError: 'Erro inesperado.',
    emailPlaceholder: 'seu@email.com',
    buy: 'Comprar',
    alreadyBought: 'Já comprou um plano?',
    verifyAccess: 'Verificar acesso pelo e-mail',
    noActiveSubscription: 'Nenhuma assinatura ativa encontrada pra esse e-mail.',
    verifyFailed: 'Falha ao verificar.',
    termsLink: 'Termos de Uso e Política de Reembolso',
  },
  en: {
    headerTitle: 'Interview Simulator | Remote Jobs & Relocation',
    headerSubtitle: 'Practice interviews in the real style of each country, tailored to your profession.',
    consentTitle: 'Before you start',
    consentBullets: [
      'Your answers (text and voice transcript) are sent to the Anthropic API only to generate this session\'s feedback — never used to train AI models.',
      'If you use "Answer by speaking", audio is processed in your own browser (Web Speech API); no audio is ever sent to any server, only the transcribed text.',
      'We store an anonymous browser/IP identifier only to enforce the free-trial limit — this does not personally identify you.',
      'If you purchase access, your email is used only to grant and verify your purchase. Never sold or shared with third parties.',
    ],
    consentCheckbox: 'I have read and agree to the use of my answers as described above.',
    consentButton: 'Start',
    modeInterview: '🎤 Interview Simulator',
    modeCv: '📄 Resume Review',
    stepCountry: '1. Interviewer\'s country',
    stepProfession: '2. Your profession',
    whyConsider: 'Why consider',
    otherProfessionPlaceholder: 'Type your profession/field (e.g. UX Designer, Information Security...)',
    startInterview: 'Start interview',
    unlimitedAccess: '✓ unlimited access',
    reconfigure: 'reconfigure',
    generatingQuestion: 'Generating question...',
    questionLabel: 'Question',
    answerPlaceholder: 'Write or record your answer in English...',
    stopRecording: 'Stop recording',
    speakAnswer: 'Answer by speaking',
    recordingLabel: 'recording...',
    paceEstimate: 'Estimated pace',
    noFillerWords: 'No filler words detected',
    fillerWordsCount: 'filler word (um, like...)',
    fillerWordsCountPlural: 'filler words (um, like...)',
    speechError: 'Could not capture your voice. Check microphone permission and try again.',
    sendAnswer: 'Submit answer',
    evaluatingAnswer: 'Evaluating answer...',
    nextQuestion: 'Next question',
    downloadPdf: 'Download PDF',
    personLimitTitle: 'You already used your free evaluation in this test',
    globalLimitTitle: 'We reached today\'s free-trial limit',
    plansSubtitle: 'Pick a plan to keep practicing without limits, and unlock resume review.',
    errorGeneratingQuestion: 'Failed to generate question',
    errorEvaluating: 'Failed to evaluate answer',
    genericError: 'Unexpected error',
    paymentConfirmed: 'Payment confirmed! Your access is already unlocked.',
    paymentReceivedCheck: 'Payment received — it may take a few seconds to confirm. Click "Verify access" shortly if it hasn\'t unlocked yet.',
    paymentReceivedGeneric: 'Payment received! If you entered your email at checkout, verify your access below.',
    cvStepCountry: '1. Target country',
    cvStepProfession: '2. Your profession',
    cvStepResume: '3. Your resume',
    cvUploadLabel: 'Upload PDF or Word (.docx)',
    cvPastePlaceholder: '...or paste your resume text here',
    cvOtherProfessionPlaceholder: 'Type your profession/field',
    cvAnalyzing: 'Analyzing resume...',
    cvReview: 'Review resume',
    cvReviewAnother: 'review another resume',
    cvFreeLimitPersonTitle: 'You already used your free resume review',
    cvFreeLimitGlobalTitle: 'We reached today\'s free-review limit',
    cvFreeLimitSubtitle: 'Pick a plan to review as many resumes as you want, and unlock unlimited interview practice.',
    cvErrorGeneric: 'Failed to review the resume.',
    fbScoreLabel: 'Score',
    fbEvaluationFallback: 'Evaluation',
    fbStrengths: 'Strengths',
    fbImprovements: 'Areas to improve',
    fbStarStructure: 'Answer structure (STAR)',
    fbRestructureTip: 'Restructuring tip:',
    fbRecruiterWants: 'What the recruiter wants to hear',
    fbEnglishNotes: 'English — corrections and improvements',
    fbModelAnswer: 'Model answer',
    cvfStrengths: 'Strengths',
    cvfImprovements: 'Areas to improve',
    cvfConventionsOf: 'Conventions for',
    cvfKeywords: 'Keywords and ATS',
    plansNotConfiguredTitle: 'Payment is not available yet',
    plansNotConfiguredSubtitle: 'We\'re setting up checkout. Leave your email and we\'ll let you know as soon as it opens.',
    notifyMeButton: 'Notify me when it opens',
    notifyMeConfirmed: 'Got it — we\'ll let you know!',
    emailFirst: 'Enter your email first.',
    paymentStartFailed: 'Could not start the payment.',
    unexpectedError: 'Unexpected error.',
    emailPlaceholder: 'you@email.com',
    buy: 'Buy',
    alreadyBought: 'Already purchased a plan?',
    verifyAccess: 'Verify access by email',
    noActiveSubscription: 'No active subscription found for that email.',
    verifyFailed: 'Verification failed.',
    termsLink: 'Terms of Service and Refund Policy',
  },
}

export function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt'
  const stored = localStorage.getItem(LOCALE_KEY)
  return stored === 'en' ? 'en' : 'pt'
}
