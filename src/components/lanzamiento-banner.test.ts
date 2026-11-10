import { describe, expect, it } from "vitest";
import { diasParaLanzamiento, LANZAMIENTO } from "./lanzamiento-banner";

// Hora de Paraguay = UTC−3
const py = (d: number, h = 12) => Date.UTC(2026, 10, d, h + 3, 0, 0);
const fecha = Date.UTC(2026, 11, 2, 3, 0, 0); // ejemplo: 2/12/2026

describe("franja del lanzamiento", () => {
  it("sin fecha confirmada no hay cuenta regresiva", () => {
    expect(LANZAMIENTO).toBeNull();
    expect(diasParaLanzamiento(py(10))).toBeNull();
  });
  it("con fecha cuenta los días, dice hoy y luego desaparece", () => {
    expect(diasParaLanzamiento(py(30), fecha)).toBe(2);
    expect(diasParaLanzamiento(Date.UTC(2026, 11, 2, 20), fecha)).toBe(0);
    expect(diasParaLanzamiento(Date.UTC(2026, 11, 3, 4), fecha)).toBeLessThan(0);
  });
});
