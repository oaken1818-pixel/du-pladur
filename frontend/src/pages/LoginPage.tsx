import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hammer, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { setTokens, setUser } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);

      // Redirecionar por role
      if (res.user.role === "FUNCIONARIO" || res.user.role === "ENCARREGADO") {
        navigate("/ponto");
      } else {
        navigate("/admin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar sessão.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at top, #1a1400 0%, #0A0A0A 60%)" }}
    >
      {/* Glow de fundo */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo + Marca */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, #D4A017, #9a6c0b)",
              boxShadow: "0 0 32px rgba(212,160,23,0.4)",
            }}
          >
            <Hammer size={28} color="#000" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            DU <span className="text-gold">PLADUR</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--gray-400)" }}>
            Sistema de Gestão de Obras
          </p>
        </div>

        {/* Card do formulário */}
        <div className="card-glass">
          <h2 className="text-lg font-semibold text-white mb-6">Iniciar Sessão</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="nome@dupladur.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPwd ? "Ocultar password" : "Mostrar password"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-gold btn-lg w-full mt-2"
              disabled={loading}
              id="btn-login"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  A entrar…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "var(--gray-500)" }}>
            Em caso de problema com o acesso, contacte o administrador.
          </p>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--gray-600)" }}>
          © 2026 DU PLADUR — Pladur & Remodelações
        </p>
      </div>
    </div>
  );
}
