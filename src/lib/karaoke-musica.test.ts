import { describe, expect, it } from "vitest";
import { aplausos, duracionMusica, notasDe, ritmoDe, sintetizar, SR_MUSICA } from "./karaoke-musica";

const chords = [
  [196, 247, 294],
  [262, 330, 392],
];

describe("karaoke: música de arpa, guitarra y bajo", () => {
  it("reconoce el ritmo por el estilo de la canción", () => {
    expect(ritmoDe("Guarania suave")).toBe("guarania");
    expect(ritmoDe("Galopa")).toBe("galopa");
    expect(ritmoDe("Polca alegre")).toBe("polca");
    expect(ritmoDe("")).toBe("polca");
  });

  it("toca algo en cada pulso y termina con un acorde", () => {
    for (const r of ["polca", "guarania", "galopa"] as const) {
      const n = notasDe(chords, 8, 0.5, r);
      for (let b = 0; b < 8; b++) expect(n.some((x) => x.t >= b * 0.5 && x.t < (b + 1) * 0.5)).toBe(true);
      expect(n.some((x) => x.t >= 8 * 0.5)).toBe(true);
      expect(n.every((x) => x.f > 0 && x.vol > 0)).toBe(true);
    }
    expect(notasDe([], 8, 0.5, "polca")).toEqual([]);
  });

  it("la pista dura lo que la canción, suena y nunca se pasa de 1", () => {
    const x = sintetizar(chords, 6, 0.5, "polca");
    expect(x.length).toBe(Math.ceil(duracionMusica(6, 0.5) * SR_MUSICA));
    let pico = 0, energia = 0;
    for (const v of x) { pico = Math.max(pico, Math.abs(v)); energia += v * v; }
    expect(pico).toBeLessThanOrEqual(1);
    expect(pico).toBeGreaterThan(0.5);
    expect(Math.sqrt(energia / x.length)).toBeGreaterThan(0.05);
    // La misma canción suena siempre igual.
    expect(sintetizar(chords, 6, 0.5, "polca")).toEqual(x);
  });

  it("los aplausos suenan y se apagan al final", () => {
    const a = aplausos(1);
    expect(Math.max(...Array.from(a, Math.abs))).toBeGreaterThan(0.3);
    expect(Math.abs(a[a.length - 1]!)).toBeLessThan(0.01);
  });
});
