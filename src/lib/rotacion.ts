/**
 * Rotación de palabras en los juegos: las que la persona vio hace poco van al final del mazo,
 * para que cada partida traiga palabras distintas. Se guarda en el celular (sin cuenta también).
 * No se usa en los retos: ahí los dos jugadores tienen que patear exactamente las mismas palabras.
 */
const MAX = 60;
const clave = (juego: string) => `jaikuaa:recientes:${juego}`;

export function leerRecientes(juego: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(clave(juego)) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function anotarReciente(juego: string, gn: string) {
  try {
    const v = [gn, ...leerRecientes(juego).filter((x) => x !== gn)].slice(0, MAX);
    localStorage.setItem(clave(juego), JSON.stringify(v));
  } catch {
    /* sin almacenamiento: el juego sigue igual */
  }
}

/** Deja primero las palabras que no se vieron hace poco; entre las vistas, la más vieja va antes. El orden al azar se respeta. */
export function priorizarNuevas<T>(mazo: readonly T[], recientes: readonly string[], gn: (w: T) => string): T[] {
  const pos = new Map(recientes.map((x, i) => [x, i] as const));
  const nuevas = mazo.filter((w) => !pos.has(gn(w)));
  const vistas = mazo.filter((w) => pos.has(gn(w))).sort((a, b) => (pos.get(gn(b)) ?? 0) - (pos.get(gn(a)) ?? 0));
  return [...nuevas, ...vistas];
}
