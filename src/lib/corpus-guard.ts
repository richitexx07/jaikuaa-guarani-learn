/**
 * Cuidar el corpus: nadie se lleva todas las palabras de un solo pedido.
 * Funciones puras (sin base de datos) para usarlas en el servidor y en las pruebas.
 */

/** Cuántas palabras recibe por día quien juega sin cuenta (elegidas al azar, distintas cada día). */
export const MUESTRA_INVITADO_JUEGOS = 60;
/** Cuántas palabras con voz ve por día en «Pronunciá» quien no tiene cuenta. */
export const MUESTRA_INVITADO_VOZ = 40;

/** Generador de azar repetible: la misma clave da siempre la misma secuencia. */
export function azarConClave(clave: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < clave.length; i++) h = Math.imul(h ^ clave.charCodeAt(i), 16777619);
  let x = h >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/**
 * Una porción de la lista, la misma durante todo el día para la misma clave (fecha + conexión).
 * Pedir mil veces el mismo día devuelve las mismas palabras: así no se junta el corpus repitiendo pedidos.
 */
export function muestraDelDia<T>(items: readonly T[], n: number, clave: string): T[] {
  if (items.length <= n) return [...items];
  const rnd = azarConClave(clave);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}
