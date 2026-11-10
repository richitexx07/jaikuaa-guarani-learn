import { describe, expect, it } from "vitest";
import { amague, combaDe, reboteDe } from "./physics";
import { esManotazo } from "./elegir-estirada";

describe("realismo de Penales", () => {
  it("la comba abre hacia afuera en tiros cruzados y es nula al centro", () => {
    expect(Math.abs(combaDe({ x: 400, y: 200 }))).toBe(0);
    expect(combaDe({ x: 650, y: 200 })).toBeLessThan(0);
    expect(combaDe({ x: 150, y: 200 })).toBeGreaterThan(0);
  });
  it("el amague nunca hunde al arquero bajo el piso", () => {
    for (let t = 0; t < 5000; t += 37) expect(amague(t, false).y).toBeLessThanOrEqual(0);
  });
  it("el rebote en el palo vuelve hacia la cancha", () => {
    const fin = reboteDe({ x: 160, y: 200 }, 1);
    expect(fin.x).toBeGreaterThan(160);
    expect(fin.y).toBeGreaterThan(200);
  });
  it("manotazo solo si es rápido y largo", () => {
    expect(esManotazo({ x: 50, y: 40 }, { x: 90, y: 40 }, 150)).toBe(true);
    expect(esManotazo({ x: 50, y: 40 }, { x: 90, y: 40 }, 600)).toBe(false);
    expect(esManotazo({ x: 50, y: 40 }, { x: 55, y: 40 }, 100)).toBe(false);
  });
});
