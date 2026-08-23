import { useEffect, useState } from "react";
import { Clock, Loader2, AlertCircle, Search, CheckCircle, XCircle, MapPin } from "lucide-react";
import { pontoApi, type Ponto } from "@/lib/api";
import { countryFlag, formatDate, formatTime } from "@/lib/auth";

const STATUS_BADGE: Record<string, string> = {
  SINCRONIZADO: "badge-green",
  PENDENTE: "badge-yellow",
  OFFLINE: "badge-blue",
  MANUAL: "badge-gray",
  FORA_AREA: "badge-red",
};

const STATUS_LABEL: Record<string, string> = {
  SINCRONIZADO: "✓ Válido",
  PENDENTE: "Pendente",
  OFFLINE: "Offline",
  MANUAL: "Manual",
  FORA_AREA: "Fora da área",
};

const TIPO_BADGE: Record<string, string> = {
  ENTRADA: "badge-green",
  SAIDA: "badge-red",
  PAUSA_INICIO: "badge-yellow",
  PAUSA_FIM: "badge-yellow",
};

const TIPO_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  PAUSA_INICIO: "Pausa ↑",
  PAUSA_FIM: "Pausa ↓",
};

export default function PontoAdminPage() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [de, setDe] = useState(new Date().toISOString().split("T")[0]);
  const [ate, setAte] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (de) params.de = `${de}T00:00:00`;
      if (ate) params.ate = `${ate}T23:59:59`;
      if (statusFilter) params.status = statusFilter;
      const data = await pontoApi.listar(params);
      setPontos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [de, ate, statusFilter]);

  const totalEntradas = pontos.filter((p) => p.tipo === "ENTRADA").length;
  const foraArea = pontos.filter((p) => p.status === "FORA_AREA").length;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Registos de Ponto</h1>
        <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
          {totalEntradas} entradas · {foraArea} fora da área
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="label">De</label>
          <input className="input" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div>
          <label className="label">Até</label>
          <input className="input" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="input select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger"><AlertCircle size={15} />{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Tipo</th>
              <th>Obra</th>
              <th>Data/Hora</th>
              <th>GPS</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2" style={{ color: "var(--gray-500)" }}>
                    <Loader2 size={16} className="animate-spin" style={{ color: "var(--gold-500)" }} />
                    A carregar…
                  </div>
                </td>
              </tr>
            ) : pontos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10" style={{ color: "var(--gray-500)" }}>
                  Sem registos para o período selecionado.
                </td>
              </tr>
            ) : (
              pontos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium text-white">{p.funcionario?.user.name || "—"}</p>
                  </td>
                  <td>
                    <span className={`badge ${TIPO_BADGE[p.tipo]}`}>
                      {p.tipo === "ENTRADA" ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {TIPO_LABEL[p.tipo]}
                    </span>
                  </td>
                  <td>
                    {p.obra && (
                      <div className="flex items-center gap-1.5">
                        <span className="country-flag text-sm">{countryFlag(p.obra.pais)}</span>
                        <span style={{ color: "var(--gray-300)" }}>{p.obra.nome}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <p className="text-white text-sm">{formatDate(p.registadoEm)}</p>
                    <p className="text-xs font-mono" style={{ color: "var(--gold-400)" }}>
                      {formatTime(p.registadoEm)}
                    </p>
                  </td>
                  <td>
                    {p.latitude ? (
                      <div className="flex items-center gap-1 text-xs" style={{ color: "var(--gray-400)" }}>
                        <MapPin size={11} />
                        {p.distanciaObra != null
                          ? `${Math.round(p.distanciaObra)}m da obra`
                          : "GPS OK"}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--gray-600)" }}>Sem GPS</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
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
