import type { TriviaCategoryId } from "./trivia";
import vocabulario from "@/assets/trivia/trivia-vocabulario.webp";
import mitos from "@/assets/trivia/trivia-mitos.webp";
import cultura from "@/assets/trivia/trivia-cultura.webp";
import gastronomia from "@/assets/trivia/trivia-gastronomia.webp";
import deportes from "@/assets/trivia/trivia-deportes.webp";
import musica from "@/assets/trivia/trivia-musica.webp";
import historia from "@/assets/trivia/trivia-historia.webp";
import naturaleza from "@/assets/trivia/trivia-naturaleza.webp";

/** Ícono 3D de cada categoría de Preguntados (sin texto dentro de la imagen). */
export const TRIVIA_ART: Record<TriviaCategoryId, string> = {
  vocabulario,
  mitos,
  cultura,
  gastronomia,
  deportes,
  musica,
  historia,
  naturaleza,
};
