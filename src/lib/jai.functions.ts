import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scrubJaiText } from "@/lib/jai-faq";

/**
 * Registro anónimo de lo que la gente le pregunta a Jai, para mejorar las respuestas.
 * No se guarda quién pregunta; se borran correos, teléfonos y números largos.
 */

// La tabla nueva todavía no está en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const Input = z.object({
  texto: z.string().trim().min(1).max(500),
  ruta: z.string().max(300).default("/"),
  resultado: z.enum(["respondida", "opciones", "derivada", "no-util", "sugerencia"]),
  faqId: z.string().max(40).nullable().default(null),
  // Correo opcional, solo para sugerencias/quejas. Se acepta como texto libre
  // (aunque tenga un error de tipeo) para que la sugerencia nunca se pierda.
  contacto: z.string().trim().max(200).nullable().optional().catch(null),
});

export const logJaiQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { consumeRateLimit, clientIp } = await import("@/lib/server-guards.server");
    const ip = clientIp(getRequest()?.headers ?? new Headers());
    if (!(await consumeRateLimit(`jai:ip:${ip}`, 40, 3600))) return { ok: false };
    const texto = scrubJaiText(data.texto);
    if (!texto) return { ok: false };
    const ruta = data.ruta.split("?")[0].replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id").slice(0, 120) || "/";
    const contacto = data.resultado === "sugerencia" && data.contacto ? data.contacto.toLowerCase() : null;
    const db = await admin();
    const { error } = await db.from("jai_consultas").insert({ texto, ruta, resultado: data.resultado, faq_id: data.faqId, contacto });
    return { ok: !error };
  });

export type JaiConsulta = { texto: string; ruta: string; resultado: string; faq_id: string | null; contacto: string | null; created_at: string };

/** Para el administrador: lo que Jai no supo responder y qué respuestas se usan más (últimos 30 días). */
export const getJaiReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (isAdmin !== true) throw new Error("Forbidden");
    const db = await admin();
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await db
      .from("jai_consultas")
      .select("texto, ruta, resultado, faq_id, contacto, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as JaiConsulta[];
    const counts: Record<string, number> = {};
    for (const r of rows) if (r.faq_id && r.resultado !== "no-util" && r.resultado !== "sugerencia") counts[r.faq_id] = (counts[r.faq_id] ?? 0) + 1;
    const noUtil: Record<string, number> = {};
    for (const r of rows) if (r.faq_id && r.resultado === "no-util") noUtil[r.faq_id] = (noUtil[r.faq_id] ?? 0) + 1;
    return {
      sugerencias: rows.filter((r) => r.resultado === "sugerencia").slice(0, 100),
      total: rows.filter((r) => r.resultado !== "sugerencia").length,
      sinRespuesta: rows.filter((r) => r.resultado === "derivada" || r.resultado === "opciones").slice(0, 100),
      masUsadas: Object.entries(counts).sort((a, b) => b[1] - a[1]),
      noUtil: Object.entries(noUtil).sort((a, b) => b[1] - a[1]),
    };
  });
