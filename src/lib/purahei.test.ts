import { describe, expect, it } from "vitest";
import {
  cancionKaraoke, enlaceWhatsapp, escribirGlosario, escribirVersos, faltaParaPublicar, leerEnlaces, leerGlosario,
  leerVersos, marcarGlosario, normalizarWhatsapp, palabrasDe, slugDe,
} from "@/lib/purahei";

// Textos de prueba sin guaraní: la letra real la cargan los docentes.
describe("Purahéi Jaikuaa: letra y glosario", () => {
  it("lee y escribe versos «original | castellano»", () => {
    const v = leerVersos("uno dos tres | one two three\n\ncuatro cinco\n");
    expect(v).toEqual([{ gn: "uno dos tres", es: "one two three" }, { gn: "cuatro cinco", es: "" }]);
    expect(leerVersos(escribirVersos(v))).toEqual(v);
  });
  it("el glosario exige término y nota", () => {
    const g = leerGlosario("alfa | primera letra\nsin nota\nbeta|segunda");
    expect(g).toEqual([{ termino: "alfa", nota: "primera letra" }, { termino: "beta", nota: "segunda" }]);
    expect(leerGlosario(escribirGlosario(g))).toEqual(g);
  });
  it("marca los términos del glosario solo como palabras enteras", () => {
    const g = [{ termino: "sol", nota: "estrella" }];
    const partes = marcarGlosario("El Sol y el solcito", g);
    expect(partes.filter((p) => p.termino).map((p) => p.t)).toEqual(["Sol"]);
    expect(partes.map((p) => p.t).join("")).toBe("El Sol y el solcito");
  });
  it("prefiere el término más largo", () => {
    const g = [{ termino: "luna", nota: "a" }, { termino: "luna llena", nota: "b" }];
    expect(marcarGlosario("la luna llena brilla", g).find((p) => p.termino)?.termino?.nota).toBe("b");
  });
});

describe("Purahéi Jaikuaa: ficha del artista", () => {
  it("WhatsApp: un número local pasa a internacional", () => {
    expect(normalizarWhatsapp("0981 123 456")).toBe("595981123456");
    expect(normalizarWhatsapp("+595 981 123456")).toBe("595981123456");
    expect(normalizarWhatsapp("12")).toBeNull();
    expect(enlaceWhatsapp("595981123456", "Ana")).toMatch(/^https:\/\/wa\.me\/595981123456\?text=/);
  });
  it("solo enlaces seguros (https)", () => {
    expect(leerEnlaces("Videos | https://example.com/x\nhttp://inseguro.com\nhttps://otro.com/a")).toEqual([
      { nombre: "Videos", url: "https://example.com/x" },
      { nombre: "otro.com", url: "https://otro.com/a" },
    ]);
  });
  it("slug sin tildes ni espacios", () => {
    expect(slugDe("Señora Árbol  Dúo")).toBe("senora-arbol-duo");
  });
});

describe("Purahéi Jaikuaa: requisitos y karaoke", () => {
  it("no se publica sin permisos ni revisión", () => {
    const base = { permiso_autor: true, permiso_interprete: true, permiso_productor: true, revisado: true, tieneAudio: true, versos: 4 };
    expect(faltaParaPublicar(base)).toEqual([]);
    expect(faltaParaPublicar({ ...base, revisado: false })).toHaveLength(1);
    expect(faltaParaPublicar({ ...base, tieneAudio: false, permiso_interprete: false, permiso_productor: false })).toEqual([]);
    expect(faltaParaPublicar({ ...base, permiso_productor: false })).toHaveLength(1);
  });
  it("arma la canción del karaoke con los huecos de los docentes", () => {
    const versos = [{ gn: "uno dos, tres", es: "a" }, { gn: "cuatro cinco seis", es: "b" }, { gn: "siete", es: "c" }];
    const s = cancionKaraoke({ id: "x", titulo: "T", estilo: "guarania", versos, karaoke: { bpm: 80, versos: [{ verso: 0, gap: 2, wrong: ["dos", "seis"] }, { verso: 1, gap: 0, wrong: ["uno", "siete"] }] } });
    expect(s?.id).toBe("o:x");
    expect(s?.lines[0]).toEqual({ words: ["uno", "dos", "tres"], es: "a", gap: 2, wrong: ["dos", "seis"] });
    expect(palabrasDe("¡hola, mundo!")).toEqual(["hola", "mundo"]);
    // Menos de dos versos válidos: no hay karaoke.
    expect(cancionKaraoke({ id: "x", titulo: "T", estilo: "polca", versos, karaoke: { bpm: 80, versos: [{ verso: 0, gap: 9, wrong: ["a", "b"] }] } })).toBeNull();
  });
});
