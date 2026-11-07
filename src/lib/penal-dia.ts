/**
 * «El penal del día»: las mismas 5 palabras para todo el país, un intento por día (hora de Paraguay).
 * Al terminar se comparte el resultado como en Wordle: una fila de pelotas y cruces, sin mostrar las palabras.
 */
import { hoyPy } from "@/lib/meta-diaria";
import type { GameWord } from "@/lib/games.functions";
import type { Outcome } from "@/components/games/penalties/physics";

export const PENALES_DEL_DIA = 5;
const CLAVE = "jaikuaa:penal-dia";

/** Número de 32 bits estable a partir de un texto (FNV-1a). */
export function hashTexto(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** La semilla del día: la misma para todos los celulares de Paraguay. */
export function semillaDelDia(fecha: string): number {
  return hashTexto(`penal-dia:${fecha}`) || 1;
}

/**
 * Las 5 palabras del día. Cada palabra recibe un número según la fecha y se eligen las 5 más bajas:
 * así, aunque se publiquen palabras nuevas durante el día, las elegidas casi nunca cambian.
 */
export function palabrasDelDia(words: readonly GameWord[], fecha: string, n = PENALES_DEL_DIA): GameWord[] {
  return [...words]
    .map((w) => ({ w, k: hashTexto(`${fecha}|${w.gn}`) }))
    .sort((a, b) => a.k - b.k || a.w.gn.localeCompare(b.w.gn))
    .slice(0, n)
    .map((x) => x.w);
}

export type ResultadoDia = { fecha: string; outcomes: Outcome[] };

export function leerResultadoDia(fecha = hoyPy()): ResultadoDia | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as ResultadoDia | null;
    return v && v.fecha === fecha && Array.isArray(v.outcomes) ? v : null;
  } catch {
    return null;
  }
}

export function guardarResultadoDia(r: ResultadoDia): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(r));
  } catch {
    /* sin almacenamiento: igual se ve el resultado en pantalla */
  }
}

/** Un ícono por penal: gol, golazo al ángulo, atajada o errado. */
export function iconoPenal(o: Outcome): string {
  if (o === "angle") return "🎯";
  if (o === "goal") return "⚽";
  if (o === "save") return "🧤";
  return "❌";
}

export function golesDe(outcomes: readonly Outcome[]): number {
  return outcomes.filter((o) => o === "goal" || o === "angle").length;
}

/** La fecha corta para mostrar y compartir: 07/11. */
export function fechaCorta(fecha: string): string {
  const [, m, d] = fecha.split("-");
  return `${d}/${m}`;
}

/** El texto para compartir por WhatsApp o redes, sin revelar las palabras. */
export function textoCompartirDia(r: ResultadoDia, url: string, t: { titulo: string; deCinco: string; reto: string }): string {
  const fila = r.outcomes.map(iconoPenal).join("");
  return `Jaikuaa · ${t.titulo} ${fechaCorta(r.fecha)}\n${fila} ${t.deCinco.replace("{n}", String(golesDe(r.outcomes)))}\n${t.reto}\n${url}`;
}

/** Cuánto falta para el próximo penal del día (medianoche de Paraguay). */
export function msHastaManana(ahora = new Date()): number {
  const hoy = hoyPy(ahora);
  // Se busca el primer minuto en que la fecha de Paraguay cambia (sirve con o sin horario de verano).
  let t = ahora.getTime();
  const paso = 60_000;
  let fin = t + 26 * 3600_000;
  // Búsqueda binaria entre «ahora» y 26 horas después.
  while (fin - t > paso) {
    const medio = t + Math.floor((fin - t) / 2);
    if (hoyPy(new Date(medio)) === hoy) t = medio;
    else fin = medio;
  }
  return Math.max(0, fin - ahora.getTime());
}
