import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import LoginPage from "@/pages/LoginPage";
import { getUser, isLoggedIn } from "@/lib/auth";

// Admin (lazy)
const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
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
  const base = import.meta.env.PROD ? "/du-pladur" : "/";

  return (
    <BrowserRouter basename={base}>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Público */}
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
            <Route path="funcionarios" element={<FuncionariosPage />} />
            <Route path="obras" element={<ObrasPage />} />
            <Route path="escala" element={<EscalaPage />} />
            <Route path="ponto" element={<PontoAdminPage />} />
            <Route path="producao" element={<ProducaoPage />} />
          </Route>

          {/* Raiz — abrir diretamente o dashboard do Eduardo */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

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
                <a href="/" className="btn btn-ghost btn-md">
                  Voltar ao início
                </a>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
