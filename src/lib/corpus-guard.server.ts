/**
 * Vigilancia de pedidos al corpus: tope por hora y aviso al administrador cuando alguien se pasa.
 * El aviso se guarda una sola vez por hora y por persona (o conexión) en `corpus_alertas`.
 */

export type Quien = { ip: string; userId?: null } | { ip?: string; userId: string };

function claveDe(q: Quien): string {
  return q.userId ? `usuario:${q.userId}` : `ip:${q.ip ?? "unknown"}`;
}

/**
 * Suma un pedido. Devuelve false si se pasó del tope (y deja el aviso para el administrador).
 * Si la base no responde, deja pasar: mejor que un alumno no se quede sin jugar.
 */
export async function vigilarPedidos(tipo: string, quien: Quien, limitePorHora: number): Promise<boolean> {
  const { consumeRateLimit } = await import("@/lib/server-guards.server");
  const clave = claveDe(quien);
  const ok = await consumeRateLimit(`corpus:${tipo}:${clave}`, limitePorHora, 3600).catch(() => true);
  if (!ok) await avisar(tipo, quien, clave, limitePorHora).catch(() => undefined);
  return ok;
}

/** Deja el aviso cuando otro control (por ejemplo, el de las voces) frenó a alguien por pedir de más. */
export async function avisarExceso(tipo: string, quien: Quien, limitePorHora: number): Promise<void> {
  await avisar(tipo, quien, claveDe(quien), limitePorHora).catch(() => undefined);
}

async function avisar(tipo: string, quien: Quien, clave: string, limite: number) {
  const { consumeRateLimit } = await import("@/lib/server-guards.server");
  // Un aviso por hora alcanza: no llenar la lista con cada pedido repetido.
  const primero = await consumeRateLimit(`aviso:${tipo}:${clave}`, 1, 3600);
  if (!primero) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any).from("corpus_alertas").insert({
    tipo,
    ip: quien.userId ? null : (quien.ip ?? null),
    user_id: quien.userId ?? null,
    limite_por_hora: limite,
  });
}
