import { describe, expect, it } from "vitest";
import { PROPUESTAS_TEXTOS } from "@/lib/traducciones-juegos";
import { TRIVIA, TRIVIA_ORDER } from "@/lib/trivia";
import { CASES, DISHES, ING, SCENES, SONGS } from "@/lib/juegos-contenido";
import { CASOS_CHACRA } from "@/lib/chacra";

/** Todos los textos en castellano que los juegos pasan por la traducción. */
function textosDeLosJuegos(): Set<string> {
  const s = new Set<string>();
  const add = (x?: string) => { if (x?.trim()) s.add(x.trim()); };
  for (const id of TRIVIA_ORDER) {
    const c = TRIVIA[id];
    add(c.title); add(c.subtitle);
    for (const q of c.questions) { add(q.q); q.options.forEach(add); add(q.explanation); }
  }
  for (const c of CASES) { add(c.story); add(c.answer); c.wrong.forEach(add); add(c.why); }
  for (const v of Object.values(ING)) add(v.es);
  for (const d of DISHES) add(d.info);
  for (const sc of SCENES) { add(sc.place); add(sc.es); }
  for (const c of CASOS_CHACRA) { add(c.historia); add(c.pregunta); add(c.consejo); }
  for (const so of SONGS) for (const l of so.lines) add(l.es);
  return s;
}

describe("propuestas de traducción de los juegos", () => {
  const textos = textosDeLosJuegos();
  it("cada propuesta corresponde a un texto que hoy existe en un juego", () => {
    const sueltas = (PROPUESTAS_TEXTOS.en ?? []).filter(([, es]) => !textos.has(es)).map(([, es]) => es);
    expect(sueltas).toEqual([]);
  });
  it("no hay propuestas repetidas ni vacías", () => {
    const es = (PROPUESTAS_TEXTOS.en ?? []).map(([, e]) => e);
    expect(new Set(es).size).toBe(es.length);
    expect((PROPUESTAS_TEXTOS.en ?? []).every(([, , t]) => t.trim().length > 0)).toBe(true);
  });
  it("las palabras en guaraní de un texto quedan iguales en la propuesta", () => {
    const gn = ["avati ky", "aramirõ", "avati ku'i", "kesu", "mandi'o", "andai", "Kuarahy", "Ñe'ẽ", "Mba'éichapa", "Jaguarete", "Aguyje", "Karu", "Guata", "Kyvy", "ka'a he'ẽ", "Tupã"];
    for (const [, es, t] of PROPUESTAS_TEXTOS.en ?? []) {
      for (const w of gn) if (es.includes(w)) expect(t, `${es} → ${t}`).toContain(w);
    }
  });
});
