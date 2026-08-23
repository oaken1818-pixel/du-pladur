import { useEffect, useState } from "react";
import { escalaApi, obrasApi, funcionariosApi, type Escala, type Obra, type Funcionario } from "@/lib/api";
import { countryFlag } from "@/lib/auth";
import { ChevronLeft, ChevronRight, Plus, Loader2, X, AlertCircle } from "lucide-react";

function getSemana(offset = 0): Date {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=Dom
  const segundaFeira = new Date(hoje);
  segundaFeira.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1) + offset * 7);
  segundaFeira.setHours(0, 0, 0, 0);
  return segundaFeira;
}

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function EscalaPage() {
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const iniciSemana = getSemana(semanaOffset);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(iniciSemana);
    d.setDate(iniciSemana.getDate() + i);
    return d;
  });

  async function carregar() {
    setLoading(true);
    const [es, os, fs] = await Promise.all([
      escalaApi.listar({ semana: iniciSemana.toISOString() }),
      obrasApi.listar({ status: "ATIVA" }),
      funcionariosApi.listar({ status: "ATIVO" }),
    ]);
    setEscalas(es);
    setObras(os);
    setFuncionarios(fs);
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [semanaOffset]);

  function escalasParaDia(dia: Date): Escala[] {
    return escalas.filter((e) => {
      const d = new Date(e.data);
      return (
        d.getDate() === dia.getDate() &&
        d.getMonth() === dia.getMonth() &&
        d.getFullYear() === dia.getFullYear()
      );
    });
  }

  const semanaLabel = `${diasSemana[0].toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} – ${diasSemana[6].toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Escala Semanal</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>{semanaLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSemanaOffset((o) => o - 1)}
              id="btn-semana-anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSemanaOffset(0)}
              id="btn-semana-hoje"
            >
              Hoje
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSemanaOffset((o) => o + 1)}
              id="btn-semana-seguinte"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            className="btn btn-gold btn-sm"
            onClick={() => setShowModal(true)}
            id="btn-nova-escala"
          >
            <Plus size={14} />
            Adicionar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2" style={{ color: "var(--gray-500)" }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--gold-500)" }} />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2" style={{ minHeight: "400px" }}>
          {diasSemana.map((dia, i) => {
            const isHoje =
              dia.toDateString() === new Date().toDateString();
            const diaEscalas = escalasParaDia(dia);

            return (
              <div
                key={i}
                className="rounded-xl p-2 flex flex-col gap-1.5 min-h-[200px]"
                style={{
                  background: isHoje
                    ? "rgba(212,160,23,0.08)"
                    : "var(--gray-800)",
                  border: isHoje
                    ? "1px solid rgba(212,160,23,0.3)"
                    : "1px solid var(--gray-700)",
                }}
              >
                {/* Cabeçalho do dia */}
                <div className="text-center mb-1">
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: isHoje ? "var(--gold-400)" : "var(--gray-500)" }}
                  >
                    {DIAS[i]}
                  </p>
                  <p
                    className={`text-lg font-bold ${isHoje ? "text-gold" : "text-white"}`}
                  >
                    {dia.getDate()}
                  </p>
                </div>

                {/* Escalas do dia */}
                {diaEscalas.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-lg p-1.5 text-xs"
                    style={{
                      background: "rgba(212,160,23,0.12)",
                      border: "1px solid rgba(212,160,23,0.2)",
                    }}
                  >
                    <p className="font-semibold text-white truncate">
                      {e.funcionario?.user.name?.split(" ")[0]}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="country-flag" style={{ fontSize: "10px" }}>
                        {countryFlag(e.obra?.codigoPais || "PT")}
                      </span>
                      <p className="truncate" style={{ color: "var(--gray-400)" }}>
                        {e.obra?.nome}
                      </p>
                    </div>
                    <p style={{ color: "var(--gold-500)", fontSize: "10px" }} className="font-mono mt-0.5">
                      {e.horaEntrada}–{e.horaSaida}
                    </p>
                  </div>
                ))}

                {diaEscalas.length === 0 && (
                  <p className="text-center text-xs mt-2" style={{ color: "var(--gray-700)" }}>
                    Vazio
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal simples de nova escala */}
      {showModal && (
        <ModalNovaEscala
          obras={obras}
          funcionarios={funcionarios}
          diasSemana={diasSemana}
          onClose={() => setShowModal(false)}
          onCreated={carregar}
        />
      )}
    </div>
  );
}

function ModalNovaEscala({
  obras,
  funcionarios,
  diasSemana,
  onClose,
  onCreated,
}: {
  obras: Obra[];
  funcionarios: Funcionario[];
  diasSemana: Date[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    funcionarioId: "",
    obraId: "",
    data: diasSemana[0].toISOString().split("T")[0],
    horaEntrada: "08:00",
    horaSaida: "17:00",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await escalaApi.criar(form);
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md card animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nova Escala</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" id="btn-fechar-modal-escala">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Funcionário</label>
            <select
              className="input select"
              value={form.funcionarioId}
              onChange={(e) => set("funcionarioId", e.target.value)}
              required
            >
              <option value="">Selecionar…</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>{f.user.name} — {f.cargo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Obra</label>
            <select
              className="input select"
              value={form.obraId}
              onChange={(e) => set("obraId", e.target.value)}
              required
            >
              <option value="">Selecionar…</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {countryFlag(o.codigoPais)} {o.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Data</label>
            <select
              className="input select"
              value={form.data}
              onChange={(e) => set("data", e.target.value)}
            >
              {diasSemana.map((d) => (
                <option key={d.toISOString()} value={d.toISOString().split("T")[0]}>
                  {d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Entrada</label>
              <input className="input" type="time" value={form.horaEntrada} onChange={(e) => set("horaEntrada", e.target.value)} />
            </div>
            <div>
              <label className="label">Saída</label>
              <input className="input" type="time" value={form.horaSaida} onChange={(e) => set("horaSaida", e.target.value)} />
            </div>
          </div>
          {error && <div className="alert alert-danger"><AlertCircle size={14} />{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-md flex-1">Cancelar</button>
            <button type="submit" className="btn btn-gold btn-md flex-1" disabled={loading} id="btn-guardar-escala">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
