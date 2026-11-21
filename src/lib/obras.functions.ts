import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AREAS, TIPOS_OBRA, informeVentas, puedeEditarObra, type Area, type EstadoRevision, type FilaInforme, type TipoObra } from "@/lib/obras";

/**
 * Portal del autor (Mis obras) y alta de autores.
 * - El administrador habilita a un autor o docente por su correo de Jaikuaa (tabla «autores»).
 * - El autor crea sus obras (libro o módulo de especialización), carga páginas y voz, propone un precio
 *   y la manda a revisión. Publicar, fijar el precio final, marcar la autorización firmada y el porcentaje
 *   es solo del administrador (/admin/libros).
 * - El autor ve sus ventas reales por mes (sin las compras de prueba) y su parte según contrato.
 */

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

async function autorHabilitado(userId: string): Promise<{ nombre: string } | null> {
  const db = await admin();
  const { data } = await db.from("autores").select("nombre, habilitado").eq("user_id", userId).maybeSingle();
  return data && data.habilitado ? { nombre: (data.nombre as string) ?? "" } : null;
}

export type ObraAutor = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoObra;
  area: Area | null;
  estado: EstadoRevision;
  nota: string;
  publicado: boolean;
  precioGs: number | null;
  precioPropuestoGs: number | null;
  porcentajeAutor: number | null;
  portadaPath: string | null;
  editable: boolean;
  lista: { n: number; imagen: string | null; audio: string | null; texto: string }[];
};

/** Todo lo del portal: si la persona es autora, sus obras con páginas y el informe de ventas. */
export const miPortalAutor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const soyAdmin = await esAdmin(context.supabase, context.userId);
    const autor = await autorHabilitado(context.userId);
    if (!autor && !soyAdmin) return { estado: "no-autor" as const };
    const db = await admin();
    const { data, error } = await db
      .from("libros")
      .select("id, titulo, descripcion, tipo, area, estado_revision, nota_revision, publicado, precio_gs, precio_propuesto_gs, porcentaje_autor, portada_path, autor_id, created_at")
      .eq("autor_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[];
    const ids = rows.map((r) => r.id as string);
    const [pags, pagos] = ids.length
      ? await Promise.all([
          db.from("libro_paginas").select("libro_id, n, imagen_path, audio_path, texto").in("libro_id", ids).order("n").limit(20000),
          db.from("pagos").select("ref_id, monto_gs, pagado_at").in("ref_id", ids).eq("estado", "pagado").neq("modo", "prueba").not("pagado_at", "is", null).limit(20000),
        ])
      : [{ data: [] }, { data: [] }];
    const pagRows = (pags.data ?? []) as { libro_id: string; n: number; imagen_path: string | null; audio_path: string | null; texto: string }[];
    const obras: ObraAutor[] = rows.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion ?? "",
      tipo: r.tipo ?? "libro",
      area: r.area ?? null,
      estado: r.estado_revision,
      nota: r.nota_revision ?? "",
      publicado: !!r.publicado,
      precioGs: r.precio_gs ?? null,
      precioPropuestoGs: r.precio_propuesto_gs ?? null,
      porcentajeAutor: r.porcentaje_autor ?? null,
      portadaPath: r.portada_path ?? null,
      editable: puedeEditarObra({ autorId: r.autor_id, estado: r.estado_revision, publicado: !!r.publicado }, context.userId, false),
      lista: pagRows.filter((p) => p.libro_id === r.id).map((p) => ({ n: p.n, imagen: p.imagen_path, audio: p.audio_path, texto: p.texto ?? "" })),
    }));
    const informe: FilaInforme[] = informeVentas(
      ((pagos.data ?? []) as { ref_id: string; monto_gs: number; pagado_at: string }[]).map((p) => ({ refId: p.ref_id, montoGs: p.monto_gs, pagadoAt: p.pagado_at })),
      obras.map((o) => ({ id: o.id, titulo: o.titulo, porcentajeAutor: o.porcentajeAutor })),
    );
    return { estado: "ok" as const, nombre: autor?.nombre ?? "", esAdmin: soyAdmin, habilitado: !!autor, obras, informe };
  });

const DatosObra = z.object({
  titulo: z.string().trim().min(1).max(200),
  descripcion: z.string().trim().max(2000).default(""),
  tipo: z.enum(TIPOS_OBRA).default("libro"),
  area: z.enum(AREAS).nullable().default(null),
  precioPropuestoGs: z.number().int().min(1000).max(10000000).nullable().default(null),
});

/** El autor crea una obra nueva (queda en borrador, sin publicar). */
export const crearObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DatosObra.parse(d))
  .handler(async ({ context, data }) => {
    const autor = await autorHabilitado(context.userId);
    if (!autor) throw new Error("Forbidden");
    const db = await admin();
    const { count } = await db.from("libros").select("id", { count: "exact", head: true }).eq("autor_id", context.userId).neq("estado_revision", "aprobado");
    if ((count ?? 0) >= 20) throw new Error("Tenés muchas obras sin terminar. Mandá alguna a revisión antes de crear otra.");
    const { data: row, error } = await db
      .from("libros")
      .insert({
        titulo: data.titulo,
        descripcion: data.descripcion,
        autor: autor.nombre,
        autor_id: context.userId,
        creado_por: context.userId,
        tipo: data.tipo,
        area: data.tipo === "modulo" ? data.area : null,
        precio_propuesto_gs: data.precioPropuestoGs,
        estado_revision: "borrador",
        publicado: false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

async function exigirObraEditable(userId: string, id: string) {
  const db = await admin();
  const { data } = await db.from("libros").select("autor_id, estado_revision, publicado").eq("id", id).maybeSingle();
  if (!data || !puedeEditarObra({ autorId: data.autor_id, estado: data.estado_revision, publicado: data.publicado }, userId, false)) throw new Error("Forbidden");
}

/** El autor cambia los datos de su obra (mientras está en borrador u observada). */
export const editarObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    DatosObra.partial()
      .extend({ id: z.string().uuid(), portadaPath: z.string().max(300).nullable().optional() })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirObraEditable(context.userId, data.id);
    const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.titulo !== undefined) cambios.titulo = data.titulo;
    if (data.descripcion !== undefined) cambios.descripcion = data.descripcion;
    if (data.tipo !== undefined) {
      cambios.tipo = data.tipo;
      if (data.tipo === "libro") cambios.area = null;
    }
    if (data.area !== undefined && data.tipo !== "libro") cambios.area = data.area;
    if (data.precioPropuestoGs !== undefined) cambios.precio_propuesto_gs = data.precioPropuestoGs;
    if (data.portadaPath !== undefined) {
      if (data.portadaPath !== null && !data.portadaPath.startsWith(`libros/${data.id}/`)) throw new Error("Ruta inválida");
      cambios.portada_path = data.portadaPath;
    }
    const db = await admin();
    const { error } = await db.from("libros").update(cambios).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** El autor manda su obra a revisión. Necesita al menos una página. */
export const enviarARevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirObraEditable(context.userId, data.id);
    const db = await admin();
    const { count } = await db.from("libro_paginas").select("n", { count: "exact", head: true }).eq("libro_id", data.id);
    if (!count) throw new Error("Cargá al menos una página antes de mandarla a revisión.");
    const { error } = await db.from("libros").update({ estado_revision: "en_revision", updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** El autor borra una obra suya que todavía es borrador y nunca se vendió. */
export const borrarObraAutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirObraEditable(context.userId, data.id);
    const db = await admin();
    const { count } = await db.from("pagos").select("id", { count: "exact", head: true }).eq("ref_id", data.id).eq("estado", "pagado");
    if (count) throw new Error("Esta obra ya tiene ventas: para darla de baja, hablá con Jaikuaa.");
    const { data: archivos } = await db.storage.from("libros").list(data.id, { limit: 1000 });
    const paths = ((archivos ?? []) as { name: string }[]).map((f) => `${data.id}/${f.name}`);
    if (paths.length) await db.storage.from("libros").remove(paths);
    const { error } = await db.from("libros").delete().eq("id", data.id).eq("autor_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ───────────────────────── Administrador: autores ───────────────────────── */

export type AutorFila = { userId: string; nombre: string; correo: string; habilitado: boolean; obras: number };

export const listarAutores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await esAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { data } = await db.from("autores").select("user_id, nombre, habilitado").order("created_at", { ascending: false }).limit(500);
    const rows = (data ?? []) as { user_id: string; nombre: string; habilitado: boolean }[];
    const ids = rows.map((r) => r.user_id);
    const [perfiles, obras] = ids.length
      ? await Promise.all([
          db.from("profiles").select("id, email").in("id", ids),
          db.from("libros").select("autor_id").in("autor_id", ids).limit(5000),
        ])
      : [{ data: [] }, { data: [] }];
    const correo = new Map(((perfiles.data ?? []) as { id: string; email: string | null }[]).map((p) => [p.id, p.email ?? ""]));
    const cuenta = new Map<string, number>();
    for (const o of (obras.data ?? []) as { autor_id: string }[]) cuenta.set(o.autor_id, (cuenta.get(o.autor_id) ?? 0) + 1);
    return { autores: rows.map<AutorFila>((r) => ({ userId: r.user_id, nombre: r.nombre, correo: correo.get(r.user_id) ?? "", habilitado: r.habilitado, obras: cuenta.get(r.user_id) ?? 0 })) };
  });

async function buscarCuenta(email: string): Promise<{ estado: "ok"; id: string; nombre: string } | { estado: "sin-cuenta" | "duplicado" }> {
  const db = await admin();
  const { data } = await db.from("profiles").select("id, full_name").ilike("email", email).limit(2);
  const lista = (data ?? []) as { id: string; full_name: string | null }[];
  if (lista.length === 0) return { estado: "sin-cuenta" };
  if (lista.length > 1) return { estado: "duplicado" };
  return { estado: "ok", id: lista[0].id, nombre: lista[0].full_name ?? "" };
}

/** Habilita (o vuelve a habilitar) a un autor por su correo de Jaikuaa. */
export const habilitarAutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(200), nombre: z.string().trim().max(200).default("") }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!(await esAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const c = await buscarCuenta(data.email);
    if (c.estado !== "ok") return { estado: c.estado };
    const db = await admin();
    const { error } = await db
      .from("autores")
      .upsert({ user_id: c.id, nombre: data.nombre || c.nombre, habilitado: true, habilitado_por: context.userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { estado: "ok" as const };
  });

export const deshabilitarAutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), habilitado: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await esAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { error } = await db.from("autores").update({ habilitado: data.habilitado, updated_at: new Date().toISOString() }).eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Asigna (o saca) el autor de una obra por su correo. */
export const asignarAutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ libroId: z.string().uuid(), email: z.string().trim().toLowerCase().email().max(200).nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!(await esAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const db = await admin();
    if (data.email === null) {
      const { error } = await db.from("libros").update({ autor_id: null, updated_at: new Date().toISOString() }).eq("id", data.libroId);
      if (error) throw new Error(error.message);
      return { estado: "ok" as const };
    }
    const c = await buscarCuenta(data.email);
    if (c.estado !== "ok") return { estado: c.estado };
    const { error } = await db.from("libros").update({ autor_id: c.id, updated_at: new Date().toISOString() }).eq("id", data.libroId);
    if (error) throw new Error(error.message);
    return { estado: "ok" as const };
  });
