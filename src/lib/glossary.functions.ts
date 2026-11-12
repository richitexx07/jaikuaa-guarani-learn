import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GlossaryItem = { gn: string; es: string; validated: boolean; sig?: Partial<Record<"en" | "pt" | "de" | "fr" | "zh", string>> };

/**
 * Glosario: solo las palabras PUBLICADAS del corpus, leídas con los permisos del usuario
 * (la política de la base ya limita la lectura a las publicadas). Nada se genera ni se traduce.
 */
export const listGlossary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("corpus_words")
      .select("gn, es, validated_by, significados")
      .eq("status", "published")
      .order("gn")
      .limit(5000);
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: GlossaryItem[] = (data ?? []).map((w: any) => ({
      gn: w.gn,
      es: w.es,
      validated: !!w.validated_by,
      sig: (w.significados ?? {}) as GlossaryItem["sig"],
    }));
    return { items };
  });
