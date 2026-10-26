import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PalabraConVoz = { gn: string; es: string };

/**
 * Palabras publicadas que tienen grabación humana: son las que sirven para «Grabate y compará».
 * Nada se genera: si una palabra no tiene voz grabada, no aparece.
 */
export const listPalabrasConVoz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("corpus_words")
      .select("gn, es")
      .eq("status", "published")
      .eq("has_audio", true)
      .order("gn")
      .limit(5000);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as PalabraConVoz[] };
  });
