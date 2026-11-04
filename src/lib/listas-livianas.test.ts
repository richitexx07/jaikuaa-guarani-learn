import { describe, expect, it } from "vitest";
import { JUEGO_IDS, TRIVIA_CATEGORIAS } from "./listas-livianas";
import { TRIVIA_ORDER } from "./trivia";
import { JUEGOS_EDITOR } from "./juego-textos";

describe("listas livianas", () => {
  it("las categorías de trivia coinciden con las originales", () => {
    expect([...TRIVIA_CATEGORIAS]).toEqual([...TRIVIA_ORDER]);
  });
  it("los juegos del editor coinciden con los originales", () => {
    expect([...JUEGO_IDS].sort()).toEqual(JUEGOS_EDITOR.map((j) => j.id).sort());
  });
});
