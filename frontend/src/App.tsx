import { Suspense, lazy } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import LoginPage from "@/pages/LoginPage";
import { getUser, isLoggedIn } from "@/lib/auth";

// Landing Page de Vendas (lazy)
const LandingVendasPage = lazy(() => import("@/pages/LandingVendasPage"));

// Admin (lazy)
const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const CalculadoraMateriaisPage = lazy(() => import("@/pages/admin/CalculadoraMateriaisPage"));
const CronogramaPage = lazy(() => import("@/pages/admin/CronogramaPage"));
const FaturacaoPage = lazy(() => import("@/pages/admin/FaturacaoPage"));
const RHPage = lazy(() => import("@/pages/admin/RHPage"));
const FuncionariosPage = lazy(() => import("@/pages/admin/FuncionariosPage"));
const ObrasPage = lazy(() => import("@/pages/admin/ObrasPage"));
const EscalaPage = lazy(() => import("@/pages/admin/EscalaPage"));
const PontoAdminPage = lazy(() => import("@/pages/admin/PontoAdminPage"));
const ProducaoPage = lazy(() => import("@/pages/admin/ProducaoPage"));

// Funcionário (lazy)
const PontoFuncionarioPage = lazy(() => import("@/pages/funcionario/PontoPage"));

function Loading() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center gap-3"
      style={{ background: "var(--gray-950)" }}
    >
      <Loader2
        size={22}
        className="animate-spin"
        style={{ color: "var(--gold-500)" }}
      />
      <span style={{ color: "var(--gray-400)" }}>A carregar…</span>
    </div>
  );
}

// Guards desabilitados para testes diretos
function RequireAuth({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LandingVendasPage />} />
          <Route path="/vendas" element={<LandingVendasPage />} />
          <Route path="/login" element={<Navigate to="/admin" replace />} />

          {/* App do funcionário */}
          <Route
            path="/ponto"
            element={
              <RequireAuth>
                <PontoFuncionarioPage />
              </RequireAuth>
            }
          />

          {/* Painel admin */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="calculadora" element={<CalculadoraMateriaisPage />} />
            <Route path="cronograma" element={<CronogramaPage />} />
            <Route path="faturacao" element={<FaturacaoPage />} />
            <Route path="rh" element={<RHPage />} />
            <Route path="funcionarios" element={<FuncionariosPage />} />
            <Route path="obras" element={<ObrasPage />} />
            <Route path="escala" element={<EscalaPage />} />
            <Route path="ponto" element={<PontoAdminPage />} />
            <Route path="producao" element={<ProducaoPage />} />
          </Route>

          {/* Raiz — abrir diretamente a landing de vendas ou o dashboard */}
          <Route path="/" element={<Navigate to="/vendas" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div
                className="min-h-dvh flex flex-col items-center justify-center gap-4"
                style={{ background: "var(--gray-950)" }}
              >
                <p className="text-6xl font-black text-gold">404</p>
                <p style={{ color: "var(--gray-400)" }}>Página não encontrada.</p>
                <a href="#/vendas" className="btn btn-ghost btn-md">
                  Voltar às Vendas
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
