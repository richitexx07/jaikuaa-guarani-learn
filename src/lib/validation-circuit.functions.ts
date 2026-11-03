import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify } from "@/lib/slug";

/**
 * Circuito de validación en tres niveles: una persona PROPONE, otra REVISA y una tercera VALIDA.
 * - Proponer: cualquier usuario con sesión (estudiantes, pasantes, docentes).
 * - Revisar: revisores avanzados (tabla content_reviewers), docentes validadores o admin.
 * - Validar: docentes validadores (rol "editor") o admin. Solo al validar entra al corpus.
 * Nunca la misma persona en dos pasos de la misma propuesta (también lo exige la base de datos).
 * Ni la IA ni el equipo técnico escriben guaraní: todo texto en guaraní llega de una persona.
 */

export type ProposalStatus = "propuesta" | "revisada" | "validada" | "devuelta" | "rechazada";
export type ProposalKind = "nueva" | "correccion";
type HistoryEntry = { paso: string; por: string; en: string; nota?: string };

type Proposal = {
  id: string;
  kind: ProposalKind;
  target_word_id: string | null;
  gn: string;
  es: string;
  notes: string;
  source: string;
  status: ProposalStatus;
  proposed_by: string;
  proposed_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  validated_by: string | null;
  validated_at: string | null;
  validation_note: string | null;
  published_word_id: string | null;
  history: HistoryEntry[];
};

const DAILY_LIMIT = 20;

// Las tablas nuevas todavía no están en los tipos generados (se regeneran al aplicar la migración).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function getCircuitRolesFor(
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
  return {
    isAdmin,
    isEditor,
    isReviewer,
    // Solo los habilitados del piloto (practicantes aprobados, docentes y admin) proponen contenido.
    canPropose: isAdmin || isEditor || isReviewer,
    canReview: isAdmin || isEditor || isReviewer,
    canValidate: isAdmin || isEditor,
  };
}

async function namesFor(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter(Boolean))] as string[];
  if (unique.length === 0) return new Map<string, string>();
  const db = await admin();
  const { data } = await db.from("profiles").select("id, full_name, email").in("id", unique);
  return new Map<string, string>(
    (data ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => [
      p.id,
      p.full_name || p.email || "Usuario",
    ]),
  );
}

function step(paso: string, por: string, nota?: string): HistoryEntry {
  return { paso, por, en: new Date().toISOString(), ...(nota ? { nota } : {}) };
}

/** Roles del usuario en el circuito. */
export const getCircuitRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getCircuitRolesFor(context.supabase, context.userId));

const TextSchema = z.object({
  gn: z.string().trim().min(1).max(200),
  es: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(1000).default(""),
  source: z.string().trim().max(300).default(""),
});

/** Paso 1: proponer una palabra nueva o una corrección de una palabra del corpus. */
export const proposeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    TextSchema.extend({
      kind: z.enum(["nueva", "correccion"]),
      targetWordId: z.string().uuid().nullable().default(null),
    })
      .refine((v) => v.kind === "nueva" || v.targetWordId, { message: "Elegí la palabra a corregir" })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const roles = await getCircuitRolesFor(context.supabase, context.userId);
    if (!roles.canPropose) {
      return { ok: false as const, error: "Solo las personas habilitadas del piloto pueden proponer palabras." };
    }
    const db = await admin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("content_proposals")
      .select("id", { count: "exact", head: true })
      .eq("proposed_by", context.userId)
      .gte("proposed_at", since);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return { ok: false as const, error: `Llegaste al máximo de ${DAILY_LIMIT} propuestas por día. Seguí mañana.` };
    }
    if (data.kind === "nueva") {
      const { data: exists } = await db.from("corpus_words").select("id").eq("gn", data.gn).maybeSingle();
      if (exists) return { ok: false as const, error: "Esa palabra ya está en el corpus. Si algo está mal, proponé una corrección." };
    } else {
      const { data: target } = await db.from("corpus_words").select("id").eq("id", data.targetWordId).maybeSingle();
      if (!target) return { ok: false as const, error: "No encontramos la palabra a corregir." };
    }
    const { error } = await db.from("content_proposals").insert({
      kind: data.kind,
      target_word_id: data.kind === "correccion" ? data.targetWordId : null,
      gn: data.gn,
      es: data.es,
      notes: data.notes,
      source: data.source,
      proposed_by: context.userId,
      history: [step("propuesta", context.userId)],
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Quien propuso corrige y vuelve a enviar una propuesta devuelta. */
export const resubmitProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TextSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: p } = await db.from("content_proposals").select("*").eq("id", data.id).maybeSingle();
    const prop = p as Proposal | null;
    if (!prop || prop.proposed_by !== context.userId) throw new Error("Forbidden");
    if (prop.status !== "devuelta") return { ok: false as const, error: "Solo se reenvían las propuestas devueltas." };
    const { error } = await db
      .from("content_proposals")
      .update({
        gn: data.gn,
        es: data.es,
        notes: data.notes,
        source: data.source,
        status: "propuesta",
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        validated_by: null,
        validated_at: null,
        validation_note: null,
        history: [...prop.history, step("reenviada", context.userId)],
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", "devuelta");
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Mis propuestas, con su estado y las notas de quien revisó o validó. */
export const listMyProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { data } = await db
      .from("content_proposals")
      .select("*")
      .eq("proposed_by", context.userId)
      .order("proposed_at", { ascending: false })
      .limit(200);
    return { proposals: (data ?? []) as Proposal[] };
  });

/** Bandeja de trabajo: "revisar" (propuestas nuevas) o "validar" (ya revisadas). Nunca muestra lo propio. */
export const listQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ step: z.enum(["revisar", "validar"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getCircuitRolesFor(context.supabase, context.userId);
    if (data.step === "revisar" && !roles.canReview) throw new Error("Forbidden");
    if (data.step === "validar" && !roles.canValidate) throw new Error("Forbidden");
    const db = await admin();
    const { data: rows, error } = await db
      .from("content_proposals")
      .select("*")
      .eq("status", data.step === "revisar" ? "propuesta" : "revisada")
      .neq("proposed_by", context.userId)
      .order("proposed_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    const list = ((rows ?? []) as Proposal[]).filter((p) => p.reviewed_by !== context.userId);
    const names = await namesFor(list.flatMap((p) => [p.proposed_by, p.reviewed_by]));
    const targetIds = list.map((p) => p.target_word_id).filter(Boolean);
    const targets = new Map<string, { gn: string; es: string }>();
    if (targetIds.length) {
      const { data: words } = await db.from("corpus_words").select("id, gn, es").in("id", targetIds);
      for (const w of words ?? []) targets.set(w.id, { gn: w.gn, es: w.es });
    }
    return {
      items: list.map((p) => ({
        ...p,
        proposerName: names.get(p.proposed_by) ?? "Usuario",
        reviewerName: p.reviewed_by ? (names.get(p.reviewed_by) ?? "Revisor") : null,
        current: p.target_word_id ? (targets.get(p.target_word_id) ?? null) : null,
      })),
    };
  });

const DecisionSchema = z
  .object({
    id: z.string().uuid(),
    decision: z.enum(["aprobar", "devolver", "rechazar"]),
    note: z.string().trim().max(1000).default(""),
  })
  .refine((v) => v.decision === "aprobar" || v.note.length > 0, {
    message: "Escribí el motivo para que la persona pueda corregir",
  });

/** Paso 2: revisión por un revisor avanzado (o docente). */
export const reviewProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DecisionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getCircuitRolesFor(context.supabase, context.userId);
    if (!roles.canReview) throw new Error("Forbidden");
    const db = await admin();
    const { data: p } = await db.from("content_proposals").select("*").eq("id", data.id).maybeSingle();
    const prop = p as Proposal | null;
    if (!prop) return { ok: false as const, error: "No encontramos la propuesta." };
    if (prop.status !== "propuesta") return { ok: false as const, error: "Otra persona ya la revisó." };
    if (prop.proposed_by === context.userId) return { ok: false as const, error: "No podés revisar tu propia propuesta." };
    const now = new Date().toISOString();
    const status: ProposalStatus =
      data.decision === "aprobar" ? "revisada" : data.decision === "devolver" ? "devuelta" : "rechazada";
    const paso = data.decision === "aprobar" ? "revisada" : data.decision === "devolver" ? "devuelta_en_revision" : "rechazada_en_revision";
    const { data: updated, error } = await db
      .from("content_proposals")
      .update({
        status,
        reviewed_by: context.userId,
        reviewed_at: now,
        review_note: data.note || null,
        history: [...prop.history, step(paso, context.userId, data.note)],
        updated_at: now,
      })
      .eq("id", data.id)
      .eq("status", "propuesta")
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated?.length) return { ok: false as const, error: "Otra persona ya la revisó." };
    return { ok: true as const };
  });

/** Paso 3: validación docente. Solo al aprobar entra al corpus, publicada y firmada por quien valida. */
export const validateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DecisionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getCircuitRolesFor(context.supabase, context.userId);
    if (!roles.canValidate) throw new Error("Forbidden");
    const db = await admin();
    const { data: p } = await db.from("content_proposals").select("*").eq("id", data.id).maybeSingle();
    const prop = p as Proposal | null;
    if (!prop) return { ok: false as const, error: "No encontramos la propuesta." };
    if (prop.status === "validada") return { ok: false as const, error: "Otra persona ya la validó." };
    if (prop.status !== "revisada") return { ok: false as const, error: "Esta propuesta ya no está esperando validación." };
    if (prop.proposed_by === context.userId || prop.reviewed_by === context.userId) {
      return { ok: false as const, error: "Valida una tercera persona: no podés validar lo que propusiste o revisaste." };
    }
    const now = new Date().toISOString();


    if (data.decision !== "aprobar") {
      const status: ProposalStatus = data.decision === "devolver" ? "devuelta" : "rechazada";
      const paso = data.decision === "devolver" ? "devuelta_en_validacion" : "rechazada_en_validacion";
      const { data: done, error } = await db
        .from("content_proposals")
        .update({
          status,
          validated_by: context.userId,
          validated_at: now,
          validation_note: data.note,
          history: [...prop.history, step(paso, context.userId, data.note)],
          updated_at: now,
        })
        .eq("id", data.id)
        .eq("status", "revisada")
        .select("id");
      if (error) throw new Error(error.message);
      if (!done?.length) return { ok: false as const, error: "Otra persona ya la validó." };
      return { ok: true as const };
    }

    // Aprobada. Primero se "toma" la propuesta (solo si sigue revisada): así, si dos docentes
    // aprueban a la vez, la palabra entra al corpus una sola vez.
    const { data: claimed, error: claimError } = await db
      .from("content_proposals")
      .update({
        status: "validada",
        validated_by: context.userId,
        validated_at: now,
        validation_note: data.note || null,
        history: [...prop.history, step("validada", context.userId, data.note)],
        updated_at: now,
      })
      .eq("id", data.id)
      .eq("status", "revisada")
      .select("id");
    if (claimError) throw new Error(claimError.message);
    if (!claimed?.length) return { ok: false as const, error: "Otra persona ya la validó." };
    // Si algo falla al pasar al corpus, la propuesta vuelve a quedar revisada, como estaba.
    const release = () =>
      db
        .from("content_proposals")
        .update({
          status: "revisada",
          validated_by: null,
          validated_at: null,
          validation_note: null,
          history: prop.history,
          updated_at: now,
        })
        .eq("id", data.id);

    let wordId: string | null = null;
    let audioWarning = false;
    if (prop.kind === "nueva") {
      const { data: exists } = await db.from("corpus_words").select("id").eq("gn", prop.gn).maybeSingle();
      if (exists) {
        await release();
        return { ok: false as const, error: "Esa palabra ya entró al corpus por otro lado. Devolvela como duplicada." };
      }
      const { data: inserted, error } = await db
        .from("corpus_words")
        .insert({
          gn: prop.gn,
          es: prop.es,
          notes: prop.notes,
          audio_slug: slugify(prop.gn),
          has_audio: false,
          status: "published",
          validated_by: context.userId,
          validated_at: now,
        })
        .select("id")
        .single();
      if (error) {
        await release();
        throw new Error(error.message);
      }
      wordId = inserted.id;
    } else {
      const { data: target } = await db.from("corpus_words").select("id, gn").eq("id", prop.target_word_id).maybeSingle();
      if (!target) {
        await release();
        return { ok: false as const, error: "La palabra a corregir ya no existe en el corpus." };
      }
      const patch: Record<string, unknown> = {
        es: prop.es,
        notes: prop.notes,
        status: "published",
        validated_by: context.userId,
        validated_at: now,
      };
      if (target.gn !== prop.gn) {
        // Cambió la escritura: el audio grabado corresponde a la forma anterior y hay que volver a grabarlo.
        patch.gn = prop.gn;
        patch.audio_slug = slugify(prop.gn);
        patch.has_audio = false;
        audioWarning = true;
      }
      const { error } = await db.from("corpus_words").update(patch).eq("id", target.id);
      if (error) {
        await release();
        throw new Error(error.message);
      }
      wordId = target.id;
    }

    const { error } = await db.from("content_proposals").update({ published_word_id: wordId }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const, audioWarning };
  });

/** Historial completo de una propuesta, con nombres. Para quien la propuso o el equipo docente. */
export const getProposalHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: p } = await db.from("content_proposals").select("*").eq("id", data.id).maybeSingle();
    const prop = p as Proposal | null;
    if (!prop) throw new Error("No encontrada");
    const roles = await getCircuitRolesFor(context.supabase, context.userId);
    if (prop.proposed_by !== context.userId && !roles.canReview) throw new Error("Forbidden");
    const names = await namesFor(prop.history.map((h) => h.por));
    return { history: prop.history.map((h) => ({ ...h, nombre: names.get(h.por) ?? "Usuario" })) };
  });

/* --------------------------- Revisores (admin) --------------------------- */

async function assertAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

export const listReviewers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: rows } = await db.from("content_reviewers").select("user_id, created_at");
    const ids = (rows ?? []).map((r: { user_id: string }) => r.user_id);
    if (!ids.length) return { reviewers: [] };
    const [{ data: profs }, { data: done }] = await Promise.all([
      db.from("profiles").select("id, full_name, email").in("id", ids),
      db.from("content_proposals").select("reviewed_by").in("reviewed_by", ids),
    ]);
    return {
      reviewers: ids.map((id: string) => {
        const p = (profs ?? []).find((x: { id: string }) => x.id === id);
        return {
          userId: id,
          name: p?.full_name || "",
          email: p?.email || "",
          reviewed: (done ?? []).filter((d: { reviewed_by: string }) => d.reviewed_by === id).length,
        };
      }),
    };
  });

export const addReviewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = await admin();
    const email = data.email.toLowerCase();
    const { data: profs } = await db.from("profiles").select("id, email").eq("email", email).limit(2);
    if (!profs || profs.length !== 1) return { ok: false as const, error: "Primero tiene que crear su cuenta en Jaikuaa" };
    const prof = profs[0];
    // Los registros entran sin confirmar el correo: exigimos que la cuenta haya ingresado
    // con Google (correo verificado por Google) para no dar permisos a un impostor.
    const { data: au } = await db.auth.admin.getUserById(prof.id);
    const providers = (au?.user?.app_metadata?.providers as string[] | undefined) ?? [];
    if (!au?.user || au.user.email?.toLowerCase() !== email || !providers.includes("google")) {
      return {
        ok: false as const,
        error: "Por seguridad, la persona tiene que entrar una vez a Jaikuaa con «Continuar con Google» usando ese correo.",
      };
    }
    const { error } = await db
      .from("content_reviewers")
      .upsert({ user_id: prof.id, added_by: context.userId }, { onConflict: "user_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const removeReviewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db.from("content_reviewers").delete().eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Buscar una palabra publicada para proponer su corrección. */
export const searchWordsForCorrection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().trim().min(2).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const like = `%${data.q.replace(/[%_,()]/g, "")}%`;
    const { data: words } = await db
      .from("corpus_words")
      .select("id, gn, es")
      .eq("status", "published")
      .or(`gn.ilike.${like},es.ilike.${like}`)
      .order("gn")
      .limit(10);
    return { words: (words ?? []) as { id: string; gn: string; es: string }[] };
  });

/* ------------------------- Palabras para verificar ------------------------- */

export type VerificationWord = { gn: string; veces: number; fuente: "common-voice" | "jojajovai" | "vikipeta"; lectura: string; ejemplo?: string };
export type VerificationState = "pendiente" | "en_circuito" | "en_corpus";

const keyOf = (s: string) => s.normalize("NFC").toLowerCase().trim().replace(/[’‘´`ʼ]/g, "'");

/**
 * Palabras frecuentes en textos reales (Common Voice, Jojajovai) que todavía no tienen respaldo.
 * Solo para revisores y docentes. El docente confirma la escritura y escribe el significado con
 * sus palabras; recién ahí la palabra entra al circuito como propuesta suya. Nadie más escribe guaraní.
 */
export const getVerificationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getCircuitRolesFor(context.supabase, context.userId);
    if (!roles.canReview) throw new Error("Forbidden");
    const mod = (await import("@/lib/morph/data/cola-verificacion.json")) as unknown as {
      default: { fuentes: Record<string, string>; palabras: VerificationWord[] };
    };
    const db = await admin();
    const [props, words] = await Promise.all([
      db.from("content_proposals").select("gn, status").neq("status", "rechazada").limit(20000),
      db.from("corpus_words").select("gn").limit(20000),
    ]);
    if (props.error) throw new Error(props.error.message);
    if (words.error) throw new Error(words.error.message);
    const inCorpus = new Set<string>((words.data ?? []).map((w: { gn: string }) => keyOf(w.gn)));
    const inCircuit = new Set<string>((props.data ?? []).map((p: { gn: string }) => keyOf(p.gn)));
    const state: Record<string, VerificationState> = {};
    for (const p of mod.default.palabras) {
      const k = keyOf(p.gn);
      state[p.gn] = inCorpus.has(k) ? "en_corpus" : inCircuit.has(k) ? "en_circuito" : "pendiente";
    }
    return { fuentes: mod.default.fuentes, palabras: mod.default.palabras, state, dailyLimit: DAILY_LIMIT };
  });
