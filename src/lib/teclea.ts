/**
 * Reglas del juego «Jai Teclea» (mecanografía en guaraní, inspirado en los juegos arcade de tipeo).
 * Las palabras salen solo del corpus publicado; acá solo se compara lo que la persona escribe.
 */

/** Separa una palabra en letras visibles: «g̃» y las vocales con tilde nasal cuentan como una sola letra. */
export function letras(palabra: string): string[] {
  const s = palabra.normalize("NFC").trim();
  const out: string[] = [];
  for (const ch of s) {
    // Las marcas combinantes (como la tilde de g̃) se pegan a la letra anterior.
    if (/\p{M}/u.test(ch) && out.length > 0) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

/** Iguala variantes del puso y mayúsculas para no castigar al teclado del celular. */
export function normalizarLetra(l: string): string {
  return l.normalize("NFC").toLowerCase().replace(/[’‘ʼ`´]/g, "'");
}

export function esLetraCorrecta(esperada: string, escrita: string): boolean {
  return normalizarLetra(esperada) === normalizarLetra(escrita);
}

/** Letras por minuto (correctas) y precisión en porcentaje entero. */
export function resultado(correctas: number, errores: number, ms: number) {
  const minutos = Math.max(ms, 1000) / 60000;
  const total = correctas + errores;
  return {
    lpm: Math.round(correctas / minutos),
    precision: total === 0 ? 100 : Math.round((correctas / total) * 100),
  };
}

/** Estrellas de la ronda: precisión manda (aprender a escribir bien antes que rápido). */
export function estrellas(precision: number): 0 | 1 | 2 | 3 {
  if (precision >= 95) return 3;
  if (precision >= 85) return 2;
  if (precision >= 70) return 1;
  return 0;
}

export const PALABRAS_POR_RONDA = 8;
