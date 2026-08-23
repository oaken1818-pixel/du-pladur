import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  HardHat,
  Clock,
  AlertCircle,
  TrendingUp,
  Loader2,
  MapPin,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { dashboardApi, type DashboardData } from "@/lib/api";
import { countryFlag, formatEuro } from "@/lib/auth";

// Stat card composto
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color = "gold",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  color?: "gold" | "green" | "red" | "blue" | "gray";
}) {
  const colors = {
    gold: { bg: "rgba(212,160,23,0.1)", border: "rgba(212,160,23,0.2)", icon: "var(--gold-400)" },
    green: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", icon: "var(--success)" },
    red: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", icon: "var(--danger)" },
    blue: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", icon: "var(--info)" },
    gray: { bg: "var(--gray-800)", border: "var(--gray-700)", icon: "var(--gray-400)" },
  };
  const c = colors[color];

  return (
    <div
      className="stat-card flex items-start gap-4"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${c.icon}20` }}
      >
        <Icon size={20} style={{ color: c.icon }} />
      </div>
      <div>
        <div className="stat-number">{value}</div>
        <div className="stat-label">{label}</div>
        {sublabel && (
          <div className="text-xs mt-1" style={{ color: "var(--gray-500)" }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hoje = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 gap-3">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--gold-500)" }} />
        <span style={{ color: "var(--gray-400)" }}>A carregar dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  const d = data!;
  const taxaPresenca = d.hoje.totalFuncionarios
    ? Math.round((d.hoje.funcionariosPresentes / d.hoje.totalFuncionarios) * 100)
    : 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bom dia, Eduardo 👋
        </h1>
        <p className="text-sm mt-1 capitalize" style={{ color: "var(--gray-400)" }}>
          {hoje}
        </p>
      </div>

      {/* Alertas */}
      {d.alertas.length > 0 && (
        <div className="space-y-2">
          {d.alertas.map((a, i) => (
            <div key={i} className={`alert alert-${a.tipo}`}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {a.mensagem}
            </div>
          ))}
        </div>
      )}

      {/* Stats principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Funcionários"
          value={d.hoje.totalFuncionarios}
          sublabel={`${d.hoje.funcionariosPresentes} presentes hoje`}
          color="gold"
        />
        <StatCard
          icon={CheckCircle}
          label="Presentes"
          value={`${taxaPresenca}%`}
          sublabel={`${d.hoje.funcionariosPresentes} de ${d.hoje.totalFuncionarios}`}
          color="green"
        />
        <StatCard
          icon={XCircle}
          label="Ausentes"
          value={d.hoje.funcionariosAusentes}
          sublabel={`${d.hoje.funcionariosFerias} de férias`}
          color="red"
        />
        <StatCard
          icon={HardHat}
          label="Obras Ativas"
          value={d.hoje.obrasAtivas}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Clock}
          label="Horas hoje"
          value={`${d.hoje.horasTrabalhadas}h`}
          color="gray"
        />
        <StatCard
          icon={TrendingUp}
          label="Produção hoje"
          value={`${d.hoje.producaoTotal} m²`}
          color="gold"
        />
      </div>

      {/* Obras */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Obras Ativas</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/admin/obras")}
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Obra</th>
                <th>Local</th>
                <th>Equipa</th>
                <th>Presentes</th>
                <th>Produção hoje</th>
              </tr>
            </thead>
            <tbody>
              {d.obras.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: "var(--gray-500)" }}>
                    Sem obras ativas
                  </td>
                </tr>
              )}
              {d.obras.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/obras`)}
                >
                  <td>
                    <span className="font-semibold text-white">{o.nome}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="country-flag">{countryFlag(o.codigoPais)}</span>
                      <span style={{ color: "var(--gray-300)" }}>
                        {o.cidade}, {o.pais}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{o.totalEquipa} trabalhadores</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        o.presentesHoje >= o.totalEquipa
                          ? "badge-green"
                          : o.presentesHoje === 0
                          ? "badge-red"
                          : "badge-yellow"
                      }`}
                    >
                      {o.presentesHoje} / {o.totalEquipa}
                    </span>
                  </td>
                  <td style={{ color: "var(--gray-200)" }}>
                    {o.producaoHoje > 0 ? `${o.producaoHoje} m²` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
