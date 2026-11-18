import { describe, expect, it } from "vitest";
import { esLetraSuelta } from "./games.functions";

describe("palabra del día", () => {
  it("nunca elige una letra suelta del abecedario", () => {
    expect(esLetraSuelta({ es: "Letra 3 del Achegety" })).toBe(true);
    expect(esLetraSuelta({ es: "Comida" })).toBe(false);
  });
});
