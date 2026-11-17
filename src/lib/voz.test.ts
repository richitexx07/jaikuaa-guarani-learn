import { describe, expect, it } from "vitest";
import { aBarras, detectorDeFin, picos, recortarSilencio, segundos } from "./voz";

describe("voz", () => {
  it("resume la señal en barras normalizadas", () => {
    const s = new Float32Array([0, 0.1, 0.5, -1, 0.2, 0.2, 0, 0]);
    const p = picos(s, 4);
    expect(p).toHaveLength(4);
    expect(Math.max(...p)).toBe(1);
    expect(p[3]).toBe(0);
  });

  it("recorta el silencio de las puntas", () => {
    expect(recortarSilencio([0, 0.01, 0.5, 0.9, 0.3, 0.02, 0])).toEqual([0.5, 0.9, 0.3]);
    expect(recortarSilencio([0, 0])).toEqual([]);
  });

  it("estira o achica a la cantidad de barras pedida", () => {
    expect(aBarras([1, 0.5], 4)).toEqual([1, 1, 0.5, 0.5]);
    expect(aBarras([], 4)).toEqual([]);
    expect(segundos(1.24)).toBe("1,2 s");
  });

  it("corta solo cuando la persona terminó de hablar", () => {
    const d = detectorDeFin();
    expect(d.medir(0, 100)).toBe("esperando");
    expect(d.medir(0.3, 600)).toBe("hablando");
    expect(d.medir(0.3, 1200)).toBe("hablando");
    expect(d.medir(0.01, 1800)).toBe("hablando");
    expect(d.medir(0.01, 2150)).toBe("fin");
  });

  it("avisa si nadie habló, y no confunde un golpecito con hablar", () => {
    const d = detectorDeFin();
    expect(d.medir(0.5, 500)).toBe("hablando");
    expect(d.medir(0, 1500)).toBe("esperando");
    expect(d.medir(0, 4100)).toBe("sin-voz");
  });

  it("nunca graba más del tope", () => {
    const d = detectorDeFin({ maxMs: 6000 });
    expect(d.medir(0.5, 300)).toBe("hablando");
    expect(d.medir(0.5, 6000)).toBe("fin");
  });
});
