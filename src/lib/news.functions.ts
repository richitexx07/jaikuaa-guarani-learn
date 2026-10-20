import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Ñande Marandu: noticias del guaraní con aprobación humana (tabla public.noticias).
 * Una tarea programada carga cada mañana noticias verificadas como «pendiente»; solo un
 * administrador las publica. Cada noticia lleva su fuente y el enlace a la nota original.
 */

export type NewsCategory = "Cultura" | "Educación" | "Comunidad";
export type NewsStatus = "pendiente" | "publicada" | "descartada";

export interface NewsRow {
  id: string;
  titulo: string;
  resumen: string;
  categoria: NewsCategory;
  emoji: string;
  fuente: string;
  url: string;
  fecha_nota: string;
  estado: NewsStatus;
  created_at: string;
}

const COLUMNS = "id, titulo, resumen, categoria, emoji, fuente, url, fecha_nota, estado, created_at";

// La tabla nueva todavía no está en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

/** Noticias publicadas, de la más nueva a la más vieja. Públicas: no devuelve nada más. */
export const listPublishedNews = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db
    .from("noticias")
    .select(COLUMNS)
    .eq("estado", "publicada")
    .order("fecha_nota", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as NewsRow[] };
});

/** Bandeja del administrador: pendientes y las últimas publicadas. */
export const listNewsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = await admin();
    const [pending, published] = await Promise.all([
      db.from("noticias").select(COLUMNS).eq("estado", "pendiente").order("fecha_nota", { ascending: false }).limit(100),
      db.from("noticias").select(COLUMNS).eq("estado", "publicada").order("fecha_nota", { ascending: false }).limit(30),
    ]);
    if (pending.error) throw new Error(pending.error.message);
    if (published.error) throw new Error(published.error.message);
    return { pending: (pending.data ?? []) as NewsRow[], published: (published.data ?? []) as NewsRow[] };
  });

/** Publicar, descartar o volver a pendiente (solo administrador). */
export const setNewsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), estado: z.enum(["publicada", "descartada", "pendiente"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db
      .from("noticias")
      .update({ estado: data.estado, revisada_por: context.userId, revisada_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
