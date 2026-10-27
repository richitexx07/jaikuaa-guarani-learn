/**
 * Guaraní de los juegos: lo que escriben los docentes validadores para los juegos que tienen su
 * contenido dentro de la app (Preguntados, Tekojoja, Karaoke, Tembi'u, Ta'anga).
 *
 * Este archivo NO tiene guaraní propio: solo ordena lo que el docente guardó y lo aplica sobre el
 * contenido de la app. Si el docente no escribió nada, el juego sigue igual que siempre.
 */
import { CASES, DISHES, ING, SCENES, SONGS, type Case, type Scene, type Song } from "@/lib/juegos-contenido";
import { TRIVIA, TRIVIA_ORDER, type TriviaCategoryId, type TriviaQuestion } from "@/lib/trivia";

export type JuegoId = "trivia" | "tekojoja" | "karaoke" | "tembiu" | "taanga";

export type JuegoTexto = {
  juego: JuegoId;
  clave: string;
  campo: string;
  texto: string;
  por: string | null;
  cuando: string;
};

/** Qué puede escribir el docente en cada juego. «revisado» = «Está bien así» (sin cambios). */
export const JUEGO_CAMPOS: Record<JuegoId, readonly string[]> = {
  trivia: ["pregunta", "revisado", "obs"],
  tekojoja: ["caso", "termino", "termino_es", "por_que", "revisado"],
  karaoke: ["verso", "completar", "incorrectas", "revisado"],
  tembiu: ["gn", "revisado"],
  taanga: ["antes", "palabra", "despues", "incorrectas", "revisado"],
};

export const REVISADO = "si";

export type TextosIndex = Map<string, JuegoTexto>;

const k = (juego: JuegoId, clave: string, campo: string) => `${juego}|${clave}|${campo}`;

export function indexTextos(list: readonly JuegoTexto[] | undefined): TextosIndex {
  const m: TextosIndex = new Map();
  for (const t of list ?? []) m.set(k(t.juego, t.clave, t.campo), t);
  return m;
}

export function getTexto(idx: TextosIndex, juego: JuegoId, clave: string, campo: string): string | undefined {
  const t = idx.get(k(juego, clave, campo))?.texto?.trim();
  return t ? t : undefined;
}

/** Lista separada por comas («a, b, c») → ["a", "b", "c"]. */
export function splitLista(s: string | undefined): string[] {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// ---------- Claves de cada elemento (el orden del contenido no debe cambiar) ----------

export const claveTrivia = (cat: TriviaCategoryId, i: number) => `${cat}:${i}`;
export const claveKaraoke = (songId: string, line: number) => `${songId}:${line}`;

// ---------- Aplicar lo del docente a cada juego ----------

/** Karaoke: el verso del docente reemplaza al de la app si la palabra a completar está en el verso. */
export function applyKaraoke(songs: readonly Song[], idx: TextosIndex): Song[] {
  return songs.map((song) => ({
    ...song,
    lines: song.lines.map((line, li) => {
      const clave = claveKaraoke(song.id, li);
      const verso = getTexto(idx, "karaoke", clave, "verso");
      const completar = getTexto(idx, "karaoke", clave, "completar");
      const incorrectas = splitLista(getTexto(idx, "karaoke", clave, "incorrectas"));
      let words = line.words;
      let gap = line.gap;
      if (verso) {
        const w = verso.split(/\s+/).filter(Boolean);
        const g = completar ? w.indexOf(completar) : -1;
        if (g >= 0) {
          words = w;
          gap = g;
        }
      } else if (completar) {
        const g = line.words.indexOf(completar);
        if (g >= 0) gap = g;
      }
      const ok = words[gap];
      const wrong = incorrectas.length ? incorrectas.filter((x) => x !== ok) : line.wrong;
      return { ...line, words, gap, wrong: wrong.length ? wrong : line.wrong };
    }),
  }));
}

/** Tembi'u: el nombre en guaraní de cada ingrediente lo pone el docente. */
export function applyTembiu(ing: typeof ING, idx: TextosIndex): typeof ING {
  const out: typeof ING = {};
  for (const [key, v] of Object.entries(ing)) {
    const gn = getTexto(idx, "tembiu", key, "gn");
    out[key] = gn ? { ...v, gn } : v;
  }
  return out;
}

// Lo guardado llega sin espacios en los bordes: se los devolvemos alrededor de la palabra que falta.
const conEspacioFinal = (s: string) => (/[¡¿(«"\s]$/.test(s) ? s : `${s} `);
const conEspacioInicial = (s: string) => (/^[,.;:!?)»"…\s]/.test(s) ? s : ` ${s}`);

/** Ta'anga: la frase (antes, palabra, después) y las opciones incorrectas las escribe el docente. */
export function applyTaanga(scenes: readonly Scene[], idx: TextosIndex): Scene[] {
  return scenes.map((s, i) => {
    const c = String(i);
    const ok = getTexto(idx, "taanga", c, "palabra") ?? s.ok;
    const incorrectas = splitLista(getTexto(idx, "taanga", c, "incorrectas")).filter((x) => x !== ok);
    return {
      ...s,
      before: ((v) => (v ? conEspacioFinal(v) : s.before))(getTexto(idx, "taanga", c, "antes")),
      after: ((v) => (v ? conEspacioInicial(v) : s.after))(getTexto(idx, "taanga", c, "despues")),
      ok,
      wrong: incorrectas.length ? incorrectas : s.wrong.filter((x) => x !== ok),
    };
  });
}

export type CaseConGn = Case & { storyGn?: string; answerGn?: string };

/** Tekojoja: el caso y el término en guaraní, y correcciones del término y la explicación. */
export function applyTekojoja(cases: readonly Case[], idx: TextosIndex): CaseConGn[] {
  return cases.map((c, i) => {
    const cl = String(i);
    const answer = getTexto(idx, "tekojoja", cl, "termino_es") ?? c.answer;
    return {
      ...c,
      answer,
      wrong: c.wrong.filter((w) => w !== answer),
      why: getTexto(idx, "tekojoja", cl, "por_que") ?? c.why,
      storyGn: getTexto(idx, "tekojoja", cl, "caso"),
      answerGn: getTexto(idx, "tekojoja", cl, "termino"),
    };
  });
}

export type TriviaQuestionConGn = TriviaQuestion & { qGn?: string };

/** Preguntados: la pregunta en guaraní que escribió el docente va arriba de la castellana. */
export function applyTrivia(
  cat: TriviaCategoryId,
  questions: readonly TriviaQuestion[],
  idx: TextosIndex,
): TriviaQuestionConGn[] {
  return questions.map((q, i) => ({ ...q, qGn: getTexto(idx, "trivia", claveTrivia(cat, i), "pregunta") }));
}

// ---------- Lo que ve el docente en la pantalla para escribir ----------

export type CampoEditor = {
  campo: string;
  label: string;
  ayuda?: string;
  /** Lo que hoy muestra la app en ese lugar (para comparar). */
  actual?: string;
  largo?: boolean;
};

export type ItemEditor = {
  clave: string;
  titulo: string;
  /** Contexto en castellano: qué es este elemento en el juego. */
  contexto: string[];
  campos: CampoEditor[];
};

export const JUEGOS_EDITOR: { id: JuegoId; nombre: string; quien: string; explica: string }[] = [
  {
    id: "trivia",
    nombre: "Preguntados",
    quien: "Docente de guaraní",
    explica: "Escribí cada pregunta en guaraní. Aparece arriba de la pregunta en castellano.",
  },
  {
    id: "karaoke",
    nombre: "Karaoke",
    quien: "Docente de guaraní",
    explica: "Corregí cada verso y elegí la palabra que el jugador tiene que completar.",
  },
  {
    id: "tembiu",
    nombre: "Tembi'u",
    quien: "Docente de guaraní",
    explica: "Revisá cómo se escribe cada ingrediente en guaraní.",
  },
  {
    id: "taanga",
    nombre: "Ta'anga",
    quien: "Docente de guaraní",
    explica: "Corregí la frase de cada escena y la palabra que falta.",
  },
  {
    id: "tekojoja",
    nombre: "Tekojoja",
    quien: "Guaraní jurídico",
    explica: "Escribí cada caso y su término jurídico en guaraní. Pensado para el docente de guaraní jurídico.",
  },
];

const OBS: CampoEditor = { campo: "obs", label: "Observación para el equipo", ayuda: "No se muestra en el juego.", largo: true };

export function itemsEditor(juego: JuegoId): ItemEditor[] {
  switch (juego) {
    case "trivia":
      return TRIVIA_ORDER.flatMap((cat) =>
        TRIVIA[cat].questions.map((q, i) => ({
          clave: claveTrivia(cat, i),
          titulo: `${TRIVIA[cat].title} · ${i + 1}`,
          contexto: [q.q, `Respuesta: ${q.options[q.answer] ?? ""}`],
          campos: [{ campo: "pregunta", label: "Pregunta en guaraní", largo: true }, OBS],
        })),
      );
    case "karaoke":
      return SONGS.flatMap((song) =>
        song.lines.map((line, li) => ({
          clave: claveKaraoke(song.id, li),
          titulo: `${song.title} · verso ${li + 1}`,
          contexto: [`Significa: ${line.es}`],
          campos: [
            { campo: "verso", label: "Verso completo", actual: line.words.join(" ") },
            { campo: "completar", label: "Palabra a completar", ayuda: "Tiene que estar escrita igual en el verso.", actual: line.words[line.gap] },
            { campo: "incorrectas", label: "Opciones incorrectas", ayuda: "Separadas por comas.", actual: line.wrong.join(", ") },
          ],
        })),
      );
    case "tembiu":
      return Object.entries(ING).map(([key, v]) => ({
        clave: key,
        titulo: `${v.emoji} ${v.es}`,
        contexto: [`Se usa en: ${DISHES.filter((d) => d.ok.includes(key)).map((d) => d.name).join(", ") || "opciones de relleno"}`],
        campos: [{ campo: "gn", label: "Nombre en guaraní", actual: v.gn }],
      }));
    case "taanga":
      return SCENES.map((s, i) => ({
        clave: String(i),
        titulo: `Escena ${i + 1} · ${s.place}`,
        contexto: [`${s.who}: ${s.es}`],
        campos: [
          { campo: "antes", label: "Texto antes de la palabra", actual: s.before },
          { campo: "palabra", label: "Palabra que falta", actual: s.ok },
          { campo: "despues", label: "Texto después de la palabra", actual: s.after },
          { campo: "incorrectas", label: "Opciones incorrectas", ayuda: "Separadas por comas.", actual: s.wrong.join(", ") },
        ],
      }));
    case "tekojoja":
      return CASES.map((c, i) => ({
        clave: String(i),
        titulo: `${c.emoji} Caso ${i + 1}`,
        contexto: [c.story, `Término: ${c.answer}`, c.why],
        campos: [
          { campo: "caso", label: "El caso en guaraní", largo: true },
          { campo: "termino", label: "Término jurídico en guaraní" },
          { campo: "termino_es", label: "Corrección del término en castellano", ayuda: "Solo si hay que cambiarlo.", actual: c.answer },
          { campo: "por_que", label: "Corrección de la explicación", ayuda: "Solo si hay que cambiarla.", actual: c.why, largo: true },
        ],
      }));
  }
}

/** Un elemento está listo cuando el docente escribió algo o marcó «Está bien así». */
export function itemListo(idx: TextosIndex, juego: JuegoId, clave: string): boolean {
  return JUEGO_CAMPOS[juego].some((campo) => campo !== "obs" && !!getTexto(idx, juego, clave, campo));
}
