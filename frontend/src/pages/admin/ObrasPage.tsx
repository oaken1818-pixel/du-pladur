import { useEffect, useState } from "react";
import {
  Plus, Search, MapPin, Users, Loader2, AlertCircle,
  X, CheckCircle, Calendar, Euro,
} from "lucide-react";
import { obrasApi, type Obra } from "@/lib/api";
import { countryFlag, formatDate, formatEuro } from "@/lib/auth";

const STATUS_BADGE: Record<string, string> = {
  ATIVA: "badge-green",
  PAUSADA: "badge-yellow",
  CONCLUIDA: "badge-gray",
  CANCELADA: "badge-red",
};

const STATUS_LABEL: Record<string, string> = {
  ATIVA: "Ativa",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const PAISES = [
  { code: "PT", nome: "Portugal", flag: "🇵🇹" },
  { code: "ES", nome: "Espanha", flag: "🇪🇸" },
  { code: "FR", nome: "França", flag: "🇫🇷" },
  { code: "DE", nome: "Alemanha", flag: "🇩🇪" },
  { code: "GB", nome: "Reino Unido", flag: "🇬🇧" },
  { code: "IT", nome: "Itália", flag: "🇮🇹" },
  { code: "NL", nome: "Países Baixos", flag: "🇳🇱" },
  { code: "CH", nome: "Suíça", flag: "🇨🇭" },
  { code: "LU", nome: "Luxemburgo", flag: "🇱🇺" },
];

function ModalCriarObra({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    cliente: "",
    cidade: "",
    pais: "Portugal",
    codigoPais: "PT",
    morada: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFimPrevista: "",
    orcamento: "",
    geofenceRaio: 200,
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string | number) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function setPais(code: string) {
    const p = PAISES.find((x) => x.code === code);
    setForm((f) => ({ ...f, codigoPais: code, pais: p?.nome || code }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await obrasApi.criar({
        nome: form.nome,
        cliente: form.cliente || undefined,
        cidade: form.cidade || undefined,
        pais: form.pais,
        codigoPais: form.codigoPais,
        morada: form.morada || undefined,
        dataInicio: form.dataInicio,
        dataFimPrevista: form.dataFimPrevista || undefined,
        orcamento: form.orcamento ? +form.orcamento : undefined,
        geofenceRaio: form.geofenceRaio,
        latitude: form.latitude ? +form.latitude : undefined,
        longitude: form.longitude ? +form.longitude : undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar obra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl card animate-fade-in"
        style={{ maxHeight: "92dvh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Nova Obra</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" id="btn-fechar-modal-obra">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome da obra</label>
              <input
                className="input"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                required
                placeholder="Escritório Lyon Centro"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Cliente</label>
              <input
                className="input"
                value={form.cliente}
                onChange={(e) => set("cliente", e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
          </div>

          {/* Localização */}
          <div
            className="p-4 rounded-xl space-y-3"
            style={{ background: "var(--gray-850)", border: "1px solid var(--gray-700)" }}
          >
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin size={14} style={{ color: "var(--gold-500)" }} />
              Localização
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">País</label>
                <select
                  className="input select"
                  value={form.codigoPais}
                  onChange={(e) => setPais(e.target.value)}
                  id="select-pais-obra"
                >
                  {PAISES.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.flag} {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cidade</label>
                <input
                  className="input"
                  value={form.cidade}
                  onChange={(e) => set("cidade", e.target.value)}
                  placeholder="Lyon"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Morada</label>
                <input
                  className="input"
                  value={form.morada}
                  onChange={(e) => set("morada", e.target.value)}
                  placeholder="Rua, número…"
                />
              </div>
              <div>
                <label className="label">Latitude GPS</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                  placeholder="45.7640"
                />
              </div>
              <div>
                <label className="label">Longitude GPS</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                  placeholder="4.8357"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Raio geofence (metros)</label>
                <input
                  className="input"
                  type="number"
                  value={form.geofenceRaio}
                  onChange={(e) => set("geofenceRaio", +e.target.value)}
                  min={50}
                  max={2000}
                />
                <p className="text-xs mt-1" style={{ color: "var(--gray-500)" }}>
                  O ponto só é válido se o funcionário estiver dentro deste raio da obra.
                </p>
              </div>
            </div>
          </div>

          {/* Datas + Orçamento */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Data início</label>
              <input
                className="input"
                type="date"
                value={form.dataInicio}
                onChange={(e) => set("dataInicio", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Fim previsto</label>
              <input
                className="input"
                type="date"
                value={form.dataFimPrevista}
                onChange={(e) => set("dataFimPrevista", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Orçamento (€)</label>
              <input
                className="input"
                type="number"
                value={form.orcamento}
                onChange={(e) => set("orcamento", e.target.value)}
                placeholder="30000"
                min={0}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-md flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-gold btn-md flex-1"
              disabled={loading}
              id="btn-criar-obra"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Criar obra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ATIVA");
  const [showModal, setShowModal] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const data = await obrasApi.listar({
        q: q || undefined,
        status: statusFilter || undefined,
      });
      setObras(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [q, statusFilter]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Obras</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
            {obras.length} obra(s) encontrada(s)
          </p>
        </div>
        <button
          className="btn btn-gold btn-md"
          onClick={() => setShowModal(true)}
          id="btn-nova-obra"
        >
          <Plus size={16} />
          Nova obra
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--gray-500)" }} />
          <input
            className="input"
            placeholder="Pesquisar obra…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
        <select
          className="input select w-auto min-w-[150px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger"><AlertCircle size={15} />{error}</div>}

      {/* Cards de obras */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--gray-500)" }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--gold-500)" }} />
          A carregar…
        </div>
      ) : obras.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--gray-500)" }}>
          Nenhuma obra encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {obras.map((o) => (
            <div key={o.id} className="card hover:border-yellow-600/30 transition-colors cursor-pointer group">
              {/* Header do card */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-gold transition-colors">
                    {o.nome}
                  </h3>
                  {o.cliente && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--gray-500)" }}>
                      {o.cliente}
                    </p>
                  )}
                </div>
                <span className={`badge ${STATUS_BADGE[o.status]} shrink-0`}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>

              {/* Localização */}
              <div className="flex items-center gap-2 mb-3">
                <span className="country-flag text-lg">{countryFlag(o.codigoPais)}</span>
                <span className="text-sm" style={{ color: "var(--gray-300)" }}>
                  {[o.cidade, o.pais].filter(Boolean).join(", ")}
                </span>
              </div>

              <hr className="divider" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users size={13} style={{ color: "var(--gold-500)" }} />
                  </div>
                  <p className="text-lg font-bold text-white">{o.funcionarios.length}</p>
                  <p className="text-xs" style={{ color: "var(--gray-500)" }}>Equipa</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar size={13} style={{ color: "var(--gold-500)" }} />
                  </div>
                  <p className="text-sm font-semibold text-white">{formatDate(o.dataInicio)}</p>
                  <p className="text-xs" style={{ color: "var(--gray-500)" }}>Início</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Euro size={13} style={{ color: "var(--gold-500)" }} />
                  </div>
                  <p className="text-sm font-bold text-white">
                    {o.orcamento ? formatEuro(o.orcamento) : "—"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--gray-500)" }}>Orçamento</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalCriarObra onClose={() => setShowModal(false)} onCreated={carregar} />
      )}
    </div>
  );
}
