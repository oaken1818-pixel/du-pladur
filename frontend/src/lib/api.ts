// ─── API client para o DU PLADUR ──────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("du_pladur_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Erro desconhecido." }));
    throw new ApiError(body.error || "Erro no servidor.", res.status);
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  me: () => request<User>("/api/auth/me"),

  logout: (refreshToken: string) =>
    request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => request<DashboardData>("/api/dashboard"),
};

// ─── Funcionários ─────────────────────────────────────────────────────────

export const funcionariosApi = {
  listar: (params?: { status?: string; obraId?: string; q?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Funcionario[]>(`/api/funcionarios${qs ? `?${qs}` : ""}`);
  },
  buscar: (id: string) => request<Funcionario>(`/api/funcionarios/${id}`),
  criar: (data: CriarFuncionarioInput) =>
    request<Funcionario>("/api/funcionarios", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  atualizar: (id: string, data: Partial<Funcionario>) =>
    request<Funcionario>(`/api/funcionarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  atribuirObra: (id: string, obraId: string) =>
    request(`/api/funcionarios/${id}/atribuir-obra`, {
      method: "POST",
      body: JSON.stringify({ obraId }),
    }),
};

// ─── Obras ────────────────────────────────────────────────────────────────

export const obrasApi = {
  listar: (params?: { status?: string; pais?: string; q?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Obra[]>(`/api/obras${qs ? `?${qs}` : ""}`);
  },
  buscar: (id: string) => request<Obra>(`/api/obras/${id}`),
  stats: (id: string) => request<ObraStats>(`/api/obras/${id}/stats`),
  criar: (data: CriarObraInput) =>
    request<Obra>("/api/obras", { method: "POST", body: JSON.stringify(data) }),
  atualizar: (id: string, data: Partial<Obra>) =>
    request<Obra>(`/api/obras/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─── Ponto ────────────────────────────────────────────────────────────────

export const pontoApi = {
  registar: (data: RegistarPontoInput) =>
    request<PontoResponse>("/api/ponto", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  hoje: () => request<PontoHoje>("/api/ponto/hoje"),
  listar: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<Ponto[]>(`/api/ponto${qs ? `?${qs}` : ""}`);
  },
  corrigir: (id: string, data: Partial<Ponto> & { notaAdmin?: string }) =>
    request<Ponto>(`/api/ponto/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const escalaApi = {
  listar: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<Escala[]>(`/api/escala${qs ? `?${qs}` : ""}`);
  },
  criar: (data: {
    funcionarioId: string;
    obraId: string;
    data: string;
    horaEntrada?: string;
    horaSaida?: string;
    nota?: string;
  }) => request<Escala>("/api/escala", { method: "POST", body: JSON.stringify(data) }),
  apagar: (id: string) =>
    request(`/api/escala/${id}`, { method: "DELETE" }),
};

// ─── Documentos de Funcionários ───────────────────────────────────────────

export const documentosApi = {
  listarPorFuncionario: (funcionarioId: string) =>
    request<DocumentoFuncionario[]>(`/api/documentos/funcionario/${funcionarioId}`),

  expirando: () =>
    request<DocumentoFuncionario[]>("/api/documentos/expirando"),

  upload: (funcionarioId: string, formData: FormData) => {
    const token = localStorage.getItem("du_pladur_token");
    const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

    return fetch(`${BASE_URL}/api/documentos/funcionario/${funcionarioId}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error("Erro ao carregar documento.");
      return res.json() as Promise<DocumentoFuncionario>;
    });
  },

  apagar: (id: string) =>
    request(`/api/documentos/${id}`, { method: "DELETE" }),
};

// ─── Tipos ────────────────────────────────────────────────────────────────

export interface DocumentoFuncionario {
  id: string;
  funcionarioId: string;
  tipo: "CURSO_CERTIFICACAO" | "IDENTIFICACAO" | "CONTRATO" | "SEGURANCA_TRABALHO" | "HABILITACAO_CONDUZIR" | "OUTRO";
  titulo: string;
  descricao?: string;
  ficheiroUrl: string;
  nomeFicheiro: string;
  tamanhoBytes?: number;
  dataEmissao?: string;
  dataValidade?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "GESTOR" | "ENCARREGADO" | "FUNCIONARIO" | "CONTABILIDADE";
  funcionario?: {
    id: string;
    cargo: string;
    status: string;
    obrasAtribuidas: { obra: { id: string; nome: string; cidade: string; pais: string } }[];
  };
}

export interface Funcionario {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; role: string; active: boolean };
  cargo: string;
  nif?: string;
  telefone?: string;
  morada?: string;
  pais: string;
  salario?: number;
  tipoContrato: string;
  jornadaSemanal: number;
  dataContratacao: string;
  dataNascimento?: string;
  status: "ATIVO" | "INATIVO" | "FERIAS" | "LICENCA" | "SUSPENDIDO";
  obrasAtribuidas: { obra: { id: string; nome: string; cidade: string; pais: string } }[];
}

export interface CriarFuncionarioInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  cargo: string;
  nif?: string;
  telefone?: string;
  morada?: string;
  pais?: string;
  salario?: number;
  tipoContrato?: string;
  jornadaSemanal?: number;
  dataContratacao: string;
  dataNascimento?: string;
}

export interface Obra {
  id: string;
  nome: string;
  cliente?: string;
  descricao?: string;
  morada?: string;
  cidade?: string;
  pais: string;
  codigoPais: string;
  latitude?: number;
  longitude?: number;
  geofenceRaio: number;
  dataInicio: string;
  dataFimPrevista?: string;
  dataFimReal?: string;
  orcamento?: number;
  status: "ATIVA" | "PAUSADA" | "CONCLUIDA" | "CANCELADA";
  funcionarios: { funcionario: { user: { name: string }; cargo: string } }[];
}

export interface ObraStats {
  funcionariosHoje: number;
  totalFuncionarios: number;
  producaoHoje: number;
  materiaisConsumidos: number;
}

export interface CriarObraInput {
  nome: string;
  cliente?: string;
  descricao?: string;
  morada?: string;
  cidade?: string;
  pais?: string;
  codigoPais?: string;
  latitude?: number;
  longitude?: number;
  geofenceRaio?: number;
  dataInicio: string;
  dataFimPrevista?: string;
  orcamento?: number;
}

export interface Ponto {
  id: string;
  funcionarioId: string;
  funcionario?: { user: { name: string } };
  obraId: string;
  obra?: { id: string; nome: string; cidade: string; pais: string };
  tipo: "ENTRADA" | "SAIDA" | "PAUSA_INICIO" | "PAUSA_FIM";
  status: "PENDENTE" | "SINCRONIZADO" | "OFFLINE" | "MANUAL" | "FORA_AREA";
  latitude?: number;
  longitude?: number;
  distanciaObra?: number;
  registadoOffline: boolean;
  registadoEm: string;
}

export interface RegistarPontoInput {
  tipo: "ENTRADA" | "SAIDA" | "PAUSA_INICIO" | "PAUSA_FIM";
  obraId: string;
  latitude?: number;
  longitude?: number;
  registadoOffline?: boolean;
  registadoEm: string;
  dispositivo?: string;
}

export interface PontoResponse {
  ponto: Ponto;
  dentroArea: boolean;
  distanciaObra?: number;
}

export interface PontoHoje {
  pontos: Ponto[];
  entrada: Ponto | null;
  saida: Ponto | null;
  emServico: boolean;
}

export interface Escala {
  id: string;
  funcionarioId: string;
  funcionario?: { user: { name: string } };
  obraId: string;
  obra?: { id: string; nome: string; cidade: string; pais: string; codigoPais: string };
  data: string;
  horaEntrada: string;
  horaSaida: string;
  status: "PLANEADA" | "CONFIRMADA" | "CANCELADA";
  nota?: string;
}

export interface DashboardData {
  hoje: {
    data: string;
    totalFuncionarios: number;
    funcionariosPresentes: number;
    funcionariosAusentes: number;
    funcionariosFerias: number;
    horasTrabalhadas: number;
    producaoTotal: number;
    obrasAtivas: number;
  };
  alertas: { tipo: "danger" | "warning" | "info"; mensagem: string }[];
  obras: {
    id: string;
    nome: string;
    cidade: string;
    pais: string;
    codigoPais: string;
    totalEquipa: number;
    presentesHoje: number;
    producaoHoje: number;
  }[];
}

export { ApiError };
