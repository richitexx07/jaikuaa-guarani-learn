import type { Paciente, RegionId } from "@/lib/consultorio";
import abuela_1 from "@/assets/consultorio/pacientes/abuela-1.webp";
import abuelo_1 from "@/assets/consultorio/pacientes/abuelo-1.webp";
import hombre_adulto_1 from "@/assets/consultorio/pacientes/hombre-adulto-1.webp";
import hombre_adulto_2 from "@/assets/consultorio/pacientes/hombre-adulto-2.webp";
import hombre_joven_1 from "@/assets/consultorio/pacientes/hombre-joven-1.webp";
import mujer_adulta_1 from "@/assets/consultorio/pacientes/mujer-adulta-1.webp";
import mujer_adulta_2 from "@/assets/consultorio/pacientes/mujer-adulta-2.webp";
import mujer_joven_1 from "@/assets/consultorio/pacientes/mujer-joven-1.webp";

export type Zona = { r: RegionId; x: number; y: number; rx: number; ry: number };
export type Figura = { id: string; src: string; zonas: Zona[]; caraY: number };

/** Zonas medidas a mano sobre cada imagen (lienzo de 100 × 150). Si se cambia una imagen, hay que volver a medir. */
const z = (l: [RegionId, number, number, number, number][]): Zona[] => l.map(([r, x, y, rx, ry]) => ({ r, x, y, rx, ry }));

export const FIGURAS: Record<string, Figura> = {
  "abuela-1": { id: "abuela-1", src: abuela_1, caraY: 150, zonas: z([
    ["cabeza", 50.3, 19.5, 12.8, 14.3],
    ["ojo", 45.2, 23.3, 4, 2.8],
    ["ojo", 54.3, 23.3, 4, 2.8],
    ["oreja", 38.3, 23.4, 3.2, 4.6],
    ["oreja", 62.0, 23.4, 3.2, 4.6],
    ["nariz", 49.9, 26.0, 3.2, 2.6],
    ["boca", 49.9, 30.3, 5.5, 3],
    ["corazon", 55.7, 59.2, 6, 5.5],
    ["panza", 49.7, 82.0, 12, 9],
    ["mano", 16.9, 81.2, 7.5, 7.5],
    ["mano", 82.8, 81.2, 7.5, 7.5],
    ["pie", 36.5, 140.1, 9, 5],
    ["pie", 63.8, 140.1, 9, 5],
  ]) },
  "abuelo-1": { id: "abuelo-1", src: abuelo_1, caraY: 147, zonas: z([
    ["cabeza", 49.6, 19.1, 12.2, 14.3],
    ["ojo", 45.4, 18.4, 4, 2.8],
    ["ojo", 53.8, 18.4, 4, 2.8],
    ["oreja", 38.2, 21.7, 3.2, 4.6],
    ["oreja", 60.4, 21.7, 3.2, 4.6],
    ["nariz", 49.6, 22.4, 3.2, 2.6],
    ["boca", 49.6, 27.3, 5.5, 3],
    ["corazon", 56.0, 61.2, 6, 5.5],
    ["panza", 50.0, 84.6, 12, 9],
    ["mano", 12.0, 84.6, 7.5, 7.5],
    ["mano", 85.4, 84.6, 7.5, 7.5],
    ["pie", 34.1, 139.3, 9, 5],
    ["pie", 64.8, 139.3, 9, 5],
  ]) },
  "hombre-adulto-1": { id: "hombre-adulto-1", src: hombre_adulto_1, caraY: 130, zonas: z([
    ["cabeza", 50.1, 16.9, 9.1, 12.1],
    ["ojo", 46.7, 16.9, 4, 2.8],
    ["ojo", 53.5, 16.9, 4, 2.8],
    ["oreja", 41.0, 18.6, 3.2, 4.6],
    ["oreja", 58.7, 18.6, 3.2, 4.6],
    ["nariz", 50.0, 20.4, 3.2, 2.6],
    ["boca", 50.0, 23.6, 5.5, 3],
    ["corazon", 55.5, 58.6, 6, 5.5],
    ["panza", 50.0, 81.4, 12, 9],
    ["mano", 18.2, 78.1, 7.5, 7.5],
    ["mano", 81.2, 78.1, 7.5, 7.5],
    ["pie", 35.7, 139.3, 9, 5],
    ["pie", 65.6, 139.3, 9, 5],
  ]) },
  "hombre-adulto-2": { id: "hombre-adulto-2", src: hombre_adulto_2, caraY: 146, zonas: z([
    ["cabeza", 48.7, 19.0, 11.7, 13.9],
    ["ojo", 45.7, 17.1, 4, 2.8],
    ["ojo", 53.5, 17.8, 4, 2.8],
    ["oreja", 37.4, 19.1, 3.2, 4.6],
    ["oreja", 60.0, 19.1, 3.2, 4.6],
    ["nariz", 50.0, 21.7, 3.2, 2.6],
    ["boca", 50.0, 25.1, 5.5, 3],
    ["corazon", 56.2, 60.2, 6, 5.5],
    ["panza", 50.0, 84.0, 12, 9],
    ["mano", 10.4, 78.1, 7.5, 7.5],
    ["mano", 88.0, 78.1, 7.5, 7.5],
    ["pie", 30.7, 139.3, 9, 5],
    ["pie", 67.2, 139.3, 9, 5],
  ]) },
  "hombre-joven-1": { id: "hombre-joven-1", src: hombre_joven_1, caraY: 133, zonas: z([
    ["cabeza", 48.4, 17.3, 9.0, 12.4],
    ["ojo", 44.8, 16.8, 4, 2.8],
    ["ojo", 51.6, 16.8, 4, 2.8],
    ["oreja", 40.2, 18.9, 3.2, 4.6],
    ["oreja", 56.5, 18.9, 3.2, 4.6],
    ["nariz", 48.3, 20.6, 3.2, 2.6],
    ["boca", 48.3, 23.6, 5.5, 3],
    ["corazon", 55.2, 58.6, 6, 5.5],
    ["panza", 49.5, 81.4, 12, 9],
    ["mano", 16.4, 80.5, 7.5, 7.5],
    ["mano", 82.8, 80.5, 7.5, 7.5],
    ["pie", 34.6, 140.4, 9, 5],
    ["pie", 63.3, 140.4, 9, 5],
  ]) },
  "mujer-adulta-1": { id: "mujer-adulta-1", src: mujer_adulta_1, caraY: 145, zonas: z([
    ["cabeza", 51.3, 18.9, 11.7, 13.8],
    ["ojo", 47.3, 19.3, 4, 2.8],
    ["ojo", 56.1, 20.3, 4, 2.8],
    ["oreja", 41.3, 22.8, 3.2, 4.6],
    ["oreja", 62.1, 22.8, 3.2, 4.6],
    ["nariz", 51.3, 23.6, 3.2, 2.6],
    ["boca", 51.3, 28.0, 5.5, 3],
    ["corazon", 56.0, 61.2, 6, 5.5],
    ["panza", 50.0, 84.0, 12, 9],
    ["mano", 13.8, 80.5, 7.5, 7.5],
    ["mano", 85.4, 80.5, 7.5, 7.5],
    ["pie", 35.4, 140.4, 9, 5],
    ["pie", 63.5, 140.4, 9, 5],
  ]) },
  "mujer-adulta-2": { id: "mujer-adulta-2", src: mujer_adulta_2, caraY: 138, zonas: z([
    ["cabeza", 50.4, 18.0, 10.0, 12.6],
    ["ojo", 47.0, 18.4, 4, 2.8],
    ["ojo", 54.2, 19.3, 4, 2.8],
    ["oreja", 41.3, 21.0, 3.2, 4.6],
    ["oreja", 58.7, 21.0, 3.2, 4.6],
    ["nariz", 50.4, 22.3, 3.2, 2.6],
    ["boca", 50.4, 25.5, 5.5, 3],
    ["corazon", 55.7, 60.9, 6, 5.5],
    ["panza", 50.0, 83.3, 12, 9],
    ["mano", 18.2, 80.5, 7.5, 7.5],
    ["mano", 80.7, 80.5, 7.5, 7.5],
    ["pie", 35.7, 140.4, 9, 5],
    ["pie", 65.6, 140.4, 9, 5],
  ]) },
  "mujer-joven-1": { id: "mujer-joven-1", src: mujer_joven_1, caraY: 135, zonas: z([
    ["cabeza", 50.8, 17.6, 8.7, 12.1],
    ["ojo", 47.0, 18.0, 4, 2.8],
    ["ojo", 54.8, 18.9, 4, 2.8],
    ["oreja", 43.1, 21.0, 3.2, 4.6],
    ["oreja", 58.7, 21.0, 3.2, 4.6],
    ["nariz", 50.9, 21.9, 3.2, 2.6],
    ["boca", 50.9, 24.9, 5.5, 3],
    ["corazon", 54.7, 59.2, 6, 5.5],
    ["panza", 50.0, 81.0, 12, 9],
    ["mano", 21.6, 81.0, 7.5, 7.5],
    ["mano", 78.1, 81.0, 7.5, 7.5],
    ["pie", 38.0, 140.4, 9, 5],
    ["pie", 65.9, 140.4, 9, 5],
  ]) },
};

/** La figura que corresponde al paciente: mismo sexo y edad parecida a la de la ficha. */
export function figuraPara(p: Paciente): Figura {
  if (p.femenino) {
    if (p.edad >= 61) return FIGURAS["abuela-1"]!;
    if (p.edad <= 33) return FIGURAS["mujer-joven-1"]!;
    return p.edad >= 48 ? FIGURAS["mujer-adulta-2"]! : FIGURAS["mujer-adulta-1"]!;
  }
  if (p.edad >= 61) return FIGURAS["abuelo-1"]!;
  if (p.edad <= 30) return FIGURAS["hombre-joven-1"]!;
  return p.edad >= 48 ? FIGURAS["hombre-adulto-2"]! : FIGURAS["hombre-adulto-1"]!;
}
