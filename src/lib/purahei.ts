/**
 * Purahéi Jaikuaa (vitrina de artistas): lo que no depende del servidor, para poder probarlo.
 * Nunca se escribe guaraní acá: la letra y el glosario los cargan docentes desde el panel.
 */
import type { Song } from "@/lib/juegos-contenido";

export type Estilo = "polca" | "guarania" | "galopa" | "otro";
export const ESTILOS: Estilo[] = ["polca", "guarania", "galopa", "otro"];
export const NOMBRE_ESTILO: Record<Estilo, string> = { polca: "Polca", guarania: "Guarania", galopa: "Galopa", otro: "Otro" };

export type Verso = { gn: string; es: string };
export type Termino = { termino: string; nota: string };
export type VersoKaraoke = { verso: number; gap: number; wrong: string[] };
export type Karaoke = { bpm: number; versos: VersoKaraoke[] };
export type Enlace = { nombre: string; url: string };

/** Los acordes del arpa según el estilo (los mismos de las canciones del juego). */
const ACORDES: Record<Estilo, number[][]> = {
  polca: [[196, 247, 294], [262, 330, 392], [294, 370, 440], [196, 247, 294]],
  guarania: [[220, 262, 330], [175, 220, 262], [262, 330, 392], [196, 247, 294]],
  galopa: [[262, 330, 392], [349, 440, 523], [392, 494, 587], [262, 330, 392]],
  otro: [[220, 277, 330], [294, 370, 440], [330, 415, 494], [220, 277, 330]],
};
export const BPM_ESTILO: Record<Estilo, number> = { polca: 104, guarania: 76, galopa: 116, otro: 96 };

/** «a b | c d» por renglón → versos. El renglón vacío se ignora. */
export function leerVersos(texto: string): Verso[] {
  return texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf("|");
    return i === -1 ? { gn: l, es: "" } : { gn: l.slice(0, i).trim(), es: l.slice(i + 1).trim() };
  }).filter((v) => v.gn).slice(0, 120);
}
export const escribirVersos = (v: Verso[]) => v.map((x) => (x.es ? `${x.gn} | ${x.es}` : x.gn)).join("\n");

export function leerGlosario(texto: string): Termino[] {
  return texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf("|");
    return i === -1 ? { termino: l, nota: "" } : { termino: l.slice(0, i).trim(), nota: l.slice(i + 1).trim() };
  }).filter((t) => t.termino && t.nota).slice(0, 80);
}
export const escribirGlosario = (g: Termino[]) => g.map((t) => `${t.termino} | ${t.nota}`).join("\n");

export function leerEnlaces(texto: string): Enlace[] {
  return texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.lastIndexOf("|");
    const nombre = i === -1 ? "" : l.slice(0, i).trim();
    const url = (i === -1 ? l : l.slice(i + 1)).trim();
    return { nombre: nombre || url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]!, url };
  }).filter((e) => /^https:\/\/[^\s]+$/.test(e.url)).slice(0, 8);
}
export const escribirEnlaces = (e: Enlace[]) => e.map((x) => `${x.nombre} | ${x.url}`).join("\n");

/** El número de WhatsApp solo con dígitos; un número paraguayo local (09…) pasa a 5959…. */
export function normalizarWhatsapp(n: string): string | null {
  let d = n.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("09")) d = `595${d.slice(1)}`;
  return /^[0-9]{8,15}$/.test(d) ? d : null;
}

export function enlaceWhatsapp(numero: string, artista: string): string {
  const texto = `Mba'éichapa. Vi tu ficha en Purahéi Jaikuaa y quisiera hablar con vos sobre una presentación de ${artista}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function slugDe(nombre: string): string {
  return nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "artista";
}

const LIMPIAR = /[¡!¿?.,;:«»"()]/g;
export const palabrasDe = (gn: string) => gn.split(/\s+/).map((w) => w.replace(LIMPIAR, "")).filter(Boolean);

/** La canción para Purahéi Karaoke, hecha con la letra y los huecos que eligieron los docentes.
 *  Su id es «o:<id de la obra>» (cabe en el reto, que admite hasta 40 caracteres). */
export function cancionKaraoke(o: { id: string; titulo: string; estilo: Estilo; versos: Verso[]; karaoke: Karaoke | null }): Song | null {
  if (!o.karaoke) return null;
  const lines = o.karaoke.versos.flatMap((k) => {
    const v = o.versos[k.verso];
    if (!v) return [];
    const words = palabrasDe(v.gn);
    const correcta = words[k.gap];
    const wrong = k.wrong.map((w) => w.replace(LIMPIAR, "").trim()).filter((w) => w && w !== correcta);
    if (!correcta || wrong.length < 2) return [];
    return [{ words, es: v.es, gap: k.gap, wrong: wrong.slice(0, 2) }];
  });
  if (lines.length < 2) return null;
  const bpm = Math.min(140, Math.max(60, Math.round(o.karaoke.bpm || BPM_ESTILO[o.estilo])));
  return { id: `o:${o.id}`, title: o.titulo, style: NOMBRE_ESTILO[o.estilo], bpm, chords: ACORDES[o.estilo], lines };
}

export type Requisitos = {
  permiso_autor: boolean; permiso_interprete: boolean; permiso_productor: boolean;
  revisado: boolean; tieneAudio: boolean; versos: number;
};
/** Lo que falta para poder publicar una obra (vacío = se puede). */
export function faltaParaPublicar(r: Requisitos): string[] {
  const f: string[] = [];
  if (r.versos === 0) f.push("La letra");
  if (!r.permiso_autor) f.push("Permiso del autor");
  if (r.tieneAudio && !r.permiso_interprete) f.push("Permiso del intérprete (por la grabación)");
  if (r.tieneAudio && !r.permiso_productor) f.push("Permiso del productor (por la grabación)");
  if (!r.revisado) f.push("Revisión de un docente distinto de quien la cargó");
  return f;
}

/** Parte un verso en trozos, marcando los términos del glosario (sin distinguir mayúsculas). */
export function marcarGlosario(texto: string, glosario: Termino[]): { t: string; termino?: Termino }[] {
  const terms = glosario.filter((g) => g.termino.trim()).sort((a, b) => b.termino.length - a.termino.length);
  if (!terms.length) return [{ t: texto }];
  const bajo = texto.toLocaleLowerCase();
  const out: { t: string; termino?: Termino }[] = [];
  let i = 0, desde = 0;
  while (i < texto.length) {
    const g = terms.find((x) => bajo.startsWith(x.termino.toLocaleLowerCase(), i) && esBorde(texto, i - 1) && esBorde(texto, i + x.termino.length));
    if (g) {
      if (desde < i) out.push({ t: texto.slice(desde, i) });
      out.push({ t: texto.slice(i, i + g.termino.length), termino: g });
      i += g.termino.length;
      desde = i;
    } else i++;
  }
  if (desde < texto.length) out.push({ t: texto.slice(desde) });
  return out;
}
function esBorde(t: string, i: number): boolean {
  if (i < 0 || i >= t.length) return true;
  return !/[\p{L}\p{N}'’]/u.test(t[i]!);
}
