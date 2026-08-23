import { useEffect, useState } from "react";
import {
  X,
  FileText,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  Award,
  CreditCard,
  ShieldAlert,
  FilePlus,
} from "lucide-react";
import {
  documentosApi,
  type DocumentoFuncionario,
  type Funcionario,
} from "@/lib/api";
import { formatDate } from "@/lib/auth";

const TIPO_LABEL: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CURSO_CERTIFICACAO: { label: "Curso / Certificado", icon: Award, color: "var(--gold-400)" },
  IDENTIFICACAO: { label: "Identificação (CC/Passaporte)", icon: CreditCard, color: "#3B82F6" },
  CONTRATO: { label: "Contrato / Adenda", icon: FileText, color: "#8B5CF6" },
  SEGURANCA_TRABALHO: { label: "Segurança / Medicina", icon: ShieldAlert, color: "#10B981" },
  HABILITACAO_CONDUZIR: { label: "Carta de Condução / CAM", icon: FileText, color: "#F59E0B" },
  OUTRO: { label: "Outro Documento", icon: FileText, color: "var(--gray-400)" },
};

function getStatusValidade(dataValidade?: string) {
  if (!dataValidade) return { status: "SEM_VALIDADE", label: "Sem expiração", color: "badge-gray" };
  const hoje = new Date();
  const validade = new Date(dataValidade);
  const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return { status: "EXPIRADO", label: "Caducado!", color: "badge-red" };
  } else if (diffDias <= 30) {
    return { status: "EXPIRANDO", label: `Caduca em ${diffDias}d`, color: "badge-yellow" };
  }
  return { status: "VALIDO", label: "Válido", color: "badge-green" };
}

export default function ModalDocumentosFuncionario({
  funcionario,
  onClose,
}: {
  funcionario: Funcionario;
  onClose: () => void;
}) {
  const [documentos, setDocumentos] = useState<DocumentoFuncionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // Form estado
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("CURSO_CERTIFICACAO");
  const [descricao, setDescricao] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataValidade, setDataValidade] = useState("");
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const data = await documentosApi.listarPorFuncionario(funcionario.id);
      setDocumentos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [funcionario.id]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!ficheiro || !titulo) return;

    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("ficheiro", ficheiro);
      fd.append("titulo", titulo);
      fd.append("tipo", tipo);
      if (descricao) fd.append("descricao", descricao);
      if (dataEmissao) fd.append("dataEmissao", dataEmissao);
      if (dataValidade) fd.append("dataValidade", dataValidade);

      await documentosApi.upload(funcionario.id, fd);
      
      // Reset form
      setTitulo("");
      setDescricao("");
      setDataEmissao("");
      setDataValidade("");
      setFicheiro(null);
      setShowUpload(false);

      carregar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar documento.");
    } finally {
      setUploading(false);
    }
  }

  async function handleApagar(id: string) {
    if (!confirm("Tens a certeza que desejas apagar este documento?")) return;
    try {
      await documentosApi.apagar(id);
      carregar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao apagar.");
    }
  }

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl card animate-fade-in flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-gold" />
              Pasta de Documentos & Cursos
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {funcionario.user.name} — {funcionario.cargo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            id="btn-fechar-modal-documentos"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <div className="alert alert-danger">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          {/* Botão Novo Documento */}
          {!showUpload && (
            <button
              className="btn btn-gold btn-md w-full flex items-center justify-center gap-2"
              onClick={() => setShowUpload(true)}
              id="btn-adicionar-documento"
            >
              <FilePlus size={16} />
              Adicionar Curso ou Documento
            </button>
          )}

          {/* Formulário de Upload */}
          {showUpload && (
            <form
              onSubmit={handleUpload}
              className="p-4 rounded-xl space-y-4"
              style={{ background: "var(--gray-850)", border: "1px solid var(--gray-700)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Carregar Novo Documento</h3>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Título do documento / Curso *</label>
                  <input
                    className="input"
                    placeholder="Ex: Curso Montador Pladur Nível 2 / Cartão de Cidadão"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">Categoria</label>
                  <select
                    className="input select"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    {Object.entries(TIPO_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Ficheiro (PDF, JPG, PNG, DOCX) *</label>
                  <input
                    type="file"
                    className="input py-1 text-xs"
                    onChange={(e) => setFicheiro(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div>
                  <label className="label">Data de Emissão</label>
                  <input
                    type="date"
                    className="input"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Data de Validade (Expirar)</label>
                  <input
                    type="date"
                    className="input"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Receberás alerta 30 dias antes de caducar.
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="label">Observações / Notas</label>
                  <input
                    className="input"
                    placeholder="Ex: Entidade formadora CITEFORMA, N.º Certificado 12345"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold btn-md w-full"
                disabled={uploading}
                id="btn-guardar-documento"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Guardar na pasta do funcionário
              </button>
            </form>
          )}

          {/* Lista de Documentos */}
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin text-gold" />
              A carregar documentos…
            </div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              Nenhum documento guardado na pasta deste funcionário.
            </div>
          ) : (
            <div className="space-y-3">
              {documentos.map((doc) => {
                const infoTipo = TIPO_LABEL[doc.tipo] || TIPO_LABEL.OUTRO;
                const IconTipo = infoTipo.icon;
                const validade = getStatusValidade(doc.dataValidade);

                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl flex items-center justify-between gap-4 transition-all hover:border-gray-700"
                    style={{
                      background: "var(--gray-800)",
                      border: "1px solid var(--gray-750)",
                    }}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(255,255,255,0.05)", color: infoTipo.color }}
                      >
                        <IconTipo size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm truncate">{doc.titulo}</p>
                          <span className={`badge ${validade.color} text-[10px]`}>
                            {validade.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{infoTipo.label}</p>

                        <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-1">
                          {doc.dataValidade && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> Validade: {formatDate(doc.dataValidade)}
                            </span>
                          )}
                          {doc.nomeFicheiro && (
                            <span className="truncate max-w-[150px]">{doc.nomeFicheiro}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`${BASE_URL}${doc.ficheiroUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm p-2 text-gray-400 hover:text-gold"
                        title="Ver / Transferir"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => handleApagar(doc.id)}
                        className="btn btn-ghost btn-sm p-2 text-gray-500 hover:text-red-400"
                        title="Apagar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
