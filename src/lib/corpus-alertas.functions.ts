import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AlertaCorpus = {
  quien: string;
  detalle: string;
  tipos: string[];
  veces: number;
  ultima: string;
};

const TIPO: Record<string, string> = {
  "invitado-words": "palabras de los juegos (sin cuenta)",
  "invitado-voz": "palabras con voz (sin cuenta)",
  "invitado-leccion": "lecciones (sin cuenta)",
  "invitado-textos": "textos de los juegos (sin cuenta)",
  "invitado-mostrador": "frases de atención (sin cuenta)",
  "invitado-mostrador-audio": "voces de frases (sin cuenta)",
  "invitado-wotd": "palabra del día (sin cuenta)",
  juegos: "palabras de los juegos",
  glosario: "glosario",
  voz: "palabras con voz",
  lecciones: "lecciones",
  voces: "voces grabadas",
};

/** Quién pidió palabras de más en los últimos 30 días (posibles intentos de copiar el corpus). Solo administración. */
export const getCorpusAlertas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await db
      .from("corpus_alertas")
      .select("tipo, ip, user_id, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { tipo: string; ip: string | null; user_id: string | null; created_at: string }[];

    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
    const nombres = new Map<string, { nombre: string; email: string }>();
    if (ids.length) {
      const { data: profs } = await db.from("profiles").select("id, full_name, email").in("id", ids);
      for (const p of (profs ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
        nombres.set(p.id, { nombre: p.full_name ?? "Sin nombre", email: p.email ?? "" });
      }
    }

    const grupos = new Map<string, AlertaCorpus>();
    for (const r of rows) {
      const k = r.user_id ? `u:${r.user_id}` : `ip:${r.ip}`;
      const p = r.user_id ? nombres.get(r.user_id) : null;
      const g = grupos.get(k) ?? {
        quien: r.user_id ? (p?.nombre ?? "Cuenta borrada") : "Sin cuenta",
        detalle: r.user_id ? (p?.email ?? "") : `Conexión ${r.ip ?? "desconocida"}`,
        tipos: [],
        veces: 0,
        ultima: r.created_at,
      };
      g.veces += 1;
      const t = TIPO[r.tipo] ?? r.tipo;
      if (!g.tipos.includes(t)) g.tipos.push(t);
      grupos.set(k, g);
    }
    return { alertas: [...grupos.values()].sort((a, b) => b.veces - a.veces) };
  });
