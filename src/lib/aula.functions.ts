import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  JUEGOS_ASIGNABLES,
  hoyPy,
  normalizarCodigo,
  nuevoCodigo,
  refLeccion,
  tareaHecha,
  type Avance,
  type Tarea,
} from "@/lib/aula";

/**
 * Aula para docentes.
 * - Docente de aula: admin, docente validador o persona habilitada por el administrador (aula_docentes).
 * - Alumno: cualquier cuenta que entra con el código del aula; así elige compartir su avance con ese docente.
 * - El docente ve el nombre y el avance de sus alumnos, nunca el correo.
 */

const MAX_AULAS_DOCENTE = 30;
const MAX_ALUMNOS_AULA = 200;
const MAX_TAREAS_AULA = 100;
const MAX_AULAS_ALUMNO = 10;

// Las tablas del aula todavía no están en los tipos generados (se regeneran al aplicar la migración).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Rpc = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: any, args: any) => any;
};

async function quienSoy(supabase: Rpc, userId: string) {
  const db = await admin();
  const [a, e, d] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
    db.from("aula_docentes").select("estado, institucion").eq("user_id", userId).maybeSingle(),
  ]);
  const isAdmin = a.data === true;
  const isEditor = e.data === true;
  const solicitud = (d.data ?? null) as { estado: string; institucion: string } | null;
  const esDocente = isAdmin || isEditor || solicitud?.estado === "aprobado";
  return { isAdmin, esDocente, solicitud };
}

type AulaRow = { id: string; nombre: string; institucion: string; codigo: string; docente_id: string; activa: boolean; created_at: string };
type TareaRow = { id: string; aula_id: string; tipo: "leccion" | "juego"; ref: string; titulo: string; nota: string; fecha_limite: string | null; created_at: string };

function toTarea(r: TareaRow): Tarea {
  return { id: r.id, tipo: r.tipo, ref: r.ref, titulo: r.titulo, nota: r.nota, fechaLimite: r.fecha_limite, createdAt: r.created_at };
}

/** Lecciones y juegos terminados por estos alumnos, solo de las tareas que importan. */
async function avancesDe(userIds: string[], refs: string[]): Promise<Avance[]> {
  if (userIds.length === 0 || refs.length === 0) return [];
  const db = await admin();
  const out: Avance[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await db
      .from("xp_transactions")
      .select("user_id, source, source_ref, created_at")
      .in("user_id", userIds)
      .in("source", ["lesson", "game"])
      .in("source_ref", refs)
      .order("created_at")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) out.push({ userId: r.user_id, source: r.source, ref: r.source_ref, at: r.created_at });
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function nombres(ids: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  if (ids.length === 0) return m;
  const db = await admin();
  const { data } = await db.from("profiles").select("id, full_name").in("id", ids);
  for (const p of data ?? []) m.set(p.id, (p.full_name as string | null)?.trim() || "Sin nombre");
  return m;
}

async function aulaDelDocente(aulaId: string, userId: string, yo: { isAdmin: boolean; esDocente: boolean }): Promise<AulaRow> {
  // Quien perdió la habilitación de docente ya no puede ver ni tocar sus aulas viejas.
  if (!yo.esDocente) throw new Error("Tu acceso de docente no está activo.");
  const isAdmin = yo.isAdmin;
  const db = await admin();
  const { data } = await db.from("aulas").select("*").eq("id", aulaId).maybeSingle();
  if (!data || (data.docente_id !== userId && !isAdmin)) throw new Error("No encontramos esa aula.");
  return data as AulaRow;
}

/* ------------------------------ Alumno ------------------------------ */

/** Pantalla del alumno: sus aulas con las tareas y si ya las hizo. */
export const getMisAulas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    const db = await admin();
    const { data: mem } = await db.from("aula_miembros").select("aula_id").eq("user_id", context.userId);
    const ids = (mem ?? []).map((m: { aula_id: string }) => m.aula_id);
    let aulas: AulaRow[] = [];
    let tareas: TareaRow[] = [];
    if (ids.length) {
      const [a, t] = await Promise.all([
        db.from("aulas").select("*").in("id", ids).eq("activa", true),
        db.from("aula_tareas").select("*").in("aula_id", ids).order("created_at"),
      ]);
      aulas = (a.data ?? []) as AulaRow[];
      tareas = (t.data ?? []) as TareaRow[];
    }
    const avances = await avancesDe([context.userId], [...new Set(tareas.map((t) => t.ref))]);
    const docentes = await nombres([...new Set(aulas.map((a) => a.docente_id))]);
    const hoy = hoyPy();
    return {
      esDocente: yo.esDocente,
      solicitud: yo.solicitud?.estado ?? null,
      hoy,
      aulas: aulas.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        institucion: a.institucion,
        docente: docentes.get(a.docente_id) ?? "",
        tareas: tareas
          .filter((t) => t.aula_id === a.id)
          .map((t) => ({ ...toTarea(t), hecha: tareaHecha(toTarea(t), avances) })),
      })),
    };
  });

/** Entrar a un aula con el código que dio el docente. */
export const unirseAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ codigo: z.string().trim().min(4).max(12) }).parse(d))
  .handler(async ({ data, context }) => {
    const { consumeRateLimit } = await import("@/lib/server-guards.server");
    if (!(await consumeRateLimit(`aula-unirse:${context.userId}`, 20, 3600)))
      throw new Error("Probaste muchos códigos. Esperá un rato y volvé a intentar.");
    const codigo = normalizarCodigo(data.codigo);
    const db = await admin();
    const { data: aula } = await db.from("aulas").select("id, nombre, docente_id, activa").eq("codigo", codigo).maybeSingle();
    if (!aula || !aula.activa) throw new Error("No encontramos un aula con ese código. Revisalo con tu docente.");
    if (aula.docente_id === context.userId) throw new Error("Esta es tu propia aula: la ves en «Mis aulas como docente».");
    const { count: mias } = await db
      .from("aula_miembros")
      .select("aula_id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    if ((mias ?? 0) >= MAX_AULAS_ALUMNO) throw new Error(`Podés estar en hasta ${MAX_AULAS_ALUMNO} aulas.`);
    const { count: alumnos } = await db
      .from("aula_miembros")
      .select("user_id", { count: "exact", head: true })
      .eq("aula_id", aula.id);
    if ((alumnos ?? 0) >= MAX_ALUMNOS_AULA) throw new Error("Esta aula ya está completa. Avisale a tu docente.");
    const { error } = await db
      .from("aula_miembros")
      .upsert({ aula_id: aula.id, user_id: context.userId }, { onConflict: "aula_id,user_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true, nombre: aula.nombre as string };
  });

export const salirAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ aulaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    await db.from("aula_miembros").delete().eq("aula_id", data.aulaId).eq("user_id", context.userId);
    return { ok: true };
  });

/* ------------------------------ Docente ------------------------------ */

/** Pedir acceso como docente de aula (lo aprueba el administrador). */
export const pedirAccesoDocente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ institucion: z.string().trim().min(2).max(120), nota: z.string().trim().max(300).default("") })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    if (yo.esDocente) return { ok: true, estado: "aprobado" };
    const db = await admin();
    const { error } = await db.from("aula_docentes").upsert(
      { user_id: context.userId, institucion: data.institucion, nota: data.nota, estado: "pendiente", decidido_por: null, decidido_at: null },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, estado: "pendiente" };
  });

/** Panel del docente: sus aulas, y para el administrador los pedidos de acceso. */
export const getPanelDocente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    const db = await admin();
    let aulas: (AulaRow & { alumnos: number; tareas: number })[] = [];
    if (yo.esDocente) {
      const { data } = await db
        .from("aulas")
        .select("*")
        .eq("docente_id", context.userId)
        .eq("activa", true)
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as AulaRow[];
      const ids = rows.map((r) => r.id);
      const [m, t] = ids.length
        ? await Promise.all([
            db.from("aula_miembros").select("aula_id").in("aula_id", ids),
            db.from("aula_tareas").select("aula_id").in("aula_id", ids),
          ])
        : [{ data: [] }, { data: [] }];
      aulas = rows.map((r) => ({
        ...r,
        alumnos: (m.data ?? []).filter((x: { aula_id: string }) => x.aula_id === r.id).length,
        tareas: (t.data ?? []).filter((x: { aula_id: string }) => x.aula_id === r.id).length,
      }));
    }
    let pedidos: { userId: string; nombre: string; email: string; institucion: string; nota: string; fecha: string }[] = [];
    if (yo.isAdmin) {
      const { data } = await db
        .from("aula_docentes")
        .select("user_id, institucion, nota, created_at")
        .eq("estado", "pendiente")
        .order("created_at");
      const rows = (data ?? []) as { user_id: string; institucion: string; nota: string; created_at: string }[];
      const { data: profs } = rows.length
        ? await db.from("profiles").select("id, full_name, email").in("id", rows.map((r) => r.user_id))
        : { data: [] };
      pedidos = rows.map((r) => {
        const p = (profs ?? []).find((x: { id: string }) => x.id === r.user_id);
        return {
          userId: r.user_id,
          nombre: p?.full_name ?? "",
          email: p?.email ?? "",
          institucion: r.institucion,
          nota: r.nota,
          fecha: r.created_at,
        };
      });
    }
    return {
      esDocente: yo.esDocente,
      isAdmin: yo.isAdmin,
      solicitud: yo.solicitud?.estado ?? null,
      aulas: aulas.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        institucion: a.institucion,
        codigo: a.codigo,
        alumnos: a.alumnos,
        tareas: a.tareas,
      })),
      pedidos,
    };
  });

export const decidirDocente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), aprobar: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    if (!yo.isAdmin) throw new Error("Solo el administrador habilita docentes.");
    const db = await admin();
    const { error } = await db
      .from("aula_docentes")
      .update({ estado: data.aprobar ? "aprobado" : "rechazado", decidido_por: context.userId, decidido_at: new Date().toISOString() })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const crearAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ nombre: z.string().trim().min(2).max(80), institucion: z.string().trim().max(120).default("") })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    if (!yo.esDocente) throw new Error("Primero pedí acceso como docente.");
    const db = await admin();
    const { count } = await db
      .from("aulas")
      .select("id", { count: "exact", head: true })
      .eq("docente_id", context.userId)
      .eq("activa", true);
    if ((count ?? 0) >= MAX_AULAS_DOCENTE) throw new Error(`Podés tener hasta ${MAX_AULAS_DOCENTE} aulas activas.`);
    const institucion = data.institucion || yo.solicitud?.institucion || "";
    for (let i = 0; i < 8; i++) {
      const codigo = nuevoCodigo();
      const { data: row, error } = await db
        .from("aulas")
        .insert({ nombre: data.nombre, institucion, codigo, docente_id: context.userId })
        .select("id, codigo")
        .single();
      if (!error) return { id: row.id as string, codigo: row.codigo as string };
      if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message);
    }
    throw new Error("No pudimos generar un código. Probá de nuevo.");
  });

export const archivarAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ aulaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    await aulaDelDocente(data.aulaId, context.userId, yo);
    const db = await admin();
    await db.from("aulas").update({ activa: false }).eq("id", data.aulaId);
    return { ok: true };
  });

/** Detalle de un aula para su docente: alumnos, tareas y quién hizo cada una. */
export const getAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ aulaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    const aula = await aulaDelDocente(data.aulaId, context.userId, yo);
    const db = await admin();
    const [m, t, lec] = await Promise.all([
      db.from("aula_miembros").select("user_id, joined_at").eq("aula_id", aula.id),
      db.from("aula_tareas").select("*").eq("aula_id", aula.id).order("created_at"),
      db.from("lessons").select("sort_order, title").eq("status", "published").order("sort_order"),
    ]);
    const miembros = (m.data ?? []) as { user_id: string; joined_at: string }[];
    const tareas = ((t.data ?? []) as TareaRow[]).map(toTarea);
    const ids = miembros.map((x) => x.user_id);
    const [avances, nom] = await Promise.all([avancesDe(ids, [...new Set(tareas.map((x) => x.ref))]), nombres(ids)]);

    // Última actividad de cada alumno (cualquier lección o juego).
    const ultima = new Map<string, string>();
    if (ids.length) {
      const desde = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
      const { data: tx } = await db
        .from("xp_transactions")
        .select("user_id, created_at")
        .in("user_id", ids)
        .gte("created_at", desde)
        .order("created_at", { ascending: false })
        .limit(5000);
      for (const r of tx ?? []) if (!ultima.has(r.user_id)) ultima.set(r.user_id, r.created_at);
    }

    const alumnos = miembros
      .map((x) => {
        const mios = avances.filter((a) => a.userId === x.user_id);
        const hechas = tareas.filter((tt) => tareaHecha(tt, mios)).map((tt) => tt.id);
        return { id: x.user_id, nombre: nom.get(x.user_id) ?? "Sin nombre", desde: x.joined_at, ultima: ultima.get(x.user_id) ?? null, hechas };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    return {
      aula: { id: aula.id, nombre: aula.nombre, institucion: aula.institucion, codigo: aula.codigo },
      hoy: hoyPy(),
      tareas,
      alumnos,
      lecciones: ((lec.data ?? []) as { sort_order: number; title: string }[]).map((l) => ({ n: l.sort_order, titulo: l.title })),
      juegos: JUEGOS_ASIGNABLES.map((j) => ({ ref: j.ref, titulo: j.titulo })),
    };
  });

export const agregarTarea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        aulaId: z.string().uuid(),
        tipo: z.enum(["leccion", "juego"]),
        ref: z.string().trim().min(1).max(60),
        fechaLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
        nota: z.string().trim().max(300).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    const aula = await aulaDelDocente(data.aulaId, context.userId, yo);
    const db = await admin();
    let titulo = "";
    let ref = data.ref;
    if (data.tipo === "juego") {
      const j = JUEGOS_ASIGNABLES.find((x) => x.ref === data.ref);
      if (!j) throw new Error("Ese juego no se puede asignar.");
      titulo = `Jugar: ${j.titulo}`;
    } else {
      const n = Number(data.ref);
      if (!Number.isInteger(n)) throw new Error("Lección no válida.");
      const { data: l } = await db.from("lessons").select("sort_order, title").eq("sort_order", n).eq("status", "published").maybeSingle();
      if (!l) throw new Error("Esa lección no está publicada.");
      titulo = `Lección ${l.sort_order}: ${l.title}`;
      ref = refLeccion(n);
    }
    const { count } = await db.from("aula_tareas").select("id", { count: "exact", head: true }).eq("aula_id", aula.id);
    if ((count ?? 0) >= MAX_TAREAS_AULA) throw new Error(`Hasta ${MAX_TAREAS_AULA} tareas por aula.`);
    const { error } = await db.from("aula_tareas").insert({
      aula_id: aula.id,
      tipo: data.tipo,
      ref,
      titulo: titulo.slice(0, 120),
      nota: data.nota,
      fecha_limite: data.fechaLimite,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarTarea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ aulaId: z.string().uuid(), tareaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    await aulaDelDocente(data.aulaId, context.userId, yo);
    const db = await admin();
    await db.from("aula_tareas").delete().eq("id", data.tareaId).eq("aula_id", data.aulaId);
    return { ok: true };
  });

export const quitarAlumno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ aulaId: z.string().uuid(), userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    await aulaDelDocente(data.aulaId, context.userId, yo);
    const db = await admin();
    await db.from("aula_miembros").delete().eq("aula_id", data.aulaId).eq("user_id", data.userId);
    return { ok: true };
  });

/** Datos para imprimir la constancia de participación de un alumno. */
export const getConstancia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ aulaId: z.string().uuid(), userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const yo = await quienSoy(context.supabase, context.userId);
    const aula = await aulaDelDocente(data.aulaId, context.userId, yo);
    const db = await admin();
    const { data: mem } = await db
      .from("aula_miembros")
      .select("joined_at")
      .eq("aula_id", aula.id)
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!mem) throw new Error("Ese alumno no está en el aula.");
    const { data: t } = await db.from("aula_tareas").select("*").eq("aula_id", aula.id).order("created_at");
    const tareas = ((t ?? []) as TareaRow[]).map(toTarea);
    const avances = await avancesDe([data.userId], [...new Set(tareas.map((x) => x.ref))]);
    const nom = await nombres([data.userId, aula.docente_id]);
    return {
      alumno: nom.get(data.userId) ?? "",
      docente: nom.get(aula.docente_id) ?? "",
      aula: aula.nombre,
      institucion: aula.institucion,
      desde: mem.joined_at as string,
      hoy: hoyPy(),
      tareas: tareas.map((x) => ({ titulo: x.titulo, hecha: tareaHecha(x, avances) })),
    };
  });
