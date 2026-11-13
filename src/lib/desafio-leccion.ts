/**
 * Desafío de lección por WhatsApp: quien termina una lección manda su puntaje a un amigo con un enlace
 * a la misma lección. El amigo la hace y al final ve quién ganó. Todo viaja en el enlace
 * (no se guarda nada en la base). Va en «?desafio=» para no mezclarse con los retos de los juegos («?reto=»).
 */

export type Desafio = {
  /** Nombre de quien desafía */
  n: string;
  /** Respuestas bien */
  p: number;
  /** Respuestas en total */
  t: number;
  /** Número de lección */
  l: number;
};

function toB64Url(s: string): string {
  const b = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64");
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b + "===".slice((b.length + 3) % 4);
  return typeof atob === "function" ? decodeURIComponent(escape(atob(pad))) : Buffer.from(pad, "base64").toString("utf8");
}

export function limpiarNombre(n: string): string {
  return n.replace(/[<>]/g, "").trim().slice(0, 20);
}

export function encodeDesafio(d: Desafio): string {
  return toB64Url(JSON.stringify({ ...d, n: limpiarNombre(d.n) || "Tu amigo" }));
}

/** Lee el desafío del enlace. Si viene roto o raro, devuelve null (la lección arranca normal). */
export function decodeDesafio(raw: string | null | undefined): Desafio | null {
  if (!raw || raw.length > 300) return null;
  try {
    const o = JSON.parse(fromB64Url(raw)) as Record<string, unknown>;
    const p = Number(o.p);
    const t = Number(o.t);
    const l = Number(o.l);
    if (![p, t, l].every((x) => Number.isInteger(x))) return null;
    if (t < 1 || t > 500 || p < 0 || p > t || l < 1 || l > 10000) return null;
    const n = typeof o.n === "string" ? limpiarNombre(o.n) : "";
    return { n: n || "Tu amigo", p, t, l };
  } catch {
    return null;
  }
}

export function desafioUrl(origin: string, lang: string, d: Desafio): string {
  return `${origin}/curso/${lang}/leccion/${d.l}?desafio=${encodeDesafio(d)}`;
}

export type Resultado = "gane" | "perdi" | "empate";

/** Gana quien tiene más respuestas bien en proporción (los intentos pueden ser distintos). */
export function compararDesafio(mio: { p: number; t: number }, otro: { p: number; t: number }): Resultado {
  const a = mio.p * otro.t;
  const b = otro.p * mio.t;
  return a > b ? "gane" : a < b ? "perdi" : "empate";
}

/* ------------------- Aciertos de la lección en curso (en el celular) ------------------- */

const clave = (lang: string, n: number) => `jaikuaa:aciertos:${lang}:${n}`;

export function leerAciertos(lang: string, n: number): { p: number; t: number } {
  try {
    const o = JSON.parse(localStorage.getItem(clave(lang, n)) || "null") as { p?: number; t?: number } | null;
    if (o && Number.isInteger(o.p) && Number.isInteger(o.t)) return { p: o.p!, t: o.t! };
  } catch { /* sin almacenamiento */ }
  return { p: 0, t: 0 };
}

export function sumarAcierto(lang: string, n: number, ok: boolean) {
  const a = leerAciertos(lang, n);
  try { localStorage.setItem(clave(lang, n), JSON.stringify({ p: a.p + (ok ? 1 : 0), t: a.t + 1 })); } catch { /* sin almacenamiento */ }
}

export function reiniciarAciertos(lang: string, n: number) {
  try { localStorage.removeItem(clave(lang, n)); } catch { /* sin almacenamiento */ }
}
