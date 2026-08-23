import { useEffect, useState } from "react";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { cronogramaApi, obrasApi, type Obra, type CronogramaData } from "@/lib/api";

export default function CronogramaPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraIdSel, setObraIdSel] = useState<string>("");
  const [cronograma, setCronograma] = useState<CronogramaData | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [relatorioIA, setRelatorioIA] = useState<string | null>(null);

  useEffect(() => {
    obrasApi.listar({ status: "ATIVA" }).then((os) => {
      setObras(os);
      if (os[0]) setObraIdSel(os[0].id);
    });
  }, []);

  useEffect(() => {
    if (!obraIdSel) return;
    setLoading(true);
    cronogramaApi.getCronograma(obraIdSel)
      .then((data: CronogramaData) => setCronograma(data))
      .finally(() => setLoading(false));
  }, [obraIdSel]);

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !obraIdSel) return;

    setUploadingFoto(true);
    setRelatorioIA(null);

    const formData = new FormData();
    formData.append("foto", file);
    formData.append("nota", "Vistoria fotográfica com telemóvel");

    try {
      const token = localStorage.getItem("du_pladur_token");
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

      const res = await fetch(`${BASE_URL}/api/fotos-obra/${obraIdSel}/fotos`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await res.json();
      setRelatorioIA(data.relatorioIA);
    } catch (err) {
      alert("Erro ao enviar foto para análise da IA.");
    } finally {
      setUploadingFoto(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays size={24} className="text-gold" />
            Cronograma, Caminho Crítico (CPM) & Visão IA
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
            Controlo de Etapas de Obra · Análise Fotográfica com Inteligência Artificial
          </p>
        </div>

        {/* Seleção de Obra */}
        <select
          className="input select w-full sm:w-64"
          value={obraIdSel}
          onChange={(e) => setObraIdSel(e.target.value)}
        >
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome} ({o.cidade})
            </option>
          ))}
        </select>
      </div>

      {/* Card de Upload de Foto com Visão IA */}
      <div
        className="card p-5 border border-gold/40 space-y-3"
        style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.05), rgba(10,10,10,0.8))" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-gold flex items-center justify-center shrink-0">
              <Camera size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-gold" />
                Vistoria Fotográfica por IA (Visão Computacional)
              </h2>
              <p className="text-xs text-gray-400">
                Tire uma foto com o telemóvel na obra para a IA avaliar o avanço dos trabalhos.
              </p>
            </div>
          </div>

          <label className="btn btn-gold btn-md cursor-pointer flex items-center justify-center gap-2 shrink-0">
            {uploadingFoto ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>{uploadingFoto ? "A analisar..." : "Carregar Foto de Obra"}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleUploadFoto}
              disabled={uploadingFoto}
            />
          </label>
        </div>

        {relatorioIA && (
          <div className="p-4 rounded-xl space-y-2 border border-green-500/30 bg-green-500/5 animate-fade-in text-xs">
            <p className="font-bold text-green-400 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Relatório da IA de Visão Computacional:
            </p>
            <p className="text-gray-200 whitespace-pre-line leading-relaxed">{relatorioIA}</p>
          </div>
        )}
      </div>

      {/* Lista de Etapas e Caminho Crítico */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-gold" />
              Caminho Crítico da Obra (Duração Total: {cronograma?.duracaoTotalCaminhoCriticoDias || 0} dias)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Etapas assinaladas a vermelho determinam a data final de entrega da obra.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-gold" />
            A carregar etapas de cronograma…
          </div>
        ) : (
          <div className="space-y-3">
            {cronograma?.tarefas.map((t) => (
              <div
                key={t.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  t.noCaminhoCritico ? "border-red-500/40 bg-red-500/5" : "border-gray-800 bg-gray-900"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">{t.nome}</p>
                    {t.noCaminhoCritico && (
                      <span className="badge badge-red text-[10px]">Caminho Crítico</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Duração: <strong className="text-white">{t.duracaoDias} dias</strong>
                    {t.dependenteDe && ` · Depende da etapa #${t.dependenteDe}`}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-32 bg-gray-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${t.progressoPct === 100 ? "bg-green-500" : "bg-gold"}`}
                      style={{ width: `${t.progressoPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-10 text-right">
                    {t.progressoPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
