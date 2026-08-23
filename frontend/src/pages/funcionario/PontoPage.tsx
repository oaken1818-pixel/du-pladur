import { useEffect, useState, useCallback } from "react";
import {
  LogIn,
  LogOut,
  MapPin,
  WifiOff,
  Wifi,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Building2,
} from "lucide-react";
import { pontoApi, obrasApi, type PontoHoje, type Obra } from "@/lib/api";
import { getUser, formatTime, countryFlag } from "@/lib/auth";
import { salvarPontoOffline, iniciarSyncAutomatico } from "@/lib/offline";

type GpsState = "idle" | "loading" | "ok" | "denied" | "unavailable";

function useGPS() {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [state, setState] = useState<GpsState>("idle");

  const getLocation = useCallback(
    () =>
      new Promise<GeolocationCoordinates>((resolve, reject) => {
        if (!navigator.geolocation) {
          setState("unavailable");
          reject(new Error("GPS não disponível neste dispositivo."));
          return;
        }
        setState("loading");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setState("ok");
            setCoords(pos.coords);
            resolve(pos.coords);
          },
          (err) => {
            setState(err.code === 1 ? "denied" : "unavailable");
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }),
    []
  );

  return { coords, state, getLocation };
}

function RelógioCorrendo() {
  const [agora, setAgora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      {agora.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

export default function PontoFuncionarioPage() {
  const user = getUser();
  const { coords, state: gpsState, getLocation } = useGPS();
  const [pontoHoje, setPontoHoje] = useState<PontoHoje | null>(null);
  const [obraAtual, setObraAtual] = useState<Obra | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "success" | "error" | "warning"; texto: string } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitorizar estado de rede
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Iniciar sync offline
  useEffect(() => {
    const stopSync = iniciarSyncAutomatico((ponto) => pontoApi.registar(ponto));
    return stopSync;
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    async function init() {
      try {
        const [ph, os] = await Promise.all([
          pontoApi.hoje(),
          obrasApi.listar({ status: "ATIVA" }),
        ]);
        setPontoHoje(ph);
        setObras(os);

        // Tentar obter obra da ficha do funcionário
        const minhasObras = user?.funcionario?.obrasAtribuidas || [];
        if (minhasObras.length > 0) {
          const id = minhasObras[0].obra.id;
          setObraId(id);
          const o = os.find((x) => x.id === id);
          if (o) setObraAtual(o);
        } else if (os.length > 0) {
          setObraId(os[0].id);
          setObraAtual(os[0]);
        }
      } catch {
        // Offline — não bloquear a página
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  function atualizarObra(id: string) {
    setObraId(id);
    const o = obras.find((x) => x.id === id);
    setObraAtual(o || null);
  }

  async function baterPonto(tipo: "ENTRADA" | "SAIDA") {
    if (!obraId) {
      setMensagem({ tipo: "error", texto: "Seleciona uma obra primeiro." });
      return;
    }

    setActionLoading(true);
    setMensagem(null);

    let latitude: number | undefined;
    let longitude: number | undefined;

    // Tentar obter GPS
    try {
      const pos = await getLocation();
      latitude = pos.latitude;
      longitude = pos.longitude;
    } catch {
      // GPS falhou — continuar sem
    }

    const payload = {
      tipo,
      obraId,
      latitude,
      longitude,
      registadoEm: new Date().toISOString(),
      dispositivo: navigator.userAgent.slice(0, 80),
      registadoOffline: false,
    };

    try {
      if (isOnline) {
        const res = await pontoApi.registar(payload);
        const novo = await pontoApi.hoje();
        setPontoHoje(novo);

        if (!res.dentroArea && res.distanciaObra != null) {
          setMensagem({
            tipo: "warning",
            texto: `Ponto registado, mas estás a ${res.distanciaObra}m da obra (fora do raio permitido). O gestor irá rever.`,
          });
        } else {
          setMensagem({
            tipo: "success",
            texto: tipo === "ENTRADA"
              ? `✅ Entrada registada às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
              : `✅ Saída registada às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`,
          });
        }
      } else {
        // Offline — guardar localmente
        await salvarPontoOffline({ ...payload, registadoOffline: true });
        setMensagem({
          tipo: "warning",
          texto: "📴 Sem internet. Ponto guardado localmente e será sincronizado quando voltar a estar online.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao registar ponto.";
      setMensagem({ tipo: "error", texto: msg });
    } finally {
      setActionLoading(false);
    }
  }

  const emServico = pontoHoje?.emServico || false;
  const hora = new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--gold-500)" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "radial-gradient(ellipse at top, #1a1400 0%, #0A0A0A 70%)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--gray-800)", background: "rgba(10,10,10,0.9)", backdropFilter: "blur(12px)" }}
      >
        <div>
          <p className="font-bold text-white text-sm">DU <span className="text-gold">PLADUR</span></p>
          <p className="text-xs" style={{ color: "var(--gray-500)" }}>
            Olá, {user?.name?.split(" ")[0]} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="badge badge-green text-xs">
              <Wifi size={10} />
              Online
            </span>
          ) : (
            <span className="badge badge-red text-xs">
              <WifiOff size={10} />
              Offline
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-8">
        {/* Relógio */}
        <div className="text-center">
          <div
            className="text-5xl font-bold font-mono"
            style={{ color: "var(--gold-400)", letterSpacing: "-0.02em" }}
          >
            <RelógioCorrendo />
          </div>
          <p className="text-sm mt-2 capitalize" style={{ color: "var(--gray-400)" }}>
            {hora.toLocaleDateString("pt-PT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* Status atual */}
        <div
          className="w-full max-w-sm rounded-2xl p-4 text-center"
          style={{
            background: emServico
              ? "rgba(34,197,94,0.08)"
              : "rgba(239,68,68,0.08)",
            border: emServico
              ? "1px solid rgba(34,197,94,0.25)"
              : "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {emServico ? (
            <>
              <CheckCircle size={20} className="mx-auto mb-2" style={{ color: "var(--success)" }} />
              <p className="font-semibold text-white text-sm">Em serviço</p>
              {pontoHoje?.entrada && (
                <p className="text-xs mt-1" style={{ color: "var(--success)" }}>
                  Entrada: {formatTime(pontoHoje.entrada.registadoEm)}
                </p>
              )}
            </>
          ) : pontoHoje?.saida ? (
            <>
              <Clock size={20} className="mx-auto mb-2" style={{ color: "var(--gray-400)" }} />
              <p className="font-semibold text-white text-sm">Dia terminado</p>
              <p className="text-xs mt-1" style={{ color: "var(--gray-400)" }}>
                Saída: {formatTime(pontoHoje.saida.registadoEm)}
              </p>
            </>
          ) : (
            <>
              <Clock size={20} className="mx-auto mb-2" style={{ color: "var(--gray-400)" }} />
              <p className="font-semibold text-white text-sm">Por iniciar</p>
              <p className="text-xs mt-1" style={{ color: "var(--gray-500)" }}>
                Regista a tua entrada para começar
              </p>
            </>
          )}
        </div>

        {/* Seleção de obra */}
        {obras.length > 1 && (
          <div className="w-full max-w-sm">
            <label className="label flex items-center gap-1.5 mb-1.5">
              <Building2 size={13} style={{ color: "var(--gold-500)" }} />
              Obra
            </label>
            <select
              className="input select"
              value={obraId}
              onChange={(e) => atualizarObra(e.target.value)}
              id="select-obra-ponto"
            >
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {countryFlag(o.codigoPais)} {o.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Obra atual */}
        {obraAtual && (
          <div
            className="w-full max-w-sm rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: "var(--gray-800)", border: "1px solid var(--gray-700)" }}
          >
            <span className="country-flag text-2xl">{countryFlag(obraAtual.codigoPais)}</span>
            <div>
              <p className="font-semibold text-white text-sm">{obraAtual.nome}</p>
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--gray-400)" }}>
                <MapPin size={10} />
                {[obraAtual.cidade, obraAtual.pais].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Botão principal */}
        <div className="flex flex-col items-center gap-4">
          {!emServico && !pontoHoje?.saida ? (
            <button
              className="ponto-btn ponto-btn-entrada"
              onClick={() => baterPonto("ENTRADA")}
              disabled={actionLoading || !obraId}
              id="btn-entrada"
              aria-label="Registar entrada"
            >
              {actionLoading ? (
                <Loader2 size={28} className="animate-spin" />
              ) : (
                <LogIn size={36} strokeWidth={2} />
              )}
              <span className="text-sm font-bold">
                {actionLoading ? "A registar…" : "ENTRADA"}
              </span>
            </button>
          ) : emServico ? (
            <button
              className="ponto-btn ponto-btn-saida"
              onClick={() => baterPonto("SAIDA")}
              disabled={actionLoading}
              id="btn-saida"
              aria-label="Registar saída"
            >
              {actionLoading ? (
                <Loader2 size={28} className="animate-spin" />
              ) : (
                <LogOut size={36} strokeWidth={2} />
              )}
              <span className="text-sm font-bold">
                {actionLoading ? "A registar…" : "SAÍDA"}
              </span>
            </button>
          ) : null}

          {/* GPS status */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--gray-500)" }}>
            <MapPin size={11} />
            {gpsState === "loading" && "A obter localização…"}
            {gpsState === "ok" && coords && `GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`}
            {gpsState === "denied" && "GPS negado — ponto registado sem localização"}
            {gpsState === "unavailable" && "GPS indisponível"}
            {gpsState === "idle" && "GPS pronto"}
          </div>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div
            className={`w-full max-w-sm alert ${
              mensagem.tipo === "success"
                ? "alert-success"
                : mensagem.tipo === "warning"
                ? "alert-warning"
                : "alert-danger"
            } animate-fade-in`}
          >
            {mensagem.tipo === "warning" ? (
              <AlertTriangle size={15} className="shrink-0" />
            ) : (
              <CheckCircle size={15} className="shrink-0" />
            )}
            <span className="text-sm">{mensagem.texto}</span>
          </div>
        )}

        {/* Histórico do dia */}
        {pontoHoje && pontoHoje.pontos.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray-500)" }}>
              Hoje
            </p>
            {pontoHoje.pontos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl px-4 py-2.5"
                style={{ background: "var(--gray-800)", border: "1px solid var(--gray-700)" }}
              >
                <span
                  className={`badge text-xs ${p.tipo === "ENTRADA" ? "badge-green" : "badge-red"}`}
                >
                  {p.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                </span>
                <span
                  className="font-mono font-semibold"
                  style={{ color: "var(--gold-400)" }}
                >
                  {formatTime(p.registadoEm)}
                </span>
                {p.registadoOffline && (
                  <span className="badge badge-blue text-xs">
                    <WifiOff size={9} /> Offline
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
