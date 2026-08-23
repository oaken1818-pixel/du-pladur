import { useState } from "react";
import {
  Calculator,
  HardHat,
  Paintbrush,
  Grid,
  Hammer,
  Sparkles,
  Loader2,
  Plus,
  AlertCircle,
  Package,
} from "lucide-react";
import { calculadoraApi, type ResultadoCalculo } from "@/lib/api";

export default function CalculadoraMateriaisPage() {
  const [especialidade, setEspecialidade] = useState<"PEDREIRO" | "PINTOR" | "LADRILHADOR" | "PLAQUISTA">("PEDREIRO");
  const [areaM2, setAreaM2] = useState<number>(50);
  const [comprimentoM, setComprimentoM] = useState<number>(10);
  const [alturaM, setAlturaM] = useState<number>(2.8);
  const [demaos, setDemaos] = useState<number>(2);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [error, setError] = useState("");

  async function handleCalcular() {
    setLoading(true);
    setError("");
    setResultado(null);

    const area = areaM2 > 0 ? areaM2 : comprimentoM * alturaM;

    try {
      const res = await calculadoraApi.calcular({
        especialidade,
        areaM2: area,
        demasPintura: demaos,
      });
      setResultado(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao calcular materiais.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator size={24} className="text-gold" />
            OAKEN BUILD — Calculadora de Materiais por Especialidade
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
            Pedreiros · Pintores · Ladrilhadores · Plaquistas · Estimativa Precisa de Obra
          </p>
        </div>
      </div>

      {/* Seleção de Especialidades */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
            especialidade === "PEDREIRO"
              ? "border-gold bg-yellow-500/10 text-white font-bold"
              : "border-gray-800 bg-gray-900 text-gray-400 hover:text-white"
          }`}
          onClick={() => {
            setEspecialidade("PEDREIRO");
            setResultado(null);
          }}
        >
          <Hammer size={24} className={especialidade === "PEDREIRO" ? "text-gold" : ""} />
          <span className="text-xs">🧱 Pedreiro / Alvenaria</span>
        </button>

        <button
          className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
            especialidade === "PINTOR"
              ? "border-gold bg-yellow-500/10 text-white font-bold"
              : "border-gray-800 bg-gray-900 text-gray-400 hover:text-white"
          }`}
          onClick={() => {
            setEspecialidade("PINTOR");
            setResultado(null);
          }}
        >
          <Paintbrush size={24} className={especialidade === "PINTOR" ? "text-gold" : ""} />
          <span className="text-xs">🎨 Pintor / Tintas</span>
        </button>

        <button
          className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
            especialidade === "LADRILHADOR"
              ? "border-gold bg-yellow-500/10 text-white font-bold"
              : "border-gray-800 bg-gray-900 text-gray-400 hover:text-white"
          }`}
          onClick={() => {
            setEspecialidade("LADRILHADOR");
            setResultado(null);
          }}
        >
          <Grid size={24} className={especialidade === "LADRILHADOR" ? "text-gold" : ""} />
          <span className="text-xs">🔲 Ladrilhador / Cerâmica</span>
        </button>

        <button
          className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
            especialidade === "PLAQUISTA"
              ? "border-gold bg-yellow-500/10 text-white font-bold"
              : "border-gray-800 bg-gray-900 text-gray-400 hover:text-white"
          }`}
          onClick={() => {
            setEspecialidade("PLAQUISTA");
            setResultado(null);
          }}
        >
          <HardHat size={24} className={especialidade === "PLAQUISTA" ? "text-gold" : ""} />
          <span className="text-xs">🛠️ Plaquista / Pladur</span>
        </button>
      </div>

      {/* Formulário de Medidas */}
      <div className="card space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calculator size={18} className="text-gold" />
          Medidas do Trabalho / Superfície
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Área Total (m²)</label>
            <input
              type="number"
              className="input"
              value={areaM2}
              onChange={(e) => setAreaM2(Number(e.target.value))}
              min={1}
              step={0.5}
            />
          </div>

          <div>
            <label className="label">Ou Comprimento (m)</label>
            <input
              type="number"
              className="input"
              value={comprimentoM}
              onChange={(e) => {
                setComprimentoM(Number(e.target.value));
                setAreaM2(Number(e.target.value) * alturaM);
              }}
              min={0.1}
              step={0.1}
            />
          </div>

          <div>
            <label className="label">Ou Altura / Pé-Direito (m)</label>
            <input
              type="number"
              className="input"
              value={alturaM}
              onChange={(e) => {
                setAlturaM(Number(e.target.value));
                setAreaM2(comprimentoM * Number(e.target.value));
              }}
              min={0.1}
              step={0.1}
            />
          </div>
        </div>

        {especialidade === "PINTOR" && (
          <div>
            <label className="label">Número de Demãos de Pintura</label>
            <select
              className="input select max-w-xs"
              value={demaos}
              onChange={(e) => setDemaos(Number(e.target.value))}
            >
              <option value={1}>1 Demão (Retoque)</option>
              <option value={2}>2 Demãos (Padrão)</option>
              <option value={3}>3 Demãos (Cobertura Forte)</option>
            </select>
          </div>
        )}

        <button
          className="btn btn-gold btn-md w-full sm:w-auto flex items-center justify-center gap-2"
          onClick={handleCalcular}
          disabled={loading}
          id="btn-calcular-materiais"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Calcular Materiais Necessários
        </button>

        {error && (
          <div className="alert alert-danger text-xs">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Lista de Materiais Calculados */}
      {resultado && (
        <div className="card space-y-4 border border-gold/40 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package size={18} className="text-gold" />
                {resultado.titulo} ({resultado.areaM2} m²)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Valores calculados com margem técnica de segurança e quebra.
              </p>
            </div>

            <button
              className="btn btn-ghost border border-gold/40 text-gold hover:bg-yellow-500/10 btn-sm flex items-center gap-1.5"
              onClick={() => alert("Lista de materiais adicionada à proposta de obra!")}
            >
              <Plus size={14} /> Adicionar à Obra
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resultado.itens.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl border flex items-center justify-between"
                style={{ background: "var(--gray-850)", borderColor: "var(--gray-750)" }}
              >
                <div>
                  <p className="font-semibold text-white text-sm">{item.material}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.nota}</p>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <p className="font-bold text-gold text-base">
                    {item.quantidade} <span className="text-xs text-gray-300 font-normal">{item.unidade}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
