import { describe, expect, it } from "vitest";
import { marcaEn, esVitrina } from "./vitrina";

const cinco = ["A", "B", "C", "D", "E", "F"].map((name) => ({ name }));
describe("vitrina de marcas", () => {
  it("rota cada 7 segundos", () => {
    expect(marcaEn(cinco, 0)?.marca.name).toBe("A");
    expect(marcaEn(cinco, 7000)?.marca.name).toBe("B");
  });
  it("muestra como máximo 5 marcas", () => {
    expect(marcaEn(cinco, 0)?.total).toBe(5);
    expect(marcaEn(cinco, 5 * 7000)?.marca.name).toBe("A");
  });
  it("sin marcas no muestra nada", () => expect(marcaEn([], 0)).toBeNull());
  it("está en los 5 juegos acordados", () => {
    for (const s of ["karaoke", "tembiu", "trivia-duelo", "chacra", "ventanilla"] as const) expect(esVitrina(s)).toBe(true);
    expect(esVitrina("ahorcado")).toBe(false);
  });
});
