// ─── Offline Ponto Storage (IndexedDB) ───────────────────────────────────
// Quando não há internet, o ponto é guardado aqui.
// Quando a internet voltar, é sincronizado automaticamente.

import type { RegistarPontoInput } from "./api";

const DB_NAME = "du_pladur_offline";
const STORE_NAME = "pontos_pendentes";

interface PontoOffline extends RegistarPontoInput {
  localId: string;
  guardadoEm: string;
  sincronizado: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" });
      }
    };
  });
}

export async function salvarPontoOffline(
  ponto: RegistarPontoInput
): Promise<PontoOffline> {
  const db = await openDB();
  const record: PontoOffline = {
    ...ponto,
    localId: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    guardadoEm: new Date().toISOString(),
    sincronizado: false,
    registadoOffline: true,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).add(record);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });

  return record;
}

export async function getPontosPendentes(): Promise<PontoOffline[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () =>
      resolve((req.result as PontoOffline[]).filter((p) => !p.sincronizado));
  });
}

export async function marcarSincronizado(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(localId);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.sincronizado = true;
        store.put(record);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// Tentar sincronizar quando voltar online
export function iniciarSyncAutomatico(
  syncFn: (ponto: RegistarPontoInput) => Promise<unknown>
): () => void {
  const tentarSync = async () => {
    if (!navigator.onLine) return;
    const pendentes = await getPontosPendentes();
    for (const ponto of pendentes) {
      try {
        await syncFn(ponto);
        await marcarSincronizado(ponto.localId);
        console.log(`[Offline Sync] Ponto sincronizado: ${ponto.localId}`);
      } catch (err) {
        console.warn(`[Offline Sync] Falhou: ${ponto.localId}`, err);
      }
    }
  };

  window.addEventListener("online", tentarSync);
  // Tentar imediatamente ao arrancar
  tentarSync();

  return () => window.removeEventListener("online", tentarSync);
}
