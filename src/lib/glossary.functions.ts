import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GlossaryItem = { gn: string; es: string; validated: boolean; sig?: Partial<Record<"en" | "pt" | "de" | "fr" | "zh", string>> };

/**
 * Glosario: solo las palabras PUBLICADAS del corpus. Se leen desde el servidor (la base no deja leer
 * el corpus directo desde afuera) y con tope por persona. Nada se genera ni se traduce.
 */
export const listGlossary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { vigilarPedidos } = await import("@/lib/corpus-guard.server");
    if (!(await vigilarPedidos("glosario", { userId: context.userId }, 120))) {
      throw new Error("Demasiadas consultas seguidas. Esperá un rato y volvé a intentar.");
    }
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data, error } = await sb
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
