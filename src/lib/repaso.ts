/**
 * Repaso de Jai: cada día, unas pocas palabras que la persona ya vio en sus lecciones.
 * Responde ANTES de ver la respuesta (practicar recordando) y cada palabra vuelve a los días
 * (repartir la práctica): lo que mejor ayuda a recordar según la investigación sobre aprendizaje.
 *
 * Sistema de cajas: acertar sube de caja (vuelve más tarde); equivocarse la manda a la caja 1 (vuelve mañana).
 * Funciones puras: sin almacenamiento ni pantalla, para usarlas en la página y en las pruebas.
 */

/** Días hasta la próxima vez, según la caja (1 a 5). */
export const INTERVALOS = [1, 3, 7, 14, 30] as const;
/** Palabras por repaso: dos minutos. */
export const POR_DIA = 5;

export type Ficha = { caja: number; proxima: string };
export type EstadoRepaso = Record<string, Ficha>;

/** «2026-11-17» + n días. Las fechas son días de calendario (sin horas). */
export function sumarDias(dia: string, n: number): string {
  const [y, m, d] = dia.split("-").map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + n));
  return t.toISOString().slice(0, 10);
}

/** Hoy en Paraguay, como AAAA-MM-DD. */
export function hoyPy(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

/**
 * Las palabras de hoy: primero las que ya tocan (las más atrasadas y las de caja más baja),
 * y si faltan, palabras nuevas de las lecciones hechas, en el orden en que se aprendieron.
 */
export function elegirRepaso(pool: readonly string[], estado: EstadoRepaso, hoy: string, n: number = POR_DIA): string[] {
  const enPool = new Set(pool);
  const tocan = Object.entries(estado)
    .filter(([gn, f]) => enPool.has(gn) && f.proxima <= hoy)
    .sort((a, b) => (a[1].proxima === b[1].proxima ? a[1].caja - b[1].caja : a[1].proxima < b[1].proxima ? -1 : 1))
    .map(([gn]) => gn);
  const nuevas = pool.filter((gn) => !estado[gn]);
  return [...tocan, ...nuevas].slice(0, n);
}

/** Después de responder: acertó → sube de caja; se equivocó → caja 1, vuelve mañana. */
export function actualizar(estado: EstadoRepaso, gn: string, acerto: boolean, hoy: string): EstadoRepaso {
  const antes = estado[gn]?.caja ?? 0;
  const caja = acerto ? Math.min(INTERVALOS.length, Math.max(1, antes + 1)) : 1;
  const dias = acerto ? INTERVALOS[caja - 1]! : 1;
  return { ...estado, [gn]: { caja, proxima: sumarDias(hoy, dias) } };
}

/** Cuándo toca el próximo repaso (la fecha más cercana), o null si todavía no hay palabras. */
export function proximoRepaso(pool: readonly string[], estado: EstadoRepaso): string | null {
  const fechas = pool.map((gn) => estado[gn]?.proxima).filter((x): x is string => !!x).sort();
  return fechas[0] ?? null;
}

/** Cuántas palabras ya están «firmes» (caja 4 o más: aciertos repetidos en días distintos). */
export function firmes(pool: readonly string[], estado: EstadoRepaso): number {
  return pool.filter((gn) => (estado[gn]?.caja ?? 0) >= 4).length;
}

/** Tres opciones equivocadas para una palabra, distintas entre sí y de la correcta (sin repetir significado). */
export function distractores<T extends { gn: string; es: string }>(item: T, todos: readonly T[], rnd: () => number = Math.random): T[] {
  const vistos = new Set([item.es.trim().toLowerCase()]);
  const candidatos = todos.filter((x) => x.gn !== item.gn);
  const mezclados = [...candidatos];
  for (let i = mezclados.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [mezclados[i], mezclados[j]] = [mezclados[j]!, mezclados[i]!];
  }
  const out: T[] = [];
  for (const c of mezclados) {
    const k = c.es.trim().toLowerCase();
    if (vistos.has(k)) continue;
    vistos.add(k);
    out.push(c);
    if (out.length === 3) break;
  }
  return out;
}
