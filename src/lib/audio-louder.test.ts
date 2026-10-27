import { describe, expect, it } from "vitest";
import { amplify, encodeWav, gainFor, MAX_GAIN, softLimit, TARGET_RMS, voiceRms } from "./audio-louder";

const tono = (amp: number, n = 22050) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin((2 * Math.PI * 220 * i) / 22050));

describe("audio más fuerte", () => {
  it("una grabación baja se sube hasta el nivel común", () => {
    const bajo = tono(0.08);
    const g = gainFor(bajo);
    expect(g).toBeGreaterThan(2);
    expect(voiceRms(amplify(bajo, g))).toBeGreaterThan(TARGET_RMS * 0.85);
  });

  it("una grabación que ya suena bien queda igual", () => {
    expect(gainFor(tono(0.4))).toBe(1);
  });

  it("nunca sube más del tope ni hace sonar el silencio", () => {
    expect(gainFor(tono(0.012))).toBeLessThanOrEqual(MAX_GAIN);
    expect(gainFor(new Float32Array(1000))).toBe(1);
  });

  it("el limitador no deja pasar de 1 ni toca lo normal", () => {
    expect(softLimit(0.5)).toBe(0.5);
    expect(softLimit(3)).toBeLessThanOrEqual(1);
    expect(softLimit(-3)).toBeGreaterThanOrEqual(-1);
    const fuerte = amplify(tono(0.9), 6);
    expect(Math.max(...fuerte.map(Math.abs))).toBeLessThanOrEqual(1);
  });

  it("arma un WAV válido", () => {
    const wav = new DataView(encodeWav(tono(0.2, 100), 22050));
    expect(String.fromCharCode(wav.getUint8(0), wav.getUint8(1), wav.getUint8(2), wav.getUint8(3))).toBe("RIFF");
    expect(wav.getUint32(24, true)).toBe(22050);
    expect(wav.byteLength).toBe(44 + 200);
  });
});
