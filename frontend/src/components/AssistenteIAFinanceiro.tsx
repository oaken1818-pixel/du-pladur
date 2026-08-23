import { useState } from "react";
import { Sparkles, X, Loader2, Check, FileText, Building2, AlertCircle } from "lucide-react";
import { iaFinanceiraApi, faturacaoApi, type IASugestaoFatura, type Obra } from "@/lib/api";
import { formatEuro } from "@/lib/auth";

export default function AssistenteIAFinanceiro({
  obras,
  onClose,
  onCreated,
}: {
  obras: Obra[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sugestao, setSugestao] = useState<IASugestaoFatura | null>(null);
  const [confirming, setConfirming] = useState(false);

  const exemplos = [
    "Cria o auto de medição da obra Moradia Cascais no valor de 12.500€ para os 300m² de pladur montados no mês",
    "Gera fatura pro-forma de 18.000€ para a obra de Lyon referente aos trabalhos de divisórias e tetos falsos",
    "Emitir auto de medição para a obra de Madrid no valor de 8.400€ com inversão de IVA",
  ];

  async function handleProcessarPrompt(texto: string) {
    if (!texto.trim()) return;
    setLoading(true);
    setError("");
    setSugestao(null);

    try {
      const res = await iaFinanceiraApi.processarPrompt(texto);
      setSugestao(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao processar pela IA.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmarEmissao() {
    if (!sugestao) return;
    setConfirming(true);
    setError("");

    try {
      await faturacaoApi.criarFatura({
        obraId: sugestao.obraId,
        tipo: sugestao.tipo,
        retencaoGarantiaPct: sugestao.retencaoGarantiaPct,
        notas: `Gerado automaticamente via Assistente de IA. ${sugestao.motivoIsencaoIva}`,
        itens: [sugestao.item],
      });

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao emitir fatura.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl card animate-fade-in space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #D4A017, #F59E0B)" }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Assistente de IA Financeira</h2>
              <p className="text-xs text-gray-400">Instruções em linguagem natural (Gratuito)</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" id="btn-fechar-ia">
            <X size={18} />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="label">Escreva ou selecione uma instrução:</label>
          <textarea
            className="input min-h-[90px] text-sm resize-none"
            placeholder="Ex: Emitir auto de medição de 15.000€ para a obra de Cascais referente a 350 m² de pladur..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="flex flex-wrap gap-2 pt-1">
            {exemplos.map((ex, i) => (
              <button
                key={i}
                type="button"
                className="text-[11px] px-2.5 py-1 rounded-lg border text-left transition-all hover:border-gold hover:text-gold"
                style={{ background: "var(--gray-850)", borderColor: "var(--gray-750)", color: "var(--gray-400)" }}
                onClick={() => {
                  setPrompt(ex);
                  handleProcessarPrompt(ex);
                }}
              >
                "{ex.slice(0, 45)}…"
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-gold btn-md w-full flex items-center justify-center gap-2"
          onClick={() => handleProcessarPrompt(prompt)}
          disabled={loading || !prompt.trim()}
          id="btn-processar-ia"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Processar com IA
        </button>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Resultado Sugerido pela IA */}
        {sugestao && (
          <div
            className="p-4 rounded-xl space-y-3 border animate-fade-in"
            style={{ background: "var(--gray-850)", borderColor: "var(--gold-500)" }}
          >
            <p className="text-xs text-gray-300 leading-relaxed">{sugestao.mensagemIA}</p>

            <div className="p-3 rounded-lg space-y-1.5 text-xs" style={{ background: "var(--gray-900)" }}>
              <div className="flex justify-between text-gray-400">
                <span>Obra:</span>
                <span className="text-white font-medium">{sugestao.obraNome}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Descrição:</span>
                <span className="text-white truncate max-w-[220px]">{sugestao.item.descricao}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Valor Sem IVA:</span>
                <span className="text-white font-semibold">{formatEuro(sugestao.valorSemIva)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>IVA (Inversão Sujeito Passivo):</span>
                <span className="text-green-400 font-semibold">0% (€ 0,00)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Retenção de Garantia (5%):</span>
                <span className="text-yellow-400 font-semibold">- {formatEuro(sugestao.valorRetido)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-800 text-sm font-bold">
                <span className="text-gold">Valor Líquido a Receber:</span>
                <span className="text-gold">{formatEuro(sugestao.valorTotal)}</span>
              </div>
            </div>

            <button
              className="btn btn-gold btn-md w-full flex items-center justify-center gap-2"
              onClick={handleConfirmarEmissao}
              disabled={confirming}
              id="btn-confirmar-fatura-ia"
            >
              {confirming ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Confirmar e Emitir Auto de Medição
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
