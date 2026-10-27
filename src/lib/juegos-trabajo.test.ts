import { describe, expect, it } from "vitest";
import { armarVisitas, CASOS_CHACRA, vocabAgro, VISITAS_POR_DIA } from "./chacra";
import { armarTurnoVentanilla, CLIENTES_POR_TURNO, hayParaJugar } from "./ventanilla";
import type { Frase } from "./mostrador";

describe("Jai en la chacra", () => {
  it("cada caso usa una palabra que existe en el vocabulario Agro-Rural", () => {
    const vocab = new Set(vocabAgro().map((v) => v.gn));
    for (const c of CASOS_CHACRA) expect(vocab.has(c.palabra)).toBe(true);
  });
  it("arma 5 visitas con 4 opciones distintas y la misma partida con la misma semilla", () => {
    const a = armarVisitas(123);
    expect(a.length).toBe(VISITAS_POR_DIA);
    for (const v of a) {
      expect(v.opciones).toContain(v.caso.palabra);
      expect(new Set(v.opciones).size).toBe(4);
    }
    expect(armarVisitas(123)).toEqual(a);
  });
});

const f = (id: string, tipo: "decir" | "escuchar", es: string, gn: string | null): Frase =>
  ({ id, rubro: "atencion", situacion: "x", tipo, es, gn, hasAudio: false, orden: 0, status: "publicada" }) as unknown as Frase;

describe("Ventanilla de Jai", () => {
  // Textos de prueba neutros (no son guaraní).
  const decir = Array.from({ length: 6 }, (_, i) => f(`d${i}`, "decir", `Decir ${i}`, `GN-D${i}`));
  const escuchar = Array.from({ length: 4 }, (_, i) => f(`e${i}`, "escuchar", `Escuchar ${i}`, `GN-E${i}`));

  it("no abre si los docentes todavía no escribieron suficientes frases", () => {
    expect(hayParaJugar([...decir.slice(0, 2), ...escuchar])).toBe(false);
    expect(hayParaJugar([...decir.map((x): Frase => ({ ...x, gn: null })), ...escuchar])).toBe(false);
    expect(hayParaJugar([...decir, ...escuchar])).toBe(true);
  });
  it("arma un turno de 8 personas, alternando decir y entender, con la respuesta entre las opciones", () => {
    const t = armarTurnoVentanilla([...decir, ...escuchar], 7);
    expect(t.length).toBe(CLIENTES_POR_TURNO);
    t.forEach((r, i) => {
      expect(r.tipo).toBe(i % 2 === 0 ? "decir" : "escuchar");
      if (r.tipo === "decir") expect(r.opciones.map((o) => o.id)).toContain(r.frase.id);
      else expect(r.opciones).toContain(r.frase.es);
    });
    expect(armarTurnoVentanilla([...decir, ...escuchar], 7)).toEqual(t);
  });
});
