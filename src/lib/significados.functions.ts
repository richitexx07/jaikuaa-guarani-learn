import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Revisión de los significados en otros idiomas (inglés, portugués, alemán, francés, chino).
 * Las propuestas no se muestran; recién cuando un docente (editor) o la administración aprueba un idioma de una
 * palabra, ese significado aparece en las lecciones. El guaraní de la palabra no se toca nunca acá.
 */

export const IDIOMAS_SIG = ["en", "pt", "de", "fr", "zh"] as const;
export type IdiomaSig = (typeof IDIOMAS_SIG)[number];
export const NOMBRE_IDIOMA_SIG: Record<IdiomaSig, string> = { en: "Inglés", pt: "Portugués", de: "Alemán", fr: "Francés", zh: "Chino (tradicional)" };

// Las columnas nuevas todavía no están en los tipos generados.
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

type Sig = Partial<Record<IdiomaSig, string>>;
export type FilaSignificado = {
  id: string; gn: string; es: string; enLeccion: boolean;
  aprobado: string | null; propuesto: string | null;
};

export const panelSignificados = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lang: z.enum(IDIOMAS_SIG) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esDocente(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const [{ data: words, error }, { data: links }] = await Promise.all([
      db.from("corpus_words").select("id, gn, es, significados, significados_propuestos").eq("status", "published").order("gn"),
      db.from("lesson_words").select("word_id"),
    ]);
    if (error) throw new Error(error.message);
    const enLeccion = new Set(((links ?? []) as { word_id: string }[]).map((l) => l.word_id));
    const filas: FilaSignificado[] = ((words ?? []) as { id: string; gn: string; es: string; significados: Sig; significados_propuestos: Sig }[])
      .map((w) => ({
        id: w.id, gn: w.gn, es: w.es, enLeccion: enLeccion.has(w.id),
        aprobado: w.significados?.[data.lang] ?? null, propuesto: w.significados_propuestos?.[data.lang] ?? null,
      }))
      // Primero lo que falta revisar y lo que está en las lecciones.
      .sort((a, b) => Number(!!a.aprobado) - Number(!!b.aprobado) || Number(b.enLeccion) - Number(a.enLeccion) || a.gn.localeCompare(b.gn));
    return filas;
  });

/** Aprueba (o corrige y aprueba) el significado de varias palabras en un idioma. */
export const aprobarSignificados = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    lang: z.enum(IDIOMAS_SIG),
    items: z.array(z.object({ id: z.string().uuid(), texto: z.string().trim().min(1).max(160) })).min(1).max(300),
  }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esDocente(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const ids = data.items.map((i) => i.id);
    const { data: rows, error } = await db.from("corpus_words")
      .select("id, significados, significados_propuestos, significados_revision").in("id", ids).eq("status", "published");
    if (error) throw new Error(error.message);
    const ahora = new Date().toISOString();
    let ok = 0;
    for (const r of (rows ?? []) as { id: string; significados: Sig; significados_propuestos: Sig; significados_revision: Record<string, unknown> }[]) {
      const texto = data.items.find((i) => i.id === r.id)!.texto;
      const propuestos = { ...(r.significados_propuestos ?? {}) };
      delete propuestos[data.lang];
      const { error: e } = await db.from("corpus_words").update({
        significados: { ...(r.significados ?? {}), [data.lang]: texto },
        significados_propuestos: propuestos,
        significados_revision: { ...(r.significados_revision ?? {}), [data.lang]: { por: context.userId, at: ahora } },
      }).eq("id", r.id);
      if (!e) ok++;
    }
    return { aprobados: ok };
  });

/** Saca un significado aprobado (vuelve a quedar como propuesta y la lección muestra el castellano). */
export const quitarSignificado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lang: z.enum(IDIOMAS_SIG), id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esDocente(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { data: r } = await db.from("corpus_words").select("significados, significados_propuestos, significados_revision").eq("id", data.id).maybeSingle();
    if (!r) throw new Error("No existe esa palabra");
    const sig = { ...(r.significados ?? {}) } as Sig;
    const texto = sig[data.lang];
    delete sig[data.lang];
    const rev = { ...(r.significados_revision ?? {}) };
    delete rev[data.lang];
    const { error } = await db.from("corpus_words").update({
      significados: sig,
      significados_propuestos: texto ? { ...(r.significados_propuestos ?? {}), [data.lang]: texto } : r.significados_propuestos,
      significados_revision: rev,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
