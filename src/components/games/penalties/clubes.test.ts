import { describe, expect, it } from "vitest";
import { CLUBES, disenoDe, kitSeguro } from "./camisetas";

describe("colores de club", () => {
  it("se pueden elegir sin racha y pintan la camiseta", () => {
    expect(disenoDe(kitSeguro({ pais: "PY", especial: "azulgrana" }))).toBe(CLUBES.azulgrana.diseno);
  });
  it("no usan nombres de clubes reales", () => {
    const nombres = Object.values(CLUBES).map((c) => c.nombre.toLowerCase()).join(" ");
    for (const club of ["olimpia", "cerro", "libertad", "guaraní", "nacional", "sol de américa"]) expect(nombres).not.toContain(club);
  });
});
