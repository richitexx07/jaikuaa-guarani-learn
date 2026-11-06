import { describe, expect, it } from "vitest";
import { diasParaLanzamiento } from "./lanzamiento-banner";

// Hora de Paraguay = UTC−3
const py = (d: number, h = 12) => Date.UTC(2026, 10, d, h + 3, 0, 0);

describe("cuenta regresiva del lanzamiento (23/11/2026)", () => {
  it("cuenta los días que faltan", () => {
    expect(diasParaLanzamiento(py(6))).toBe(17);
    expect(diasParaLanzamiento(py(22))).toBe(1);
  });
  it("el 23 dice hoy y el 24 ya no se muestra", () => {
    expect(diasParaLanzamiento(py(23, 0))).toBe(0);
    expect(diasParaLanzamiento(py(23, 23))).toBe(0);
    expect(diasParaLanzamiento(py(24, 1))).toBeLessThan(0);
  });
});
