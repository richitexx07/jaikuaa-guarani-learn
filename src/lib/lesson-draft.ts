// Lección a medio hacer: se guarda en el teléfono en cada paso para poder cerrar la app
// (o quedarse sin batería) y seguir después desde la misma pregunta.

export type ChoiceDraft = {
  questions: { gn: string; options: string[] }[];
  i: number;
  correct: number;
  picked: string | null;
};

export type MatchDraft = { pairs: string[]; left: string[]; right: string[]; matched: string[] };

export type LessonDraft = {
  phase: "intro" | "vocab" | "choice" | "match" | "done";
  choice?: ChoiceDraft;
  match?: MatchDraft;
  savedAt: number;
};

const key = (lang: string, n: number) => `jaikuaa:lesson-draft:${lang}:${n}`;
/** Una lección a medias se descarta después de 30 días. */
const MAX_AGE = 30 * 24 * 3600 * 1000;

export function readLessonDraft(lang: string, n: number): LessonDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(lang, n));
    if (!raw) return null;
    const d = JSON.parse(raw) as LessonDraft;
    if (!d?.phase || Date.now() - (d.savedAt ?? 0) > MAX_AGE) return null;
    return d;
  } catch {
    return null;
  }
}

export function saveLessonDraft(lang: string, n: number, d: Omit<LessonDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(lang, n), JSON.stringify({ ...d, savedAt: Date.now() }));
  } catch {}
}

export function clearLessonDraft(lang: string, n: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(lang, n));
  } catch {}
}

/** El borrador sigue sirviendo solo si todas sus palabras siguen en la lección. */
export function draftFitsLesson(d: LessonDraft, vocab: { gn: string; es: string }[]): boolean {
  const gns = new Set(vocab.map((v) => v.gn));
  const ess = new Set(vocab.map((v) => v.es));
  const okChoice =
    !d.choice ||
    d.choice.questions.every((q) => gns.has(q.gn) && q.options.every((o) => ess.has(o)));
  const okMatch =
    !d.match ||
    (d.match.pairs.every((g) => gns.has(g)) && d.match.right.every((e) => ess.has(e)));
  return okChoice && okMatch;
}
