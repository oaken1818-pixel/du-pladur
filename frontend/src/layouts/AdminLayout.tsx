import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  HardHat,
  Clock,
  CalendarDays,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Hammer,
} from "lucide-react";
import { getUser, clearAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/funcionarios", label: "Funcionários", icon: Users },
  { to: "/admin/obras", label: "Obras", icon: HardHat },
  { to: "/admin/escala", label: "Escala", icon: CalendarDays },
  { to: "/admin/ponto", label: "Ponto", icon: Clock },
  { to: "/admin/producao", label: "Produção", icon: BarChart3 },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--gray-950)" }}>
      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className="sidebar"
        style={{ transform: sidebarOpen ? "translateX(0)" : undefined }}
        id="admin-sidebar"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 p-5 border-b"
          style={{ borderColor: "var(--gray-800)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #D4A017, #9a6c0b)",
              boxShadow: "0 0 16px rgba(212,160,23,0.3)",
            }}
          >
            <Hammer size={18} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">DU PLADUR</p>
            <p className="text-xs" style={{ color: "var(--gray-500)" }}>
              Gestão de Obras
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={14} style={{ opacity: 0.3 }} />
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t" style={{ borderColor: "var(--gray-800)" }}>
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--gray-800)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-black text-xs"
              style={{ background: "linear-gradient(135deg, #D4A017, #9a6c0b)" }}
            >
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--gray-500)" }}>
                {user?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
              aria-label="Terminar sessão"
              title="Terminar sessão"
              id="btn-logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main
        className="flex-1 min-w-0"
        style={{ marginLeft: "260px" }}
        id="admin-main"
      >
        {/* Header mobile */}
        <div
          className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 border-b lg:hidden"
          style={{
            background: "rgba(10,10,10,0.9)",
            backdropFilter: "blur(12px)",
            borderColor: "var(--gray-800)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost btn-sm"
            aria-label="Menu"
            id="btn-sidebar-toggle"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <Hammer size={16} style={{ color: "var(--gold-500)" }} />
            <span className="font-bold text-white text-sm">DU PLADUR</span>
          </div>
        </div>

        {/* Página */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Responsive: esconder sidebar em mobile por default */}
      <style>{`
        @media (max-width: 1023px) {
          aside.sidebar {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
