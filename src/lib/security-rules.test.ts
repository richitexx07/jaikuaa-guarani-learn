import { describe, expect, it } from "vitest";
import { csvCell } from "./csv-safe";
import { checkLessonOrder } from "./progress.functions";

describe("planillas seguras", () => {
  it("neutraliza un nombre que empieza con fórmula", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
  });
  it("deja intactos los nombres normales", () => {
    expect(csvCell("Ana")).toBe('"Ana"');
  });
});

describe("lecciones de guaraní en orden", () => {
  const pub = new Set([1, 2, 3]);
  const now = Date.parse("2026-10-27T12:00:00Z");
  it("no deja saltar a la lección 3 sin la 2", () => {
    expect(checkLessonOrder(3, pub, [{ n: 1, at: "2026-10-27T10:00:00Z" }], now)).toBe("Primero completá la lección anterior");
  });
  it("rechaza una lección que no existe", () => {
    expect(checkLessonOrder(9, pub, [], now)).toBe("Lección no válida");
  });
  it("rechaza dos lecciones nuevas en menos de 60 segundos", () => {
    expect(checkLessonOrder(2, pub, [{ n: 1, at: "2026-10-27T11:59:30Z" }], now)).toBe("Demasiado rápido");
  });
  it("permite la siguiente lección en orden y con tiempo", () => {
    expect(checkLessonOrder(2, pub, [{ n: 1, at: "2026-10-27T11:50:00Z" }], now)).toBeNull();
  });
});
