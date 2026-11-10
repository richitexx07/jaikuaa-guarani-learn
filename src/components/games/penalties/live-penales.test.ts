import { describe, expect, it } from "vitest";
import { armarTanda } from "./live-penales";

const palabras = Array.from({ length: 30 }, (_, i) => ({ gn: `p${i}`, es: `s${i}`, hasAudio: i % 2 === 0 }));

describe("penales a distancia", () => {
  it("arma la tanda con la respuesta entre tres opciones distintas", () => {
    const m = armarTanda(palabras as never, "a", "b");
    expect(m.words.length).toBe(16);
    m.words.forEach((w, i) => {
      expect(m.options[i]).toContain(w.gn);
      expect(new Set(m.options[i]).size).toBe(3);
    });
    expect(m.hostUid).toBe("a");
    expect(m.guestUid).toBe("b");
  });
});

describe("sorteo con moneda", () => {
  it("el ganador patea primero y después se alternan", async () => {
    const { pateadorEn } = await import("./live-penales");
    expect([0, 1, 2, 3].map((t) => pateadorEn("guest", t))).toEqual(["guest", "host", "guest", "host"]);
    expect([0, 1, 2, 3].map((t) => pateadorEn("host", t))).toEqual(["host", "guest", "host", "guest"]);
  });
  it("la tanda trae quién ganó la moneda", () => {
    const m = armarTanda(palabras as never, "a", "b");
    expect(["host", "guest"]).toContain(m.primero);
  });
});
