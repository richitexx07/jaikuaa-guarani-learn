/** Valla LED rotativa del estadio: varias marcas en tanda, cada una unos segundos. */
export const SEPARADOR_MARCAS = "\n";
export const SEGUNDOS_POR_MARCA = 7;
export const MAX_MARCAS = 5;
export const MENSAJES_JAIKUAA = ["JAIKUAA · EL ESTADIO DE LAS PALABRAS", "APRENDÉ JUGANDO · AUDIO DE VOCES REALES"];
/** Colores de marca para la valla (se asignan por orden). */
export const COLORES_VALLA = ["#FFB23E", "#4FC3F7", "#FF5A4E", "#3BE38A", "#F4F7FB"];

/** Lista de la tanda: las marcas cargadas (hasta 5) y, después, los mensajes de Jaikuaa. */
export function tandaDeValla(ledText: string): string[] {
  const marcas = ledText.split(SEPARADOR_MARCAS).map((s) => s.trim()).filter(Boolean).slice(0, MAX_MARCAS);
  return [...marcas, ...MENSAJES_JAIKUAA];
}

/** Qué marca está en la valla en este momento. `cambio` va de 0 a 1 durante el barrido de luz al cambiar. */
export function vallaEn(ledText: string, now: number) {
  const tanda = tandaDeValla(ledText), ms = SEGUNDOS_POR_MARCA * 1000;
  const i = Math.floor(now / ms) % tanda.length, dentro = now % ms;
  return { i, texto: tanda[i], color: COLORES_VALLA[i % COLORES_VALLA.length], total: tanda.length, cambio: dentro < 450 ? 1 - dentro / 450 : 0 };
}
