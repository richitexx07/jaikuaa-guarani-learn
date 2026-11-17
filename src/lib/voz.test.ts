import { describe, expect, it } from "vitest";
import { aBarras, cortesLimpios, detectorDeFin, picos, recortarSilencio, segundos, wavDe } from "./voz";

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
    expect(d.tramo()).toEqual({ inicio: 600, fin: 1200 });
  });

  it("no corta en el puso (la pausa cortita de «Mba'éichapa»)", () => {
    const d = detectorDeFin();
    d.medir(0, 100);
    expect(d.medir(0.3, 500)).toBe("hablando"); // «Mba»
    expect(d.medir(0, 600)).toBe("hablando"); // puso: silencio de unos 100 ms
    expect(d.medir(0.3, 700)).toBe("hablando"); // «éichapa»
    expect(d.medir(0, 1000)).toBe("hablando");
  });

  it("con ruido de fondo pide una voz más fuerte que el ruido", () => {
    const d = detectorDeFin();
    // Escuela con ruido: 0,05 de fondo durante la medición.
    d.medir(0.05, 50);
    d.medir(0.05, 200);
    expect(d.medir(0.06, 400)).toBe("esperando"); // sigue siendo ruido
    expect(d.medir(0.3, 600)).toBe("hablando"); // voz
  });

  it("una palabra de una sílaba cuenta; un clic, no", () => {
    const d = detectorDeFin();
    expect(d.medir(0.4, 500)).toBe("hablando");
    expect(d.medir(0.4, 680)).toBe("hablando"); // palabra de una sílaba: menos de 200 ms
    expect(d.medir(0, 1600)).toBe("fin");
    const clic = detectorDeFin();
    expect(clic.medir(0.9, 500)).toBe("hablando");
    expect(clic.medir(0, 1450)).toBe("esperando");
  });

  it("avisa si nadie habló", () => {
    const d = detectorDeFin();
    expect(d.medir(0, 1500)).toBe("esperando");
    expect(d.medir(0, 4100)).toBe("sin-voz");
  });

  it("nunca graba más del tope", () => {
    const d = detectorDeFin({ maxMs: 6000 });
    expect(d.medir(0.5, 300)).toBe("hablando");
    expect(d.medir(0.5, 6000)).toBe("fin");
  });

  it("recorta la grabación a la voz, con un margen para la primera consonante y el final suave", () => {
    expect(cortesLimpios(4, { inicio: 1000, fin: 1800 })).toEqual({ desde: 0.85, hasta: 2.1 });
    expect(cortesLimpios(4, null)).toEqual({ desde: 0, hasta: 4 });
    expect(cortesLimpios(1.5, { inicio: 100, fin: 1400 })).toEqual({ desde: 0, hasta: 1.5 });
  });

  it("arma un WAV válido", () => {
    const w = wavDe(new Float32Array([0, 0.5, -0.5, 1]), 16000);
    const v = new DataView(w);
    expect(w.byteLength).toBe(44 + 8);
    expect(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3))).toBe("RIFF");
    expect(v.getUint32(24, true)).toBe(16000);
    expect(v.getInt16(44 + 6, true)).toBe(0x7fff);
  });
});
