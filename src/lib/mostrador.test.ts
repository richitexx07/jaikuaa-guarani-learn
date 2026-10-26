import { describe, expect, it } from "vitest";
import { agruparPorSituacion, faltantes, isRubro, type Frase } from "./mostrador";

const base = (o: Partial<Frase>): Frase => ({
  id: o.id ?? "x",
  rubro: "salud",
  situacion: "Recepción",
  tipo: "decir",
  es: "Hola",
  gn: null,
  hasAudio: false,
  orden: 0,
  status: "pendiente",
  ...o,
});

describe("mostrador", () => {
  it("agrupa por situación con lo que se dice primero y las respuestas al final", () => {
    const g = agruparPorSituacion([
      base({ id: "r", situacion: "Respuestas", tipo: "escuchar", orden: 1 }),
      base({ id: "b", situacion: "Revisión", orden: 30 }),
      base({ id: "a", situacion: "Recepción", orden: 10 }),
      base({ id: "a2", situacion: "Recepción", orden: 11 }),
    ]);
    expect(g.map((x) => x.nombre)).toEqual(["Recepción", "Revisión", "Respuestas"]);
    expect(g[0].frases.map((f) => f.id)).toEqual(["a", "a2"]);
    expect(g[2].tipo).toBe("escuchar");
  });

  it("dice qué le falta a una frase para publicarse", () => {
    expect(faltantes({ gn: null, hasAudio: false })).toEqual(["guaraní", "grabación"]);
    expect(faltantes({ gn: "x", hasAudio: false })).toEqual(["grabación"]);
    expect(faltantes({ gn: "x", hasAudio: true })).toEqual([]);
  });

  it("acepta solo los rubros conocidos", () => {
    expect(isRubro("salud")).toBe(true);
    expect(isRubro("atencion")).toBe(true);
    expect(isRubro("otro")).toBe(false);
  });
});
