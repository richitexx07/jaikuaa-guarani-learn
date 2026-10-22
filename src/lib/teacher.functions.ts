import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Todo lo que necesita cada persona del piloto en una sola ventana:
 * - Docente validador (rol "editor"): Panel del docente.
 * - Estudiante del Ateneo en práctica (tabla content_reviewers): Panel de práctica.
 * - Administrador: además, los pedidos de habilitación para aprobar con un toque.
 * Nadie en el equipo técnico escribe guaraní: estas funciones solo cuentan, ordenan y habilitan.
 */

export type StaffKind = "docente" | "practicante";
export type StaffRequestStatus = "pendiente" | "aprobado" | "rechazado";

// La tabla staff_requests todavía no está en los tipos generados (se regeneran al aplicar la migración).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function rolesFor(
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
  const isAdmin = a.data === true;
  const isEditor = e.data === true;
  const isReviewer = !!r.data;
  return { isAdmin, isEditor, isReviewer, isTeacher: isAdmin || isEditor, isPractice: isReviewer };
}

function weekAgo() {
  return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
}

async function countOf(q: PromiseLike<{ count: number | null }>): Promise<number> {
  const { count } = await q;
  return count ?? 0;
}

async function constanciaApproved(db: Awaited<ReturnType<typeof admin>>): Promise<boolean> {
  const { data } = await db.from("app_settings").select("value").eq("key", "constancia_aprobada").maybeSingle();
  return !!data && ["1", "true", "si", "sí"].includes(String(data.value).trim().toLowerCase());
}

/* ------------------------------ Mi lugar en el piloto ------------------------------ */

/** Roles, grupo y pedido de habilitación del usuario actual. */
export const getMyStaffStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const [roles, prof, req] = await Promise.all([
      rolesFor(context.supabase, context.userId),
      db.from("profiles").select("full_name, cohort").eq("id", context.userId).maybeSingle(),
      db
        .from("staff_requests")
        .select("kind, status, full_name, institution, created_at, decided_at")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    return {
      ...roles,
      fullName: (prof.data?.full_name as string | null) ?? "",
      cohort: (prof.data?.cohort as string | null) ?? null,
      request: (req.data ?? null) as {
        kind: StaffKind;
        status: StaffRequestStatus;
        full_name: string;
        institution: string;
        created_at: string;
        decided_at: string | null;
      } | null,
    };
  });

/** Un docente pide ser validador, o un estudiante del Ateneo pide hacer su práctica. */
export const requestStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        kind: z.enum(["docente", "practicante"]),
        fullName: z.string().trim().min(3, "Escribí tu nombre y apellido").max(120),
        institution: z.string().trim().max(120).default("Ateneo de Lengua y Cultura Guaraní"),
        note: z.string().trim().max(300).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await admin();
    const roles = await rolesFor(context.supabase, context.userId);
    if ((data.kind === "docente" && roles.isTeacher) || (data.kind === "practicante" && (roles.isPractice || roles.isTeacher))) {
      return { ok: true as const, already: true };
    }
    const { data: prev } = await db.from("staff_requests").select("status").eq("user_id", context.userId).maybeSingle();
    if (prev?.status === "rechazado") {
      return { ok: false as const, error: "Tu pedido anterior no fue aprobado. Escribile a Richard por WhatsApp para conversarlo." };
    }
    const row = {
      user_id: context.userId,
      kind: data.kind,
      full_name: data.fullName,
      institution: data.institution,
      note: data.note,
      status: "pendiente",
      decided_by: null,
      decided_at: null,
    };
    const { error } = await db.from("staff_requests").upsert(row, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    // El nombre que escribió también queda en su perfil si todavía no tenía.
    const { data: prof } = await db.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();
    if (!prof?.full_name) await db.from("profiles").update({ full_name: data.fullName }).eq("id", context.userId);
    return { ok: true as const, already: false };
  });

/** Pedidos de habilitación (solo administrador). */
export const listStaffRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    if (!roles.isAdmin) throw new Error("Forbidden");
    const db = await admin();
    const { data: rows, error } = await db
      .from("staff_requests")
      .select("id, user_id, kind, full_name, institution, note, status, created_at, decided_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as {
      id: string;
      user_id: string;
      kind: StaffKind;
      full_name: string;
      institution: string;
      note: string;
      status: StaffRequestStatus;
      created_at: string;
      decided_at: string | null;
    }[];
    const ids = list.map((r) => r.user_id);
    const emails = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await db.from("profiles").select("id, email").in("id", ids);
      for (const p of profs ?? []) emails.set(p.id, p.email ?? "");
    }
    const withEmail = list.map((r) => ({ ...r, email: emails.get(r.user_id) ?? "" }));
    return {
      pending: withEmail.filter((r) => r.status === "pendiente"),
      decided: withEmail.filter((r) => r.status !== "pendiente").slice(0, 20),
    };
  });

/** Aprobar o rechazar con un toque. Aprobar docente = validador; aprobar practicante = revisor. */
export const decideStaffRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["aprobar", "rechazar"]),
        cohort: z.string().trim().min(1).max(60).nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    if (!roles.isAdmin) throw new Error("Forbidden");
    const db = await admin();
    const { data: req } = await db.from("staff_requests").select("id, user_id, kind, status").eq("id", data.id).maybeSingle();
    if (!req) throw new Error("No encontramos el pedido");

    if (data.decision === "aprobar") {
      if (req.kind === "docente") {
        const { data: existing } = await db
          .from("user_roles")
          .select("id")
          .eq("user_id", req.user_id)
          .eq("role", "editor")
          .maybeSingle();
        if (!existing) {
          const { error } = await db.from("user_roles").insert({ user_id: req.user_id, role: "editor" });
          if (error) throw new Error(error.message);
        }
      } else {
        const { error } = await db
          .from("content_reviewers")
          .upsert({ user_id: req.user_id, added_by: context.userId }, { onConflict: "user_id" });
        if (error) throw new Error(error.message);
      }
      if (data.cohort) await db.from("profiles").update({ cohort: data.cohort }).eq("id", req.user_id);
    }
    const { error } = await db
      .from("staff_requests")
      .update({
        status: data.decision === "aprobar" ? "aprobado" : "rechazado",
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------- Panel del docente ---------------------------------- */

/** Todo lo de hoy para el docente, en números. */
export const getTeacherHome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    if (!roles.isTeacher) throw new Error("Forbidden");
    const db = await admin();
    const me = context.userId;
    const since = weekAgo();

    const [prof, lessonLinks, pendingWords] = await Promise.all([
      db.from("profiles").select("full_name, cohort").eq("id", me).maybeSingle(),
      db.from("lesson_words").select("word_id"),
      db.from("corpus_words").select("id").is("validated_by", null).limit(5000),
    ]);
    const inLessons = new Set<string>((lessonLinks.data ?? []).map((l: { word_id: string }) => l.word_id));
    const pendingIds = (pendingWords.data ?? []).map((w: { id: string }) => w.id);
    const cohort = (prof.data?.cohort as string | null) ?? null;

    const [
      openReports,
      toReview,
      toValidate,
      myWords,
      myWordsWeek,
      myReviews,
      myValidations,
      groupSize,
      requests,
      practiceCount,
      approved,
    ] = await Promise.all([
      countOf(db.from("content_reports").select("id", { count: "exact", head: true }).eq("estado", "abierto")),
      countOf(
        db.from("content_proposals").select("id", { count: "exact", head: true }).eq("status", "propuesta").neq("proposed_by", me),
      ),
      roles.isTeacher
        ? countOf(
            db
              .from("content_proposals")
              .select("id", { count: "exact", head: true })
              .eq("status", "revisada")
              .neq("proposed_by", me)
              .neq("reviewed_by", me),
          )
        : Promise.resolve(0),
      countOf(db.from("corpus_words").select("id", { count: "exact", head: true }).eq("validated_by", me)),
      countOf(
        db.from("corpus_words").select("id", { count: "exact", head: true }).eq("validated_by", me).gte("validated_at", since),
      ),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("reviewed_by", me)),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("validated_by", me)),
      cohort ? countOf(db.from("profiles").select("id", { count: "exact", head: true }).eq("cohort", cohort)) : Promise.resolve(0),
      roles.isAdmin
        ? countOf(db.from("staff_requests").select("id", { count: "exact", head: true }).eq("status", "pendiente"))
        : Promise.resolve(0),
      countOf(db.from("content_reviewers").select("user_id", { count: "exact", head: true })),
      constanciaApproved(db),
    ]);

    return {
      isAdmin: roles.isAdmin,
      fullName: (prof.data?.full_name as string | null) ?? "",
      cohort,
      groupSize: Math.max(0, groupSize - 1),
      pending: {
        words: pendingIds.length,
        wordsInLessons: pendingIds.filter((id: string) => inLessons.has(id)).length,
        reports: openReports,
        toReview,
        toValidate,
        staffRequests: requests,
      },
      mine: { words: myWords, wordsWeek: myWordsWeek, reviews: myReviews, validations: myValidations },
      practiceCount,
      constanciaApproved: approved,
    };
  });

/**
 * Fila de validación rápida en el orden de las lecciones: primero lo que los alumnos ven antes.
 * Después, las palabras que no están en ninguna lección (primero las que tienen audio).
 */
export const listValidationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    if (!roles.isTeacher) throw new Error("Forbidden");
    const db = await admin();
    const [wordsRes, linksRes, lessonsRes, mineRes] = await Promise.all([
      db
        .from("corpus_words")
        .select("id, gn, es, audio_slug, has_audio, status, notes, category, validated_by")
        .is("validated_by", null)
        .order("gn")
        .limit(2000),
      db.from("lesson_words").select("lesson_id, word_id, position"),
      db.from("lessons").select("id, sort_order, title, status"),
      db.from("corpus_words").select("id", { count: "exact", head: true }).eq("validated_by", context.userId),
    ]);
    if (wordsRes.error) throw new Error(wordsRes.error.message);
    type L = { id: string; sort_order: number; title: string; status: string };
    const lessons = new Map<string, L>(((lessonsRes.data ?? []) as L[]).map((l) => [l.id, l]));
    // Para cada palabra, la primera lección (la de número más bajo) donde aparece.
    const firstLesson = new Map<string, { n: number; title: string; published: boolean; pos: number }>();
    for (const link of (linksRes.data ?? []) as { lesson_id: string; word_id: string; position: number }[]) {
      const l = lessons.get(link.lesson_id);
      if (!l) continue;
      const cur = firstLesson.get(link.word_id);
      if (!cur || l.sort_order < cur.n || (l.sort_order === cur.n && link.position < cur.pos)) {
        firstLesson.set(link.word_id, { n: l.sort_order, title: l.title, published: l.status === "published", pos: link.position ?? 0 });
      }
    }
    type W = {
      id: string;
      gn: string;
      es: string;
      audio_slug: string;
      has_audio: boolean;
      status: string;
      notes: string | null;
      category: string | null;
      validated_by: string | null;
    };
    const words = ((wordsRes.data ?? []) as W[]).map((w) => {
      const l = firstLesson.get(w.id);
      return { ...w, lesson: l ? { n: l.n, title: l.title, published: l.published } : null, _pos: l?.pos ?? 0 };
    });
    words.sort((a, b) => {
      if (a.lesson && b.lesson) return a.lesson.n - b.lesson.n || a._pos - b._pos;
      if (a.lesson) return -1;
      if (b.lesson) return 1;
      return Number(b.has_audio) - Number(a.has_audio) || a.gn.localeCompare(b.gn, "es");
    });
    return {
      words: words.map(({ _pos, ...w }) => w),
      myTotal: mineRes.count ?? 0,
    };
  });

/** Datos para la constancia del docente: nombre y cuánto validó. */
export const getMyConstancia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    if (!roles.isTeacher && !roles.isPractice) throw new Error("Forbidden");
    const db = await admin();
    const me = context.userId;
    const [prof, words, firstW, lastW, reviews, validations, proposals, approved] = await Promise.all([
      db.from("profiles").select("full_name, email").eq("id", me).maybeSingle(),
      countOf(db.from("corpus_words").select("id", { count: "exact", head: true }).eq("validated_by", me)),
      db.from("corpus_words").select("validated_at").eq("validated_by", me).order("validated_at", { ascending: true }).limit(1),
      db.from("corpus_words").select("validated_at").eq("validated_by", me).order("validated_at", { ascending: false }).limit(1),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("reviewed_by", me)),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("validated_by", me)),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("proposed_by", me)),
      constanciaApproved(db),
    ]);
    return {
      role: roles.isTeacher ? ("docente" as const) : ("practicante" as const),
      name: (prof.data?.full_name as string | null) || (prof.data?.email as string | null) || "",
      words,
      reviews,
      validations,
      proposals,
      from: (firstW.data?.[0]?.validated_at as string | undefined) ?? null,
      to: (lastW.data?.[0]?.validated_at as string | undefined) ?? null,
      approved,
    };
  });

/* ---------------------------------- Panel de práctica ---------------------------------- */

/** Números del estudiante en práctica y lo que hay para hacer hoy. */
export const getPracticeHome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    if (!roles.isPractice && !roles.isTeacher) throw new Error("Forbidden");
    const db = await admin();
    const me = context.userId;
    const since24 = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [prof, mine, today, toReview, myReviews] = await Promise.all([
      db.from("profiles").select("full_name").eq("id", me).maybeSingle(),
      db.from("content_proposals").select("status").eq("proposed_by", me).limit(5000),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("proposed_by", me).gte("proposed_at", since24)),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("status", "propuesta").neq("proposed_by", me)),
      countOf(db.from("content_proposals").select("id", { count: "exact", head: true }).eq("reviewed_by", me)),
    ]);
    const by: Record<string, number> = {};
    for (const p of (mine.data ?? []) as { status: string }[]) by[p.status] = (by[p.status] ?? 0) + 1;
    return {
      isTeacher: roles.isTeacher,
      fullName: (prof.data?.full_name as string | null) ?? "",
      today,
      dailyLimit: 20,
      toReview,
      mine: {
        total: (mine.data ?? []).length,
        waiting: (by.propuesta ?? 0) + (by.revisada ?? 0),
        returned: by.devuelta ?? 0,
        published: by.validada ?? 0,
        rejected: by.rechazada ?? 0,
        reviews: myReviews,
      },
    };
  });

/** Registro de práctica supervisada: cada paso hecho, con fecha y hora (para imprimir). */
export const getPracticeLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid().nullable().default(null) }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    const target = data.userId ?? context.userId;
    // Cada uno ve el suyo; los docentes y el administrador pueden ver el de cualquier practicante.
    if (target !== context.userId && !roles.isTeacher) throw new Error("Forbidden");
    if (target === context.userId && !roles.isPractice && !roles.isTeacher) throw new Error("Forbidden");
    const db = await admin();
    const [prof, proposed, reviewed] = await Promise.all([
      db.from("profiles").select("full_name, email").eq("id", target).maybeSingle(),
      db
        .from("content_proposals")
        .select("gn, es, status, proposed_at")
        .eq("proposed_by", target)
        .order("proposed_at", { ascending: true })
        .limit(2000),
      db
        .from("content_proposals")
        .select("gn, es, status, reviewed_at")
        .eq("reviewed_by", target)
        .order("reviewed_at", { ascending: true })
        .limit(2000),
    ]);
    type Row = { en: string; accion: "Propuso" | "Revisó"; gn: string; es: string; estado: string };
    const rows: Row[] = [
      ...((proposed.data ?? []) as { gn: string; es: string; status: string; proposed_at: string }[]).map((p) => ({
        en: p.proposed_at,
        accion: "Propuso" as const,
        gn: p.gn,
        es: p.es,
        estado: p.status,
      })),
      ...((reviewed.data ?? []) as { gn: string; es: string; status: string; reviewed_at: string }[]).map((p) => ({
        en: p.reviewed_at,
        accion: "Revisó" as const,
        gn: p.gn,
        es: p.es,
        estado: p.status,
      })),
    ].sort((a, b) => a.en.localeCompare(b.en));
    const days = new Set(rows.map((r) => new Date(r.en).toLocaleDateString("en-CA", { timeZone: "America/Asuncion" })));
    return {
      name: (prof.data?.full_name as string | null) || (prof.data?.email as string | null) || "",
      rows,
      days: days.size,
      proposed: (proposed.data ?? []).length,
      reviewed: (reviewed.data ?? []).length,
      published: ((proposed.data ?? []) as { status: string }[]).filter((p) => p.status === "validada").length,
    };
  });

/** Estudiantes en práctica, con lo que hicieron en los últimos 7 días (docentes y administrador). */
export const listPracticeStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context.supabase, context.userId);
    if (!roles.isTeacher) throw new Error("Forbidden");
    const db = await admin();
    const { data: revs } = await db.from("content_reviewers").select("user_id, created_at");
    const ids = ((revs ?? []) as { user_id: string }[]).map((r) => r.user_id);
    if (!ids.length) return { students: [] };
    const since = weekAgo();
    const [profs, props, reviews] = await Promise.all([
      db.from("profiles").select("id, full_name, email").in("id", ids),
      db.from("content_proposals").select("proposed_by, status, proposed_at").in("proposed_by", ids).limit(10000),
      db.from("content_proposals").select("reviewed_by, reviewed_at").in("reviewed_by", ids).limit(10000),
    ]);
    const students = ids.map((id) => {
      const p = (profs.data ?? []).find((x: { id: string }) => x.id === id) as
        | { full_name: string | null; email: string | null }
        | undefined;
      const mine = ((props.data ?? []) as { proposed_by: string; status: string; proposed_at: string }[]).filter(
        (x) => x.proposed_by === id,
      );
      const rv = ((reviews.data ?? []) as { reviewed_by: string; reviewed_at: string }[]).filter((x) => x.reviewed_by === id);
      return {
        id,
        name: p?.full_name || p?.email || "Estudiante",
        proposed: mine.length,
        proposedWeek: mine.filter((x) => x.proposed_at >= since).length,
        published: mine.filter((x) => x.status === "validada").length,
        reviews: rv.length,
        reviewsWeek: rv.filter((x) => x.reviewed_at >= since).length,
      };
    });
    students.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return { students };
  });
