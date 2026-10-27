import { describe, expect, it } from "vitest";
import { decodeReto, encodeReto, leccionDeReto, orderedBy, puntajeTexto, retoMensaje, retoUrl, shufflerFor, veredicto, type Reto } from "./reto";

describe("reto por WhatsApp", () => {
  const r: Reto = { j: "penales", s: 123456, p: 4, t: 5, n: "Ña Rosa", x: "3" };

  it("el enlace se arma y se lee igual, con tildes y eñes", () => {
    expect(decodeReto(encodeReto(r))).toEqual(r);
  });

  it("un enlace roto o tramposo no rompe el juego", () => {
    expect(decodeReto("no-es-un-reto")).toBeNull();
    expect(decodeReto(null)).toBeNull();
    expect(decodeReto(encodeReto({ ...r, j: "casino" as never }))).toBeNull();
    expect(decodeReto(encodeReto({ ...r, p: -1 }))).toBeNull();
    expect(decodeReto(encodeReto({ ...r, n: "<script>x</script>" }))?.n).not.toContain("<");
  });

  it("la misma semilla da la misma partida en los dos celulares", () => {
    const lista = Array.from({ length: 30 }, (_, i) => `palabra${i}`);
    expect(shufflerFor(99)(lista)).toEqual(shufflerFor(99)(lista));
    expect(shufflerFor(99)(lista)).not.toEqual(shufflerFor(100)(lista));
    expect(shufflerFor(99, 1)(lista)).not.toEqual(shufflerFor(99, 2)(lista));
    // Aunque el servidor mande las palabras en otro orden, ordenadas primero dan lo mismo.
    const al_reves = [...lista].reverse();
    expect(shufflerFor(7)(orderedBy(al_reves, (x) => x))).toEqual(shufflerFor(7)(orderedBy(lista, (x) => x)));
  });

  it("quién ganó, también cuando menos es mejor", () => {
    expect(veredicto(5, { p: 4 })).toBe("gane");
    expect(veredicto(3, { p: 4 })).toBe("perdi");
    expect(veredicto(4, { p: 4 })).toBe("empate");
    expect(veredicto(10, { p: 12, m: 1 })).toBe("gane");
    expect(veredicto(14, { p: 12, m: 1 })).toBe("perdi");
  });

  it("textos y enlaces", () => {
    expect(puntajeTexto({ p: 4, t: 5 })).toBe("4 de 5");
    expect(puntajeTexto({ p: 12, t: 6, u: "intentos" })).toBe("12 intentos");
    expect(retoUrl("https://www.jaikuaa.com", { j: "trivia", s: 1, p: 3, t: 6, n: "Ana", x: "mitos" })).toMatch(/^https:\/\/www\.jaikuaa\.com\/trivia\/mitos\?reto=/);
    expect(retoMensaje(r, "URL")).toContain("Penales");
    expect(leccionDeReto(r)).toBe(3);
    expect(leccionDeReto({ ...r, x: "8:10" })).toBeNull();
  });
});
