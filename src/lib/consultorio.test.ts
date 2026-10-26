import { describe, expect, it } from "vitest";
import { armarTurno, enIdioma, estrellas, puntosPorAcierto, regionDe, xpDelTurno, type FraseSalud, type PalabraCuerpo } from "./consultorio";

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
    const solo = armarTurno(cuerpo, []);
    expect(solo).toHaveLength(8);
    expect(solo.every((r) => r.tipo === "cuerpo")).toBe(true);
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
});
