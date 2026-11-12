/**
 * Purahéi Karaoke: la lógica del show (sin pantalla, para poder probarla).
 *
 * Una canción se canta en tres vueltas:
 *  1. Ensayo: falta la palabra que eligió el docente.
 *  2. Cambia la palabra: falta OTRA palabra del mismo verso. Las opciones falsas salen de las demás
 *     palabras de la misma canción (nunca se inventa guaraní: todo viene de la letra cargada).
 *  3. De memoria: vuelve el hueco del docente, pero la letra aparece recién cuando se canta.
 *
 * Cada verso dura: 1 pulso para leerlo + 1 pulso por palabra + 1 pulso de respiro.
 * Entre vueltas hay un telón de 4 pulsos que explica lo que cambia.
 */
import type { Song } from "@/lib/juegos-contenido";
import { mulberry32, seededShuffle } from "@/lib/reto";

export type Vuelta = 1 | 2 | 3;
export const VUELTAS: Vuelta[] = [1, 2, 3];

export type Verso = {
  /** Número de verso en todo el show (0, 1, 2…). */
  n: number;
  vuelta: Vuelta;
  /** Verso de la canción (0..lines-1). */
  linea: number;
  words: string[];
  es: string;
  /** Posición de la palabra que falta. */
  gap: number;
  correcta: string;
  /** Opciones en el orden en que se muestran (incluye la correcta). */
  opciones: string[];
  dorado: boolean;
  memoria: boolean;
};

/** Qué pasa en cada pulso. */
export type Paso =
  | { tipo: "intro"; i: number }
  | { tipo: "cuenta"; i: number }
  | { tipo: "telon"; vuelta: Vuelta; i: number }
  /** word: -2 = se lee el verso, 0..n-1 = la pelotita sobre esa palabra, -1 = respiro. */
  | { tipo: "verso"; v: number; word: number };

export const INTRO = 4;
export const CUENTA = 4;
export const TELON = 4;

export type Show = { versos: Verso[]; pasos: Paso[]; inicio: number[] };

const norm = (w: string) => w.normalize("NFC").toLowerCase().replace(/[¡!¿?.,;:«»"]/g, "").trim();

/** La opción falsa se escribe con la misma mayúscula inicial que la correcta (para no regalar la respuesta). */
function igualarMayuscula(w: string, modelo: string): string {
  const may = modelo.charAt(0) !== modelo.charAt(0).toLowerCase();
  const c = w.charAt(0);
  return (may ? c.toUpperCase() : c.toLowerCase()) + w.slice(1);
}

/** Vuelta 2: el hueco pasa a la palabra más larga del verso que no sea la del docente. */
export function huecoAlternativo(words: readonly string[], gap: number): number {
  let mejor = -1;
  words.forEach((w, i) => {
    if (i === gap) return;
    const n = norm(w);
    if (n.length < 2 || n === norm(words[gap] ?? "")) return;
    if (mejor === -1 || n.length > norm(words[mejor]!).length) mejor = i;
  });
  return mejor;
}

export function armarShow(song: Song, seed: number): Show {
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const mezclar = <T,>(a: readonly T[]) => seededShuffle(a, rng);
  // Todas las palabras de la canción (una vez cada una), para las opciones de la vuelta 2.
  const todas: string[] = [];
  const vistas = new Set<string>();
  for (const l of song.lines) for (const w of l.words) {
    const n = norm(w);
    if (n.length >= 2 && !vistas.has(n)) { vistas.add(n); todas.push(w); }
  }

  const versos: Verso[] = [];
  for (const vuelta of VUELTAS) {
    const dorado = Math.floor(rng() * song.lines.length);
    song.lines.forEach((l, linea) => {
      let gap = l.gap;
      let falsas = l.wrong.slice();
      if (vuelta === 2) {
        const alt = huecoAlternativo(l.words, l.gap);
        if (alt !== -1) {
          const correcta = norm(l.words[alt]!);
          const delVerso = new Set(l.words.map(norm));
          const pool = todas.filter((w) => norm(w) !== correcta && !delVerso.has(norm(w)));
          if (pool.length >= 2) {
            gap = alt;
            falsas = mezclar(pool).slice(0, 2).map((w) => igualarMayuscula(w, l.words[alt]!));
          }
        }
      }
      const correcta = l.words[gap]!;
      const opciones = mezclar([correcta, ...falsas.filter((w) => norm(w) !== norm(correcta))]);
      versos.push({ n: versos.length, vuelta, linea, words: l.words, es: l.es, gap, correcta, opciones, dorado: linea === dorado, memoria: vuelta === 3 });
    });
  }

  const pasos: Paso[] = [];
  const inicio: number[] = [];
  for (let i = 0; i < INTRO; i++) pasos.push({ tipo: "intro", i });
  for (let i = 0; i < CUENTA; i++) pasos.push({ tipo: "cuenta", i });
  for (const v of versos) {
    if (v.vuelta > 1 && v.linea === 0) for (let i = 0; i < TELON; i++) pasos.push({ tipo: "telon", vuelta: v.vuelta, i });
    inicio[v.n] = pasos.length;
    pasos.push({ tipo: "verso", v: v.n, word: -2 });
    v.words.forEach((_, word) => pasos.push({ tipo: "verso", v: v.n, word }));
    pasos.push({ tipo: "verso", v: v.n, word: -1 });
  }
  return { versos, pasos, inicio };
}

/** Pulso en que la pelotita llega al hueco del verso. */
export function pulsoDelHueco(show: Show, v: number): number {
  return show.inicio[v]! + 1 + show.versos[v]!.gap;
}

export type Nota = "perfecto" | "bien" | "justo" | "fallo";
export const PUNTOS_BASE: Record<Nota, number> = { perfecto: 5, bien: 3, justo: 2, fallo: 0 };

/** Qué tan a tiempo tocó: diferencia en segundos con el momento del hueco. */
export function juzgar(dtSeg: number, beatSec: number): Exclude<Nota, "fallo"> {
  const d = Math.abs(dtSeg) / beatSec;
  return d <= 0.4 ? "perfecto" : d <= 1 ? "bien" : "justo";
}

/** La racha multiplica: 3 seguidas ×2, 6 seguidas ×3, 10 seguidas ×4. */
export function multiplicador(racha: number): number {
  return racha >= 10 ? 4 : racha >= 6 ? 3 : racha >= 3 ? 2 : 1;
}
export const HITOS_RACHA = [3, 6, 10];
/** Desde esta racha el escenario entra en modo fiesta. */
export const RACHA_FIESTA = 6;

export function puntosDe(nota: Nota, rachaDespues: number, dorado: boolean): number {
  return PUNTOS_BASE[nota] * multiplicador(rachaDespues) * (dorado ? 2 : 1);
}

/** El máximo posible: todo perfecto, sin cortar la racha. */
export function puntajeMaximo(versos: readonly Verso[]): number {
  return versos.reduce((s, v, i) => s + puntosDe("perfecto", i + 1, v.dorado), 0);
}

/** Si falló el verso anterior, este se ofrece con solo dos opciones. */
export function opcionesVisibles(v: Verso, ayuda: boolean): string[] {
  if (!ayuda || v.opciones.length <= 2) return v.opciones;
  const falsa = v.opciones.find((w) => w !== v.correcta)!;
  return v.opciones.filter((w) => w === v.correcta || w === falsa);
}

export function estrellas(ratio: number): number {
  return ratio >= 0.75 ? 3 : ratio >= 0.45 ? 2 : ratio > 0 ? 1 : 0;
}

/** Título de cantor según el porcentaje del máximo (0 a 4). */
export function rango(ratio: number): 0 | 1 | 2 | 3 | 4 {
  return ratio >= 0.85 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.35 ? 2 : ratio > 0.1 ? 1 : 0;
}

export function dificultad(bpm: number): 1 | 2 | 3 {
  return bpm < 90 ? 1 : bpm <= 110 ? 2 : 3;
}

/* ------------------------- Récord de cada canción (en este celular) ------------------------- */

const CLAVE = (id: string) => `jk.karaoke.record.${id}`;
export type Record_ = { p: number; e: number };
export function leerRecord(id: string): Record_ | null {
  try {
    const r = JSON.parse(localStorage.getItem(CLAVE(id)) ?? "null");
    return r && typeof r.p === "number" ? r : null;
  } catch { return null; }
}
/** Guarda si supera el récord. Devuelve true si es récord nuevo. */
export function guardarRecord(id: string, p: number, e: number): boolean {
  const antes = leerRecord(id);
  if (antes && antes.p >= p) return false;
  try { localStorage.setItem(CLAVE(id), JSON.stringify({ p, e: Math.max(e, antes?.e ?? 0) })); } catch { /* sin guardado */ }
  return p > 0;
}
