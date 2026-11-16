/**
 * Modo aula (proyectar a toda la clase): el docente guía, los chicos escuchan la voz real y repiten.
 * Pensado para usar Jaikuaa desde primer grado sin celulares en manos de los alumnos.
 */

/** Pasos de cada palabra: se ve y se escucha, la clase repite, se muestra el significado. */
export type PasoAula = "ver" | "repetir" | "significado";

export const PASOS_AULA: PasoAula[] = ["ver", "repetir", "significado"];

export function siguientePaso(paso: PasoAula): PasoAula | null {
  const i = PASOS_AULA.indexOf(paso);
  return i >= 0 && i < PASOS_AULA.length - 1 ? PASOS_AULA[i + 1] : null;
}

export function avanzar(pos: { i: number; paso: PasoAula }, total: number): { i: number; paso: PasoAula } | "fin" {
  const sig = siguientePaso(pos.paso);
  if (sig) return { i: pos.i, paso: sig };
  if (pos.i + 1 < total) return { i: pos.i + 1, paso: "ver" };
  return "fin";
}

export function retroceder(pos: { i: number; paso: PasoAula }): { i: number; paso: PasoAula } {
  const k = PASOS_AULA.indexOf(pos.paso);
  if (k > 0) return { i: pos.i, paso: PASOS_AULA[k - 1] };
  if (pos.i > 0) return { i: pos.i - 1, paso: PASOS_AULA[PASOS_AULA.length - 1] };
  return pos;
}
