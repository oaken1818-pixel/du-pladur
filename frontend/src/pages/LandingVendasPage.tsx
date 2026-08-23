import { useState } from "react";
import {
  Hammer,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  FileText,
  Calculator,
  CalendarDays,
  Smartphone,
  TrendingUp,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Gift,
  Star,
  Euro,
  Globe,
} from "lucide-react";

export default function LandingVendasPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const whatsappUrl =
    "https://wa.me/351966770171?text=Ol%C3%A1!%20Quero%20testar%20o%20OAKEN%20BUILD%20por%2049%E2%82%AC%2Fm%C3%AAs%20e%20garantir%20todos%20os%20B%C3%B3nus%20Exclusivos.";

  const bonusList = [
    {
      badge: "BÓNUS EXCLUSIVO #1",
      valor: "197 €",
      titulo: "Guia Acelerador de Clientes & Angariação de Obras em Portugal",
      descricao:
        "Passo a passo prático para conseguir clientes e fechar contratos de obras através das principais plataformas em Portugal (Zaask, Habitissimo, Worknow e PedirOrçamentos.com). Inclui modelos de propostas prontas de alta conversão.",
    },
    {
      badge: "BÓNUS EXCLUSIVO #2",
      valor: "147 €",
      titulo: "Pack de Minutas de Contratos de Empreitada & Subempreitada (Direito PT)",
      descricao:
        "Contratos jurídicos prontos para uso em Portugal. Proteja os seus pagamentos com cláusulas legais de retenção de garantia (5%), prazos de pagamento, inversão de IVA e proteção de sinal.",
    },
    {
      badge: "BÓNUS EXCLUSIVO #3",
      valor: "97 €",
      titulo: "Tabela de Preços Médios de Mão de Obra & Margens por m² (PT, ES e FR)",
      descricao:
        "Guia de referência com os preços médios praticados no mercado europeu por m² (Pladur, Alvenaria, Pintura, Cerâmica) para nunca mais orçamentar com prejuízo.",
    },
    {
      badge: "BÓNUS EXCLUSIVO #4",
      valor: "99 €",
      titulo: "Setup Assistido & Suporte Prioritário VIP no WhatsApp",
      descricao:
        "Acompanhamento direto via WhatsApp (+351 966 770 171) para configurar a sua empresa, equipa e ligação à Autoridade Tributária em menos de 24 horas.",
    },
  ];

  const faqs = [
    {
      q: "O OAKEN BUILD cumpre as regras de faturação e IVA da Autoridade Tributária (AT) em Portugal?",
      a: "Sim! O OAKEN BUILD foi desenvolvido com base no regime fiscal português. Calcula automaticamente a Inversão do Sujeito Passivo (0% IVA - Artigo 2.º n.º 1 al. j do CIVA), Retenção de Garantia de 5% e comunica diretamente com o e-Fatura da AT ou com o seu software atual (InvoiceXpress/Moloni).",
    },
    {
      q: "Serve para que tipo de trabalhos de construção?",
      a: "Para todos! O OAKEN BUILD foi desenhado para Plaquistas (Pladur), Pedreiros, Pintores, Ladrilhadores, Eletricistas, Canalizadores, Empreiteiros e Mestres de Obra com equipas de 2 a 50 trabalhadores.",
    },
    {
      q: "Como funciona a garantia de 7 dias?",
      a: "Experimente o OAKEN BUILD durante 7 dias sem qualquer compromisso. Se sentir que a plataforma não economiza dezenas de horas na gestão da sua empresa, devolvemos 100% do seu dinheiro sem perguntas.",
    },
    {
      q: "Como recebo os 540 € em Bónus Digitais?",
      a: "Imediatamente após a sua assinatura de 49 €/mês, os guias em PDF, minutas de contratos e tabelas de preços ficam disponíveis para download instantâneo no seu painel.",
    },
  ];

  return (
    <div className="min-h-dvh text-gray-100 w-full overflow-x-hidden" style={{ background: "#060608", fontFamily: "Inter, sans-serif" }}>
      {/* ── BARRA DE AVISO SUPERIOR ── */}
      <div
        className="py-2.5 px-4 text-center font-semibold text-xs text-black flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(90deg, #D4A017, #F59E0B)" }}
      >
        <Sparkles size={16} />
        <span>OFERTA LIMITADA: Garanta 540 € em Bónus Digitais ao assinar por apenas 49 €/mês!</span>
      </div>

      {/* ── NAVEGAÇÃO / HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-gray-800/80 backdrop-blur-md bg-black/80">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-bold"
              style={{ background: "linear-gradient(135deg, #D4A017, #F59E0B)" }}
            >
              <Hammer size={20} />
            </div>
            <div>
              <p className="font-extrabold text-white text-base leading-none tracking-tight">OAKEN BUILD</p>
              <p className="text-[10px] text-gray-400 mt-0.5">SaaS de Gestão de Obras & Empreiteiros</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#/admin"
              className="btn btn-ghost btn-md font-bold text-xs sm:text-sm text-gray-300 hover:text-white"
              id="btn-nav-admin"
            >
              Entrar no SaaS
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold btn-md font-bold flex items-center gap-2 text-xs sm:text-sm"
              id="btn-nav-whatsapp"
            >
              <MessageCircle size={17} />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION DE ALTA CONVERSÃO ── */}
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-gold text-xs font-semibold">
            <Zap size={14} />
            O Sistema Definitivo para Empreiteiros & Mestres de Obra em Portugal
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Gerencie Obras, Folhas de Ponto por Hora e Faturas com IA em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
              1 Único Clique
            </span>
          </h1>

          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Elimine a confusão da gestão de obras. Calcule materiais por especialidade, processe vencimentos de trabalhadores (€/h) e emita Autos de Medição com Inversão de IVA automática.
          </p>

          {/* CTA Principal */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-base text-black flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
              style={{ background: "linear-gradient(135deg, #D4A017, #F59E0B)" }}
              id="hero-cta-button"
            >
              <span>Começar por Apenas 49 € / mês</span>
              <ArrowRight size={20} />
            </a>

            <a
              href="#bonus"
              className="text-xs text-gray-400 hover:text-white underline underline-offset-4"
            >
              Ver os 540 € em Bónus Incluídos ↓
            </a>
          </div>

          {/* Selos de Confiança */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-400" /> Teste de 7 Dias Sem Risco
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-400" /> Sem Fidelização (Cancele quando quiser)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-400" /> Suporte VIP em Portugal (+351 966 770 171)
            </span>
          </div>
        </div>
      </section>

      {/* ── RECURSOS PRINCIPAIS DA PLATAFORMA ── */}
      <section className="py-16 px-4 bg-gray-900/40 border-y border-gray-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Tudo o que a sua Empresa Precisa Numa Única Plataforma
            </h2>
            <p className="text-sm text-gray-400">
              Desenvolvido especialmente para Pedreiros, Plaquistas, Pintores, Ladrilhadores e Empreiteiros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-gold flex items-center justify-center">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Faturação & Autos de Medição AT</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Emita autos de medição mensais com 0% IVA (Inversão de Sujeito Passivo - Artigo 2.º CIVA) e 5% de retenção de garantia de obra integrados com a Autoridade Tributária.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Recursos Humanos & Vencimentos (€/h)</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Calcule automaticamente a folha de pagamento de 20 a 50 trabalhadores com base nas horas trabalhadas (€/h), horas extraordinárias (+50%) e relatórios para a contabilista.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                <Calculator size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Calculadora de Materiais Precisa</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Estimativas exatas para Pedreiros (Cimento 25kg, Tijolo), Pintores (Tintas e Demãos), Ladrilhadores (Cerâmica, Cola) e Plaquistas (Montantes a 60cm e Raias).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BÓNUS EXCLUSIVOS (VALOR > 540€ INCLUÍDO GRÁTIS) ── */}
      <section id="bonus" className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-gold text-xs font-bold border border-amber-500/30">
              <Gift size={15} /> BÓNUS DIGITAIS EXCLUSIVOS INCLUÍDOS
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Leve 540 € em Bónus Digitais Sem Pagar Mais Nada
            </h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Ao assinar o OAKEN BUILD hoje por apenas 49 €/mês, recebe acesso imediato a todo o material de aceleração empresarial:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bonusList.map((b, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-gray-900 to-black space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-amber-500/20 text-gold border border-amber-500/40">
                    {b.badge}
                  </span>
                  <span className="text-sm font-bold text-gray-400 line-through">
                    Valor: {b.valor}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{b.titulo}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{b.descricao}</p>
                <p className="text-xs font-bold text-green-400 pt-2">✓ Incluído Grátis na Subscrição Mensal</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARD DE PREÇO & CTA FINAL ── */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-950 to-black border-t border-gray-800">
        <div className="max-w-xl mx-auto card p-8 sm:p-10 border-2 border-amber-500/50 space-y-6 text-center relative shadow-2xl shadow-amber-500/10">
          <div className="inline-block px-4 py-1 rounded-full bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider">
            Plano Profissional Completo
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white">OAKEN BUILD SaaS</h2>

          <div className="space-y-1">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl sm:text-6xl font-black text-gold">49 €</span>
              <span className="text-gray-400 text-base font-semibold">/ mês</span>
            </div>
            <p className="text-xs text-green-400 font-semibold">
              + 540 € em Bónus Digitais Totalmente GRÁTIS
            </p>
          </div>

          <ul className="text-xs text-gray-300 space-y-3 text-left max-w-sm mx-auto">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold shrink-0" />
              <span>Acesso total à Gestão de Obras & Ponto GPS</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold shrink-0" />
              <span>Agente de IA Financeira & Faturação AT Portugal</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold shrink-0" />
              <span>Calculadoras de Materiais (Pedreiro, Pintor, Pladur, Cerâmica)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold shrink-0" />
              <span>Processamento da Folha de Vencimentos (€/h) em 1 Clique</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold shrink-0" />
              <span>Todos os 4 Bónus Digitais de Angariação de Clientes (540€ Valor)</span>
            </li>
          </ul>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-4 rounded-xl font-extrabold text-base text-black flex items-center justify-center gap-3 transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #D4A017, #F59E0B)" }}
            id="pricing-whatsapp-button"
          >
            <MessageCircle size={20} />
            Assinar Agora via WhatsApp (+351 966 770 171)
          </a>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
            <ShieldCheck size={16} className="text-green-400" />
            <span>7 Dias de Garantia Incondicional de Reembolso</span>
          </div>
        </div>
      </section>

      {/* ── FAQ PERGUNTAS FREQUENTES ── */}
      <section className="py-16 px-4 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Perguntas Frequentes</h2>
          <p className="text-xs text-gray-400">Esclareça todas as suas dúvidas antes de assinar.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden transition-all"
            >
              <button
                className="w-full p-4 text-left text-sm font-bold text-white flex items-center justify-between gap-3"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{f.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-gold transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-gray-300 leading-relaxed border-t border-gray-800/60 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER & BOTÃO FLUTUANTE WHATSAPP ── */}
      <footer className="py-8 px-4 border-t border-gray-800 text-center text-xs text-gray-500 space-y-2">
        <p>© 2026 OAKEN BUILD — Todos os direitos reservados.</p>
        <p>Contacto de Vendas: +351 966 770 171 · Portugal</p>
      </footer>

      {/* Botão Flutuante de WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 p-4 rounded-full bg-green-500 text-white font-bold flex items-center gap-2 shadow-2xl hover:scale-110 transition-transform"
        id="floating-whatsapp-cta"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle size={24} />
        <span className="hidden sm:inline text-xs font-extrabold">Falar no WhatsApp</span>
      </a>
    </div>
  );
}
