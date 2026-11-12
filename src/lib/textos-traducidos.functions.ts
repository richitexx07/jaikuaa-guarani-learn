import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Textos de los juegos en otros idiomas (Trivia, Tekojoja, Tembi'u, Ta'anga, Chacra, Karaoke).
 * Las propuestas están en el código (traducciones-juegos.ts) y no se muestran; lo aprobado por un docente o la
 * administración queda en la tabla textos_traducidos y es lo único que ven los jugadores.
 */

const IDIOMAS = ["en", "pt", "de", "fr", "zh"] as const;
type Idioma = (typeof IDIOMAS)[number];

// La tabla nueva todavía no está en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function esDocente(supabase: any, userId: string): Promise<boolean> {
  const [a, e] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
  ]);
  return a.data === true || e.data === true;
}

/** Lo aprobado en un idioma, para los juegos (también para quien juega sin cuenta). */
export const traduccionesJuegos = createServerFn({ method: "GET" })
  .inputValidator((d: { lang: string }) => z.object({ lang: z.enum(IDIOMAS) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows } = await db.from("textos_traducidos").select("es, aprobado").eq("lang", data.lang).limit(5000);
    return ((rows ?? []) as { es: string; aprobado: string }[]).map((r) => [r.es, r.aprobado] as [string, string]);
  });

export type FilaTexto = { juego: string; es: string; propuesto: string | null; aprobado: string | null };

export const panelTextos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lang: z.enum(IDIOMAS) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esDocente(context.supabase, context.userId))) throw new Error("Forbidden");
    const { PROPUESTAS_TEXTOS } = await import("@/lib/traducciones-juegos");
    const db = await admin();
    const { data: rows, error } = await db.from("textos_traducidos").select("es, juego, aprobado").eq("lang", data.lang);
    if (error) throw new Error(error.message);
    const aprobados = new Map(((rows ?? []) as { es: string; juego: string; aprobado: string }[]).map((r) => [r.es, r]));
    const filas: FilaTexto[] = (PROPUESTAS_TEXTOS[data.lang as Idioma] ?? []).map(([juego, es, propuesto]) => ({
      juego, es, propuesto, aprobado: aprobados.get(es)?.aprobado ?? null,
    }));
    const vistos = new Set(filas.map((f) => f.es));
    for (const r of aprobados.values()) if (!vistos.has(r.es)) filas.push({ juego: r.juego, es: r.es, propuesto: null, aprobado: r.aprobado });
    return filas;
  });

export const aprobarTextos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    lang: z.enum(IDIOMAS),
    items: z.array(z.object({ es: z.string().min(1).max(500), juego: z.string().max(40), texto: z.string().trim().min(1).max(500) })).min(1).max(500),
  }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esDocente(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const ahora = new Date().toISOString();
    const { error } = await db.from("textos_traducidos").upsert(
      data.items.map((i) => ({ es: i.es, lang: data.lang, juego: i.juego, aprobado: i.texto, revisado_por: context.userId, revisado_at: ahora })),
      { onConflict: "es,lang" },
    );
    if (error) throw new Error(error.message);
    return { aprobados: data.items.length };
  });

/** Saca una traducción aprobada: el juego vuelve a mostrar el castellano y la propuesta vuelve a revisión. */
export const quitarTexto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lang: z.enum(IDIOMAS), es: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esDocente(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { error } = await db.from("textos_traducidos").delete().eq("lang", data.lang).eq("es", data.es);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
