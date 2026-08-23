import { useState, useEffect } from "react";
import { X, ShieldCheck, Check, Loader2, AlertCircle } from "lucide-react";
import { faturacaoApi } from "@/lib/api";

export default function ModalConfigFinancasAT({
  onClose,
}: {
  onClose: () => void;
}) {
  const [nifEmpresa, setNifEmpresa] = useState("");
  const [modoIntegracao, setModoIntegracao] = useState("INVOICEXPRESS");
  const [utilizadorWse, setUtilizadorWse] = useState("");
  const [passwordWse, setPasswordWse] = useState("");
  const [apiKeyProvider, setApiKeyProvider] = useState("");
  const [ambiente, setAmbiente] = useState("TESTES");

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    faturacaoApi.getAtConfig()
      .then((cfg: { nifEmpresa?: string; modoIntegracao?: string; utilizadorWse?: string }) => {
        if (cfg.nifEmpresa) setNifEmpresa(cfg.nifEmpresa);
        if (cfg.modoIntegracao) setModoIntegracao(cfg.modoIntegracao);
        if (cfg.utilizadorWse) setUtilizadorWse(cfg.utilizadorWse);
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await faturacaoApi.saveAtConfig({
        nifEmpresa,
        modoIntegracao,
        utilizadorWse,
        passwordWse,
        apiKeyProvider,
        ambiente,
      });

      setSaved(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao guardar configurações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg card animate-fade-in space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Integração AT — Finanças Portugal</h2>
              <p className="text-xs text-gray-400">Comunicação e-Fatura & Emissão Legal ATCUD</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" id="btn-fechar-at-modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="alert alert-danger text-xs">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {saved && (
            <div className="alert alert-success text-xs">
              <Check size={14} />
              Configurações da Autoridade Tributária ativadas com sucesso!
            </div>
          )}

          <div>
            <label className="label">NIF da Empresa (Portugal)</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: 510 123 456"
              value={nifEmpresa}
              onChange={(e) => setNifEmpresa(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Método de Emissão Certificada</label>
            <select
              className="input select"
              value={modoIntegracao}
              onChange={(e) => setModoIntegracao(e.target.value)}
            >
              <option value="INVOICEXPRESS">
                API InvoiceXpress / Moloni (Certificação AT Automática - Recomendado)
              </option>
              <option value="DIRETO_AT">
                Web Services Diretos da AT (Utilizador WSE - Portal das Finanças)
              </option>
            </select>
          </div>

          {modoIntegracao === "INVOICEXPRESS" ? (
            <div>
              <label className="label">Chave de API do Integrador (InvoiceXpress / Moloni / TOConline)</label>
              <input
                type="password"
                className="input"
                placeholder="Introduza a API Key do serviço de faturação"
                value={apiKeyProvider}
                onChange={(e) => setApiKeyProvider(e.target.value)}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Permite à IA assinar as faturas com o certificado AT nº 2243 e gerar o QR Code legal.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-3 rounded-xl border border-gray-800" style={{ background: "var(--gray-850)" }}>
              <div>
                <label className="label text-xs">Utilizador WebService AT (WSE)</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="Ex: 510123456/1"
                  value={utilizadorWse}
                  onChange={(e) => setUtilizadorWse(e.target.value)}
                />
              </div>

              <div>
                <label className="label text-xs">Palavra-passe WSE</label>
                <input
                  type="password"
                  className="input text-xs"
                  placeholder="Senha criada no Portal das Finanças"
                  value={passwordWse}
                  onChange={(e) => setPasswordWse(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Ambiente de Operação</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="ambiente"
                  value="TESTES"
                  checked={ambiente === "TESTES"}
                  onChange={() => setAmbiente("TESTES")}
                />
                Ambiente de Testes / Sandbox AT
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="ambiente"
                  value="PRODUCAO"
                  checked={ambiente === "PRODUCAO"}
                  onChange={() => setAmbiente("PRODUCAO")}
                />
                Produção Real (AT Finanças)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-md w-full flex items-center justify-center gap-2"
            disabled={loading}
            id="btn-guardar-config-at"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Guardar Configuração de Faturação
          </button>
        </form>
      </div>
    </div>
  );
}
