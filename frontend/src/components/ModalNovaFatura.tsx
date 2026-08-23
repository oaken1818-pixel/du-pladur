import { useState } from "react";
import { X, Plus, Trash2, Loader2, Check, AlertCircle, FileText, Building2 } from "lucide-react";
import { faturacaoApi, type Obra, type Cliente } from "@/lib/api";
import { formatEuro } from "@/lib/auth";

export default function ModalNovaFatura({
  obras,
  clientes,
  onClose,
  onCreated,
}: {
  obras: Obra[];
  clientes: Cliente[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [tipo, setTipo] = useState<"AUTO_MEDICAO" | "PRO_FORMA" | "FATURA">("AUTO_MEDICAO");
  const [obraId, setObraId] = useState(obras[0]?.id || "");
  const [clienteId, setClienteId] = useState(clientes[0]?.id || "");
  const [retencaoGarantiaPct, setRetencaoGarantiaPct] = useState(5);
  const [dataVencimento, setDataVencimento] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notas, setNotas] = useState("");

  const [itens, setItens] = useState<
    { descricao: string; quantidade: number; unidade: string; precoUnitario: number }[]
  >([
    {
      descricao: "Montagem de divisórias e tetos falsos de Pladur Nível 2",
      quantidade: 250,
      unidade: "m²",
      precoUnitario: 35,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addItem() {
    setItens((old) => [
      ...old,
      { descricao: "Trabalhos adicionais de pladur", quantidade: 1, unidade: "un", precoUnitario: 500 },
    ]);
  }

  function removeItem(index: number) {
    if (itens.length === 1) return;
    setItens((old) => old.filter((_, i) => i !== index));
  }

  function updateItem(index: number, key: string, val: string | number) {
    setItens((old) =>
      old.map((item, i) => (i === index ? { ...item, [key]: val } : item))
    );
  }

  // Cálculos em tempo real
  const valorSemIva = itens.reduce(
    (acc, item) => acc + Number(item.quantidade || 0) * Number(item.precoUnitario || 0),
    0
  );
  const valorRetido = (valorSemIva * Number(retencaoGarantiaPct || 0)) / 100;
  const valorTotal = valorSemIva - valorRetido;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itens.length || valorSemIva <= 0) {
      setError("Adiciona pelo menos um item com valor válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await faturacaoApi.criarFatura({
        obraId: obraId || undefined,
        clienteId: clienteId || undefined,
        tipo,
        retencaoGarantiaPct,
        dataVencimento,
        notas,
        itens,
      });

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao emitir documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl card animate-fade-in flex flex-col space-y-4"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-gold" />
              Novo Auto de Medição / Fatura
            </h2>
            <p className="text-xs text-gray-400">
              Construção Civil — Normas Portugal & Inversão de IVA
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" id="btn-fechar-modal-fatura">
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo de Documento</label>
              <select
                className="input select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
              >
                <option value="AUTO_MEDICAO">Auto de Medição Mensal</option>
                <option value="PRO_FORMA">Fatura Pro-Forma</option>
                <option value="FATURA">Fatura Comercial</option>
              </select>
            </div>

            <div>
              <label className="label">Obra Relacionada</label>
              <select
                className="input select"
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
              >
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome} ({o.cidade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Retenção de Garantia (%)</label>
              <input
                type="number"
                className="input"
                value={retencaoGarantiaPct}
                onChange={(e) => setRetencaoGarantiaPct(Number(e.target.value))}
                min={0}
                max={20}
              />
              <p className="text-[11px] text-gray-500 mt-1">Normalmente 5% retido em obra.</p>
            </div>

            <div>
              <label className="label">Data de Vencimento</label>
              <input
                type="date"
                className="input"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Lista de itens de medição */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="label text-gold font-semibold">Itens de Medição / Trabalhos</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs text-gold flex items-center gap-1"
                onClick={addItem}
              >
                <Plus size={14} /> Adicionar Linha
              </button>
            </div>

            {itens.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl space-y-2 border"
                style={{ background: "var(--gray-850)", borderColor: "var(--gray-750)" }}
              >
                <div>
                  <input
                    className="input text-xs"
                    placeholder="Descrição do trabalho (ex: Montagem de Pladur Teto Falso)"
                    value={item.descricao}
                    onChange={(e) => updateItem(index, "descricao", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 items-center">
                  <div>
                    <span className="text-[10px] text-gray-400">Qtd</span>
                    <input
                      type="number"
                      className="input text-xs py-1"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, "quantidade", Number(e.target.value))}
                      min={0.1}
                      step={0.1}
                      required
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400">Unidade</span>
                    <select
                      className="input select text-xs py-1"
                      value={item.unidade}
                      onChange={(e) => updateItem(index, "unidade", e.target.value)}
                    >
                      <option value="m²">m²</option>
                      <option value="ml">ml</option>
                      <option value="un">un</option>
                      <option value="h">h</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400">Preço Uni (€)</span>
                    <input
                      type="number"
                      className="input text-xs py-1"
                      value={item.precoUnitario}
                      onChange={(e) => updateItem(index, "precoUnitario", Number(e.target.value))}
                      min={0}
                      step={0.5}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="font-semibold text-xs text-white">
                      {formatEuro(item.quantidade * item.precoUnitario)}
                    </span>
                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo de Impostos & Totais */}
          <div
            className="p-3.5 rounded-xl space-y-2 text-xs"
            style={{ background: "var(--gray-900)", border: "1px solid var(--gray-800)" }}
          >
            <div className="flex justify-between text-gray-400">
              <span>Subtotal (Sem IVA):</span>
              <span className="font-semibold text-white">{formatEuro(valorSemIva)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>IVA (0% - Inversão do Sujeito Passivo PT):</span>
              <span className="font-semibold text-green-400">0,00 €</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Retenção de Garantia ({retencaoGarantiaPct}%):</span>
              <span className="font-semibold text-yellow-400">- {formatEuro(valorRetido)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-800 text-sm font-bold">
              <span className="text-gold">Valor Final a Receber:</span>
              <span className="text-gold">{formatEuro(valorTotal)}</span>
            </div>
            <p className="text-[10px] text-gray-500 text-center pt-1">
              Nota legal: IVA - Inversão do sujeito passivo [Artigo 2.º n.º 1 al. j) do CIVA]
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-md w-full flex items-center justify-center gap-2"
            disabled={loading}
            id="btn-guardar-fatura"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Emitir Documento
          </button>
        </form>
      </div>
    </div>
  );
}
