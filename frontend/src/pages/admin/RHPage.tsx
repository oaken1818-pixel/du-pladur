import { useEffect, useState } from "react";
import {
  Users,
  Euro,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit2,
  Check,
  Building2,
  Calendar,
  Zap,
} from "lucide-react";
import { rhApi, type FolhaPagamentoData, type TrabalhadorFolha } from "@/lib/api";
import { formatEuro } from "@/lib/auth";

export default function RHPage() {
  const [folha, setFolha] = useState<FolhaPagamentoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempHora, setTempHora] = useState<number>(10);
  const [savingHora, setSavingHora] = useState(false);

  const [processingIA, setProcessingIA] = useState(false);
  const [iaResumo, setIaResumo] = useState<string | null>(null);

  async function carregarFolha() {
    setLoading(true);
    setError("");
    try {
      const data = await rhApi.getFolhaPagamento(mes, ano);
      setFolha(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar folha de pagamento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarFolha();
  }, [mes, ano]);

  async function handleSaveHora(funcionarioId: string) {
    setSavingHora(true);
    try {
      await rhApi.updateSalarioHora(funcionarioId, tempHora);
      setEditingId(null);
      carregarFolha();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao guardar valor por hora.");
    } finally {
      setSavingHora(false);
    }
  }

  async function handleProcessarIA() {
    setProcessingIA(true);
    setIaResumo(null);
    try {
      const res = await rhApi.processarFolhaIA(mes, ano);
      setIaResumo(res.mensagemIA);
      carregarFolha();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao processar com IA.");
    } finally {
      setProcessingIA(false);
    }
  }

  const mesesNome = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-gold" />
            Recursos Humanos & Vencimentos por Hora (€/h)
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
            Gestão Automática de 30 Trabalhadores · Cálculo de Horas & Folha de Pagamento
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn btn-gold btn-md flex items-center gap-2"
            onClick={handleProcessarIA}
            disabled={processingIA}
            id="btn-processar-folha-ia"
          >
            {processingIA ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Processar Folha com IA (1 Clique)
          </button>
        </div>
      </div>

      {/* Seletores de Mês / Ano */}
      <div className="flex items-center gap-3">
        <select
          className="input select w-40"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          {mesesNome.map((m, index) => (
            <option key={index} value={index + 1}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="input select w-28"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
        >
          <option value={2026}>2026</option>
          <option value={2025}>2025</option>
        </select>
      </div>

      {iaResumo && (
        <div className="alert alert-success animate-fade-in text-xs">
          <CheckCircle size={15} />
          {iaResumo}
        </div>
      )}

      {error && (
        <div className="alert alert-danger text-xs">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-gold flex items-center justify-center shrink-0">
            <Euro size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Folha do Mês</p>
            <p className="text-lg font-bold text-gold mt-0.5">
              {formatEuro(folha?.totalFolhaMes || 0)}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Horas Trabalhadas</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {folha?.totalHorasGerais || 0} h
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Trabalhadores Ativos</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {folha?.totalTrabalhadores || 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Média Valor / Hora</p>
            <p className="text-lg font-bold text-white mt-0.5">
              € 11,50 /h
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Folha por Hora */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Trabalhador</th>
              <th>Cargo</th>
              <th>Obras Atribuídas</th>
              <th>Valor / Hora (€/h)</th>
              <th>Horas no Mês</th>
              <th>Horas Extra</th>
              <th>Total a Pagar (€)</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 size={16} className="animate-spin text-gold" />
                    A calcular folha de horas e salários…
                  </div>
                </td>
              </tr>
            ) : !folha?.trabalhadores.length ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  Nenhum trabalhador com horas registadas neste mês.
                </td>
              </tr>
            ) : (
              folha.trabalhadores.map((t) => (
                <tr key={t.funcionarioId}>
                  <td>
                    <p className="font-semibold text-white">{t.nome}</p>
                    <p className="text-[11px] text-gray-500">{t.pais}</p>
                  </td>
                  <td>
                    <span className="badge badge-gray text-xs">{t.cargo}</span>
                  </td>
                  <td>
                    <p className="text-xs text-gray-300 max-w-[180px] truncate">
                      {t.obras}
                    </p>
                  </td>
                  <td>
                    {editingId === t.funcionarioId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="input text-xs w-20 py-1"
                          value={tempHora}
                          onChange={(e) => setTempHora(Number(e.target.value))}
                          step={0.5}
                          min={0}
                        />
                        <button
                          className="btn btn-ghost btn-sm text-green-400 p-1"
                          onClick={() => handleSaveHora(t.funcionarioId)}
                          disabled={savingHora}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gold text-xs">
                          {formatEuro(t.salarioHora)} /h
                        </span>
                        <button
                          className="text-gray-500 hover:text-white"
                          onClick={() => {
                            setEditingId(t.funcionarioId);
                            setTempHora(t.salarioHora);
                          }}
                          title="Alterar valor por hora"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="font-medium text-white text-xs">{t.horasTrabalhadas} h</span>
                  </td>
                  <td>
                    {t.horasExtra > 0 ? (
                      <span className="badge badge-yellow text-[11px]">
                        +{t.horasExtra} h extra
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">0 h</span>
                    )}
                  </td>
                  <td>
                    <p className="font-bold text-green-400 text-sm">
                      {formatEuro(t.totalAPagar)}
                    </p>
                  </td>
                  <td className="text-right">
                    <button
                      className="btn btn-ghost btn-sm text-xs text-gold"
                      onClick={() => alert(`Recibo de vencimento gerado para ${t.nome}: ${formatEuro(t.totalAPagar)}`)}
                    >
                      📄 Recibo PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
