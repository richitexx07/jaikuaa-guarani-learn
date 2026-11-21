import { describe, expect, it } from "vitest";
import { esLetraCorrecta, estrellas, letras, resultado } from "./teclea";

describe("Jai Teclea", () => {
  it("g̃ cuenta como una sola letra", () => {
    expect(letras("g\u0303").length).toBe(1);
  });
  it("vocal nasal escrita con tilde combinante equivale a la precompuesta", () => {
    expect(esLetraCorrecta("ã", "a\u0303")).toBe(true);
  });
  it("el apóstrofo curvo del celular vale como puso", () => {
    expect(esLetraCorrecta("'", "’")).toBe(true);
  });
  it("una vocal sin nasal no vale como nasal", () => {
    expect(esLetraCorrecta("ã", "a")).toBe(false);
  });
  it("precisión de 9 aciertos y 1 error es 90%", () => {
    expect(resultado(9, 1, 60000)).toEqual({ lpm: 9, precision: 90 });
  });
  it("95% de precisión da 3 estrellas y 69% ninguna", () => {
    expect(estrellas(95)).toBe(3);
    expect(estrellas(69)).toBe(0);
  });
});
