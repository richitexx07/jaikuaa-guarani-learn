import { describe, expect, it } from "vitest";
import { muestraDelDia } from "./corpus-guard";

const lista = Array.from({ length: 500 }, (_, i) => `p${i}`);

describe("muestraDelDia", () => {
  it("entrega solo una porción, sin repetidas", () => {
    const m = muestraDelDia(lista, 60, "2026-11-16:1.2.3.4");
    expect(m).toHaveLength(60);
    expect(new Set(m).size).toBe(60);
    for (const x of m) expect(lista).toContain(x);
  });

  it("pedir de nuevo el mismo día da las mismas palabras (repetir no sirve para juntar el corpus)", () => {
    const a = muestraDelDia(lista, 60, "2026-11-16:1.2.3.4");
    for (let i = 0; i < 20; i++) expect(muestraDelDia(lista, 60, "2026-11-16:1.2.3.4")).toEqual(a);
  });

  it("otro día cambia la porción (el juego no se vuelve aburrido)", () => {
    const a = muestraDelDia(lista, 60, "2026-11-16:1.2.3.4");
    const b = muestraDelDia(lista, 60, "2026-11-17:1.2.3.4");
    expect(b).not.toEqual(a);
  });

  it("si hay pocas palabras, entrega todas", () => {
    expect(muestraDelDia(["a", "b"], 60, "x")).toEqual(["a", "b"]);
  });
});
