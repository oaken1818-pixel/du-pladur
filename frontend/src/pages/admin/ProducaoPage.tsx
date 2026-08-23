import { BarChart3 } from "lucide-react";

export default function ProducaoPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Produção</h1>
        <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
          Registo de produção por obra e funcionário
        </p>
      </div>
      <div
        className="card flex flex-col items-center justify-center py-20 text-center"
        style={{ borderStyle: "dashed" }}
      >
        <BarChart3 size={40} style={{ color: "var(--gold-500)", opacity: 0.5 }} className="mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Módulo de Produção</h3>
        <p style={{ color: "var(--gray-500)" }} className="max-w-sm text-sm">
          Aqui verás os registos de produção (m², metros lineares, divisórias) por obra e
          funcionário, com cálculo automático de produtividade. Disponível em breve.
        </p>
        <span className="badge badge-yellow mt-4">Em desenvolvimento — V2</span>
      </div>
    </div>
  );
}
