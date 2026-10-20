import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * «Señalar un error»: cualquier usuario con sesión avisa que una palabra, su significado o su audio
 * parece estar mal. El aviso no cambia nada del corpus: lo revisa el equipo docente (revisores,
 * docentes validadores o admin) y, si corresponde, la corrección entra por el circuito de validación.
 */

export type ReportType = "escritura" | "significado" | "audio" | "otro";
export type ReportStatus = "abierto" | "resuelto" | "descartado";

export interface ContentReport {
  id: string;
  word_gn: string;
  word_es: string;
  lugar: string;
  tipo: ReportType;
  mensaje: string;
  estado: ReportStatus;
  created_at: string;
  revisado_at: string | null;
  reporterName: string;
  reviewerName: string | null;
}

const DAILY_LIMIT = 20;

// La tabla nueva todavía no está en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function canReview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
) {
  const db = await admin();
  const [a, e, r] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
    db.from("content_reviewers").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  return a.data === true || e.data === true || !!r.data;
}

async function namesFor(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter(Boolean))] as string[];
  if (unique.length === 0) return new Map<string, string>();
  const db = await admin();
  const { data } = await db.from("profiles").select("id, full_name, email").in("id", unique);
  return new Map<string, string>(
    ((data ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((p) => [
      p.id,
      p.full_name || p.email || "Usuario",
    ]),
  );
}

const reportInput = z.object({
  gn: z.string().trim().min(1).max(200),
  es: z.string().trim().max(300).default(""),
  lugar: z.string().trim().min(1).max(120),
  tipo: z.enum(["escritura", "significado", "audio", "otro"]),
  mensaje: z.string().trim().min(3).max(500),
});

/** Guarda un aviso de error. Límite: 20 por usuario por día. */
export const reportContentError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reportInput.parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .eq("reported_by", context.userId)
      .gte("created_at", since);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return { ok: false as const, error: "Llegaste al límite de avisos por hoy. Gracias por tanta ayuda." };
    }
    const { error } = await db.from("content_reports").insert({
      reported_by: context.userId,
      word_gn: data.gn,
      word_es: data.es,
      lugar: data.lugar,
      tipo: data.tipo,
      mensaje: data.mensaje,
    });
    if (error) return { ok: false as const, error: "No se pudo guardar el aviso. Probá de nuevo." };
    return { ok: true as const };
  });

/** Bandeja del equipo docente: avisos abiertos y los últimos revisados. */
export const listContentReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await canReview(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const cols = "id, reported_by, word_gn, word_es, lugar, tipo, mensaje, estado, created_at, revisado_por, revisado_at";
    const [open, done] = await Promise.all([
      db.from("content_reports").select(cols).eq("estado", "abierto").order("created_at", { ascending: true }).limit(200),
      db.from("content_reports").select(cols).neq("estado", "abierto").order("revisado_at", { ascending: false }).limit(20),
    ]);
    if (open.error) throw new Error(open.error.message);
    type Row = Omit<ContentReport, "reporterName" | "reviewerName"> & { reported_by: string; revisado_por: string | null };
    const rows = [...((open.data ?? []) as Row[]), ...((done.data ?? []) as Row[])];
    const names = await namesFor(rows.flatMap((r) => [r.reported_by, r.revisado_por]));
    const shape = (r: Row): ContentReport => ({
      id: r.id,
      word_gn: r.word_gn,
      word_es: r.word_es,
      lugar: r.lugar,
      tipo: r.tipo,
      mensaje: r.mensaje,
      estado: r.estado,
      created_at: r.created_at,
      revisado_at: r.revisado_at,
      reporterName: names.get(r.reported_by) ?? "Usuario",
      reviewerName: r.revisado_por ? (names.get(r.revisado_por) ?? "Equipo docente") : null,
    });
    return {
      open: ((open.data ?? []) as Row[]).map(shape),
      done: ((done.data ?? []) as Row[]).map(shape),
    };
  });

/** Marca un aviso como resuelto o descartado (o lo vuelve a abrir). */
export const setContentReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), estado: z.enum(["abierto", "resuelto", "descartado"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await canReview(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const reopen = data.estado === "abierto";
    const { error } = await db
      .from("content_reports")
      .update({
        estado: data.estado,
        revisado_por: reopen ? null : context.userId,
        revisado_at: reopen ? null : new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
