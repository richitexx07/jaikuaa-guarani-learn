import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** `sig`: el significado en otros idiomas, solo lo que ya revisó un docente (sin clave = se muestra el castellano). */
export type CourseVocabItem = { gn: string; es: string; validated: boolean; sig?: Partial<Record<"en" | "pt" | "de" | "fr" | "zh", string>> };
export type CourseLesson = { n: number; title: string; theme: string; vocab: CourseVocabItem[] };

/**
 * Lecciones publicadas del Curso de Guaraní, leídas con los permisos del usuario.
 * Solo se cuentan palabras publicadas del corpus.
 */
export const listCourseLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: lessons, error } = await sb
      .from("lessons")
      .select("id, sort_order, title, theme")
      .eq("status", "published")
      .order("sort_order");
    if (error) throw new Error(error.message);
    const ids = (lessons ?? []).map((l) => l.id);
    const { data: links } = ids.length
      ? await sb
          .from("lesson_words")
          .select("lesson_id, corpus_words!inner(status)")
          .in("lesson_id", ids)
          .eq("corpus_words.status", "published")
      : { data: [] };
    const { data: done } = await sb
      .from("xp_transactions")
      .select("source_ref")
      .eq("user_id", context.userId)
      .eq("source", "lesson")
      .like("source_ref", "guarani:%")
      .limit(5000);
    const completed = new Set(
      (done ?? []).map((d) => Number(String(d.source_ref ?? "").split(":")[1])).filter(Number.isFinite),
    );
    return {
      lessons: (lessons ?? []).map((l) => ({
        n: l.sort_order,
        title: l.title,
        theme: l.theme,
        publishedWords: (links ?? []).filter((x) => x.lesson_id === l.id).length,
        completed: completed.has(l.sort_order),
      })),
    };
  });

export const getCourseLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ n: z.number().int().min(1).max(10000) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: lesson } = await sb
      .from("lessons")
      .select("id, sort_order, title, theme")
      .eq("status", "published")
      .eq("sort_order", data.n)
      .maybeSingle();
    if (!lesson) return { lesson: null as CourseLesson | null };
    const { data: links, error } = await sb
      .from("lesson_words")
      .select("position, corpus_words!inner(gn, es, status, validated_by, significados)")
      .eq("lesson_id", lesson.id)
      .eq("corpus_words.status", "published")
      .order("position");
    if (error) throw new Error(error.message);
    const vocab: CourseVocabItem[] = (links ?? []).map((x) => {
      const w = x.corpus_words as unknown as { gn: string; es: string; validated_by: string | null; significados?: CourseVocabItem["sig"] | null };
      return { gn: w.gn, es: w.es, validated: !!w.validated_by, sig: w.significados ?? {} };
    });
    return {
      lesson: { n: lesson.sort_order, title: lesson.title, theme: lesson.theme, vocab } as CourseLesson,
    };
  });
