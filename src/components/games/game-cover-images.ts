import type { CoverId } from "./game-covers";
import consultorio from "@/assets/covers/cover-consultorio.webp";
import ventanilla from "@/assets/covers/cover-ventanilla.webp";
import chacra from "@/assets/covers/cover-chacra.webp";
import karaoke from "@/assets/covers/cover-karaoke.webp";
import tembiu from "@/assets/covers/cover-tembiu.webp";
import taanga from "@/assets/covers/cover-taanga.webp";
import tekojoja from "@/assets/covers/cover-tekojoja.webp";
import neeRape from "@/assets/covers/cover-nee-rape.webp";
import penales from "@/assets/covers/cover-penales.webp";
import duelo from "@/assets/covers/cover-duelo.webp";
import triviaDuelo from "@/assets/covers/cover-trivia-duelo.webp";
import ahorcado from "@/assets/covers/cover-ahorcado.webp";
import sopa from "@/assets/covers/cover-sopa-de-letras.webp";
import memoria from "@/assets/covers/cover-memoria.webp";
import palabraDelDia from "@/assets/covers/cover-palabra-del-dia.webp";

/** Portadas ilustradas de cada juego (Jai en escena, sin texto dentro de la imagen). */
export const COVER_IMAGE: Record<CoverId, string> = {
  consultorio,
  ventanilla,
  chacra,
  karaoke,
  tembiu,
  taanga,
  tekojoja,
  "nee-rape": neeRape,
  penales,
  duelo,
  "trivia-duelo": triviaDuelo,
  ahorcado,
  "sopa-de-letras": sopa,
  memoria,
  "palabra-del-dia": palabraDelDia,
};
