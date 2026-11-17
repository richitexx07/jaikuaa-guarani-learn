import { describe, expect, it } from "vitest";
import { corregirExamen, firmarIntento, leerIntento, minSegundosLeccion } from "./intento";

const banco = [
  { prompt: "A", options: ["1", "2"], answer: "1" },
  { prompt: "B", options: ["1", "2"], answer: "2" },
];

describe("comprobantes de intento", () => {
  it("acepta el comprobante del servidor para la misma persona y lección", async () => {
    const tok = await firmarIntento("s", { u: "u1", k: "lesson", r: "guarani:3", t: 1_700_000_000_000 });
    expect(await leerIntento("s", tok, "u1", "lesson", "guarani:3", 1_700_000_100_000)).toBe(1_700_000_000_000);
  });
  it("rechaza el comprobante de otra persona o lección", async () => {
    const tok = await firmarIntento("s", { u: "u1", k: "lesson", r: "guarani:3", t: 1_700_000_000_000 });
    expect(await leerIntento("s", tok, "u2", "lesson", "guarani:3", 1_700_000_100_000)).toBeNull();
    expect(await leerIntento("s", tok, "u1", "lesson", "guarani:4", 1_700_000_100_000)).toBeNull();
  });
  it("rechaza un comprobante inventado", async () => {
    expect(await leerIntento("s", "1700000000000.inventadoinventadoinventado", "u1", "lesson", "guarani:3", 1_700_000_100_000)).toBeNull();
  });
  it("una lección de 10 palabras pide al menos 50 segundos", () => {
    expect(minSegundosLeccion(10)).toBe(50);
  });
});

describe("corrección del examen en el servidor", () => {
  it("cuenta el examen perfecto solo si todas las respuestas son correctas", () => {
    expect(corregirExamen(banco, [{ p: "A", r: "1" }, { p: "B", r: "2" }], 2)).toEqual({ aciertos: 2, total: 2 });
    expect(corregirExamen(banco, [{ p: "A", r: "1" }, { p: "B", r: "1" }], 2)).toEqual({ aciertos: 1, total: 2 });
  });
  it("rechaza preguntas repetidas, inventadas o de menos", () => {
    expect(corregirExamen(banco, [{ p: "A", r: "1" }, { p: "A", r: "1" }], 2)).toBeNull();
    expect(corregirExamen(banco, [{ p: "Z", r: "1" }], 1)).toBeNull();
    expect(corregirExamen(banco, [{ p: "A", r: "1" }], 2)).toBeNull();
  });
});
