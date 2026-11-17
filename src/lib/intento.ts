/**
 * Comprobantes de intento firmados por el servidor (sin tabla nueva).
 * El servidor entrega un comprobante al empezar (lección o reto) y, al terminar,
 * solo acepta el avance si el comprobante es suyo, de esa misma persona y cosa,
 * y pasó un tiempo mínimo real. El celular no puede fabricarlos.
 */
export type Intento = { u: string; k: string; r: string; t: number };

function b64(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(`jaikuaa-intento:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

export async function firmarIntento(secret: string, i: Intento): Promise<string> {
  const body = `${i.u}|${i.k}|${i.r}|${i.t}`;
  return `${i.t}.${await hmac(secret, body)}`;
}

/** Devuelve la hora de inicio si el comprobante es válido para esa persona y cosa; si no, null. */
export async function leerIntento(secret: string, token: string | undefined, u: string, k: string, r: string, ahora: number): Promise<number | null> {
  if (!token) return null;
  const m = /^(\d{10,14})\.([A-Za-z0-9_-]{20,})$/.exec(token);
  if (!m) return null;
  const t = Number(m[1]);
  if (!Number.isFinite(t) || t > ahora + 60_000) return null;
  const esperado = await firmarIntento(secret, { u, k, r, t });
  if (esperado.length !== token.length) return null;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= esperado.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0 ? t : null;
}

/** Tiempo mínimo real para terminar una lección: ver cada palabra y responder. */
export function minSegundosLeccion(palabras: number): number {
  return 20 + 3 * Math.max(0, palabras);
}

/** Tiempo mínimo real para jugar un reto. */
export const MIN_SEGUNDOS_RETO = 8;

export type Pregunta = { prompt: string; options: string[]; answer: string };
export type Respuesta = { p: string; r: string };

/**
 * Corrige un examen en el servidor. Cada pregunta tiene que existir en el banco,
 * no se repiten y debe haber al menos `minimo`. Devuelve aciertos y total.
 */
export function corregirExamen(banco: Pregunta[], respuestas: Respuesta[], minimo: number): { aciertos: number; total: number } | null {
  const porTexto = new Map(banco.map((q) => [q.prompt, q]));
  const vistas = new Set<string>();
  let aciertos = 0;
  for (const x of respuestas) {
    const q = porTexto.get(x.p);
    if (!q || vistas.has(x.p) || !q.options.includes(x.r)) return null;
    vistas.add(x.p);
    if (x.r === q.answer) aciertos++;
  }
  if (vistas.size < minimo) return null;
  return { aciertos, total: vistas.size };
}
