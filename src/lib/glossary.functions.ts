import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GlossaryItem = { gn: string; es: string; validated: boolean };

/**
 * Glosario: solo las palabras PUBLICADAS del corpus, leídas con los permisos del usuario
 * (la política de la base ya limita la lectura a las publicadas). Nada se genera ni se traduce.
 */
export const listGlossary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("corpus_words")
      .select("gn, es, validated_by")
      .eq("status", "published")
      .order("gn")
      .limit(5000);
    if (error) throw new Error(error.message);
    const items: GlossaryItem[] = (data ?? []).map((w) => ({
      gn: w.gn,
      es: w.es,
      validated: !!w.validated_by,
    }));
    return { items };
  });
