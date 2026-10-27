/**
 * Ventanilla de Jai: atención al público en guaraní (bancos, municipalidades, ministerios).
 * Usa las frases de «Atención al público» del Modo mostrador, que escriben y graban los
 * docentes. Este archivo no tiene guaraní propio: solo arma las rondas con lo publicado.
 */
import type { Frase } from "@/lib/mostrador";
import { orderedBy, shufflerFor } from "@/lib/reto";

export const CLIENTES_POR_TURNO = 8;
export const MIN_DECIR = 4;
export const MIN_ESCUCHAR = 3;

/** «decir»: elegí cómo decirle algo al cliente. «escuchar»: entendé lo que te dice el cliente. */
export type RondaVentanilla =
  | { tipo: "decir"; frase: Frase; opciones: Frase[] }
  | { tipo: "escuchar"; frase: Frase; opciones: string[] };

/** Clientes que llegan a la ventanilla (solo dibujitos y nombres comunes). */
export const CLIENTES = [
  { emoji: "👵", nombre: "Doña Carmen" },
  { emoji: "👨‍🌾", nombre: "Don Ramón" },
  { emoji: "👩", nombre: "Lourdes" },
  { emoji: "👴", nombre: "Don Aniceto" },
  { emoji: "🧑", nombre: "Hugo" },
  { emoji: "👩‍🦱", nombre: "Ña Sara" },
  { emoji: "👨", nombre: "Marcos" },
  { emoji: "👧", nombre: "Ana" },
];

export function frasesUsables(frases: Frase[], vistaPrevia = false) {
  const ok = (f: Frase) => vistaPrevia || !!f.gn?.trim();
  return {
    decir: orderedBy(frases.filter((f) => f.tipo === "decir" && ok(f)), (f) => f.id),
    escuchar: orderedBy(frases.filter((f) => f.tipo === "escuchar" && ok(f)), (f) => f.id),
  };
}

export function hayParaJugar(frases: Frase[], vistaPrevia = false) {
  const u = frasesUsables(frases, vistaPrevia);
  return u.decir.length >= MIN_DECIR && u.escuchar.length >= MIN_ESCUCHAR;
}

/** Arma el turno: alterna decir y escuchar, con la misma semilla sale el mismo turno. */
export function armarTurnoVentanilla(frases: Frase[], seed: number, vistaPrevia = false): RondaVentanilla[] {
  const { decir, escuchar } = frasesUsables(frases, vistaPrevia);
  if (decir.length < MIN_DECIR || escuchar.length < MIN_ESCUCHAR) return [];
  const d = shufflerFor(seed, 1)(decir);
  const e = shufflerFor(seed, 2)(escuchar);
  const out: RondaVentanilla[] = [];
  for (let i = 0; i < CLIENTES_POR_TURNO; i++) {
    const mezclar = shufflerFor(seed, 10 + i);
    if (i % 2 === 0 || e.length === 0) {
      const frase = d[(i / 2) % d.length | 0]!;
      const otras = mezclar(decir.filter((x) => x.id !== frase.id && x.gn !== frase.gn)).slice(0, 2);
      out.push({ tipo: "decir", frase, opciones: mezclar([frase, ...otras]) });
    } else {
      const frase = e[((i - 1) / 2) % e.length | 0]!;
      const otras = mezclar(escuchar.filter((x) => x.id !== frase.id && x.es !== frase.es).map((x) => x.es)).slice(0, 3);
      out.push({ tipo: "escuchar", frase, opciones: mezclar([frase.es, ...otras]) });
    }
  }
  return out;
}

/** Cómo se muestra el guaraní: lo escrito por el docente, o un aviso en la vista previa. */
export function gnDe(f: Frase): string {
  return f.gn?.trim() || `(falta el guaraní: «${f.es}»)`;
}
