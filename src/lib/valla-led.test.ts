import { describe, expect, it } from "vitest";
import { tandaDeValla, vallaEn } from "./valla-led";
import { demoLedText, limpiarMarcas } from "./demo-brand";

describe("valla LED rotativa", () => {
  it("rota hasta 5 marcas y después los mensajes de Jaikuaa", () => {
    const t = tandaDeValla(["A", "B", "C", "D", "E", "F"].join("\n"));
    expect(t.slice(0, 5)).toEqual(["A", "B", "C", "D", "E"]);
    expect(t).toHaveLength(7);
  });
  it("cada marca dura 7 segundos", () => {
    const txt = "A\nB\nC";
    expect(vallaEn(txt, 0).texto).toBe("A");
    expect(vallaEn(txt, 6999).texto).toBe("A");
    expect(vallaEn(txt, 7000).texto).toBe("B");
    expect(vallaEn(txt, 14000).texto).toBe("C");
  });
  it("la demo acepta como máximo 5 marcas con nombre", () => {
    const l = limpiarMarcas([1, 2, 3, 4, 5, 6].map((n) => ({ name: `M${n}`, slogan: "" })).concat({ name: " ", slogan: "x" }));
    expect(l).toHaveLength(5);
    expect(demoLedText(l.slice(0, 2)).split("\n")).toHaveLength(2);
  });
});
