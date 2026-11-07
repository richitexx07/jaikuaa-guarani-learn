import { describe, expect, it } from "vitest";
import { canto, fondoDe, mezclar, remuestrear } from "./microfono";

describe("karaoke: cantar con micrófono", () => {
  it("el ruido de fondo es la mediana de lo medido con el arpa sola", () => {
    expect(fondoDe([0.01, 0.5, 0.02])).toBe(0.02);
    expect(fondoDe([])).toBeGreaterThan(0);
  });

  it("cuenta como cantado si hay voz en al menos un tercio del verso", () => {
    const fondo = 0.02;
    expect(canto([0.1, 0.1, 0.01, 0.01, 0.01, 0.01], fondo)).toBe(true);
    expect(canto([0.1, 0.01, 0.01, 0.01, 0.01, 0.01], fondo)).toBe(false);
    // Con el arpa fuerte de fondo, hace falta cantar más fuerte que el arpa.
    expect(canto([0.1, 0.1, 0.1], 0.08)).toBe(false);
    expect(canto([0.2], fondo)).toBe(false); // muy pocas mediciones
  });

  it("cambia la frecuencia de muestreo manteniendo la duración", () => {
    const x = new Float32Array(48000).fill(0.5);
    const y = remuestrear(x, 48000, 22050);
    expect(y.length).toBe(22050);
    expect(y[100]).toBeCloseTo(0.5);
  });

  it("mezcla la voz con la música en su lugar y sin pasarse de 1", () => {
    const sr = 100;
    const musica = new Float32Array(300).fill(0.4);
    const voz = new Float32Array(50).fill(0.9);
    const m = mezclar(musica, voz, 1, sr);
    expect(m.length).toBe(300);
    expect(m[50]).toBeCloseTo(0.2); // antes de la voz: solo música (a la mitad)
    expect(m[120]!).toBeGreaterThan(0.5); // con voz
    expect(Math.max(...Array.from(m, Math.abs))).toBeLessThanOrEqual(1);
    // Grabación que empezó antes que la música: se recorta el principio.
    const n = mezclar(musica, voz, -0.2, sr);
    expect(n[10]!).toBeGreaterThan(0.5);
    expect(n[40]).toBeCloseTo(0.2);
  });
});
