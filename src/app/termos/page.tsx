import Link from 'next/link'
import { PLANS } from '@/lib/plans'

export const metadata = {
  title: 'Termos de Uso e Política de Reembolso — Simulador de Entrevista Europa',
}

export default function TermosPage() {
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
              O Simulador de Entrevista — Europa é uma ferramenta online que gera perguntas de entrevista, avaliação de respostas
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
