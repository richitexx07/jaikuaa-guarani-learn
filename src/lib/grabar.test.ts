import { describe, expect, it } from "vitest";
import { duracion, elegirFormato, mimeBase } from "./grabar";

describe("grabación de voz", () => {
  it("prefiere mp4 con AAC (suena en todos los celulares) y si no, webm", () => {
    expect(elegirFormato(() => true)).toBe("audio/mp4;codecs=mp4a.40.2");
    expect(elegirFormato((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(elegirFormato((t) => t.startsWith("audio/webm"))).toBe("audio/webm;codecs=opus");
    expect(elegirFormato(() => false)).toBe("");
    expect(elegirFormato(() => { throw new Error("viejo"); })).toBe("");
  });

  it("guarda el formato sin los códecs, solo si el depósito lo acepta", () => {
    expect(mimeBase("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(mimeBase("audio/mp4")).toBe("audio/mp4");
    expect(mimeBase("video/mp4")).toBe("audio/mp4");
    expect(mimeBase("audio/ogg; codecs=opus")).toBe("audio/ogg");
    expect(mimeBase("audio/x-flac")).toBeNull();
  });

  it("muestra minutos y segundos", () => {
    expect(duracion(7)).toBe("0:07");
    expect(duracion(92.6)).toBe("1:32");
  });
});
