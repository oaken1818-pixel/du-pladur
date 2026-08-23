// ─── Auth helpers ─────────────────────────────────────────────────────────

import type { User } from "./api";

const TOKEN_KEY = "du_pladur_token";
const REFRESH_KEY = "du_pladur_refresh";
const USER_KEY = "du_pladur_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function isGestor(user: User | null): boolean {
  return user?.role === "ADMIN" || user?.role === "GESTOR";
}

export function isFuncionario(user: User | null): boolean {
  return user?.role === "FUNCIONARIO";
}

// Flag emoji a partir do código do país (ISO 3166-1 alpha-2)
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  const offset = 127397;
  return Array.from(code.toUpperCase())
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join("");
}

// Formatar data PT
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Formatar hora PT
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formatar moeda EUR
export function formatEuro(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
