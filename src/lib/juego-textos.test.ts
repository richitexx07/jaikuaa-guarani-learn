import { describe, expect, it } from "vitest";
import {
  applyKaraoke,
  applyTaanga,
  applyTekojoja,
  applyTembiu,
  applyTrivia,
  indexTextos,
  itemListo,
  itemsEditor,
  JUEGO_CAMPOS,
  JUEGOS_EDITOR,
  type JuegoId,
  type JuegoTexto,
} from "./juego-textos";
import { CASES, ING, SCENES, SONGS } from "./juegos-contenido";
import { TRIVIA } from "./trivia";

// Textos de prueba neutros (no son guaraní): solo verifican que lo guardado reemplaza a lo de la app.
const t = (juego: JuegoId, clave: string, campo: string, texto: string): JuegoTexto => ({
  juego,
  clave,
  campo,
  texto,
  por: "Docente",
  cuando: "2026-10-27T00:00:00Z",
});

describe("guaraní de los juegos", () => {
  it("sin nada guardado, los juegos quedan iguales", () => {
    const idx = indexTextos([]);
    expect(applyKaraoke(SONGS, idx)).toEqual(SONGS);
    expect(applyTembiu(ING, idx)).toEqual(ING);
    expect(applyTaanga(SCENES, idx)).toEqual(SCENES);
    expect(applyTekojoja(CASES, idx).map(({ storyGn, answerGn, ...c }) => c)).toEqual(CASES);
  });

  it("karaoke usa el verso del docente solo si la palabra a completar está en el verso", () => {
    const song = SONGS[0]!;
    const ok = applyKaraoke(SONGS, indexTextos([
      t("karaoke", `${song.id}:0`, "verso", "AAA BBB CCC DDD"),
      t("karaoke", `${song.id}:0`, "completar", "CCC"),
      t("karaoke", `${song.id}:0`, "incorrectas", "XXX, YYY ,CCC"),
    ]));
    expect(ok[0]!.lines[0]).toMatchObject({ words: ["AAA", "BBB", "CCC", "DDD"], gap: 2, wrong: ["XXX", "YYY"] });

    const mal = applyKaraoke(SONGS, indexTextos([
      t("karaoke", `${song.id}:1`, "verso", "AAA BBB"),
      t("karaoke", `${song.id}:1`, "completar", "ZZZ"),
    ]));
    expect(mal[0]!.lines[1]!.words).toEqual(song.lines[1]!.words);
    expect(mal[0]!.lines[1]!.gap).toBe(song.lines[1]!.gap);
  });

  it("tembi'u, ta'anga, tekojoja y preguntados usan lo del docente", () => {
    const key = Object.keys(ING)[0]!;
    expect(applyTembiu(ING, indexTextos([t("tembiu", key, "gn", "NNN")]))[key]!.gn).toBe("NNN");

    const sc = applyTaanga(SCENES, indexTextos([
      t("taanga", "0", "antes", "A"),
      t("taanga", "0", "palabra", "PPP"),
      t("taanga", "0", "despues", "B"),
      t("taanga", "0", "incorrectas", "Q1, Q2"),
    ]))[0]!;
    expect(sc).toMatchObject({ before: "A ", ok: "PPP", after: " B", wrong: ["Q1", "Q2"] });
    const sc2 = applyTaanga(SCENES, indexTextos([t("taanga", "1", "antes", "¡"), t("taanga", "1", "despues", ", C.")]))[1]!;
    expect(sc2).toMatchObject({ before: "¡", after: ", C." });

    const c = applyTekojoja(CASES, indexTextos([
      t("tekojoja", "2", "caso", "CASO"),
      t("tekojoja", "2", "termino", "TERM"),
      t("tekojoja", "2", "termino_es", "Otro término"),
    ]))[2]!;
    expect(c).toMatchObject({ storyGn: "CASO", answerGn: "TERM", answer: "Otro término", why: CASES[2]!.why });

    const qs = applyTrivia("mitos", TRIVIA.mitos.questions, indexTextos([t("trivia", "mitos:1", "pregunta", "PREG")]));
    expect(qs[1]!.qGn).toBe("PREG");
    expect(qs[0]!.qGn).toBeUndefined();
  });

  it("la pantalla del docente cubre todo el contenido y solo usa campos permitidos", () => {
    for (const { id } of JUEGOS_EDITOR) {
      const items = itemsEditor(id);
      expect(items.length).toBeGreaterThan(0);
      expect(new Set(items.map((i) => i.clave)).size).toBe(items.length);
      for (const it of items) for (const c of it.campos) expect(JUEGO_CAMPOS[id]).toContain(c.campo);
    }
    expect(itemsEditor("trivia").length).toBe(Object.values(TRIVIA).reduce((n, c) => n + c.questions.length, 0));
    expect(itemsEditor("tekojoja").length).toBe(CASES.length);
  });

  it("un elemento queda listo con «Está bien así» pero no con una observación sola", () => {
    expect(itemListo(indexTextos([t("trivia", "mitos:0", "obs", "nota")]), "trivia", "mitos:0")).toBe(false);
    expect(itemListo(indexTextos([t("trivia", "mitos:0", "revisado", "si")]), "trivia", "mitos:0")).toBe(true);
  });
});
