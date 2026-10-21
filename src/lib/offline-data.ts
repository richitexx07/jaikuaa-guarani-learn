// Pedidos al servidor que siguen funcionando sin señal: si hay internet se trae lo último y se
// guarda una copia en el teléfono; si no hay, se usa la copia guardada.

import { offlineGet, offlineSet } from "./offline-store";

export class OfflineMissingError extends Error {
  constructor(what = "Este contenido") {
    super(`${what} todavía no está descargado para usar sin conexión.`);
    this.name = "OfflineMissingError";
  }
}

/** true si el navegador avisa que no hay conexión. */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/** Errores de red (sin señal, servidor inalcanzable o demasiado lento). No incluye «no autorizado». */
export function isNetworkError(e: unknown): boolean {
  if (isOffline()) return true;
  if (!e || typeof e !== "object") return false;
  const err = e as { name?: string; message?: string; status?: number };
  if (err.name === "TimeoutError" || err.name === "AbortError") return true;
  if (err.name === "AuthRetryableFetchError") return true;
  if (err.name === "TypeError" && /fetch|network|load failed/i.test(err.message ?? "")) return true;
  return /failed to fetch|networkerror|network request failed|load failed|err_internet|sin conexi/i.test(
    err.message ?? "",
  );
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      const e = new Error("La conexión tardó demasiado");
      e.name = "TimeoutError";
      reject(e);
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

type CacheOpts = {
  /** Cuánto esperar al servidor antes de usar la copia guardada (si existe). */
  timeoutMs?: number;
  /** Nombre amable para el mensaje de «no descargado». */
  label?: string;
};

/**
 * Trae del servidor y guarda copia; sin señal (o si el servidor no responde) devuelve la copia.
 * Los errores que NO son de red (por ejemplo, sesión vencida) se propagan igual que antes.
 */
export async function withOfflineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: CacheOpts = {},
): Promise<T> {
  if (!isOffline()) {
    const cached = await offlineGet<T>(key);
    try {
      // Con copia guardada no se espera más de unos segundos a una red lenta.
      const value = await (cached ? withTimeout(fetcher(), opts.timeoutMs ?? 8000) : fetcher());
      await offlineSet(key, value);
      return value;
    } catch (e) {
      if (!isNetworkError(e)) throw e;
      if (cached) return cached.value;
      throw new OfflineMissingError(opts.label);
    }
  }
  const cached = await offlineGet<T>(key);
  if (cached) return cached.value;
  throw new OfflineMissingError(opts.label);
}

/** Copia guardada sin consultar al servidor (o undefined). */
export async function readOfflineCopy<T>(key: string): Promise<T | undefined> {
  return (await offlineGet<T>(key))?.value;
}

/* ------------------------- Sesión guardada en el teléfono ------------------------- */

export type StoredUser = { id: string; email?: string };

/**
 * Usuario de la última sesión guardada en este navegador, aunque su permiso ya haya vencido.
 * Sirve SOLO para dejar entrar a la app sin señal: el servidor sigue pidiendo una sesión válida
 * para cualquier dato, y los avances se envían cuando la sesión se renueva.
 */
export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !/^sb-.+-auth-token$/.test(k)) continue;
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { user?: { id?: string; email?: string } } | null;
      const user = parsed?.user;
      if (user?.id) return { id: user.id, email: user.email };
    }
  } catch {}
  return null;
}
