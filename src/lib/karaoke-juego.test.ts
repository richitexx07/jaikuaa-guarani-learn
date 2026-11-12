import { describe, expect, it } from "vitest";
import { SONGS } from "@/lib/juegos-contenido";
import {
  armarShow, CUENTA, estrellas, huecoAlternativo, INTRO, juzgar, multiplicador, opcionesVisibles,
  pulsoDelHueco, puntajeMaximo, puntosDe, rango, TELON,
} from "@/lib/karaoke-juego";

const norm = (w: string) => w.toLowerCase();

describe("Purahéi: el show de tres vueltas", () => {
  for (const song of SONGS) {
    const show = armarShow(song, 12345);

    it(`${song.id}: tres vueltas con todos los versos y un verso dorado por vuelta`, () => {
      expect(show.versos).toHaveLength(song.lines.length * 3);
      for (const v of [1, 2, 3]) {
        const vs = show.versos.filter((x) => x.vuelta === v);
        expect(vs).toHaveLength(song.lines.length);
        expect(vs.filter((x) => x.dorado)).toHaveLength(1);
      }
      expect(show.versos.filter((x) => x.memoria).every((x) => x.vuelta === 3)).toBe(true);
    });

    it(`${song.id}: la respuesta correcta es la palabra de la letra y está entre las opciones una sola vez`, () => {
      for (const v of show.versos) {
        expect(v.correcta).toBe(v.words[v.gap]);
        expect(v.opciones.filter((o) => norm(o) === norm(v.correcta))).toHaveLength(1);
        expect(v.opciones.length).toBeGreaterThanOrEqual(2);
      }
    });

    it(`${song.id}: las vueltas 1 y 3 usan el hueco y las opciones del docente`, () => {
      for (const v of show.versos.filter((x) => x.vuelta !== 2)) {
        const l = song.lines[v.linea]!;
        expect(v.gap).toBe(l.gap);
        expect([...v.opciones].sort()).toEqual([l.words[l.gap]!, ...l.wrong].sort());
      }
    });

    it(`${song.id}: en la vuelta 2 cambia la palabra y las opciones salen de la misma canción`, () => {
      const palabras = new Set(song.lines.flatMap((l) => l.words.map(norm)));
      for (const v of show.versos.filter((x) => x.vuelta === 2)) {
        const l = song.lines[v.linea]!;
        if (huecoAlternativo(l.words, l.gap) !== -1) expect(v.gap).not.toBe(l.gap);
        for (const o of v.opciones) expect(palabras.has(norm(o))).toBe(true);
        // Ninguna opción falsa es otra palabra del mismo verso.
        for (const o of v.opciones) if (o !== v.correcta) expect(l.words.map(norm)).not.toContain(norm(o));
      }
    });

    it(`${song.id}: la línea de tiempo tiene intro, cuenta, telones y cada verso`, () => {
      const largo = INTRO + CUENTA + 2 * TELON + show.versos.reduce((s, v) => s + v.words.length + 2, 0);
      expect(show.pasos).toHaveLength(largo);
      for (const v of show.versos) {
        const p = show.pasos[pulsoDelHueco(show, v.n)]!;
        expect(p).toEqual({ tipo: "verso", v: v.n, word: v.gap });
      }
    });
  }

  it("la misma semilla arma el mismo show (los retos son parejos)", () => {
    expect(armarShow(SONGS[0]!, 7)).toEqual(armarShow(SONGS[0]!, 7));
  });
});

describe("Purahéi: puntaje", () => {
  it("juzga por cercanía al pulso", () => {
    expect(juzgar(0.05, 0.6)).toBe("perfecto");
    expect(juzgar(-0.5, 0.6)).toBe("bien");
    expect(juzgar(1.5, 0.6)).toBe("justo");
  });
  it("la racha multiplica", () => {
    expect([1, 2, 3, 5, 6, 9, 10, 20].map(multiplicador)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(puntosDe("perfecto", 3, true)).toBe(20);
    expect(puntosDe("fallo", 10, true)).toBe(0);
  });
  it("el máximo es todo perfecto con la racha entera", () => {
    const show = armarShow(SONGS[0]!, 1);
    const max = puntajeMaximo(show.versos);
    const sinRacha = show.versos.reduce((s, v) => s + puntosDe("perfecto", 1, v.dorado), 0);
    expect(max).toBeGreaterThan(sinRacha);
  });
  it("la ayuda deja dos opciones con la correcta", () => {
    const v = armarShow(SONGS[0]!, 3).versos[0]!;
    const dos = opcionesVisibles(v, true);
    expect(dos).toHaveLength(2);
    expect(dos).toContain(v.correcta);
    expect(opcionesVisibles(v, false)).toEqual(v.opciones);
  });
  it("estrellas y títulos", () => {
    expect([0, 0.2, 0.5, 0.8].map(estrellas)).toEqual([0, 1, 2, 3]);
    expect([0, 0.2, 0.4, 0.7, 0.9].map(rango)).toEqual([0, 1, 2, 3, 4]);
  });
});
