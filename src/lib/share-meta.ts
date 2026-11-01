/**
 * Vista previa de los enlaces que se comparten (WhatsApp, Facebook…).
 * Los juegos se arman en el celular (sin servidor), así que su título e imagen salen de acá,
 * desde la raíz: si no, el enlace de un juego aparecía pelado, sin foto ni texto.
 */
export type ShareMeta = { title: string; description: string };

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
  "/juegos/penales": { title: "Penales en guaraní · Jaikuaa", description: `Respondé bien y pateá al arco. Solo o en duelo. ${FREE}` },
  "/respaldos": { title: "Respaldos de Jaikuaa", description: "Declaraciones del Senado, de Diputados y de la Secretaría de Políticas Lingüísticas." },
};

export function shareMetaFor(pathname: string): ShareMeta {
  const p = pathname.replace(/\/+$/, "") || "/";
  return BY_PATH[p] ?? DEFAULT;
}
