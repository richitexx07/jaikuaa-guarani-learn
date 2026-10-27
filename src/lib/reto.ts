/**
 * Reto por WhatsApp: jugás, te sale un puntaje y le mandás a un amigo un enlace para que juegue
 * exactamente la misma partida (mismas palabras, mismo orden) cuando quiera. Al terminar, se ve
 * quién ganó. No necesita que los dos estén conectados a la vez.
 *
 * La partida se repite gracias a una «semilla»: un número que ordena todo igual en los dos celulares.
 */

export type RetoJuego =
  | "penales"
  | "ahorcado"
  | "memoria"
  | "sopa"
  | "tembiu"
  | "taanga"
  | "tekojoja"
  | "karaoke"
  | "trivia"
  | "consultorio"
  | "ventanilla"
  | "chacra";

export type Reto = {
  /** Juego */
  j: RetoJuego;
  /** Semilla de la partida */
  s: number;
  /** Puntaje de quien retó */
  p: number;
  /** Puntaje máximo posible */
  t: number;
  /** Nombre de quien retó */
  n: string;
  /** Dato extra del juego (lección, canción, categoría) */
  x?: string;
  /** Si es «menos es mejor» (por ejemplo, intentos) */
  m?: 1;
  /** Unidad del puntaje cuando no es «X de Y» (por ejemplo, «intentos») */
  u?: string;
};

export const RETO_RUTA: Record<RetoJuego, string> = {
  penales: "/juegos/penales",
  ahorcado: "/juegos/ahorcado",
  memoria: "/juegos/memoria",
  sopa: "/juegos/sopa-de-letras",
  tembiu: "/juegos/tembiu",
  taanga: "/juegos/taanga",
  tekojoja: "/juegos/tekojoja",
  karaoke: "/juegos/karaoke",
  trivia: "/trivia",
  consultorio: "/juegos/consultorio",
  ventanilla: "/juegos/ventanilla",
  chacra: "/juegos/chacra",
};

export const RETO_NOMBRE: Record<RetoJuego, string> = {
  penales: "Penales",
  ahorcado: "Ahorcado con chipas",
  memoria: "Memoria",
  sopa: "Sopa de letras",
  tembiu: "Tembi'u Paraguái",
  taanga: "Ta'anga",
  tekojoja: "Tekojoja",
  karaoke: "Purahéi Karaoke",
  trivia: "Preguntados",
  consultorio: "Consultorio de Jai",
  ventanilla: "Ventanilla de Jai",
  chacra: "Jai en la chacra",
};

const JUEGOS = Object.keys(RETO_RUTA) as RetoJuego[];

function toB64Url(s: string): string {
  const b = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64");
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b + "===".slice((b.length + 3) % 4);
  return typeof atob === "function" ? decodeURIComponent(escape(atob(pad))) : Buffer.from(pad, "base64").toString("utf8");
}

export function encodeReto(r: Reto): string {
  return toB64Url(JSON.stringify(r));
}

/** Lee un reto del enlace. Si viene roto o raro, devuelve null (el juego arranca normal). */
export function decodeReto(raw: string | null | undefined): Reto | null {
  if (!raw || raw.length > 400) return null;
  try {
    const o = JSON.parse(fromB64Url(raw)) as Record<string, unknown>;
    const j = o.j as RetoJuego;
    const s = Number(o.s);
    const p = Number(o.p);
    const t = Number(o.t);
    if (!JUEGOS.includes(j) || !Number.isFinite(s) || !Number.isFinite(p) || !Number.isFinite(t)) return null;
    if (s < 0 || s > 2 ** 32 || p < 0 || t < 0 || p > 100000 || t > 100000) return null;
    const n = typeof o.n === "string" ? o.n.replace(/[<>]/g, "").trim().slice(0, 20) : "";
    const x = typeof o.x === "string" ? o.x.slice(0, 40) : undefined;
    const u = typeof o.u === "string" && /^[a-záéíóúñ ]{1,14}$/i.test(o.u) ? o.u : undefined;
    return { j, s: Math.floor(s), p: Math.floor(p), t: Math.floor(t), n: n || "Tu amigo", ...(x ? { x } : {}), ...(o.m === 1 ? { m: 1 as const } : {}), ...(u ? { u } : {}) };
  } catch {
    return null;
  }
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Generador de números «al azar» que da siempre la misma serie para la misma semilla. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Un «mezclador» para una partida: misma semilla, mismo orden. `salt` separa cada ronda. */
export function shufflerFor(seed: number, salt = 0) {
  const rng = mulberry32((seed + Math.imul(salt + 1, 2654435761)) >>> 0);
  return <T,>(arr: readonly T[]) => seededShuffle(arr, rng);
}

/** Ordena una lista de palabras igual en todos los celulares antes de mezclarla con la semilla. */
export function orderedBy<T>(arr: readonly T[], key: (x: T) => string): T[] {
  return [...arr].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

export type Veredicto = "gane" | "perdi" | "empate";

export function veredicto(mio: number, reto: Pick<Reto, "p" | "m">): Veredicto {
  if (mio === reto.p) return "empate";
  const mejor = reto.m ? mio < reto.p : mio > reto.p;
  return mejor ? "gane" : "perdi";
}

export function retoUrl(origin: string, r: Reto): string {
  const path = r.j === "trivia" && r.x ? `/trivia/${encodeURIComponent(r.x)}` : RETO_RUTA[r.j];
  return `${origin}${path}?reto=${encodeReto(r)}`;
}

/** El puntaje como «4 de 5», o con su unidad («12 intentos»). */
export function puntajeTexto(r: Pick<Reto, "p" | "t" | "u">): string {
  return r.u ? `${r.p} ${r.u}` : `${r.p} de ${r.t}`;
}

export function retoMensaje(r: Reto, url: string): string {
  return `¡Te reto en ${RETO_NOMBRE[r.j]} de Jaikuaa! Hice ${puntajeTexto(r)}. Jugá la misma partida y a ver si me ganás:\n${url}`;
}

/** Lee el reto de la dirección actual, solo si es de este juego. */
export function retoDeLaUrl(juego: RetoJuego): Reto | null {
  if (typeof window === "undefined") return null;
  const r = decodeReto(new URLSearchParams(window.location.search).get("reto"));
  return r && r.j === juego ? r : null;
}

/** La lección elegida por quien retó (para que el amigo juegue con las mismas palabras). */
export function leccionDeReto(r: { x?: string } | null): number | null {
  return r?.x && /^\d{1,3}$/.test(r.x) ? Number(r.x) : null;
}
