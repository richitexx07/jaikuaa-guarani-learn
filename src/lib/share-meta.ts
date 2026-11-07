/**
 * Vista previa de los enlaces que se comparten (WhatsApp, Facebook…).
 * Los juegos se arman en el celular (sin servidor), así que su título e imagen salen de acá,
 * desde la raíz: si no, el enlace de un juego aparecía pelado, sin foto ni texto.
 */
/** `image`: vista previa propia (public/og/<juego>.jpg, 1200×630); sin ella va la general de Jaikuaa. */
export type ShareMeta = { title: string; description: string; image?: string };

const DEFAULT: ShareMeta = {
  title: "Jaikuaa — Aprendé y jugá en guaraní",
  description: "Aprendé guaraní con voces de paraguayos de verdad, juegos y desafíos. Gratis, desde el celular.",
};

const FREE = "Gratis y sin registrarte.";
const BY_PATH: Record<string, ShareMeta> = {
  "/juegos": { title: "Juegos en guaraní · Jaikuaa", description: `Ahorcado, sopa de letras, penales, duelos y más, con voces reales. ${FREE}` },
  "/juegos/ahorcado": { title: "Ahorcado con chipas · Jaikuaa", description: `Adiviná la palabra en guaraní antes de quedarte sin chipas. ${FREE}` },
  "/juegos/sopa-de-letras": { title: "Sopa de letras en guaraní · Jaikuaa", description: `Encontrá las palabras escondidas y escuchalas con voz real. ${FREE}` },
  "/juegos/memoria": { title: "Memoria en guaraní · Jaikuaa", description: `Uní cada palabra con su significado. ${FREE}` },
  "/juegos/duelo": { title: "Duelo Cara a Cara en guaraní · Jaikuaa", description: `Dos jugadores, un celular: el más rápido gana. ${FREE}` },
  "/juegos/trivia-duelo": { title: "Duelo de Trivia Paraguaya · Jaikuaa", description: `¿Quién sabe más del Paraguay? Desafiá a un amigo. ${FREE}` },
  "/juegos/penales": { title: "Penales en guaraní · Jaikuaa", description: `Elegí la camiseta de tu país y pateale al Jai arquero. Solo o en duelo. ${FREE}` },
  "/juegos/consultorio": { title: "Consultorio de Jai · Jaikuaa", description: `Atendé pacientes que hablan guaraní, con voces de hablantes paraguayos. ${FREE}` },
  "/juegos/karaoke": { title: "Purahéi Karaoke en guaraní · Jaikuaa", description: `Cantá en guaraní con arpa paraguaya y compartí tu canción. ${FREE}` },
  "/juegos/tembiu": { title: "Tembi'u Paraguái · Jaikuaa", description: `Armá los platos típicos del Paraguay con sus ingredientes en guaraní. ${FREE}` },
  "/juegos/chacra": { title: "Jai en la chacra · Jaikuaa", description: `Sos técnico de campo: entendé lo que necesita cada productor en guaraní. ${FREE}` },
  "/juegos/taanga": { title: "Ta'anga · Claqueta de Jai · Jaikuaa", description: `Sé guionista: completá el diálogo de cada escena en guaraní. ${FREE}` },
  "/juegos/tekojoja": { title: "Tekojoja · Juzgado de Paz · Jaikuaa", description: `Resolvé casos y aprendé términos jurídicos en guaraní. ${FREE}` },
  "/juegos/nee-rape": { title: "Ñe'ẽ Rape: desafío a distancia · Jaikuaa", description: `Te desafiaron en guaraní: cada uno juega desde su celular. ${FREE}` },
  "/juegos/ventanilla": { title: "Ventanilla de Jai · Jaikuaa", description: `Atendé al público en guaraní, como en un banco o una oficina. ${FREE}` },
  "/juegos/palabra-del-dia": { title: "Palabra del día en guaraní · Jaikuaa", description: `Escuchala con voz real y elegí su significado. ${FREE}` },
  "/pronunciar": { title: "Pronunciá en guaraní · Jaikuaa", description: `Escuchá la voz de un hablante paraguayo, grabate y compará. ${FREE}` },
  "/respaldos": { title: "Respaldos de Jaikuaa", description: "Declaraciones del Senado, de Diputados y de la Secretaría de Políticas Lingüísticas." },
};

/** Juegos con imagen propia para la vista previa (public/og/<juego>.jpg). */
const CON_IMAGEN = new Set([
  "penales", "consultorio", "karaoke", "tembiu", "chacra", "taanga", "tekojoja", "nee-rape",
  "duelo", "trivia-duelo", "ahorcado", "sopa-de-letras", "memoria", "palabra-del-dia", "ventanilla",
]);

export function shareMetaFor(pathname: string): ShareMeta {
  const p = pathname.replace(/\/+$/, "") || "/";
  const m = BY_PATH[p] ?? DEFAULT;
  const juego = p.startsWith("/juegos/") ? p.slice("/juegos/".length) : "";
  return CON_IMAGEN.has(juego) ? { ...m, image: `https://www.jaikuaa.com/og/${juego}.jpg` } : m;
}
