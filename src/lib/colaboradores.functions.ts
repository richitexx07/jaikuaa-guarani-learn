import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizarWhatsapp } from "@/lib/purahei";
import { APORTE_IDS, ESTADO_IDS, faltaPostulacion, type EstadoColaborador } from "@/lib/colaboradores";

/**
 * Postulaciones de colaboradores. El público solo puede enviar la suya; la administración y los docentes
 * las ven y las marcan (contactado, seleccionado, descartado). La tabla no se lee desde el navegador.
 */

// La tabla nueva todavía no está en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function esEquipo(supabase: any, userId: string): Promise<boolean> {
  const [a, e] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
  ]);
  return a.data === true || e.data === true;
}

const corto = (n: number) => z.string().max(n);

export const postularColaborador = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    nombre: corto(120), departamento: corto(60), ciudad: corto(120), whatsapp: corto(30), email: corto(255),
    perfil: corto(30), institucion: corto(160), lenguas: corto(200), aportes: z.array(corto(20)).max(6),
    capacitacion: z.boolean().nullable(), comentario: corto(800), acepto: z.boolean(), origen: corto(40),
    // Campo trampa: las personas no lo ven; los robots lo llenan.
    sitio: corto(200),
  }).parse(d))
  .handler(async ({ data }) => {
    if (data.sitio.trim()) return { ok: true };
    const aportes = data.aportes.filter((a) => (APORTE_IDS as readonly string[]).includes(a));
    const falta = faltaPostulacion({ ...data, aportes }, (n) => !!normalizarWhatsapp(n));
    if (falta.length) throw new Error(`Falta: ${falta.join(", ")}`);
    const { clientIp, consumeRateLimit } = await import("@/lib/server-guards.server");
    const ip = clientIp(getRequest()?.headers ?? new Headers());
    if (!(await consumeRateLimit(`colaboradores:ip:${ip}`, 8, 3600))) throw new Error("Recibimos varias postulaciones desde esta conexión. Probá de nuevo en una hora.");
    const db = await admin();
    const { error } = await db.from("colaboradores_postulaciones").insert({
      nombre: data.nombre.trim().replace(/\s+/g, " "), departamento: data.departamento, ciudad: data.ciudad.trim(),
      whatsapp: data.whatsapp.trim() ? normalizarWhatsapp(data.whatsapp) : null,
      email: data.email.trim() ? data.email.trim().toLowerCase() : null,
      perfil: data.perfil, institucion: data.institucion.trim(), lenguas: data.lenguas.trim(), aportes,
      capacitacion: data.capacitacion === true, comentario: data.comentario.trim(),
      origen: data.origen.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40),
    });
    if (error) throw new Error("No se pudo guardar la postulación. Probá de nuevo.");
    return { ok: true };
  });

export type ColaboradorRow = {
  id: string; nombre: string; departamento: string; ciudad: string; whatsapp: string | null; email: string | null;
  perfil: string; institucion: string; lenguas: string; aportes: string[]; capacitacion: boolean; comentario: string;
  origen: string; estado: EstadoColaborador; nota_interna: string; created_at: string;
};

export const panelColaboradores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await esEquipo(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { data, error } = await db.from("colaboradores_postulaciones")
      .select("id, nombre, departamento, ciudad, whatsapp, email, perfil, institucion, lenguas, aportes, capacitacion, comentario, origen, estado, nota_interna, created_at")
      .order("created_at", { ascending: false }).limit(3000);
    if (error) throw new Error(error.message);
    return { filas: (data ?? []) as ColaboradorRow[] };
  });

export const actualizarColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), estado: z.enum(ESTADO_IDS), nota: z.string().max(600) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esEquipo(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { error } = await db.from("colaboradores_postulaciones")
      .update({ estado: data.estado, nota_interna: data.nota.trim(), revisado_por: context.userId, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
