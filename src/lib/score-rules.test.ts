import { describe, expect, it } from "vitest";
import { allowedXp } from "./progress.functions";
import { puntajeValido } from "./reto.functions";
import { safeSearchTerm } from "./corpus.functions";

describe("reglas de puntajes y puntos", () => {
  it("un juego no da más de 20 puntos por partida", () => {
    expect(allowedXp(999, "game", 0)).toBe(20);
  });
  it("los juegos no dan más de 200 puntos por día", () => {
    expect(allowedXp(20, "game", 190)).toBe(10);
    expect(allowedXp(20, "game", 200)).toBe(0);
  });
  it("un reto rechaza un puntaje mayor al máximo del juego", () => {
    expect(puntajeValido(101, 100, false)).toBe(false);
    expect(puntajeValido(100, 100, false)).toBe(true);
  });
  it("en retos donde gana el menor, cero no es válido", () => {
    expect(puntajeValido(0, 0, true)).toBe(false);
  });
  it("la búsqueda del banco de palabras no puede alterar el filtro", () => {
    expect(safeSearchTerm("a,status.eq.draft")).toBe("a status eq draft");
  });
});
