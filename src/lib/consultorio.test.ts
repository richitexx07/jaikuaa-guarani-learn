import { describe, expect, it } from "vitest";
import { armarTurno, enIdioma, estrellas, exigencias, paciente, puntosPorAcierto, regionDe, xpDelTurno, type FraseSalud, type PalabraCuerpo, type Ronda } from "./consultorio";

const cuerpo: PalabraCuerpo[] = [
  { gn: "a", es: "Cabeza", region: "cabeza" },
  { gn: "b", es: "Ojo", region: "ojo" },
  { gn: "c", es: "Pie", region: "pie" },
];
const frases: FraseSalud[] = [
  ...["Me duele la cabeza.", "Tengo fiebre.", "Tengo tos.", "Desde ayer."].map((es, i) => ({ id: `e${i}`, tipo: "escuchar" as const, es, gn: `g${i}` })),
  ...["Respire hondo.", "Abra la boca.", "Tome mucha agua.", "Firme aquí, por favor."].map((es, i) => ({ id: `d${i}`, tipo: "decir" as const, es, gn: `h${i}` })),
];

describe("consultorio", () => {
  it("reconoce las partes del cuerpo por su significado", () => {
    expect(regionDe("Cabeza")).toBe("cabeza");
    expect(regionDe("Corazón")).toBe("corazon");
    expect(regionDe("5")).toBeNull();
  });

  it("arma un turno de 8 pacientes mezclando lo que haya", () => {
    // Con solo 3 palabras publicadas, el turno tiene 3 pacientes y ninguno se repite.
    const solo = armarTurno(cuerpo, []);
    expect(solo).toHaveLength(3);
    expect(solo.every((r) => r.tipo === "cuerpo")).toBe(true);
    expect(new Set(solo.map((r) => (r.tipo === "cuerpo" ? r.palabra.gn : "")))).toEqual(new Set(["a", "b", "c"]));
    const todo = armarTurno(cuerpo, frases);
    expect(new Set(todo.map((r) => r.tipo))).toEqual(new Set(["cuerpo", "sintoma", "indicacion"]));
    for (const r of todo) {
      if (r.tipo !== "cuerpo") {
        expect(r.opciones).toHaveLength(4);
        expect(r.opciones.some((o) => o.id === r.frase.id)).toBe(true);
        expect(new Set(r.opciones.map((o) => o.id)).size).toBe(4);
      }
    }
    expect(armarTurno([], [])).toEqual([]);
  });

  it("calcula puntos, estrellas y XP", () => {
    expect(puntosPorAcierto(10, 1)).toBe(150);
    expect(puntosPorAcierto(10, 5)).toBe(300);
    expect(estrellas(8, 8)).toBe(3);
    expect(estrellas(5, 8)).toBe(2);
    expect(estrellas(0, 8)).toBe(0);
    expect(xpDelTurno(10)).toBe(20);
  });

  it("traduce al portugués y deja en castellano lo que no conoce", () => {
    expect(enIdioma("¿Dónde le duele?", "pt")).toBe("Onde dói?");
    expect(enIdioma("Respire hondo.", "pt")).toBe("Respire fundo.");
    expect(enIdioma("Frase nueva", "pt")).toBe("Frase nueva");
    expect(enIdioma("Tengo tos.", "es")).toBe("Tengo tos.");
  });

  it("nunca repite un paciente en el mismo turno", () => {
    for (let seed = 1; seed < 30; seed++) {
      let x = seed;
      const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
      const turno = armarTurno(cuerpo, frases, rnd);
      expect(turno).toHaveLength(8);
      const claves = turno.map((r) => (r.tipo === "cuerpo" ? `c:${r.palabra.gn}` : `f:${r.frase.id}`));
      expect(new Set(claves).size).toBe(claves.length);
    }
  });

  it("el paciente es coherente con la frase", () => {
    expect(exigencias("¿Está embarazada?")).toEqual({ genero: "f", edadMin: 18, edadMax: 42 });
    expect(exigencias("Estoy mareado.").genero).toBe("m");
    const preg: FraseSalud = { id: "x", tipo: "decir", es: "¿Está embarazada?", gn: "g" };
    const ronda: Ronda = { tipo: "indicacion", frase: preg, opciones: [preg] };
    for (let k = 0; k < 40; k++) {
      const p = paciente(k, Math.random, ronda);
      expect(p.femenino).toBe(true);
      expect(p.edad).toBeGreaterThanOrEqual(18);
      expect(p.edad).toBeLessThanOrEqual(42);
    }
  });

  it("en portugués trata de «a senhora» a las pacientes", () => {
    expect(enIdioma("¿Dónde vive?", "pt")).toBe("Onde o senhor mora?");
    expect(enIdioma("¿Dónde vive?", "pt", true)).toBe("Onde a senhora mora?");
    expect(enIdioma("¿Vino con alguien?", "pt", true)).toBe("Veio acompanhada?");
    expect(enIdioma("Le voy a revisar. No se preocupe.", "pt", true)).toBe("Vou examinar a senhora. Não se preocupe.");
    expect(enIdioma("¿Dónde vive?", "es", true)).toBe("¿Dónde vive?");
  });
});
