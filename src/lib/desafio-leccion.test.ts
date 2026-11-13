import { describe, expect, it } from "vitest";
import { compararDesafio, decodeDesafio, desafioUrl, encodeDesafio } from "./desafio-leccion";

describe("desafío de lección", () => {
  it("el enlace lleva nombre, puntaje y lección, y se lee igual", () => {
    const raw = encodeDesafio({ n: "Ana María", p: 14, t: 16, l: 1 });
    expect(decodeDesafio(raw)).toEqual({ n: "Ana María", p: 14, t: 16, l: 1 });
    expect(desafioUrl("https://www.jaikuaa.com", "guarani", { n: "Ana", p: 1, t: 2, l: 1 })).toMatch(/^https:\/\/www\.jaikuaa\.com\/curso\/guarani\/leccion\/1\?desafio=/);
  });
  it("un enlace roto o tramposo no se acepta", () => {
    expect(decodeDesafio("basura")).toBeNull();
    expect(decodeDesafio(encodeDesafio({ n: "x", p: 20, t: 10, l: 1 }))).toBeNull();
    expect(decodeDesafio(encodeDesafio({ n: "<b>", p: 1, t: 2, l: 1 }))?.n).toBe("b");
  });
  it("gana quien acertó más en proporción", () => {
    expect(compararDesafio({ p: 15, t: 16 }, { p: 14, t: 16 })).toBe("gane");
    expect(compararDesafio({ p: 10, t: 12 }, { p: 10, t: 10 })).toBe("perdi");
    expect(compararDesafio({ p: 8, t: 8 }, { p: 10, t: 10 })).toBe("empate");
  });
});
