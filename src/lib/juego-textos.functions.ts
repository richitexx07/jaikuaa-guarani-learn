import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { JUEGO_CAMPOS, type JuegoId, type JuegoTexto } from "@/lib/juego-textos";

/**
 * Guaraní de los juegos.
 * - Cualquier cuenta lee lo que escribieron los docentes (los juegos lo muestran).
 * - Solo un docente validador (rol "editor") o el admin escribe o borra. Queda su nombre.
 * - Nadie del equipo técnico escribe guaraní: este código solo guarda lo que escribe el docente.
 */

// La tabla juego_textos todavía no está en los tipos generados (se regeneran al aplicar la migración).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function roles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
) {
  const [a, e] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
  ]);
  return { isStaff: a.data === true || e.data === true };
}

const JuegoSchema = z.enum(["trivia", "tekojoja", "karaoke", "tembiu", "taanga"]);

export const listJuegoTextos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await roles(context.supabase, context.userId);
    const db = await admin();
    const { data, error } = await db
      .from("juego_textos")
      .select("juego, clave, campo, texto, escrito_por_nombre, updated_at")
      .limit(5000);
    // Si la tabla todavía no existe, los juegos siguen con su contenido de siempre.
    if (error) return { textos: [] as JuegoTexto[], isStaff: r.isStaff };
    const textos: JuegoTexto[] = (data ?? []).map((x: Record<string, string | null>) => ({
      juego: x.juego as JuegoId,
      clave: x.clave as string,
      campo: x.campo as string,
      texto: x.texto as string,
      por: x.escrito_por_nombre ?? null,
      cuando: x.updated_at as string,
    }));
    return { textos, isStaff: r.isStaff };
  });

/** Guarda (o borra, si viene vacío) lo que escribió el docente para un campo de un juego. */
export const saveJuegoTexto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        juego: JuegoSchema,
        clave: z.string().trim().min(1).max(80),
        campo: z.string().trim().min(1).max(40),
        texto: z.string().trim().max(600),
      })
      .refine((x) => JUEGO_CAMPOS[x.juego].includes(x.campo), { message: "Campo no válido." })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.isStaff) throw new Error("Solo docentes validadores o administradores.");
    const db = await admin();
    if (!data.texto) {
      const { error } = await db
        .from("juego_textos")
        .delete()
        .eq("juego", data.juego)
        .eq("clave", data.clave)
        .eq("campo", data.campo);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { data: prof } = await db.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();
    const { error } = await db.from("juego_textos").upsert(
      {
        juego: data.juego,
        clave: data.clave,
        campo: data.campo,
        texto: data.texto,
        escrito_por: context.userId,
        escrito_por_nombre: (prof?.full_name as string | null)?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "juego,clave,campo" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
