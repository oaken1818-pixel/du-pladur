import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  X,
  CheckCircle,
  Folder,
} from "lucide-react";
import { funcionariosApi, obrasApi, type Funcionario, type Obra } from "@/lib/api";
import { countryFlag, formatDate } from "@/lib/auth";
import ModalDocumentosFuncionario from "@/components/ModalDocumentosFuncionario";

const STATUS_LABEL: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  FERIAS: "Férias",
  LICENCA: "Licença",
  SUSPENDIDO: "Suspendido",
};

const STATUS_BADGE: Record<string, string> = {
  ATIVO: "badge-green",
  INATIVO: "badge-gray",
  FERIAS: "badge-blue",
  LICENCA: "badge-yellow",
  SUSPENDIDO: "badge-red",
};

function ModalCriar({
  obras,
  onClose,
  onCreated,
}: {
  obras: Obra[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "dupladur123",
    cargo: "",
    tipoContrato: "EFETIVO",
    jornadaSemanal: 40,
    pais: "PT",
    dataContratacao: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string | number) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await funcionariosApi.criar(form);
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar funcionário.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg card animate-fade-in"
        style={{ maxHeight: "90dvh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Novo Funcionário</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Fechar"
            id="btn-fechar-modal-funcionario"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome completo</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="label">Cargo</label>
              <input
                className="input"
                value={form.cargo}
                onChange={(e) => set("cargo", e.target.value)}
                required
                placeholder="Plaquista"
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              placeholder="joao@dupladur.pt"
            />
          </div>

          <div>
            <label className="label">Password inicial</label>
            <input
              className="input"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              placeholder="mínimo 6 caracteres"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Contrato</label>
              <select
                className="input select"
                value={form.tipoContrato}
                onChange={(e) => set("tipoContrato", e.target.value)}
              >
                <option value="EFETIVO">Efetivo</option>
                <option value="PRAZO_CERTO">Prazo certo</option>
                <option value="TEMPORARIO">Temporário</option>
                <option value="ESTAGIO">Estágio</option>
              </select>
            </div>
            <div>
              <label className="label">Jornada (h/sem)</label>
              <input
                className="input"
                type="number"
                value={form.jornadaSemanal}
                onChange={(e) => set("jornadaSemanal", +e.target.value)}
                min={1}
                max={60}
              />
            </div>
            <div>
              <label className="label">País</label>
              <select
                className="input select"
                value={form.pais}
                onChange={(e) => set("pais", e.target.value)}
              >
                <option value="PT">🇵🇹 Portugal</option>
                <option value="ES">🇪🇸 Espanha</option>
                <option value="FR">🇫🇷 França</option>
                <option value="DE">🇩🇪 Alemanha</option>
                <option value="GB">🇬🇧 Reino Unido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Data de contratação</label>
            <input
              className="input"
              type="date"
              value={form.dataContratacao}
              onChange={(e) => set("dataContratacao", e.target.value)}
              required
            />
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
              id="btn-criar-funcionario"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Criar funcionário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [funcDocumentos, setFuncDocumentos] = useState<Funcionario | null>(null);

  async function carregar() {
    setLoading(true);
    try {
      const [fs, os] = await Promise.all([
        funcionariosApi.listar({ q, status: statusFilter || undefined }),
        obrasApi.listar({ status: "ATIVA" }),
      ]);
      setFuncionarios(fs);
      setObras(os);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [q, statusFilter]);

  const ativos = funcionarios.filter((f) => f.status === "ATIVO").length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Funcionários</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
            {ativos} ativos de {funcionarios.length} total
          </p>
        </div>
        <button
          className="btn btn-gold btn-md"
          onClick={() => setShowModal(true)}
          id="btn-novo-funcionario"
        >
          <Plus size={16} />
          Novo funcionário
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--gray-500)" }}
          />
          <input
            className="input"
            placeholder="Pesquisar por nome ou email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
            id="input-pesquisa-funcionarios"
          />
        </div>
        <select
          className="input select w-auto min-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          id="select-status-funcionarios"
        >
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Erros / Loading */}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Tabela */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>País</th>
              <th>Obra atual</th>
              <th>Contratado</th>
              <th>Estado</th>
              <th className="text-right">Documentos</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2" style={{ color: "var(--gray-500)" }}>
                    <Loader2 size={16} className="animate-spin" />
                    A carregar…
                  </div>
                </td>
              </tr>
            ) : funcionarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10" style={{ color: "var(--gray-500)" }}>
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            ) : (
              funcionarios.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                        style={{ background: "linear-gradient(135deg, #D4A017, #9a6c0b)" }}
                      >
                        {f.user.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{f.user.name}</p>
                        <p className="text-xs" style={{ color: "var(--gray-500)" }}>
                          {f.user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--gray-300)" }}>{f.cargo}</td>
                  <td>
                    <span className="country-flag">{countryFlag(f.pais)}</span>
                    <span className="ml-1.5 text-sm" style={{ color: "var(--gray-400)" }}>
                      {f.pais}
                    </span>
                  </td>
                  <td>
                    {f.obrasAtribuidas.length > 0 ? (
                      <span className="badge badge-gold">
                        {f.obrasAtribuidas[0].obra.nome}
                      </span>
                    ) : (
                      <span style={{ color: "var(--gray-600)" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--gray-400)" }}>
                    {formatDate(f.dataContratacao)}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[f.status] || "badge-gray"}`}>
                      {f.status === "ATIVO" ? (
                        <UserCheck size={11} />
                      ) : (
                        <UserX size={11} />
                      )}
                      {STATUS_LABEL[f.status] || f.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      className="btn btn-ghost btn-sm text-gold hover:bg-yellow-500/10"
                      onClick={() => setFuncDocumentos(f)}
                      title="Abrir pasta de documentos"
                    >
                      <Folder size={15} />
                      Pasta
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal criar */}
      {showModal && (
        <ModalCriar
          obras={obras}
          onClose={() => setShowModal(false)}
          onCreated={carregar}
        />
      )}

      {/* Modal Documentos & Cursos do Funcionário */}
      {funcDocumentos && (
        <ModalDocumentosFuncionario
          funcionario={funcDocumentos}
          onClose={() => setFuncDocumentos(null)}
        />
      )}
    </div>
  );
}
