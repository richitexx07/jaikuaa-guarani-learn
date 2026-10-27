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
