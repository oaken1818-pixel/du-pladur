import { useEffect, useState } from "react";
import {
  Euro,
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  AlertTriangle,
  Download,
  Check,
  Trash2,
  Building2,
  Filter,
} from "lucide-react";
import {
  faturacaoApi,
  obrasApi,
  type Fatura,
  type FaturacaoStats,
  type Obra,
  type Cliente,
} from "@/lib/api";
import { formatEuro, formatDate } from "@/lib/auth";
import ModalNovaFatura from "@/components/ModalNovaFatura";
import AssistenteIAFinanceiro from "@/components/AssistenteIAFinanceiro";
import ModalConfigFinancasAT from "@/components/ModalConfigFinancasAT";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  RASCUNHO: { label: "Rascunho", color: "badge-gray" },
  EMITIDA: { label: "Emitida", color: "badge-yellow" },
  PAGA: { label: "Paga", color: "badge-green" },
  CANCELADA: { label: "Cancelada", color: "badge-red" },
};

export default function FaturacaoPage() {
  const [stats, setStats] = useState<FaturacaoStats | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [obraFilter, setObraFilter] = useState("");

  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showIAModal, setShowIAModal] = useState(false);
  const [showATModal, setShowATModal] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (obraFilter) params.obraId = obraFilter;

      const [s, fs, os, cs] = await Promise.all([
        faturacaoApi.stats(),
        faturacaoApi.listarFaturas(params),
        obrasApi.listar({ status: "ATIVA" }),
        faturacaoApi.listarClientes(),
      ]);
      setStats(s);
      setFaturas(fs);
      setObras(os);
      setClientes(cs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar módulo de faturação.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [statusFilter, obraFilter]);

  async function handleMarcarPaga(id: string) {
    if (!confirm("Confirmar registo de pagamento desta fatura?")) return;
    try {
      await faturacaoApi.marcarPaga(id);
      carregar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar pagamento.");
    }
  }

  async function handleApagar(id: string) {
    if (!confirm("Tens a certeza que desejas apagar esta fatura?")) return;
    try {
      await faturacaoApi.apagar(id);
      carregar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao apagar fatura.");
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-gold" />
            Faturação & Autos de Medição
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
            Normas de Portugal · Inversão de IVA · Gestão Financeira de Obras
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn btn-ghost border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 btn-md flex items-center gap-2"
            onClick={() => setShowATModal(true)}
            id="btn-config-at"
          >
            🏛️ Configuração AT Finanças
          </button>
          <button
            className="btn btn-ghost border border-gold/40 text-gold hover:bg-yellow-500/10 btn-md flex items-center gap-2"
            onClick={() => setShowIAModal(true)}
            id="btn-ia-financeira"
          >
            <Sparkles size={16} />
            Gerar com IA (Gratuito)
          </button>
          <button
            className="btn btn-gold btn-md flex items-center gap-2"
            onClick={() => setShowNovaModal(true)}
            id="btn-nova-fatura"
          >
            <Plus size={16} />
            Novo Auto / Fatura
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-gold flex items-center justify-center shrink-0">
            <Euro size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Faturado este mês</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {formatEuro(stats?.totalFaturadoMes || 0)}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Pendente a receber</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {formatEuro(stats?.totalPendentes || 0)}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Vencido em atraso</p>
            <p className="text-lg font-bold text-red-400 mt-0.5">
              {formatEuro(stats?.totalVencidas || 0)}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total recebido</p>
            <p className="text-lg font-bold text-green-400 mt-0.5">
              {formatEuro(stats?.totalPagas || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="input select flex-1"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          id="select-filter-status"
        >
          <option value="">Todos os estados (Emitidas, Pagas, Vencidas)</option>
          <option value="EMITIDA">Emitidas (Pendentes)</option>
          <option value="PAGA">Pagas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>

        <select
          className="input select flex-1"
          value={obraFilter}
          onChange={(e) => setObraFilter(e.target.value)}
          id="select-filter-obra"
        >
          <option value="">Todas as obras (França, Espanha, Portugal)</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome} ({o.cidade})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Tabela de Faturas */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Tipo</th>
              <th>Obra / Cliente</th>
              <th>Emissão / Vencimento</th>
              <th>Sem IVA & Retenção</th>
              <th>Total Líquido</th>
              <th>Estado</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 size={16} className="animate-spin text-gold" />
                    A carregar documentos de faturação…
                  </div>
                </td>
              </tr>
            ) : faturas.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  Nenhuma fatura ou auto de medição registado.
                </td>
              </tr>
            ) : (
              faturas.map((f) => {
                const badge = STATUS_BADGE[f.status] || STATUS_BADGE.EMITIDA;
                const isVencida =
                  f.status === "EMITIDA" && new Date(f.dataVencimento) < new Date();

                return (
                  <tr key={f.id}>
                    <td>
                      <p className="font-semibold text-white">{f.numero}</p>
                      <p className="text-[11px] text-gray-500">
                        {f.itens[0]?.descricao || "Medição de obra"}
                      </p>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-gray-300">
                        {f.tipo === "AUTO_MEDICAO"
                          ? "Auto Medição"
                          : f.tipo === "PRO_FORMA"
                          ? "Pro-Forma"
                          : "Fatura"}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-white">{f.obra?.nome || "Obra"}</p>
                      <p className="text-xs text-gray-400">
                        {f.cliente?.nome || "Empresa Cliente"}
                      </p>
                    </td>
                    <td>
                      <p className="text-xs text-gray-300">{formatDate(f.dataEmissao)}</p>
                      <p
                        className={`text-[11px] ${
                          isVencida ? "text-red-400 font-semibold" : "text-gray-500"
                        }`}
                      >
                        Venc: {formatDate(f.dataVencimento)}
                      </p>
                    </td>
                    <td>
                      <p className="text-xs text-gray-300">{formatEuro(f.valorSemIva)}</p>
                      <p className="text-[10px] text-yellow-400">
                        Ret. {f.retencaoGarantiaPct}% (-{formatEuro(f.valorRetido || 0)})
                      </p>
                    </td>
                    <td>
                      <p className="font-bold text-gold text-sm">
                        {formatEuro(f.valorTotal)}
                      </p>
                      <p className="text-[9px] text-gray-500">IVA 0% Inversão</p>
                    </td>
                    <td>
                      <span className={`badge ${isVencida ? "badge-red" : badge.color}`}>
                        {isVencida ? "Em Atraso!" : badge.label}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {f.status !== "PAGA" && (
                          <button
                            className="btn btn-ghost btn-sm text-green-400 hover:bg-green-500/10"
                            onClick={() => handleMarcarPaga(f.id)}
                            title="Marcar como Paga"
                          >
                            <Check size={15} />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm text-gray-500 hover:text-red-400"
                          onClick={() => handleApagar(f.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modais */}
      {showNovaModal && (
        <ModalNovaFatura
          obras={obras}
          clientes={clientes}
          onClose={() => setShowNovaModal(false)}
          onCreated={carregar}
        />
      )}

      {showIAModal && (
        <AssistenteIAFinanceiro
          obras={obras}
          onClose={() => setShowIAModal(false)}
          onCreated={carregar}
        />
      )}

      {showATModal && (
        <ModalConfigFinancasAT onClose={() => setShowATModal(false)} />
      )}
    </div>
  );
}
