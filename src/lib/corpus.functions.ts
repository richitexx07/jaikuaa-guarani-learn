import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify, tokenizeSentence } from "@/lib/slug";
import { CORPUS_CATEGORIES } from "@/lib/corpus-categories";

export type CorpusStatus = "draft" | "published";

const CategorySchema = z.enum(CORPUS_CATEGORIES);

const RowSchema = z.object({
  gn: z.string().min(1),
  es: z.string().min(1),
  levelId: z.string().min(1),
  unit: z.string().default(""),
  type: z.enum(["palabra", "oracion"]).default("palabra"),
  notes: z.string().default(""),
  category: CategorySchema.nullable().default(null),
});

/** Cronograma oficial del MEC: capacidades por grado, con léxico asociado. */
export const getMecCapacities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [capsRes, levelsRes, linksRes] = await Promise.all([
      supabaseAdmin
        .from("mec_capacities")
        .select("code, level_id, axis, capacity_gn, contents_es, sort_order")
        .order("sort_order"),
      supabaseAdmin.from("mec_levels").select("id, label, stage, sort_order").order("sort_order"),
      supabaseAdmin.from("corpus_word_levels").select("word_id, level_id, unit"),
    ]);

    const links = linksRes.data ?? [];
    const caps = (capsRes.data ?? []).map((c) => ({
      ...c,
      words: links.filter((l) => l.unit === c.code).length,
    }));

    return {
      levels: levelsRes.data ?? [],
      capacities: caps,
      freeUnits: [
        ...new Set(links.filter((l) => l.unit && !caps.some((c) => c.code === l.unit)).map((l) => `${l.level_id} · ${l.unit}`)),
      ].sort(),
      unassigned: links.filter((l) => !l.unit).length,
    };
  });

const ImportSchema = z.object({ rows: z.array(RowSchema).max(5000) });

type Role = "admin" | "editor";

async function getRoles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
) {
  const [a, e] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
  ]);
  return { isAdmin: a.data === true, isEditor: e.data === true };
}

/** Chequeo de rol según la acción: "admin" solo admin; "editor" admin o docente validador. */
async function assertRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
  min: Role,
) {
  const r = await getRoles(supabase, userId);
  if (r.isAdmin) return r;
  if (min === "editor" && r.isEditor) return r;
  throw new Error("Forbidden");
}

/** Roles del usuario actual en el panel de validación. */
export const checkCorpusAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await getRoles(context.supabase, context.userId);
    return { ...r, canAccess: r.isAdmin || r.isEditor };
  });

/** Lista de slugs de audio realmente presentes en el bucket. */
async function listAudioSlugs(): Promise<Set<string>> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const slugs = new Set<string>();
  let offset = 0;
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabaseAdmin.storage
      .from("guarani-audio")
      .list("", { limit: 1000, offset });
    if (error || !data || data.length === 0) break;
    for (const f of data) {
      if (f.name.endsWith(".mp3")) slugs.add(f.name.replace(/\.mp3$/, ""));
    }
    if (data.length < 1000) break;
    offset += data.length;
  }
  return slugs;
}

/** Panorama general: niveles, totales y cobertura de audio por nivel. */
export const getCorpusOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [levelsRes, wordsRes, linksRes, sentencesRes] = await Promise.all([
      supabaseAdmin.from("mec_levels").select("id, label, stage, sort_order").order("sort_order"),
      supabaseAdmin.from("corpus_words").select("id, gn, audio_slug, has_audio, status"),
      supabaseAdmin.from("corpus_word_levels").select("word_id, level_id"),
      supabaseAdmin.from("corpus_sentences").select("id, level_id, status"),
    ]);

    const levels = levelsRes.data ?? [];
    const words = wordsRes.data ?? [];
    const links = linksRes.data ?? [];
    const sentences = sentencesRes.data ?? [];

    const byId = new Map(words.map((w) => [w.id, w]));
    const perLevel = levels.map((lv) => {
      const ids = new Set(links.filter((l) => l.level_id === lv.id).map((l) => l.word_id));
      const lvWords = [...ids].map((id) => byId.get(id)).filter(Boolean) as typeof words;
      return {
        ...lv,
        words: lvWords.length,
        withAudio: lvWords.filter((w) => w.has_audio).length,
        published: lvWords.filter((w) => w.status === "published").length,
        sentences: sentences.filter((s) => s.level_id === lv.id).length,
      };
    });

    return {
      levels: perLevel,
      totals: {
        words: words.length,
        withAudio: words.filter((w) => w.has_audio).length,
        published: words.filter((w) => w.status === "published").length,
        sentences: sentences.length,
        unassigned: words.filter((w) => !links.some((l) => l.word_id === w.id)).length,
      },
    };
  });

/** Compara las filas del Excel contra el corpus: reusadas / nuevas / conflictos. */
export const previewCorpusImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Una sola fila (formulario "Nueva palabra"): también docentes. Excel: solo admin.
    await assertRole(context.supabase, context.userId, data.rows.length === 1 ? "editor" : "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [existingRes, capsRes, audioSlugs] = await Promise.all([
      supabaseAdmin.from("corpus_words").select("id, gn, es, has_audio"),
      supabaseAdmin.from("mec_capacities").select("code, level_id"),
      listAudioSlugs(),
    ]);
    const existing = new Map((existingRes.data ?? []).map((w) => [w.gn.trim(), w]));
    const caps = capsRes.data ?? [];
    const unknownCapacities = [
      ...new Set(
        data.rows
          .map((r) => r.unit.trim())
          .filter((u) => /^MEC-/i.test(u) && !caps.some((c) => c.code === u.toUpperCase())),
      ),
    ];

    const reused: { gn: string; es: string; hasAudio: boolean }[] = [];
    const created: { gn: string; es: string; slug: string; hasAudio: boolean }[] = [];
    const conflicts: { gn: string; nuevo: string; actual: string }[] = [];
    const sentences: { gn: string; es: string; missingWords: string[] }[] = [];
    const seen = new Set<string>();

    for (const row of data.rows) {
      const gn = row.gn.trim();
      if (row.type === "oracion") {
        const tokens = tokenizeSentence(gn);
        const missing = tokens.filter(
          (t) =>
            !existing.has(t) && !data.rows.some((r) => r.type === "palabra" && r.gn.trim() === t),
        );
        sentences.push({ gn, es: row.es.trim(), missingWords: missing });
        continue;
      }
      if (seen.has(gn)) continue;
      seen.add(gn);
      const prev = existing.get(gn);
      if (prev) {
        reused.push({ gn, es: prev.es, hasAudio: prev.has_audio });
        if (prev.es.trim().toLowerCase() !== row.es.trim().toLowerCase()) {
          conflicts.push({ gn, nuevo: row.es.trim(), actual: prev.es });
        }
      } else {
        const slug = slugify(gn);
        created.push({ gn, es: row.es.trim(), slug, hasAudio: audioSlugs.has(slug) });
      }
    }

    return {
      reused,
      created,
      conflicts,
      sentences,
      audioToRecord: created.filter((c) => !c.hasAudio).map((c) => `${c.slug}.mp3`),
      unknownCapacities,
    };
  });

/** Guarda la importación: crea lo nuevo, reusa lo existente, vincula al nivel. */
export const commitCorpusImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    ImportSchema.extend({ overwriteTranslations: z.boolean().default(false) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const single = data.rows.length === 1 && !data.overwriteTranslations;
    await assertRole(context.supabase, context.userId, single ? "editor" : "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const audioSlugs = await listAudioSlugs();

    const wordRows = data.rows.filter((r) => r.type === "palabra");
    const sentenceRows = data.rows.filter((r) => r.type === "oracion");

    const { data: existingWords } = await supabaseAdmin.from("corpus_words").select("id, gn, es");
    const existing = new Map((existingWords ?? []).map((w) => [w.gn.trim(), w]));

    let createdCount = 0;
    let reusedCount = 0;
    const newRows: {
      gn: string;
      es: string;
      audio_slug: string;
      has_audio: boolean;
      notes: string;
      category: string | null;
    }[] = [];
    const seen = new Set<string>();

    for (const r of wordRows) {
      const gn = r.gn.trim();
      if (seen.has(gn)) continue;
      seen.add(gn);
      if (existing.has(gn)) {
        reusedCount++;
        if (data.overwriteTranslations) {
          await supabaseAdmin.from("corpus_words").update({ es: r.es.trim() }).eq("gn", gn);
        }
        continue;
      }
      const slug = slugify(gn);
      newRows.push({
        gn,
        es: r.es.trim(),
        audio_slug: slug,
        has_audio: audioSlugs.has(slug),
        notes: r.notes ?? "",
        category: r.category ?? null,
      });
    }

    if (newRows.length > 0) {
      const { error } = await supabaseAdmin.from("corpus_words").insert(newRows);
      if (error) throw new Error(error.message);
      createdCount = newRows.length;
    }

    // Re-leer para tener todos los ids y vincular a niveles.
    const { data: allWords } = await supabaseAdmin.from("corpus_words").select("id, gn");
    const idByGn = new Map((allWords ?? []).map((w) => [w.gn.trim(), w.id]));

    const links = wordRows
      .map((r) => ({
        word_id: idByGn.get(r.gn.trim()),
        level_id: r.levelId,
        unit: r.unit ?? "",
      }))
      .filter((l) => Boolean(l.word_id));
    if (links.length > 0) {
      await supabaseAdmin
        .from("corpus_word_levels")
        .upsert(links as never, { onConflict: "word_id,level_id,unit", ignoreDuplicates: true });
    }

    // Oraciones
    let sentenceCount = 0;
    for (const s of sentenceRows) {
      const gn = s.gn.trim();
      const { data: inserted, error } = await supabaseAdmin
        .from("corpus_sentences")
        .upsert(
          { gn, es: s.es.trim(), level_id: s.levelId, unit: s.unit ?? "", notes: s.notes ?? "" },
          { onConflict: "gn" },
        )
        .select("id")
        .maybeSingle();
      if (error || !inserted) continue;
      sentenceCount++;
      await supabaseAdmin.from("corpus_sentence_words").delete().eq("sentence_id", inserted.id);
      const tokens = tokenizeSentence(gn).map((token, position) => ({
        sentence_id: inserted.id,
        word_id: idByGn.get(token) ?? null,
        token,
        position,
      }));
      if (tokens.length > 0) await supabaseAdmin.from("corpus_sentence_words").insert(tokens);
    }

    return { created: createdCount, reused: reusedCount, sentences: sentenceCount };
  });

/** Listado de palabras con filtros para el panel. */
export const listCorpusWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        levelId: z.string().optional(),
        search: z.string().default(""),
        onlyMissingAudio: z.boolean().default(false),
        onlyPendingValidation: z.boolean().default(false),
        category: z.union([CategorySchema, z.literal("none")]).optional(),
        limit: z.number().min(1).max(500).default(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let ids: string[] | null = null;
    if (data.levelId) {
      const { data: links } = await supabaseAdmin
        .from("corpus_word_levels")
        .select("word_id")
        .eq("level_id", data.levelId);
      ids = (links ?? []).map((l) => l.word_id);
      if (ids.length === 0) return { words: [] };
    }

    let q = supabaseAdmin
      .from("corpus_words")
      .select("id, gn, es, audio_slug, has_audio, status, notes, category, validated_by, validated_at")
      .order("gn")
      .limit(data.limit);
    if (ids) q = q.in("id", ids);
    if (data.search.trim())
      q = q.or(`gn.ilike.%${data.search.trim()}%,es.ilike.%${data.search.trim()}%`);
    if (data.onlyMissingAudio) q = q.eq("has_audio", false);
    if (data.onlyPendingValidation) q = q.or("status.eq.draft,validated_by.is.null");
    if (data.category === "none") q = q.is("category", null);
    else if (data.category) q = q.eq("category", data.category);

    const { data: words, error } = await q;
    if (error) throw new Error(error.message);
    const vIds = [...new Set((words ?? []).map((w) => w.validated_by).filter(Boolean))] as string[];
    const names = new Map<string, string>();
    if (vIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", vIds);
      for (const p of profs ?? []) names.set(p.id, p.full_name || p.email || "Docente");
    }
    return {
      words: (words ?? []).map((w) => ({
        ...w,
        validatorName: w.validated_by ? (names.get(w.validated_by) ?? "Docente") : null,
      })),
    };
  });

/** Editar, publicar o borrar una palabra. */
export const updateCorpusWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        es: z.string().min(1).optional(),
        notes: z.string().optional(),
        category: CategorySchema.nullable().optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = { ...rest };
    if (rest.status === "published") {
      const { data: w } = await supabaseAdmin.from("corpus_words").select("gn").eq("id", id).maybeSingle();
      const { requireDeterministicAcceptance } = await import("@/lib/deterministic-gate.server");
      await requireDeterministicAcceptance(w?.gn ?? "");
      patch.validated_by = context.userId;
      patch.validated_at = new Date().toISOString();
    } else if (rest.status === "draft") {
      patch.validated_by = null;
      patch.validated_at = null;
    }
    const { data: before } = await supabaseAdmin
      .from("corpus_words")
      .select("es, notes, category, status")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("corpus_words").update(patch as never).eq("id", id);
    if (error) throw new Error(error.message);

    // Registro de cambios: quién cambió qué (antes → después). Solo lo ven los administradores.
    const changes: Record<string, { antes: unknown; despues: unknown }> = {};
    for (const key of ["es", "notes", "category", "status"] as const) {
      if (rest[key] === undefined) continue;
      const prev = (before as Record<string, unknown> | null)?.[key] ?? null;
      if (prev !== rest[key]) changes[key] = { antes: prev, despues: rest[key] };
    }
    if (Object.keys(changes).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: logError } = await (supabaseAdmin as any)
        .from("corpus_word_changes")
        .insert({ word_id: id, changed_by: context.userId, changes });
      if (logError) console.error("corpus_word_changes:", logError.message);
    }
    return { ok: true };
  });

export const deleteCorpusWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("corpus_words").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Publica todas las palabras de un nivel que ya tengan audio. */
export const publishLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ levelId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: links } = await supabaseAdmin
      .from("corpus_word_levels")
      .select("word_id")
      .eq("level_id", data.levelId);
    const ids = (links ?? []).map((l) => l.word_id);
    if (ids.length === 0) return { published: 0, blocked: 0 };
    const { data: candidates } = await supabaseAdmin
      .from("corpus_words")
      .select("id, gn")
      .in("id", ids)
      .eq("has_audio", true)
      .eq("status", "draft");
    // Barrera determinista palabra por palabra: solo pasan las aceptadas explícitamente.
    const { checkDeterministicAcceptance } = await import("@/lib/deterministic-gate.server");
    const accepted: string[] = [];
    for (const c of candidates ?? []) {
      if ((await checkDeterministicAcceptance(c.gn)).accepted) accepted.push(c.id);
    }
    const blocked = (candidates?.length ?? 0) - accepted.length;
    if (accepted.length === 0) return { published: 0, blocked };
    const { data: updated, error } = await supabaseAdmin
      .from("corpus_words")
      .update({
        status: "published",
        validated_by: context.userId,
        validated_at: new Date().toISOString(),
      })
      .in("id", accepted)
      .eq("has_audio", true)
      .eq("status", "draft")
      .select("id");
    if (error) throw new Error(error.message);
    return { published: updated?.length ?? 0, blocked };
  });

/** Re-escanea el bucket de audio y actualiza qué palabras ya tienen grabación. */
export const refreshAudioCoverage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slugs = await listAudioSlugs();
    const { data: words } = await supabaseAdmin
      .from("corpus_words")
      .select("id, audio_slug, has_audio");
    let changed = 0;
    for (const w of words ?? []) {
      const now = slugs.has(w.audio_slug);
      if (now !== w.has_audio) {
        await supabaseAdmin.from("corpus_words").update({ has_audio: now }).eq("id", w.id);
        changed++;
      }
    }
    return { changed, audioFiles: slugs.size };
  });

/* --------------------------- DOCENTES VALIDADORES --------------------------- */

export const listValidators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "editor");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return { validators: [] };
    const [profs, words] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids),
      supabaseAdmin.from("corpus_words").select("validated_by").in("validated_by", ids),
    ]);
    return {
      validators: ids.map((id) => {
        const p = profs.data?.find((x) => x.id === id);
        return {
          userId: id,
          name: p?.full_name || "",
          email: p?.email || "",
          validated: (words.data ?? []).filter((w) => w.validated_by === id).length,
        };
      }),
    };
  });

export const addValidator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        cohort: z.string().trim().min(1).max(60).nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (!prof) return { ok: false as const, error: "Primero tiene que crear su cuenta en Jaikuaa" };
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", prof.id)
      .eq("role", "editor")
      .maybeSingle();
    if (!existing) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: prof.id, role: "editor" });
      if (error) throw new Error(error.message);
    }
    if (data.cohort) {
      await supabaseAdmin.from("profiles").update({ cohort: data.cohort }).eq("id", prof.id);
    }
    return { ok: true as const };
  });

export const removeValidator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "editor");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------- PILOTO ------------------------------- */

/** Usuarios con grupo asignado y lista de grupos existentes. */
export const listCohortMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, cohort")
      .not("cohort", "is", null)
      .order("cohort");
    const members = (data ?? []).map((p) => ({
      userId: p.id,
      name: p.full_name || "",
      email: p.email || "",
      cohort: p.cohort as string,
    }));
    return { members, cohorts: [...new Set(members.map((m) => m.cohort))].sort() };
  });

export const setUserCohort = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        cohort: z.string().trim().min(1).max(60).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (!prof) return { ok: false as const, error: "Primero tiene que crear su cuenta en Jaikuaa" };
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ cohort: data.cohort })
      .eq("id", prof.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

function pyDay(ts: string | Date): string {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T>(build: (from: number, to: number) => any): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < 100; page++) {
    const { data, error } = await build(page * 1000, page * 1000 + 999);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Métricas reales del piloto, calculadas desde la base de datos. */
export const getPilotDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        cohort: z.string().trim().max(60).nullable().default(null),
        period: z.enum(["7", "30", "all"]).default("30"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const today = pyDay(new Date());
    const dayMinus = (n: number) => {
      const d = new Date(`${today}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - n);
      return d.toISOString().slice(0, 10);
    };
    const last7 = dayMinus(6);

    const profiles = await fetchAll<{ id: string; created_at: string; cohort: string | null }>(
      (f, t) => {
        let q = supabaseAdmin.from("profiles").select("id, created_at, cohort").range(f, t);
        if (data.cohort) q = q.eq("cohort", data.cohort);
        return q;
      },
    );
    const userIds = new Set(profiles.map((p) => p.id));

    const startDay =
      data.period === "all"
        ? profiles.reduce((m, p) => (pyDay(p.created_at) < m ? pyDay(p.created_at) : m), today)
        : dayMinus(Number(data.period) - 1);
    // Desde 1 día antes en UTC para cubrir la diferencia horaria; se filtra por día de Paraguay.
    const fetchFrom = new Date(`${(startDay < last7 ? startDay : last7)}T00:00:00Z`);
    fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 1);

    const txs = (
      await fetchAll<{ user_id: string; amount: number; source: string; created_at: string }>(
        (f, t) =>
          supabaseAdmin
            .from("xp_transactions")
            .select("user_id, amount, source, created_at")
            .gte("created_at", fetchFrom.toISOString())
            .neq("source", "local-migration")
            .range(f, t),
      )
    )
      .filter((x) => userIds.has(x.user_id))
      .map((x) => ({ ...x, day: pyDay(x.created_at) }));

    const { data: editorRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "editor");
    const editors = new Set((editorRows ?? []).map((r) => r.user_id));

    const validatedAll = await fetchAll<{ validated_by: string | null; validated_at: string | null; status: string }>(
      (f, t) => supabaseAdmin.from("corpus_words").select("validated_by, validated_at, status").range(f, t),
    );
    const validatedInScope = validatedAll
      .filter((w) => w.validated_by && w.validated_at && (!data.cohort || userIds.has(w.validated_by)))
      .map((w) => ({ by: w.validated_by as string, day: pyDay(w.validated_at as string) }));

    const inPeriod = (day: string) => day >= startDay && day <= today;
    const ptx = txs.filter((x) => inPeriod(x.day));
    const pval = validatedInScope.filter((w) => inPeriod(w.day));

    const days: string[] = [];
    for (let d = startDay; d <= today; ) {
      days.push(d);
      const n = new Date(`${d}T12:00:00Z`);
      n.setUTCDate(n.getUTCDate() + 1);
      d = n.toISOString().slice(0, 10);
      if (days.length > 2000) break;
    }
    const series = days.map((day) => {
      const dt = ptx.filter((x) => x.day === day);
      return {
        date: day,
        active: new Set(dt.map((x) => x.user_id)).size,
        newUsers: profiles.filter((p) => pyDay(p.created_at) === day).length,
        lessons: dt.filter((x) => x.source === "lesson").length,
        exams: dt.filter((x) => x.source === "exam").length,
        games: dt.filter((x) => x.source === "game").length,
        xp: dt.reduce((a, x) => a + x.amount, 0),
        validated: pval.filter((w) => w.day === day).length,
      };
    });

    return {
      startDay,
      today,
      registered: profiles.length,
      newUsers: profiles.filter((p) => inPeriod(pyDay(p.created_at))).length,
      activeUsers: new Set(ptx.map((x) => x.user_id)).size,
      active7: new Set(txs.filter((x) => x.day >= last7 && x.day <= today).map((x) => x.user_id)).size,
      lessons: ptx.filter((x) => x.source === "lesson").length,
      exams: ptx.filter((x) => x.source === "exam").length,
      games: ptx.filter((x) => x.source === "game").length,
      xp: ptx.reduce((a, x) => a + x.amount, 0),
      activeValidators: new Set(pval.filter((w) => editors.has(w.by)).map((w) => w.by)).size,
      validatedInPeriod: pval.length,
      validatedTotal: validatedAll.filter((w) => w.validated_by).length,
      pendingValidation: validatedAll.filter((w) => w.status === "draft" || !w.validated_by).length,
      series,
    };
  });

/* ------------------------------ LECCIONES ------------------------------ */

const LessonFields = z.object({
  sortOrder: z.number().int().min(1).max(10000),
  title: z.string().trim().min(1).max(120),
  theme: z.string().trim().max(240).default(""),
  levelId: z.string().trim().min(1).max(40).nullable().default(null),
  capacityCode: z.string().trim().min(1).max(40).nullable().default(null),
});

export const listAdminLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: lessons }, links] = await Promise.all([
      supabaseAdmin
        .from("lessons")
        .select("id, sort_order, title, theme, level_id, capacity_code, status")
        .order("sort_order"),
      fetchAll<{ lesson_id: string; corpus_words: { status: string } | null }>((f, t) =>
        supabaseAdmin.from("lesson_words").select("lesson_id, corpus_words(status)").range(f, t),
      ),
    ]);
    return {
      isAdmin: r.isAdmin,
      lessons: (lessons ?? []).map((l) => {
        const mine = links.filter((x) => x.lesson_id === l.id);
        return {
          ...l,
          published: mine.filter((x) => x.corpus_words?.status === "published").length,
          drafts: mine.filter((x) => x.corpus_words?.status !== "published").length,
        };
      }),
    };
  });

export const saveLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    LessonFields.extend({ id: z.string().uuid().nullable().default(null) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      sort_order: data.sortOrder,
      title: data.title,
      theme: data.theme,
      level_id: data.levelId,
      capacity_code: data.capacityCode,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("lessons").update(row).eq("id", data.id)
      : await supabaseAdmin.from("lessons").insert({ ...row, status: "draft" });
    if (error) {
      if (error.code === "23505") return { ok: false as const, error: "Ya existe una lección con ese número de orden." };
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const setLessonStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "published"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lessons").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLessonWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lessonId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("lesson_words")
      .select("id, position, word_id, corpus_words(gn, es, status, has_audio, validated_by)")
      .eq("lesson_id", data.lessonId)
      .order("position");
    if (error) throw new Error(error.message);
    return {
      words: (rows ?? []).map((r) => {
        const w = r.corpus_words as unknown as {
          gn: string;
          es: string;
          status: string;
          has_audio: boolean;
          validated_by: string | null;
        };
        return { linkId: r.id, wordId: r.word_id, position: r.position, ...w };
      }),
    };
  });

export const addLessonWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ lessonId: z.string().uuid(), wordId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: last } = await supabaseAdmin
      .from("lesson_words")
      .select("position")
      .eq("lesson_id", data.lessonId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("lesson_words").insert({
      lesson_id: data.lessonId,
      word_id: data.wordId,
      position: (last?.position ?? -1) + 1,
    });
    if (error) {
      if (error.code === "23505") return { ok: false as const, error: "Esa palabra ya está en la lección." };
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const removeLessonWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ linkId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lesson_words").delete().eq("id", data.linkId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderLessonWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ lessonId: z.string().uuid(), linkIds: z.array(z.string().uuid()).max(500) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < data.linkIds.length; i++) {
      await supabaseAdmin
        .from("lesson_words")
        .update({ position: i })
        .eq("id", data.linkIds[i])
        .eq("lesson_id", data.lessonId);
    }
    return { ok: true };
  });

/** Guarda una grabación humana (MP3) para una palabra del corpus. Admin o docente validador. */
export const uploadWordAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        // MP3 en base64, máximo ~2 MB de audio
        base64: z.string().min(100).max(2_800_000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: word, error: wErr } = await supabaseAdmin
      .from("corpus_words")
      .select("id, audio_slug")
      .eq("id", data.id)
      .maybeSingle();
    if (wErr || !word?.audio_slug) throw new Error("Palabra no encontrada");
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    // Verifica cabecera MP3 (ID3 o frame sync)
    const isMp3 =
      (bin[0] === 0x49 && bin[1] === 0x44 && bin[2] === 0x33) ||
      (bin[0] === 0xff && (bin[1] & 0xe0) === 0xe0);
    if (!isMp3) throw new Error("El archivo no es un MP3 válido");
    const path = `${word.audio_slug}.mp3`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("guarani-audio")
      .upload(path, bin, { contentType: "audio/mpeg", upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { error } = await supabaseAdmin
      .from("corpus_words")
      .update({ has_audio: true } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, path };
  });

/**
 * Validación rápida (una palabra por pantalla). «Aprobar» publica la palabra y registra al docente
 * que la validó. «Deshacer» vale solo para la propia aprobación de los últimos 15 minutos y
 * devuelve la palabra exactamente como estaba (publicada o en borrador).
 */
export const quickValidateWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "undo"]),
        prevStatus: z.enum(["draft", "published"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase, context.userId, "editor");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: before } = await supabaseAdmin
      .from("corpus_words")
      .select("gn, status, validated_by, validated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (!before) throw new Error("No encontramos la palabra");

    let patch: Record<string, unknown>;
    if (data.action === "approve") {
      if (before.validated_by) return { ok: true, prevStatus: before.status as "draft" | "published", already: true };
      const { requireDeterministicAcceptance } = await import("@/lib/deterministic-gate.server");
      await requireDeterministicAcceptance(before.gn);
      patch = { status: "published", validated_by: context.userId, validated_at: new Date().toISOString() };
    } else {
      const recent =
        before.validated_by === context.userId &&
        !!before.validated_at &&
        Date.now() - new Date(before.validated_at).getTime() < 15 * 60 * 1000;
      if (!recent) throw new Error("Solo se puede deshacer tu propia aprobación de los últimos 15 minutos");
      patch = { status: data.prevStatus ?? "draft", validated_by: null, validated_at: null };
    }
    // Condición en la misma escritura: si dos docentes aprueban la misma palabra a la vez,
    // la firma queda para el primero y el segundo no la pisa.
    const base = supabaseAdmin.from("corpus_words").update(patch as never).eq("id", data.id);
    const guarded = data.action === "approve" ? base.is("validated_by", null) : base.eq("validated_by", context.userId);
    const { data: changed, error } = await guarded.select("id");
    if (error) throw new Error(error.message);
    if (!changed?.length) {
      if (data.action === "approve") return { ok: true, prevStatus: before.status as "draft" | "published", already: true };
      throw new Error("Solo se puede deshacer tu propia aprobación de los últimos 15 minutos");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logError } = await (supabaseAdmin as any).from("corpus_word_changes").insert({
      word_id: data.id,
      changed_by: context.userId,
      changes: {
        validacion: {
          antes: before.validated_by ? "validada" : "sin validar",
          despues: data.action === "approve" ? "validada" : "sin validar",
        },
        ...(before.status !== patch.status ? { status: { antes: before.status, despues: patch.status } } : {}),
      },
    });
    if (logError) console.error("corpus_word_changes:", logError.message);
    return { ok: true, prevStatus: before.status as "draft" | "published", already: false };
  });
