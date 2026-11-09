import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Retos con amigos guardados en la base: así se puede retar ANTES de jugar, y todos los que
 * entran por el mismo enlace aparecen en la tabla del reto (sirve para grupos de WhatsApp,
 * Instagram o Facebook). Cuenta el primer intento de cada persona.
 */

const JUEGOS = ["penales", "ahorcado", "memoria", "sopa", "tembiu", "taanga", "tekojoja", "karaoke", "trivia", "consultorio", "ventanilla", "chacra"] as const;

// Las tablas nuevas todavía no están en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function nombreDe(db: { from: (t: string) => any }, userId: string): Promise<string> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await db.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const full = ((data?.full_name as string | null) ?? "").trim();
  return full.split(/\s+/)[0]?.slice(0, 20) || "Jugador";
}

function nuevoId(): string {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const r = crypto.getRandomValues(new Uint32Array(8));
  for (const n of r) s += abc[n % abc.length];
  return s;
}

/** Un puntaje es posible solo si no supera el máximo del reto (o, si gana el menor, si es mayor a 0). */
export function puntajeValido(puntaje: number, total: number, menos: boolean): boolean {
  if (!Number.isInteger(puntaje) || puntaje < 0) return false;
  if (menos) return puntaje > 0;
  return total > 0 ? puntaje <= total : puntaje === 0;
}

export type RetoResultado = { nombre: string; puntaje: number; mio: boolean };
export type RetoGuardado = {
  id: string;
  juego: (typeof JUEGOS)[number];
  semilla: number;
  extra: string | null;
  total: number;
  unidad: string | null;
  menos: boolean;
  creador: string;
  creadorEsYo: boolean;
  resultados: RetoResultado[];
  miPuntaje: number | null;
};

async function cargar(db: any, id: string, userId: string): Promise<RetoGuardado | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data: r } = await db.from("retos").select("*").eq("id", id).maybeSingle();
  if (!r) return null;
  const { data: rs } = await db.from("reto_resultados").select("user_id, nombre, puntaje, created_at").eq("reto_id", id).order("created_at").limit(200);
  const menos = !!r.menos_es_mejor;
  const lista = ((rs ?? []) as { user_id: string; nombre: string | null; puntaje: number }[])
    .map((x) => ({ nombre: x.nombre || "Jugador", puntaje: x.puntaje, mio: x.user_id === userId }))
    .sort((a, b) => (menos ? a.puntaje - b.puntaje : b.puntaje - a.puntaje));
  const mio = lista.find((x) => x.mio);
  return {
    id: r.id,
    juego: r.juego,
    semilla: Number(r.semilla),
    extra: r.extra ?? null,
    total: r.total ?? 0,
    unidad: r.unidad ?? null,
    menos,
    creador: r.creado_por_nombre || "Tu amigo",
    creadorEsYo: r.creado_por === userId,
    resultados: lista,
    miPuntaje: mio ? mio.puntaje : null,
  };
}

export const crearReto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        juego: z.enum(JUEGOS),
        semilla: z.number().int().min(0).max(2 ** 32),
        extra: z.string().max(40).optional(),
        total: z.number().int().min(0).max(100000),
        unidad: z.string().regex(/^[a-záéíóúñ ]{1,14}$/i).optional(),
        menos: z.boolean().optional(),
        puntaje: z.number().int().min(0).max(100000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await admin();
    const nombre = await nombreDe(db, context.userId);
    let id = "";
    for (let k = 0; k < 4; k++) {
      id = nuevoId();
      const { error } = await db.from("retos").insert({
        id,
        juego: data.juego,
        semilla: data.semilla,
        extra: data.extra ?? null,
        total: data.total,
        unidad: data.unidad ?? null,
        menos_es_mejor: !!data.menos,
        creado_por: context.userId,
        creado_por_nombre: nombre,
      });
      if (!error) break;
      if (k === 3) throw new Error("No se pudo crear el reto. Probá de nuevo.");
    }
    if (data.puntaje !== undefined && puntajeValido(data.puntaje, data.total, !!data.menos)) {
      await db.from("reto_resultados").insert({ reto_id: id, user_id: context.userId, nombre, puntaje: data.puntaje });
    }
    return { id };
  });

export const verReto = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().regex(/^[A-Za-z0-9]{6,12}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    return { reto: await cargar(db, data.id, context.userId) };
  });

/** Ver un reto sin cuenta: quien recibe el enlace por WhatsApp entra a la misma partida. */
export const verRetoPublico = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().regex(/^[A-Za-z0-9]{6,12}$/) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    return { reto: await cargar(db, data.id, "00000000-0000-0000-0000-000000000000") };
  });

export const guardarResultadoReto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().regex(/^[A-Za-z0-9]{6,12}$/), puntaje: z.number().int().min(0).max(100000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: r } = await db.from("retos").select("total, menos_es_mejor, created_at").eq("id", data.id).maybeSingle();
    if (!r) throw new Error("Reto no encontrado");
    if (!puntajeValido(data.puntaje, r.total ?? 0, !!r.menos_es_mejor)) throw new Error("Puntaje no válido");
    const ok = await db.rpc("consume_rate_limit", { _key: `reto:${context.userId}`, _limit: 20, _window_seconds: 600 });
    if (ok.data === false) throw new Error("Demasiados intentos. Esperá unos minutos.");
    const nombre = await nombreDe(db, context.userId);
    // Cuenta el primer intento: si ya jugó este reto, no se cambia.
    await db
      .from("reto_resultados")
      .upsert({ reto_id: data.id, user_id: context.userId, nombre, puntaje: data.puntaje }, { onConflict: "reto_id,user_id", ignoreDuplicates: true });
    return { reto: await cargar(db, data.id, context.userId) };
  });
