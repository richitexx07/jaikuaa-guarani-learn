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
    const { vigilarPedidos } = await import("@/lib/corpus-guard.server");
    if (!(await vigilarPedidos("voz", { userId: context.userId }, 120))) {
      throw new Error("Demasiadas consultas seguidas. Esperá un rato y volvé a intentar.");
    }
    // Desde el servidor: la base no deja leer el corpus directo desde afuera.
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data, error } = await sb
      .from("corpus_words")
      .select("gn, es")
      .eq("status", "published")
      .eq("has_audio", true)
      .order("gn")
      .limit(5000);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as PalabraConVoz[] };
  });
