import { describe, expect, it } from "vitest";
import { sumarClasico, textoCargada } from "./hinchada";

describe("clásico de penales", () => {
  it("suma victoria, derrota y empate", () => {
    const c = { yo: 0, rival: 0, empates: 0 };
    expect(sumarClasico(c, 4, 2)).toEqual({ yo: 1, rival: 0, empates: 0 });
    expect(sumarClasico(c, 1, 3)).toEqual({ yo: 0, rival: 1, empates: 0 });
    expect(sumarClasico(c, 2, 2)).toEqual({ yo: 0, rival: 0, empates: 1 });
  });
  it("la cargada lleva el marcador y el enlace", () => {
    expect(textoCargada("Richard", "Ana", 4, 2, "https://x")).toContain("Le gané 4 a 2 a Ana");
    expect(textoCargada("Richard", "Ana", 4, 2, "https://x")).toContain("https://x");
  });
});
