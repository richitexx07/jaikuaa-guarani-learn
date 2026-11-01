import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { GameWord } from "@/lib/games.functions";
import type { JuegoId, JuegoTexto } from "@/lib/juego-textos";

/**
 * Lo mínimo para jugar sin cuenta: SOLO contenido ya publicado (lo mismo que ve cualquiera que se registra).
 * Con tope por dirección de internet para que nadie descargue el corpus a lo bruto.
 */
// Alto a propósito: muchos celulares comparten la misma IP de la empresa de telefonía.
const LIMIT_GUEST_PER_HOUR = 3000;

async function guard(kind: string) {
  const { consumeRateLimit, clientIp } = await import("@/lib/server-guards.server");
  const headers = getRequest()?.headers ?? new Headers();
  const ok = await consumeRateLimit(`guest:${kind}:ip:${clientIp(headers)}`, LIMIT_GUEST_PER_HOUR, 3600).catch(() => true);
  if (!ok) throw new Error("Demasiadas consultas seguidas. Creá tu cuenta gratis para seguir jugando.");
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
        .select("corpus_words!inner(gn, es, has_audio, status)")
        .eq("lesson_id", lesson.id)
        .eq("corpus_words.status", "published");
      if (error) throw new Error(error.message);
      const words = (links ?? []).map((x) => {
        const w = x.corpus_words as unknown as { gn: string; es: string; has_audio: boolean };
        return { gn: w.gn, es: w.es, hasAudio: w.has_audio };
      });
      return { words };
    }
    const { data: rows, error } = await supabaseAdmin
      .from("corpus_words")
      .select("gn, es, has_audio")
      .eq("status", "published")
      .limit(2000);
    if (error) throw new Error(error.message);
    return { words: (rows ?? []).map((w) => ({ gn: w.gn, es: w.es, hasAudio: w.has_audio })) as GameWord[] };
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
