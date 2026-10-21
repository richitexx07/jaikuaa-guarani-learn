import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Answer = z.object({
  id: z.string().uuid(),
  gn: z.string().trim().min(1).max(120),
  correct: z.boolean(),
  source: z.enum(["lesson", "wotd", "game"]),
  sourceRef: z.string().trim().max(60).nullable().default(null),
  at: z.number().int(),
});

/**
 * Guarda respuestas de práctica (también las hechas sin señal, que llegan después).
 * Repetir un envío no duplica nada: cada respuesta trae su propio id.
 */
export const recordAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ answers: z.array(Answer).min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { consumeRateLimit } = await import("@/lib/server-guards.server");
    if (!(await consumeRateLimit(`answers:user:${context.userId}`, 120, 3600))) {
      throw new Error("Demasiados envíos, se reintenta más tarde");
    }
    const now = Date.now();
    const oldest = now - 45 * 24 * 3600 * 1000;
    const rows = data.answers.map((a) => ({
      id: a.id,
      user_id: context.userId,
      gn: a.gn,
      correct: a.correct,
      source: a.source,
      source_ref: a.sourceRef,
      // Fecha real de la respuesta, sin aceptar fechas futuras ni muy viejas.
      answered_at: new Date(Math.min(now, Math.max(oldest, a.at))).toISOString(),
    }));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("practice_answers" as never)
      .upsert(rows as never, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw new Error("No se pudieron guardar las respuestas");
    return { saved: rows.length };
  });
