import { describe, expect, it } from "vitest";
import { fechaCorta, golesDe, msHastaManana, palabrasDelDia, semillaDelDia, textoCompartirDia } from "./penal-dia";
import { anotar, anotarDesempate, DEPARTAMENTOS, nuevaCopa, pideDesempate } from "./copa";

const W = Array.from({ length: 40 }, (_, i) => ({ gn: `p${i}`, es: `e${i}`, hasAudio: i % 2 === 0 }));

describe("penal del día", () => {
  it("elige las mismas 5 palabras para la misma fecha, sin importar el orden", () => {
    const a = palabrasDelDia(W, "2026-11-07");
    const b = palabrasDelDia([...W].reverse(), "2026-11-07");
    expect(a).toHaveLength(5);
    expect(a.map((w) => w.gn)).toEqual(b.map((w) => w.gn));
  });
  it("cambia de un día al otro", () => {
    expect(palabrasDelDia(W, "2026-11-07").map((w) => w.gn)).not.toEqual(palabrasDelDia(W, "2026-11-08").map((w) => w.gn));
    expect(semillaDelDia("2026-11-07")).not.toBe(semillaDelDia("2026-11-08"));
  });
  it("una palabra nueva casi nunca cambia las del día", () => {
    const base = palabrasDelDia(W, "2026-11-07").map((w) => w.gn);
    const conUna = palabrasDelDia([...W, { gn: "nueva", es: "x", hasAudio: false }], "2026-11-07").map((w) => w.gn);
    expect(conUna.filter((g) => base.includes(g)).length).toBeGreaterThanOrEqual(4);
  });
  it("comparte sin revelar las palabras", () => {
    const t = textoCompartirDia({ fecha: "2026-11-07", outcomes: ["goal", "save", "angle", "wide", "goal"] }, "https://www.jaikuaa.com/juegos/penales?dia=1", { titulo: "Penal del día", deCinco: "{n} de 5", reto: "¿Te animás?" });
    expect(t).toContain("⚽🧤🎯❌⚽ 3 de 5");
    expect(t).toContain("07/11");
    expect(t).not.toMatch(/p\d/);
    expect(golesDe(["goal", "angle", "post"])).toBe(2);
    expect(fechaCorta("2026-01-05")).toBe("05/01");
  });
  it("calcula cuánto falta para la medianoche de Paraguay", () => {
    const ms = msHastaManana(new Date("2026-11-07T15:00:00Z")); // 12:00 en Asunción (UTC-3)
    expect(Math.round(ms / 3600_000)).toBe(12);
  });
});

describe("copa de los departamentos", () => {
  it("arma cuatro rivales distintos que no son el propio departamento", () => {
    const c = nuevaCopa("Central", 42);
    expect(c.partidos).toHaveLength(4);
    expect(new Set(c.partidos.map((p) => p.rival)).size).toBe(4);
    expect(c.partidos.some((p) => p.rival === "Central")).toBe(false);
    expect(c.partidos.every((p) => p.golesRival >= 1 && p.golesRival <= 4)).toBe(true);
    expect(DEPARTAMENTOS).toHaveLength(18);
  });
  it("gana, pierde y desempata", () => {
    let c = nuevaCopa("Itapúa", 7);
    const r0 = c.partidos[0]!.golesRival;
    c = anotar(c, r0 + 1);
    expect(c.ronda).toBe(1);
    const r1 = c.partidos[1]!.golesRival;
    c = anotar(c, r1);
    expect(pideDesempate(c)).toBe(true);
    c = anotarDesempate(c, true);
    expect(c.ronda).toBe(2);
    c = anotar(c, 0);
    expect(c.estado).toBe("eliminado");
  });
  it("sale campeón al ganar la final", () => {
    let c = nuevaCopa("Guairá", 3);
    for (let i = 0; i < 4; i++) c = anotar(c, 5);
    expect(c.estado).toBe("campeon");
  });
});

import { relatosDe } from "./relato-gol";
import { disenoDe, kitSeguro, CAMISETAS, ESPECIALES } from "@/components/games/penalties/camisetas";

describe("relato del gol y camisetas de racha", () => {
  it("sin grabaciones no relata; el golazo usa las de gol si no tiene propias", () => {
    expect(relatosDe("gol", {})).toEqual([]);
    const l = { "/src/assets/penales/relato/gol-1.mp3": "a.mp3", "/src/assets/penales/relato/gol-2.mp3": "b.mp3" };
    expect(relatosDe("golazo", l)).toEqual(["a.mp3", "b.mp3"]);
    expect(relatosDe("golazo", { ...l, "/src/assets/penales/relato/golazo-1.mp3": "c.mp3" })).toEqual(["c.mp3"]);
  });
  it("la camiseta especial reemplaza los colores del país y se limpia si llega algo raro", () => {
    expect(disenoDe(kitSeguro({ pais: "PY", especial: "dorada" }))).toBe(ESPECIALES.dorada.diseno);
    expect(disenoDe(kitSeguro({ pais: "PY", especial: "trucha" }))).toBe(CAMISETAS.PY);
  });
});
