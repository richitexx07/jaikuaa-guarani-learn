import type { SponsorSlot } from "./sponsor-slots";
import { COLORES_VALLA, MAX_MARCAS, SEGUNDOS_POR_MARCA } from "./valla-led";

/** Juegos con vitrina LED rotativa de marcas (además de Penales). */
export const VITRINAS = {
  karaoke: { lugar: "Pantalla del escenario" },
  tembiu: { lugar: "Cocina de Jai" },
  "trivia-duelo": { lugar: "Zócalo del duelo" },
  chacra: { lugar: "Cartel de la chacra" },
  ventanilla: { lugar: "Pantalla de turnos" },
} as const satisfies Partial<Record<SponsorSlot, { lugar: string }>>;

export type VitrinaSlot = keyof typeof VITRINAS;
export const esVitrina = (s: SponsorSlot): s is VitrinaSlot => s in VITRINAS;

export type MarcaVitrina = { name: string; slogan?: string };

/** Qué marca se ve ahora: hasta 5, unos segundos cada una, con su color. */
export function marcaEn(marcas: MarcaVitrina[], now: number) {
  const lista = marcas.filter((m) => m.name.trim()).slice(0, MAX_MARCAS);
  if (!lista.length) return null;
  const i = Math.floor(now / (SEGUNDOS_POR_MARCA * 1000)) % lista.length;
  return { i, marca: lista[i], color: COLORES_VALLA[i % COLORES_VALLA.length], total: lista.length };
}
