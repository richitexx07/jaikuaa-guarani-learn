import { describe, expect, it } from "vitest";
import { fallbackBackPath, showsBackButton } from "./back-nav";

describe("botón Volver", () => {
  it("no aparece en portada, panel ni ingreso", () => {
    expect(showsBackButton("/")).toBe(false);
    expect(showsBackButton("/dashboard")).toBe(false);
    expect(showsBackButton("/auth")).toBe(false);
  });
  it("aparece en el laboratorio y en los juegos", () => {
    expect(showsBackButton("/laboratorio")).toBe(true);
    expect(showsBackButton("/juegos/ahorcado")).toBe(true);
  });
  it("sin historial lleva a la sección superior", () => {
    expect(fallbackBackPath("/juegos/ahorcado")).toBe("/juegos");
    expect(fallbackBackPath("/laboratorio")).toBe("/");
  });
});
