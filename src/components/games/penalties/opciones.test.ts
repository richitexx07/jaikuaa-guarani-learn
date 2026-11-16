import { describe, expect, it } from "vitest";
import { opcionesPenal } from "./opciones";
import type { GameWord } from "@/lib/games.functions";

const w = (gn: string, es: string): GameWord => ({ gn, es } as GameWord);

describe("opciones de un penal", () => {
  it("la palabra que suena está entre las tres opciones", () => {
    const o = opcionesPenal(w("Oga", "Cabeza"), [w("Oga", "Cabeza"), w("Tepy", "Fiebre"), w("Po", "Mano"), w("Py", "Pie")], 7, 3);
    expect(o.map((x) => x.gn)).toContain("Oga");
    expect(o.length).toBe(3);
  });
  it("un sinónimo traducido no entra como distractor: las dos serían correctas", () => {
    // «Cabeza» y «Testa» con la misma traducción aprobada al portugués.
    const o = opcionesPenal(w("Oga", "Cabeça"), [w("Oga", "Cabeça"), w("Akã", "Cabeça"), w("Po", "Mano"), w("Py", "Pie")], 7, 3);
    expect(o.map((x) => x.gn)).not.toContain("Akã");
    expect(o.map((x) => x.gn)).toContain("Oga");
  });
});
