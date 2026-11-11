import { describe, expect, it } from "vitest";
import { analyzeLocalMotor } from "./motor-local";
import { armarFuentes } from "./fuentes-motor";
import { evaluateGate } from "@/lib/deterministic-gate";
import spl from "./data/spl-diccionario-alg.json";
import libro from "./data/gramatica-alg-2020-formas.json";

// Fuentes hechas por personas: Diccionario de la Academia (SPL) y Gramática ALG 2020.
const F = armarFuentes({
  diccionario: (spl as unknown as { entradas: [string, string, string, number, string[]?][] }).entradas,
  gramatica: (libro as unknown as { forms: Record<string, number[]> }).forms,
});
const acepta = (w: string, f = F) => evaluateGate(w, { status: "ok", response: analyzeLocalMotor(w, f) }).accepted;

describe("motor de Jaikuaa con fuentes", () => {
  it("nunca reconoce letras al azar ni palabras de otro idioma que no estén en las fuentes", () => {
    for (const w of ["xqzkkw", "asdfgh", "computadora", "blorp", "kkkk", "qwerty", "plim", "trabajo", "perro"]) expect(acepta(w), w).toBe(false);
  });

  it("reconoce formas impresas en la Gramática (págs. citadas en el contrato del motor)", () => {
    expect(acepta("ndojapói")).toBe(true);
    expect(acepta("amboguata")).toBe(true);
  });

  it("sin fuentes no reconoce nada salvo las clases cerradas de la Gramática", () => {
    const sin = { conoce: () => null };
    expect(acepta("asdfgh", sin)).toBe(false);
    expect(acepta("amboguata", sin)).toBe(false);
  });

  it("el vocabulario de Jaikuaa cuenta como fuente, pero los afijos sueltos no son raíces", () => {
    const f = armarFuentes({ vocabulario: ["Jaha", "-pe", "A-"] });
    expect(f.conoce("jaha")).toBe("vocabulario-jaikuaa");
    expect(f.conoce("pe")).toBeNull();
    const r = evaluateGate("Jaha", { status: "ok", response: analyzeLocalMotor("Jaha", f) });
    expect(r).toEqual({ accepted: true, fuente: "vocabulario-jaikuaa" });
  });
});
