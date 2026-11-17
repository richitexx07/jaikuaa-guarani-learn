import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { GameWord } from "@/lib/games.functions";
import type { JuegoId, JuegoTexto } from "@/lib/juego-textos";
import type { Frase } from "@/lib/mostrador";
import type { CourseLesson, CourseVocabItem } from "@/lib/lessons.functions";
import { GUEST_LESSONS } from "@/lib/guest-lessons";

/**
 * Lo mínimo para jugar sin cuenta: SOLO contenido ya publicado.
 * Con tope por dirección de internet y aviso al administrador si alguien se pasa (posible copia del corpus).
 */
// No tan bajo: muchos celulares comparten la misma IP de la empresa de telefonía.
// Lo que de verdad frena la copia es la muestra del día (pedir mil veces da las mismas palabras).
const LIMIT_GUEST_PER_HOUR = 1000;

/** Suma el pedido y devuelve la IP (para elegir la muestra del día de esa conexión). */
async function guard(kind: string): Promise<string> {
  const { clientIp } = await import("@/lib/server-guards.server");
  const { vigilarPedidos } = await import("@/lib/corpus-guard.server");
  const headers = getRequest()?.headers ?? new Headers();
  const ip = clientIp(headers);
  const ok = await vigilarPedidos(`invitado-${kind}`, { ip }, LIMIT_GUEST_PER_HOUR);
  if (!ok) throw new Error("Demasiadas consultas seguidas. Creá tu cuenta gratis para seguir jugando.");
  return ip;
}

/** Palabras publicadas para los juegos, para quien juega sin cuenta. */
export const getGameWordsGuest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ lesson: z.number().int().min(1).max(10000).nullable().default(null) }).parse(d),
  )
  .handler(async ({ data }) => {
    await guard("words");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.lesson !== null) {
      const { data: lesson } = await supabaseAdmin
        .from("lessons")
        .select("id")
        .eq("status", "published")
        .eq("sort_order", data.lesson)
        .maybeSingle();
      if (!lesson) return { words: [] as GameWord[] };
      const { data: links, error } = await supabaseAdmin
        .from("lesson_words")
        .select("corpus_words!inner(gn, es, has_audio, status, significados)")
        .eq("lesson_id", lesson.id)
        .eq("corpus_words.status", "published");
      if (error) throw new Error(error.message);
      const words = (links ?? []).map((x) => {
        const w = x.corpus_words as unknown as { gn: string; es: string; has_audio: boolean; significados?: GameWord["sig"] | null };
        return { gn: w.gn, es: w.es, hasAudio: w.has_audio, sig: w.significados ?? {} };
      });
      return { words };
    }
    const { data: rows, error } = await supabaseAdmin
      .from("corpus_words")
      .select("gn, es, has_audio, significados")
      .eq("status", "published")
      .limit(2000);
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Todas las publicadas: el reto del día (Penales) y los desafíos entre amigos tienen que salir iguales para
    // todos, y el Consultorio necesita todas las partes del cuerpo. Lo que cuida el corpus es que nadie lo lea
    // directo de la base, el tope por conexión y el aviso al administrador.
    return { words: (rows ?? []).map((w: any) => ({ gn: w.gn, es: w.es, hasAudio: w.has_audio, sig: (w.significados ?? {}) as GameWord["sig"] })) as GameWord[] };
  });

/** Textos en guaraní de los juegos (escritos por docentes), para quien juega sin cuenta. */
export const listJuegoTextosGuest = createServerFn({ method: "GET" }).handler(async () => {
  await guard("textos");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;
  const { data, error } = await db
    .from("juego_textos")
    .select("juego, clave, campo, texto, escrito_por_nombre, updated_at")
    .limit(5000);
  if (error) return { textos: [] as JuegoTexto[], isStaff: false };
  const textos: JuegoTexto[] = (data ?? []).map((x: Record<string, string | null>) => ({
    juego: x.juego as JuegoId,
    clave: x.clave as string,
    campo: x.campo as string,
    texto: x.texto as string,
    por: x.escrito_por_nombre ?? null,
    cuando: x.updated_at as string,
  }));
  return { textos, isStaff: false };
});

// ── Frases de atención (Consultorio y Ventanilla) para quien juega sin cuenta ──

const RubroGuest = z.enum(["salud", "atencion"]);

/** Frases PUBLICADAS de un rubro (lo mismo que ve cualquier cuenta común). */
export const listMostradorGuest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ rubro: RubroGuest }).parse(d))
  .handler(async ({ data }) => {
    await guard("mostrador");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any;
    const { data: rows, error } = await db
      .from("mostrador_frases")
      .select("id, rubro, situacion, tipo, es, gn, audio_path, orden, status")
      .eq("rubro", data.rubro)
      .eq("status", "publicada")
      .order("orden");
    if (error) throw new Error(error.message);
    const frases: Frase[] = ((rows ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      rubro: r.rubro as Frase["rubro"],
      situacion: r.situacion as string,
      tipo: r.tipo as Frase["tipo"],
      es: r.es as string,
      gn: (r.gn as string | null) ?? null,
      hasAudio: !!r.audio_path,
      orden: r.orden as number,
      status: r.status as Frase["status"],
    }));
    return { frases, pendientes: 0, isStaff: false };
  });

/** Enlaces temporales de las grabaciones de frases publicadas. */
export const getMostradorAudioGuest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    await guard("mostrador-audio");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any;
    const { data: rows } = await db
      .from("mostrador_frases")
      .select("id, audio_path")
      .in("id", data.ids)
      .eq("status", "publicada")
      .not("audio_path", "is", null);
    const list = (rows ?? []) as { id: string; audio_path: string }[];
    const urls: Record<string, string> = {};
    if (list.length === 0) return { urls, limited: false };
    const { data: signed } = await db.storage.from("guarani-audio").createSignedUrls(list.map((x) => x.audio_path), 60 * 60);
    for (const s of (signed ?? []) as { path: string | null; signedUrl: string | null; error: string | null }[]) {
      const row = list.find((x) => x.audio_path === s.path);
      if (row && s.signedUrl && !s.error) urls[row.id] = s.signedUrl;
    }
    return { urls, limited: false };
  });

/* ------------------- Palabra del día y «Pronunciá» sin cuenta ------------------- */

function hoyAsuncion(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

/** La palabra de hoy (la misma para todos). La respuesta NO viaja: se corrige en el servidor. */
export const getWordOfDayGuest = createServerFn({ method: "GET" }).handler(async () => {
  await guard("wotd");
  const { wordOfDay } = await import("@/lib/games.functions");
  const day = hoyAsuncion();
  const w = await wordOfDay(day);
  return { day, word: w ? { gn: w.gn, options: w.options, labels: w.labels } : null, played: null };
});

/** Corrige la respuesta de quien juega sin cuenta. Los puntos quedan en su celular (como en los otros juegos). */
export const answerWordOfDayGuest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ choice: z.string().trim().max(300) }).parse(d))
  .handler(async ({ data }) => {
    await guard("wotd");
    const { wordOfDay } = await import("@/lib/games.functions");
    const w = await wordOfDay(hoyAsuncion());
    if (!w) throw new Error("No hay palabra del día");
    return { correct: data.choice === w.es, answer: w.es };
  });

/** Palabras publicadas con voz grabada, para «Pronunciá» sin cuenta. */
export const listPalabrasConVozGuest = createServerFn({ method: "GET" }).handler(async () => {
  const ip = await guard("voz");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("corpus_words")
    .select("gn, es")
    .eq("status", "published")
    .eq("has_audio", true)
    .order("gn")
    .limit(5000);
  if (error) throw new Error(error.message);
  // Sin cuenta, una porción por día (con cuenta se ven todas).
  const { muestraDelDia, MUESTRA_INVITADO_VOZ } = await import("@/lib/corpus-guard");
  const items = muestraDelDia((data ?? []) as { gn: string; es: string }[], MUESTRA_INVITADO_VOZ, `voz:${hoyAsuncion()}:${ip}`);
  return { items: items.sort((a, b) => a.gn.localeCompare(b.gn)) };
});

/* ------------------- Lección del curso sin cuenta ------------------- */

/** Solo las lecciones abiertas (GUEST_LESSONS) y solo palabras publicadas: lo mismo que ve quien tiene cuenta. */
export const getCourseLessonGuest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ n: z.number().int().min(1).max(10000) }).parse(d))
  .handler(async ({ data }) => {
    if (!(GUEST_LESSONS as readonly number[]).includes(data.n)) return { lesson: null as CourseLesson | null };
    await guard("leccion");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("id, sort_order, title, theme")
      .eq("status", "published")
      .eq("sort_order", data.n)
      .maybeSingle();
    if (!lesson) return { lesson: null as CourseLesson | null };
    const { data: links, error } = await supabaseAdmin
      .from("lesson_words")
      .select("position, corpus_words!inner(gn, es, status, validated_by, significados)")
      .eq("lesson_id", lesson.id)
      .eq("corpus_words.status", "published")
      .order("position");
    if (error) throw new Error(error.message);
    const vocab: CourseVocabItem[] = (links ?? []).map((x) => {
      const w = x.corpus_words as unknown as { gn: string; es: string; validated_by: string | null; significados?: CourseVocabItem["sig"] | null };
      return { gn: w.gn, es: w.es, validated: !!w.validated_by, sig: w.significados ?? {} };
    });
    return { lesson: { n: lesson.sort_order, title: lesson.title, theme: lesson.theme, vocab } as CourseLesson };
  });
