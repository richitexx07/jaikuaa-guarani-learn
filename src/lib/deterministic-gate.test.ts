import { describe, expect, it } from "vitest";
import { evaluateGate } from "@/lib/deterministic-gate";
import type { MotorResponse, MotorToken } from "@/lib/morph/motor-contract";

// Datos abstractos de prueba: no son palabras guaraníes ni reglas lingüísticas.
const reading = { raiz: "X", lema: null, categoria: null, persona: null, negacion: false, prefijos: [], sufijos: [], analisis_crudo: "X+?", rango: 1, peso: null, paginas: [], procedencia: "hfst" };
const tok = (estado: MotorToken["estado"], lecturas = [reading]): MotorToken => ({ superficie: "X", normalizada: "X", lecturas, seleccion: null, estado, metodo: null });
const ok = (tokens: MotorToken[]) => ({ status: "ok" as const, response: { version_contrato: "1.0", motor: { nombre: "t", version: "0", transductor: null }, tokens } as MotorResponse });

describe("barrera determinista", () => {
  it("bloquea si el motor no está conectado", () => expect(evaluateGate("X", { status: "apagado" }).accepted).toBe(false));
  it("bloquea si el motor falla (HTTP o forma)", () => expect(evaluateGate("X", { status: "error", message: "HTTP 500" }).accepted).toBe(false));
  it("bloquea con tokens vacíos", () => expect(evaluateGate("X", ok([])).accepted).toBe(false));
  it("bloquea sin_analisis", () => expect(evaluateGate("X", ok([tok("sin_analisis", [])])).accepted).toBe(false));
  it("bloquea lecturas ambiguas sin resolver", () => expect(evaluateGate("X", ok([tok("sin_resolver")])).accepted).toBe(false));
  it("bloquea texto vacío aunque el motor acepte", () => expect(evaluateGate("   ", ok([tok("una_lectura")])).accepted).toBe(false));
  it("bloquea si un solo token de varios no es aceptado", () => expect(evaluateGate("X Y", ok([tok("resuelta"), tok("sin_analisis", [])])).accepted).toBe(false));
  it("acepta solo con aceptación explícita en todos los tokens", () => expect(evaluateGate("X", ok([tok("una_lectura"), tok("resuelta")])).accepted).toBe(true));
});
