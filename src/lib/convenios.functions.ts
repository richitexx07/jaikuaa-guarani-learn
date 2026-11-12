import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CONVENIOS, codigoConvenio, ESTADOS, esCodigoConvenio, faltaParaFirmar, normalizarCI, obrasLlenas, textoCanonico,
  type Estado, type ObraFirmada, type Programa,
} from "@/lib/convenios";
import { normalizarWhatsapp, slugDe } from "@/lib/purahei";

/**
 * Convenios firmados en línea (Purahéi y Librería).
 * - Firma: solo con sesión iniciada y el correo confirmado; el servidor calcula la huella del texto que tiene él
 *   (nunca la que manda el navegador) y guarda fecha, correo, dispositivo e IP.
 * - El Titular ve y descarga su constancia, adjunta su convenio firmado y puede pedir el retiro.
 * - La verificación pública muestra solo nombre, fecha, versión, estado y huella.
 * - La administración revisa, aprueba o rechaza y, en Purahéi, crea la ficha del artista (sin publicarla).
 */

const DEPOSITO = "convenios";
const URL_TTL = 60 * 60;

// La tabla nueva todavía no está en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function esAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** El correo de la cuenta y si está confirmado (Google también lo confirma). */
async function cuenta(userId: string): Promise<{ email: string | null; confirmado: boolean; nombre: string }> {
  const db = await admin();
  const { data } = await db.auth.admin.getUserById(userId);
  const u = data?.user;
  const meta = (u?.user_metadata ?? {}) as Record<string, unknown>;
  const nombre = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
  return { email: u?.email ?? null, confirmado: !!(u?.email && u?.email_confirmed_at), nombre: nombre.slice(0, 120) };
}

function origen(): { ip: string; dispositivo: string } {
  const r = getRequest();
  const h = r?.headers;
  const ip = (h?.get("cf-connecting-ip") || h?.get("x-real-ip") || h?.get("x-forwarded-for")?.split(",")[0] || "").trim().slice(0, 64);
  return { ip, dispositivo: (h?.get("user-agent") ?? "").slice(0, 300) };
}

export type ConvenioRow = {
  id: string; codigo: string; programa: Programa; version: string; huella: string; user_id: string | null; email: string;
  nombre: string; ci: string; whatsapp: string; ciudad: string; roles: string[]; permisos: string[]; obras: ObraFirmada[];
  ip: string; dispositivo: string; firmado_at: string; adjunto_path: string | null; adjunto_tipo: "cualificada" | "manuscrita" | null;
  adjunto_at: string | null; estado: Estado; nota: string; revisado_at: string | null; artista_id: string | null;
};
const COLS = "id, codigo, programa, version, huella, user_id, email, nombre, ci, whatsapp, ciudad, roles, permisos, obras, ip, dispositivo, firmado_at, adjunto_path, adjunto_tipo, adjunto_at, estado, nota, revisado_at, artista_id";

const programaZ = z.enum(["purahei", "libreria"]);
const codigoZ = z.string().trim().toUpperCase().refine(esCodigoConvenio, "Código inválido");

/** Quién soy para firmar: correo y si está confirmado, y mis convenios de ese programa. */
export const miCuentaConvenio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ programa: programaZ }).parse(d))
  .handler(async ({ context, data }) => {
    const c = await cuenta(context.userId);
    const db = await admin();
    const { data: rows } = await db.from("convenios_firmados")
      .select("codigo, version, firmado_at, estado").eq("user_id", context.userId).eq("programa", data.programa)
      .order("firmado_at", { ascending: false }).limit(20);
    return { email: c.email, confirmado: c.confirmado, nombre: c.nombre, convenios: (rows ?? []) as { codigo: string; version: string; firmado_at: string; estado: Estado }[] };
  });

const obraZ = z.object({
  titulo: z.string().max(200), autor: z.string().max(120), interprete: z.string().max(120), productor: z.string().max(120),
});

export const firmarConvenio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    programa: programaZ,
    version: z.string().max(40),
    nombre: z.string().max(120),
    ci: z.string().max(30),
    whatsapp: z.string().max(30),
    ciudad: z.string().max(120),
    roles: z.array(z.string().max(20)).max(6),
    permisos: z.array(z.string().max(20)).max(10),
    obras: z.array(obraZ).max(30),
    acepto: z.literal(true),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const conv = CONVENIOS[data.programa];
    if (data.version !== conv.version) throw new Error("El texto del convenio cambió. Recargá la página y leelo de nuevo antes de firmar.");
    const roles = data.roles.filter((r) => conv.roles.some((x) => x.id === r));
    const permisos = data.permisos.filter((p) => conv.permisos.some((x) => x.id === p));
    const firma = { nombre: data.nombre, ci: data.ci, whatsapp: data.whatsapp, ciudad: data.ciudad, roles, permisos, obras: data.obras, acepto: true };
    const falta = faltaParaFirmar(conv, firma);
    if (falta.length) throw new Error(`Falta: ${falta.join(", ")}`);

    const c = await cuenta(context.userId);
    if (!c.email || !c.confirmado) throw new Error("Primero confirmá tu correo: te mandamos un enlace al crear la cuenta.");

    const db = await admin();
    const { count } = await db.from("convenios_firmados").select("id", { count: "exact", head: true })
      .eq("user_id", context.userId).eq("estado", "pendiente");
    if ((count ?? 0) >= 5) throw new Error("Ya tenés cinco convenios en revisión. Esperá a que los revisemos o escribinos.");

    const huella = await sha256(textoCanonico(conv));
    const { ip, dispositivo } = origen();
    const fila = {
      programa: data.programa, version: conv.version, huella, user_id: context.userId, email: c.email,
      nombre: data.nombre.trim().replace(/\s+/g, " "), ci: normalizarCI(data.ci)!, whatsapp: normalizarWhatsapp(data.whatsapp)!,
      ciudad: data.ciudad.trim(), roles, permisos, obras: obrasLlenas(data.obras), ip, dispositivo,
    };
    const anio = new Date().getUTCFullYear();
    for (let i = 0; i < 5; i++) {
      const codigo = codigoConvenio(anio, crypto.getRandomValues(new Uint8Array(6)));
      const { error } = await db.from("convenios_firmados").insert({ ...fila, codigo });
      if (!error) return { codigo };
      if (!String(error.message).includes("duplicate")) throw new Error("No se pudo guardar la firma. Probá de nuevo.");
    }
    throw new Error("No se pudo guardar la firma. Probá de nuevo.");
  });

async function miConvenio(userId: string, codigo: string, puedeAdmin: boolean): Promise<ConvenioRow> {
  const db = await admin();
  const { data: row } = await db.from("convenios_firmados").select(COLS).eq("codigo", codigo).maybeSingle();
  if (!row || (row.user_id !== userId && !puedeAdmin)) throw new Error("No encontramos esa constancia en tu cuenta.");
  return row as ConvenioRow;
}

/** La constancia completa (solo el Titular o la administración). */
export const verConstancia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ codigo: codigoZ }).parse(d))
  .handler(async ({ context, data }) => {
    const a = await esAdmin(context.supabase, context.userId);
    const row = await miConvenio(context.userId, data.codigo, a);
    let adjuntoUrl: string | null = null;
    if (row.adjunto_path) {
      const db = await admin();
      const { data: s } = await db.storage.from(DEPOSITO).createSignedUrl(row.adjunto_path, URL_TTL);
      adjuntoUrl = s?.signedUrl ?? null;
    }
    return { ...row, adjuntoUrl, esTitular: row.user_id === context.userId };
  });

export const MIME_ADJUNTO = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type MimeAdjunto = keyof typeof MIME_ADJUNTO;

/** Enlace para subir el convenio firmado (PDF con firma cualificada o foto del papel firmado). */
export const urlAdjuntoConvenio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    codigo: codigoZ,
    mime: z.enum(Object.keys(MIME_ADJUNTO) as [MimeAdjunto, ...MimeAdjunto[]]),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const row = await miConvenio(context.userId, data.codigo, false);
    if (row.estado === "retirado") throw new Error("Este convenio ya fue retirado.");
    const path = `${row.codigo}/adjunto-${Date.now().toString(36)}.${MIME_ADJUNTO[data.mime]}`;
    const db = await admin();
    const { data: s, error } = await db.storage.from(DEPOSITO).createSignedUploadUrl(path);
    if (error) throw new Error("No se pudo preparar la subida.");
    return { path, token: s.token as string };
  });

export const confirmarAdjunto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    codigo: codigoZ, path: z.string().max(300), tipo: z.enum(["cualificada", "manuscrita"]),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const row = await miConvenio(context.userId, data.codigo, false);
    if (!data.path.startsWith(`${row.codigo}/adjunto-`)) throw new Error("Archivo inválido");
    const db = await admin();
    const nombre = data.path.slice(row.codigo.length + 1);
    const { data: lista } = await db.storage.from(DEPOSITO).list(row.codigo, { search: nombre, limit: 1 });
    if (!lista?.length) throw new Error("No encontramos el archivo subido. Probá de nuevo.");
    const { error } = await db.from("convenios_firmados")
      .update({ adjunto_path: data.path, adjunto_tipo: data.tipo, adjunto_at: new Date().toISOString() }).eq("id", row.id);
    if (error) throw new Error("No se pudo guardar el adjunto.");
    if (row.adjunto_path && row.adjunto_path !== data.path) await db.storage.from(DEPOSITO).remove([row.adjunto_path]);
    return { ok: true };
  });

/** El Titular pide el retiro: el equipo lo ve en el panel y tiene siete días para retirar. */
export const pedirRetiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ codigo: codigoZ, motivo: z.string().max(500) }).parse(d))
  .handler(async ({ context, data }) => {
    const row = await miConvenio(context.userId, data.codigo, false);
    if (row.estado === "retirado" || row.estado === "retiro_pedido") return { ok: true };
    const db = await admin();
    const nota = `${row.nota ? `${row.nota}\n` : ""}Retiro pedido por el Titular el ${new Date().toISOString().slice(0, 10)}${data.motivo.trim() ? `: ${data.motivo.trim()}` : "."}`.slice(-1000);
    const { error } = await db.from("convenios_firmados").update({ estado: "retiro_pedido", nota }).eq("id", row.id);
    if (error) throw new Error("No se pudo pedir el retiro.");
    return { ok: true };
  });

/** Verificación pública: solo lo impreso en la constancia. */
export const verificarConvenio = createServerFn({ method: "GET" })
  .inputValidator((d: { codigo: string }) => z.object({ codigo: z.string().trim().toUpperCase().max(20) }).parse(d))
  .handler(async ({ data }) => {
    if (!esCodigoConvenio(data.codigo)) return null;
    const db = await admin();
    const { data: row } = await db.from("convenios_firmados")
      .select("codigo, programa, version, huella, nombre, firmado_at, estado, adjunto_tipo")
      .eq("codigo", data.codigo).maybeSingle();
    return (row ?? null) as null | {
      codigo: string; programa: Programa; version: string; huella: string; nombre: string; firmado_at: string; estado: Estado;
      adjunto_tipo: "cualificada" | "manuscrita" | null;
    };
  });

// ——— Administración ———

export const panelConvenios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ programa: programaZ.optional(), estado: z.enum(ESTADOS).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    let q = db.from("convenios_firmados").select(COLS).order("firmado_at", { ascending: false }).limit(300);
    if (data.programa) q = q.eq("programa", data.programa);
    if (data.estado) q = q.eq("estado", data.estado);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ConvenioRow[];
  });

export const decidirConvenio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(), estado: z.enum(["aprobado", "rechazado", "retirado"]), nota: z.string().max(1000),
  }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { error } = await db.from("convenios_firmados").update({
      estado: data.estado, nota: data.nota.trim(), revisado_por: context.userId, revisado_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Purahéi: crea la ficha del artista con los datos del convenio (sin publicar: falta la foto y sus obras). */
export const crearFichaDesdeConvenio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { data: row } = await db.from("convenios_firmados").select(COLS).eq("id", data.id).maybeSingle();
    const c = row as ConvenioRow | null;
    if (!c || c.programa !== "purahei") throw new Error("Solo para convenios de Purahéi");
    if (c.estado !== "aprobado") throw new Error("Primero aprobá el convenio");
    if (c.artista_id) return { artistaId: c.artista_id };
    const base = slugDe(c.nombre);
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: hay } = await db.from("purahei_artistas").select("id").eq("slug", slug).maybeSingle();
      if (!hay) break;
      slug = `${base.slice(0, 55)}-${i}`;
    }
    const { data: nuevo, error } = await db.from("purahei_artistas").insert({
      slug, nombre: c.nombre, ciudad: c.ciudad,
      whatsapp: c.permisos.includes("whatsapp") ? c.whatsapp : null,
      permiso_imagen: c.permisos.includes("imagen"),
      publicado: false, creado_por: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await db.from("convenios_firmados").update({ artista_id: nuevo.id }).eq("id", c.id);
    return { artistaId: nuevo.id as string };
  });
