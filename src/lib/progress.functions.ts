import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Tope de XP por evento según el tipo de actividad (evita inflar desde el navegador). */
const XP_CAP: Record<string, number> = {
  lesson: 60,
  exam: 60,
  trivia: 100,
  weekly: 20,
  onboarding: 15,
  visit: 0,
  game: 20,
};

/** Juegos que se registran con recordActivity (la Palabra del día tiene su propio flujo). */
const GAME_REFS = new Set(["ahorcado", "sopa-de-letras", "memoria", "penales", "duelo", "trivia-duelo", "nee-rape", "tembiu", "karaoke", "tekojoja", "taanga", "consultorio"]);

const BADGE_IDS = ["primer-paso", "guaranihablante", "estudiante-estrella", "racha-fuego"] as const;

function asuncionToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type ServerStats = {
  userId: string;
  xp: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  badges: string[];
  guaraniLessonsCompleted: number;
};

async function readStats(userId: string): Promise<ServerStats> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: s }, { count }, { data: mig }] = await Promise.all([
    supabaseAdmin.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
    supabaseAdmin
      .from("xp_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", "lesson")
      .eq("metadata->>guarani", "true"),
    supabaseAdmin
      .from("xp_transactions")
      .select("metadata")
      .eq("user_id", userId)
      .eq("sync_id", "local-migration")
      .maybeSingle(),
  ]);
  const today = asuncionToday();
  const last = s?.last_active_date ?? "";
  // La racha se muestra viva solo si hubo actividad hoy o ayer (hora de Paraguay).
  const alive = last === today || last === shiftDay(today, -1);
  const migLessons = Number((mig?.metadata as { guarani_lessons?: number } | null)?.guarani_lessons ?? 0);
  return {
    userId,
    xp: s?.xp ?? 0,
    streak: alive ? (s?.current_streak ?? 0) : 0,
    longestStreak: s?.longest_streak ?? 0,
    lastActiveDate: last,
    badges: Array.isArray(s?.badges) ? (s!.badges as string[]) : [],
    guaraniLessonsCompleted: (count ?? 0) + (Number.isFinite(migLessons) ? migLessons : 0),
  };
}

export const getMyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => readStats(context.userId));

export const recordActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        source: z.enum(["lesson", "exam", "trivia", "weekly", "onboarding", "visit", "game"]),
        sourceRef: z.string().trim().max(120).default(""),
        xp: z.number().int().min(0).max(1000).default(0),
        syncId: z.string().trim().min(8).max(80),
        isGuaraniLesson: z.boolean().default(false),
        perfectExam: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.source === "game" && !GAME_REFS.has(data.sourceRef)) throw new Error("Juego no válido");
    const amount = Math.min(data.xp, XP_CAP[data.source] ?? 0);
    // Visitas: como máximo una por día por usuario (sync_id fijo por fecha).
    const syncId = data.source === "visit" ? `visit:${asuncionToday()}` : data.syncId;
    const { error } = await supabaseAdmin.rpc("record_activity", {
      _user_id: context.userId,
      _amount: amount,
      _source: data.source,
      _source_ref: data.sourceRef || null,
      _sync_id: syncId,
      _metadata: {
        guarani: data.source === "lesson" && data.isGuaraniLesson,
        perfect: data.perfectExam,
        requested_xp: data.xp,
      },
      _perfect: data.source === "exam" && data.perfectExam,
    } as never);
    if (error) throw new Error("No se pudo guardar el progreso");
    return readStats(context.userId);
  });

/** Sube una sola vez el progreso que estaba guardado solo en el dispositivo. */
export const migrateLocalProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        xp: z.number().int().min(0).max(5000),
        streak: z.number().int().min(0).max(365),
        lastActiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
        badges: z.array(z.enum(BADGE_IDS)).max(BADGE_IDS.length),
        guaraniLessonsCompleted: z.number().int().min(0).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = asuncionToday();
    const last = data.lastActiveDate && data.lastActiveDate <= today ? data.lastActiveDate : null;
    const { error } = await supabaseAdmin.rpc("migrate_local_progress", {
      _user_id: context.userId,
      _xp: data.xp,
      _streak: last ? data.streak : 0,
      _last_date: last,
      _badges: [...new Set(data.badges)],
      _lessons: data.guaraniLessonsCompleted,
    } as never);
    if (error) throw new Error("No se pudo migrar el progreso");
    return readStats(context.userId);
  });
