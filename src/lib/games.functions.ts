import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** `sig`: el significado en otros idiomas, solo lo aprobado por un docente (ver significado.ts). */
export type GameWord = { gn: string; es: string; hasAudio: boolean; sig?: Partial<Record<"en" | "pt" | "de" | "fr" | "zh", string>> };

/** Palabras publicadas del corpus para los juegos; opcionalmente solo las de una lección publicada. */
export const getGameWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ lesson: z.number().int().min(1).max(10000).nullable().default(null) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    if (data.lesson !== null) {
      const { data: lesson } = await sb
        .from("lessons")
        .select("id")
        .eq("status", "published")
        .eq("sort_order", data.lesson)
        .maybeSingle();
      if (!lesson) return { words: [] as GameWord[] };
      const { data: links, error } = await sb
        .from("lesson_words")
        .select("corpus_words!inner(gn, es, has_audio, status, significados)")
        .eq("lesson_id", lesson.id)
        .eq("corpus_words.status", "published");
      if (error) throw new Error(error.message);
      const words = (links ?? []).map((x) => {
        const w = x.corpus_words as unknown as { gn: string; es: string; has_audio: boolean; significados?: GameWord["sig"] | null };
        return { gn: w.gn, es: w.es, hasAudio: w.has_audio, sig: w.significados ?? {} };
      });
      return { words };
    }
    const { data: rows, error } = await sb
      .from("corpus_words")
      .select("gn, es, has_audio, significados")
      .eq("status", "published")
      .limit(2000);
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { words: (rows ?? []).map((w: any) => ({ gn: w.gn, es: w.es, hasAudio: w.has_audio, sig: (w.significados ?? {}) as GameWord["sig"] })) };
  });

/* --------------------------- PALABRA DEL DÍA --------------------------- */

function asuncionToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

function seeded(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  let x = h >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/** Elección determinística por fecha de Paraguay: misma palabra y opciones para todos. */
type WotdWord = { id: number | string; gn: string; es: string; has_audio: boolean; significados?: GameWord["sig"] | null };
/** Para mostrar cada opción en el idioma de la persona: opción en castellano → sus significados aprobados. */
export type WotdLabels = Record<string, GameWord["sig"]>;

export async function loadWotdWords(): Promise<WotdWord[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("corpus_words")
    .select("id, gn, es, has_audio, significados")
    .eq("status", "published")
    .order("id")
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as WotdWord[];
}

export async function wordOfDay(day: string, preloaded?: WotdWord[]) {
  const all = preloaded ?? (await loadWotdWords());
  const withAudio = all.filter((w) => w.has_audio);
  if (withAudio.length === 0) return null;
  const rnd = seeded(`jaikuaa:${day}`);
  const word = withAudio[Math.floor(rnd() * withAudio.length)]!;
  const others = [...new Set(all.map((w) => w.es.trim()).filter((es) => es && es !== word.es.trim()))];
  const wrong: string[] = [];
  while (wrong.length < 3 && others.length) {
    wrong.push(others.splice(Math.floor(rnd() * others.length), 1)[0]!);
  }
  const options = [word.es.trim(), ...wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  // La respuesta se sigue comparando en castellano; los significados aprobados solo cambian lo que se ve.
  const labels: WotdLabels = {};
  for (const o of options) {
    const w = all.find((x) => x.es.trim() === o && x.significados && Object.keys(x.significados).length);
    if (w?.significados) labels[o] = w.significados;
  }
  return { gn: word.gn, es: word.es.trim(), options, labels };
}

const syncIdFor = (day: string) => `game:palabra-del-dia:${day}`;

export const getWordOfDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const day = asuncionToday();
    const w = await wordOfDay(day);
    if (!w) return { day, word: null };
    const { data: tx } = await context.supabase
      .from("xp_transactions")
      .select("metadata")
      .eq("user_id", context.userId)
      .eq("sync_id", syncIdFor(day))
      .maybeSingle();
    const prev = tx?.metadata as { choice?: string; correct?: boolean } | undefined;
    return {
      day,
      word: { gn: w.gn, options: w.options, labels: w.labels },
      played: tx
        ? { choice: prev?.choice ?? "", correct: !!prev?.correct, answer: w.es }
        : null,
    };
  });

export const answerWordOfDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ choice: z.string().trim().max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const day = asuncionToday();
    const w = await wordOfDay(day);
    if (!w) throw new Error("No hay palabra del día");
    const correct = data.choice === w.es;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.rpc("record_activity", {
      _user_id: context.userId,
      _amount: correct ? 5 : 0,
      _source: "game",
      _source_ref: "palabra-del-dia",
      _sync_id: syncIdFor(day),
      _metadata: { choice: data.choice, correct, verified: true },
      _perfect: false,
    } as never);
    if (error) throw new Error("No se pudo guardar la partida");
    const duplicate = !!(res as { duplicate?: boolean } | null)?.duplicate;
    return { correct, answer: w.es, duplicate };
  });

/* ------------------- PALABRA DEL DÍA SIN CONEXIÓN ------------------- */

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type WordOfDayPackItem = { day: string; gn: string; options: string[]; answer: string; labels?: WotdLabels };

/**
 * Las Palabras del día de las próximas semanas, para jugar sin señal. Incluye la respuesta para
 * poder mostrar el resultado en el teléfono; los puntos los decide siempre el servidor al enviar.
 */
export const getWordOfDayPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(1).max(42).default(28) }).parse(d))
  .handler(async ({ data }) => {
    const today = asuncionToday();
    const all = await loadWotdWords();
    const items: WordOfDayPackItem[] = [];
    for (let i = 0; i < data.days; i++) {
      const day = addDays(today, i);
      const w = await wordOfDay(day, all);
      if (w) items.push({ day, gn: w.gn, options: w.options, answer: w.es, labels: w.labels });
    }
    return { today, items };
  });

/**
 * Respuesta de una Palabra del día jugada sin señal, enviada después. Solo vale para el día de hoy
 * o los 14 anteriores; la corrección y los puntos se calculan acá, nunca en el teléfono.
 */
export const answerWordOfDayFor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), choice: z.string().trim().max(300) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const today = asuncionToday();
    if (data.day > today || data.day < addDays(today, -14)) throw new Error("Fecha fuera de rango");
    const w = await wordOfDay(data.day);
    if (!w) throw new Error("No hay palabra para esa fecha");
    const correct = data.choice === w.es;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.rpc("record_activity", {
      _user_id: context.userId,
      _amount: correct ? 5 : 0,
      _source: "game",
      _source_ref: "palabra-del-dia",
      _sync_id: syncIdFor(data.day),
      _metadata: { choice: data.choice, correct, offline: true, verified: true },
      _perfect: false,
    } as never);
    if (error) throw new Error("No se pudo guardar la partida");
    const duplicate = !!(res as { duplicate?: boolean } | null)?.duplicate;
    return { correct, answer: w.es, duplicate };
  });
