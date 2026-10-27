import { describe, expect, it } from "vitest";
import { duracionPista, masFuerte, plucksFor } from "./karaoke-arpa";

describe("karaoke: pista del arpa", () => {
  const chords = [
    [220, 277, 330],
    [196, 247, 294],
  ];

  it("toca cada pulso con su acorde, igual que el arpa en vivo", () => {
    const p = plucksFor(chords, 4, 0.5);
    // 3 cuerdas + bajo + agudo por pulso
    expect(p).toHaveLength(4 * 5);
    // pulsos 0 y 1 → primer acorde; 2 y 3 → segundo
    expect(p.filter((x) => x.t >= 1 && x.t < 1.2).map((x) => x.f)).toContain(196);
    expect(p[0]).toEqual({ f: 220, t: 0, vol: 0.07 });
    expect(Math.max(...p.map((x) => x.t))).toBeLessThan(duracionPista(4, 0.5));
  });

  it("sin acordes no toca nada", () => {
    expect(plucksFor([], 8, 0.5)).toEqual([]);
  });

  it("sube el volumen sin pasarse de 1", () => {
    const x = new Float32Array([0.05, -0.1, 0.02, 0]);
    const y = masFuerte(x);
    const peak = Math.max(...Array.from(y, Math.abs));
    expect(peak).toBeGreaterThan(0.8);
    expect(peak).toBeLessThanOrEqual(1);
    expect(masFuerte(new Float32Array(3))).toEqual(new Float32Array(3));
  });
});
