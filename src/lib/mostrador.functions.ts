import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Frase, FraseStatus, FraseTipo, RubroId } from "@/lib/mostrador";

/**
 * Modo mostrador «Atendé en guaraní».
 * - Cualquier cuenta ve y escucha las frases publicadas.
 * - El docente validador (rol "editor") o el admin escribe el guaraní y graba la voz.
 * - Otra persona distinta valida y publica. Nadie del equipo técnico escribe guaraní.
 */

const RubroSchema = z.enum(["salud", "atencion"]);
const BUCKET = "guarani-audio";
const URL_TTL_SECONDS = 60 * 60;

// La tabla mostrador_frases todavía no está en los tipos generados (se regeneran al aplicar la migración).
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
  const isAdmin = a.data === true;
  const isEditor = e.data === true;
  return { isAdmin, isEditor, isStaff: isAdmin || isEditor };
}

async function assertStaff(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: (fn: any, args: any) => any },
  userId: string,
) {
  const r = await roles(supabase, userId);
  if (!r.isStaff) throw new Error("Solo docentes validadores o administradores.");
  return r;
}

type Row = {
  id: string;
  rubro: RubroId;
  situacion: string;
  tipo: FraseTipo;
  es: string;
  gn: string | null;
  gn_by: string | null;
  audio_path: string | null;
  orden: number;
  status: FraseStatus;
  validated_by: string | null;
};

const COLS = "id, rubro, situacion, tipo, es, gn, gn_by, audio_path, orden, status, validated_by";

function toFrase(r: Row, me: string | null): Frase {
  const f: Frase = {
    id: r.id,
    rubro: r.rubro,
    situacion: r.situacion,
    tipo: r.tipo,
    es: r.es,
    gn: r.gn,
    hasAudio: !!r.audio_path,
    orden: r.orden,
    status: r.status,
  };
  if (me) {
    f.gnByMe = r.gn_by === me;
    f.validatedByMe = r.validated_by === me;
  }
  return f;
}

/** Frases de un rubro. El público recibe solo las publicadas; el equipo, todas (con su estado). */
export const listMostrador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rubro: RubroSchema, todas: z.boolean().default(false) }).parse(d))
  .handler(async ({ data, context }) => {
    const r = await roles(context.supabase, context.userId);
    const verTodas = data.todas && r.isStaff;
    const db = await admin();
    let q = db.from("mostrador_frases").select(COLS).eq("rubro", data.rubro).order("orden");
    if (!verTodas) q = q.eq("status", "publicada");
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const frases = ((rows ?? []) as Row[]).map((x) => toFrase(x, verTodas ? context.userId : null));
    let pendientes = 0;
    if (!verTodas) {
      const { count } = await db
        .from("mostrador_frases")
        .select("id", { count: "exact", head: true })
        .eq("rubro", data.rubro)
        .eq("status", "pendiente");
      pendientes = count ?? 0;
    }
    return { frases, pendientes, isStaff: r.isStaff };
  });

/** Enlaces firmados de las grabaciones. Solo frases publicadas (o cualquiera, para el equipo). */
export const getMostradorAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { consumeRateLimit } = await import("@/lib/server-guards.server");
    const ok = await consumeRateLimit(`mostrador-audio:${context.userId}`, 300, 3600);
    if (!ok) return { urls: {} as Record<string, string>, limited: true };
    const r = await roles(context.supabase, context.userId);
    const db = await admin();
    let q = db.from("mostrador_frases").select("id, audio_path, status").in("id", data.ids).not("audio_path", "is", null);
    if (!r.isStaff) q = q.eq("status", "publicada");
    const { data: rows } = await q;
    const list = (rows ?? []) as { id: string; audio_path: string }[];
    const urls: Record<string, string> = {};
    if (list.length === 0) return { urls, limited: false };
    const { data: signed } = await db.storage
      .from(BUCKET)
      .createSignedUrls(list.map((x) => x.audio_path), URL_TTL_SECONDS);
    for (const s of (signed ?? []) as { path: string | null; signedUrl: string | null; error: string | null }[]) {
      const row = list.find((x) => x.audio_path === s.path);
      if (row && s.signedUrl && !s.error) urls[row.id] = s.signedUrl;
    }
    return { urls, limited: false };
  });

/**
 * El docente escribe (o corrige) el guaraní. Si cambia la escritura, la frase vuelve a pendiente,
 * pierde la validación y la grabación anterior (que correspondía a otra forma).
 */
export const saveMostradorGn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), gn: z.string().trim().min(1).max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const db = await admin();
    const { data: before, error: bErr } = await db.from("mostrador_frases").select("gn").eq("id", data.id).maybeSingle();
    if (bErr || !before) throw new Error("No encontramos la frase.");
    if (before.gn === data.gn) return { ok: true, unchanged: true };
    const { error } = await db
      .from("mostrador_frases")
      .update({
        gn: data.gn,
        gn_by: context.userId,
        gn_at: new Date().toISOString(),
        audio_path: null,
        audio_by: null,
        status: "pendiente",
        validated_by: null,
        validated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, unchanged: false };
  });

/** Guarda la grabación humana (MP3) de una frase. Vuelve a pendiente: hay que validarla de nuevo. */
export const uploadMostradorAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), base64: z.string().min(100).max(2_800_000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const db = await admin();
    const { data: row } = await db.from("mostrador_frases").select("id, gn").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("No encontramos la frase.");
    if (!row.gn) throw new Error("Primero hay que escribir la frase en guaraní.");
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const isMp3 =
      (bin[0] === 0x49 && bin[1] === 0x44 && bin[2] === 0x33) || (bin[0] === 0xff && (bin[1] & 0xe0) === 0xe0);
    if (!isMp3) throw new Error("El archivo no es un MP3 válido.");
    const path = `mostrador/${data.id}.mp3`;
    const { error: upErr } = await db.storage.from(BUCKET).upload(path, bin, { contentType: "audio/mpeg", upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { error } = await db
      .from("mostrador_frases")
      .update({
        audio_path: path,
        audio_by: context.userId,
        status: "pendiente",
        validated_by: null,
        validated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Validar y publicar, o sacar de publicación. Quien escribió el guaraní no puede validarlo:
 * lo controla el servidor y también la base de datos.
 */
export const validateMostrador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), action: z.enum(["publicar", "despublicar"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const db = await admin();
    const { data: row } = await db
      .from("mostrador_frases")
      .select("id, gn, gn_by, audio_path")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("No encontramos la frase.");
    const now = new Date().toISOString();
    if (data.action === "despublicar") {
      const { error } = await db
        .from("mostrador_frases")
        .update({ status: "pendiente", validated_by: null, validated_at: null, updated_at: now })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (!row.gn) throw new Error("Falta la frase en guaraní.");
    if (!row.audio_path) throw new Error("Falta la grabación de un hablante.");
    if (row.gn_by === context.userId) {
      throw new Error("La valida otro docente: quien escribió el guaraní no puede validarlo.");
    }
    const { error } = await db
      .from("mostrador_frases")
      .update({ status: "publicada", validated_by: context.userId, validated_at: now, updated_at: now })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** El admin agrega frases nuevas en castellano (el guaraní lo escriben los docentes). */
export const addMostradorFrase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        rubro: RubroSchema,
        situacion: z.string().trim().min(1).max(80),
        tipo: z.enum(["decir", "escuchar"]),
        es: z.string().trim().min(1).max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.isAdmin) throw new Error("Solo el administrador agrega frases nuevas.");
    const db = await admin();
    const { data: last } = await db
      .from("mostrador_frases")
      .select("orden")
      .eq("rubro", data.rubro)
      .eq("situacion", data.situacion)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: maxRow } = await db
      .from("mostrador_frases")
      .select("orden")
      .eq("rubro", data.rubro)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    const orden = last ? last.orden + 1 : (maxRow?.orden ?? 0) + 10;
    const { error } = await db.from("mostrador_frases").insert({ ...data, orden });
    if (error) {
      if (/duplicate|unique/i.test(error.message)) throw new Error("Esa frase ya está cargada.");
      throw new Error(error.message);
    }
    return { ok: true };
  });
