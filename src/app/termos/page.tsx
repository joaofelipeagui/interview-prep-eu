import Link from 'next/link'
import { PLANS } from '@/lib/plans'

export const metadata = {
  title: 'Termos de Uso e Política de Reembolso — Simulador de Entrevistas | Vagas Remotas & Relocation',
}

export default async function TermosPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams
  const en = lang === 'en'

  if (en) {
    return (
      <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex-1 flex flex-col items-center w-full px-4 py-10 sm:py-16">
          <div className="w-full max-w-2xl space-y-8">
            <div>
              <Link href="/" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white">
                ← Back
              </Link>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
                Terms of Service and Refund Policy
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Last updated: July 2026</p>
            </div>

            <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
              <h2 className="text-base font-medium text-black dark:text-zinc-50">What this service is</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Interview Simulator | Remote Jobs & Relocation is an online tool that generates interview questions, answer
                evaluations, and resume reviews using artificial intelligence (Anthropic API). It is offered by an individual,
                not a registered company — there is no formal business registration or invoice associated with purchases. When
                you buy a plan, you are paying for access to a digital tool, not for consulting or a service provided by third
                parties.
              </p>
            </section>

            <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
              <h2 className="text-base font-medium text-black dark:text-zinc-50">Plans and payment</h2>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1 list-disc pl-5">
                {PLANS.map(plan => (
                  <li key={plan.id}>{plan.labelEn} — R$ {plan.priceBRL}, unlimited access to the simulator and resume review for the plan&apos;s duration</li>
                ))}
                <li>Payment is processed by Mercado Pago. We never have access to your card details — they are entered directly on Mercado Pago&apos;s secure page.</li>
                <li>These are fixed-duration access plans, with no auto-renewal. Buying a new plan before the current one expires adds the time to the remaining period.</li>
                <li>Access is tied to the email used at purchase, with no account or password required.</li>
              </ul>
            </section>

            <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
              <h2 className="text-base font-medium text-black dark:text-zinc-50">Refunds</h2>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1 list-disc pl-5">
                <li>
                  Under the right of withdrawal provided by the Brazilian Consumer Protection Code (Art. 49) for purchases made
                  outside a physical establishment, you may request a full refund within 7 calendar days of purchase, as long as
                  the paid access has not yet been used (no evaluated question and no resume review beyond the free trial).
                </li>
                <li>If the paid access has already been used, no refund is available — the service is delivered immediately and the cost (AI processing) has already been incurred.</li>
                <li>To request a refund, email <a href="mailto:felipe.aguiar29@gmail.com" className="underline">felipe.aguiar29@gmail.com</a> with the email used at purchase.</li>
              </ul>
            </section>

            <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
              <h2 className="text-base font-medium text-black dark:text-zinc-50">Data usage</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                See the consent screen at the start of the simulator for details on how your answers, voice, and email are used.
                In short: answers and resumes are sent to the Anthropic API only to generate your feedback, never to train
                models; voice audio is processed in your own browser and never leaves your device; email is used only to grant
                and verify your purchase.
              </p>
            </section>

            <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
              <h2 className="text-base font-medium text-black dark:text-zinc-50">Contact</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Questions, access issues, or refunds: <a href="mailto:felipe.aguiar29@gmail.com" className="underline">felipe.aguiar29@gmail.com</a>
              </p>
            </section>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex-1 flex flex-col items-center w-full px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl space-y-8">
          <div>
            <Link href="/" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white">
              ← Voltar
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Termos de Uso e Política de Reembolso
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Última atualização: julho de 2026</p>
          </div>

          <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <h2 className="text-base font-medium text-black dark:text-zinc-50">O que é este serviço</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              O Simulador de Entrevistas | Vagas Remotas & Relocation é uma ferramenta online que gera perguntas de entrevista, avaliação de respostas
              e revisão de currículo usando inteligência artificial (API da Anthropic). É oferecido por uma pessoa física, não
              por uma empresa registrada — não há CNPJ ou nota fiscal formal associada às compras. Ao comprar um plano, você está
              pagando por acesso a uma ferramenta digital, não por consultoria ou serviço prestado por terceiros.
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <h2 className="text-base font-medium text-black dark:text-zinc-50">Planos e pagamento</h2>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1 list-disc pl-5">
              {PLANS.map(plan => (
                <li key={plan.id}>{plan.label} — R$ {plan.priceBRL}, acesso ilimitado ao simulador e à revisão de currículo pelo período do plano</li>
              ))}
              <li>Pagamento processado pelo Mercado Pago. Não temos acesso aos dados do seu cartão — eles são inseridos diretamente na página segura do Mercado Pago.</li>
              <li>São planos de acesso por prazo fixo, sem renovação automática. Comprar um novo plano antes do atual expirar soma o tempo ao período restante.</li>
              <li>O acesso é vinculado ao e-mail usado na compra, sem necessidade de conta ou senha.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <h2 className="text-base font-medium text-black dark:text-zinc-50">Reembolso</h2>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1 list-disc pl-5">
              <li>
                Conforme o direito de arrependimento previsto no Código de Defesa do Consumidor (Art. 49) para compras feitas
                fora de estabelecimento físico, você pode pedir reembolso integral em até 7 dias corridos após a compra, desde
                que ainda não tenha usado o acesso pago (nenhuma pergunta avaliada nem currículo revisado além da tentativa
                gratuita).
              </li>
              <li>Se o acesso pago já foi utilizado, não há reembolso — o serviço é de entrega imediata e o custo (processamento de IA) já foi gerado.</li>
              <li>Para pedir reembolso, mande um e-mail para <a href="mailto:felipe.aguiar29@gmail.com" className="underline">felipe.aguiar29@gmail.com</a> com o e-mail usado na compra.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <h2 className="text-base font-medium text-black dark:text-zinc-50">Uso de dados</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Ver a tela de consentimento no início do simulador para detalhes sobre como suas respostas, voz e e-mail são usados.
              Em resumo: respostas e currículos são enviados à API da Anthropic só para gerar seu feedback, não para treinar
              modelos; áudio de voz é processado no seu navegador e nunca sai do seu dispositivo; e-mail é usado só para liberar
              e verificar sua compra.
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <h2 className="text-base font-medium text-black dark:text-zinc-50">Contato</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Dúvidas, problemas de acesso ou reembolso: <a href="mailto:felipe.aguiar29@gmail.com" className="underline">felipe.aguiar29@gmail.com</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
