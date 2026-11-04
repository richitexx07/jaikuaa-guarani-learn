import { useEffect, useState } from "react";

/** «Seguí donde quedaste»: el último juego o lección que se abrió en este celular. */
export type LastPlace = { href: string; title: string; kind: "game" | "lesson"; at: number };
const KEY = "jaikuaa:ultimo-lugar";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function rememberPlace(p: Omit<LastPlace, "at">) {
  try {
    if (!p.href.startsWith("/") || p.href.startsWith("//")) return;
    localStorage.setItem(KEY, JSON.stringify({ ...p, at: Date.now() }));
  } catch { /* sin almacenamiento */ }
}

/** Al terminar o abandonar, el panel deja de insistir con ese juego. */
export function forgetPlace() {
  try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ }
}

export function readPlace(now = Date.now()): LastPlace | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as LastPlace | null;
    if (!v || typeof v.href !== "string" || !v.href.startsWith("/") || v.href.startsWith("//")) return null;
    if (typeof v.title !== "string" || !v.title || now - Number(v.at) > MAX_AGE_MS) return null;
    return v;
  } catch {
    return null;
  }
}

/** Anota este lugar al abrirlo (sin parámetros de sala o reto, que vencen). */
export function useRememberPlace(title: string, kind: LastPlace["kind"], enabled = true) {
  useEffect(() => {
    if (!enabled || !title || typeof window === "undefined") return;
    rememberPlace({ href: window.location.pathname, title, kind });
  }, [title, kind, enabled]);
}

export function useLastPlace(): LastPlace | null {
  const [p, setP] = useState<LastPlace | null>(null);
  useEffect(() => setP(readPlace()), []);
  return p;
}
