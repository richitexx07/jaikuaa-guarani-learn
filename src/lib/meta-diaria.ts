/**
 * La meta diaria: cada uno elige cuántos puntos quiere sumar por día y ve un círculo que se completa.
 * Se cuenta en el celular (los puntos de hoy se suman cada vez que se termina un juego o una lección).
 * Es para animarse a volver mañana, no para competir: por eso basta el celular.
 */
import { useSyncExternalStore } from "react";

export const METAS = [
  { pts: 20, min: 5, id: "tranqui" },
  { pts: 40, min: 10, id: "normal" },
  { pts: 60, min: 15, id: "afull" },
] as const;

const K_META = "jaikuaa:meta-diaria";
const K_HOY = "jaikuaa:puntos-hoy";
const EVENTO = "jaikuaa:meta-cambio";

/** El día de hoy en Paraguay (AAAA-MM-DD). */
export function hoyPy(ahora = new Date()): string {
  return ahora.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

function leer<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function guardar(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ }
  // Nunca debe frenar el registro de puntos: si el aviso falla, se ignora.
  try { window.dispatchEvent(new Event(EVENTO)); } catch { /* sin ventana */ }
}

/** Puntos de hoy: si el registro es de otro día, hoy arranca en cero. */
export function puntosDeHoy(reg: { dia: string; pts: number } | null, hoy: string): number {
  return reg && reg.dia === hoy ? reg.pts : 0;
}

/** Se llama al terminar cualquier juego o lección (gamification.recordCompletion). */
export function sumarPuntosHoy(pts: number) {
  if (!(pts > 0) || typeof window === "undefined") return;
  const hoy = hoyPy();
  const reg = leer<{ dia: string; pts: number }>(K_HOY);
  guardar(K_HOY, { dia: hoy, pts: puntosDeHoy(reg, hoy) + Math.round(pts) });
}

export function elegirMeta(pts: number) {
  guardar(K_META, pts);
}

type Estado = { meta: number | null; hoy: number };
let cache: Estado = { meta: null, hoy: 0 };
let clave = "";
function leerEstado(): Estado {
  const meta = leer<number>(K_META);
  const hoy = puntosDeHoy(leer<{ dia: string; pts: number }>(K_HOY), hoyPy());
  const k = `${meta}|${hoy}`;
  if (k !== clave) { clave = k; cache = { meta: typeof meta === "number" ? meta : null, hoy }; }
  return cache;
}
const SERVIDOR: Estado = { meta: null, hoy: 0 };

export function useMetaDiaria(): Estado {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENTO, cb);
      window.addEventListener("storage", cb);
      window.addEventListener("focus", cb);
      return () => { window.removeEventListener(EVENTO, cb); window.removeEventListener("storage", cb); window.removeEventListener("focus", cb); };
    },
    leerEstado,
    () => SERVIDOR,
  );
}
