import { describe, expect, it } from "vitest";
import { actualizar, distractores, elegirRepaso, firmes, proximoRepaso, sumarDias, type EstadoRepaso } from "./repaso";

const pool = ["a", "b", "c", "d", "e", "f", "g"];

describe("repaso de Jai", () => {
  it("suma días de calendario, también al cambiar de mes y de año", () => {
    expect(sumarDias("2026-11-17", 1)).toBe("2026-11-18");
    expect(sumarDias("2026-11-30", 3)).toBe("2026-12-03");
    expect(sumarDias("2026-12-30", 7)).toBe("2027-01-06");
  });

  it("sin historia, empieza por las primeras palabras aprendidas", () => {
    expect(elegirRepaso(pool, {}, "2026-11-17")).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("primero las que ya tocan (las más atrasadas), después las nuevas", () => {
    const estado: EstadoRepaso = {
      a: { caja: 2, proxima: "2026-11-20" },
      b: { caja: 3, proxima: "2026-11-15" },
      c: { caja: 1, proxima: "2026-11-17" },
    };
    expect(elegirRepaso(pool, estado, "2026-11-17")).toEqual(["b", "c", "d", "e", "f"]);
  });

  it("acertar sube de caja y espera más días; equivocarse vuelve mañana", () => {
    let e: EstadoRepaso = {};
    e = actualizar(e, "a", true, "2026-11-17");
    expect(e.a).toEqual({ caja: 1, proxima: "2026-11-18" });
    e = actualizar(e, "a", true, "2026-11-18");
    expect(e.a).toEqual({ caja: 2, proxima: "2026-11-21" });
    e = actualizar(e, "a", true, "2026-11-21");
    expect(e.a).toEqual({ caja: 3, proxima: "2026-11-28" });
    e = actualizar(e, "a", false, "2026-11-28");
    expect(e.a).toEqual({ caja: 1, proxima: "2026-11-29" });
  });

  it("nunca pasa de la última caja (un mes)", () => {
    let e: EstadoRepaso = { a: { caja: 5, proxima: "2026-11-17" } };
    e = actualizar(e, "a", true, "2026-11-17");
    expect(e.a).toEqual({ caja: 5, proxima: "2026-12-17" });
  });

  it("dice cuándo toca el próximo repaso y cuántas palabras ya están firmes", () => {
    const e: EstadoRepaso = { a: { caja: 4, proxima: "2026-11-30" }, b: { caja: 1, proxima: "2026-11-18" } };
    expect(proximoRepaso(pool, e)).toBe("2026-11-18");
    expect(firmes(pool, e)).toBe(1);
    expect(proximoRepaso(pool, {})).toBeNull();
  });

  it("las opciones equivocadas no repiten significado ni incluyen la correcta", () => {
    const items = [
      { gn: "Ake", es: "Duermo" },
      { gn: "Jajotopa peve", es: "Hasta luego" },
      { gn: "Jajotopáta", es: "Hasta luego" },
      { gn: "Aha", es: "Voy" },
      { gn: "Aju", es: "Vengo" },
      { gn: "Ahecha", es: "Veo" },
    ];
    for (let i = 0; i < 30; i++) {
      const d = distractores(items[1]!, items);
      expect(d).toHaveLength(3);
      expect(d.map((x) => x.es)).not.toContain("Hasta luego");
      expect(new Set(d.map((x) => x.es)).size).toBe(3);
    }
  });
});
