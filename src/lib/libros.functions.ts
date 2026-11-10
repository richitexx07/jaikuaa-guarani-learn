import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { marcaDeAgua, partirRuta } from "@/lib/libros";

/**
 * Librería Jaikuaa: libros comprados y su lector.
 * - Las páginas (imagen + voz humana opcional) viven en el depósito privado «libros».
 * - Solo quien tiene acceso (libro_accesos) o el administrador recibe enlaces firmados, que vencen en 1 hora.
 * - Mientras no haya pasarela de pago, el acceso lo da el administrador desde /admin/libros
 *   cuando la persona paga (por WhatsApp). Después, la pasarela llamará a la misma función de acceso.
 * - Los archivos se pueden guardar como «libros/…» (subidos desde el panel) o «guarani-audio/…»
 *   (voces ya grabadas de la app). No se acepta otro depósito.
 */

const URL_TTL = 60 * 60;
const MAX_PAGINAS = 2000;

// Las tablas nuevas todavía no están en los tipos generados.
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exigirAdmin(supabase: any, userId: string) {
  if (!(await esAdmin(supabase, userId))) throw new Error("Forbidden");
}

/** Firma muchas rutas de una vez (agrupadas por depósito). Devuelve ruta → URL. */
async function firmar(rutas: (string | null | undefined)[]): Promise<Map<string, string>> {
  const db = await admin();
  const porDeposito = new Map<string, string[]>();
  for (const r of rutas) {
    const p = partirRuta(r);
    if (!p) continue;
    const lista = porDeposito.get(p.bucket) ?? [];
    if (!lista.includes(p.path)) lista.push(p.path);
    porDeposito.set(p.bucket, lista);
  }
  const out = new Map<string, string>();
  for (const [bucket, paths] of porDeposito) {
    for (let i = 0; i < paths.length; i += 200) {
      const lote = paths.slice(i, i + 200);
      const { data } = await db.storage.from(bucket).createSignedUrls(lote, URL_TTL);
      for (const s of (data ?? []) as { path: string | null; signedUrl: string | null }[]) {
        if (s.path && s.signedUrl) out.set(`${bucket}/${s.path}`, s.signedUrl);
      }
    }
  }
  return out;
}

export type LibroCard = {
  id: string;
  titulo: string;
  autor: string;
  descripcion: string;
  portada: string | null;
  paginas: number;
  publicado: boolean;
  tengo: boolean;
  precioGs: number | null;
};

type LibroRow = { id: string; titulo: string; autor: string; descripcion: string; portada_path: string | null; publicado: boolean; precio_gs: number | null; created_at: string };

async function contarPaginas(ids: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (ids.length === 0) return out;
  const db = await admin();
  const { data } = await db.from("libro_paginas").select("libro_id").in("libro_id", ids).limit(MAX_PAGINAS * 20);
  for (const r of (data ?? []) as { libro_id: string }[]) out.set(r.libro_id, (out.get(r.libro_id) ?? 0) + 1);
  return out;
}

async function aTarjetas(rows: LibroRow[], tengo: Set<string> | "todos"): Promise<LibroCard[]> {
  const [urls, paginas] = await Promise.all([firmar(rows.map((r) => r.portada_path)), contarPaginas(rows.map((r) => r.id))]);
  return rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    autor: r.autor,
    descripcion: r.descripcion,
    portada: r.portada_path ? (urls.get(r.portada_path) ?? null) : null,
    paginas: paginas.get(r.id) ?? 0,
    publicado: r.publicado,
    tengo: tengo === "todos" || tengo.has(r.id),
    precioGs: r.precio_gs ?? null,
  }));
}

/** Catálogo público de la Librería: solo libros publicados. Sin sesión, «tengo» siempre es falso. */
export const catalogoLibros = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db
    .from("libros")
    .select("id, titulo, autor, descripcion, portada_path, publicado, precio_gs, created_at")
    .eq("publicado", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return { libros: await aTarjetas((data ?? []) as LibroRow[], new Set()) };
});

/** «Mis libros»: los que la persona compró. El administrador ve todos (para revisarlos antes de publicar). */
export const misLibros = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const soyAdmin = await esAdmin(context.supabase, context.userId);
    const { data: acc } = await db.from("libro_accesos").select("libro_id").eq("user_id", context.userId).limit(500);
    const ids = new Set(((acc ?? []) as { libro_id: string }[]).map((a) => a.libro_id));
    let q = db.from("libros").select("id, titulo, autor, descripcion, portada_path, publicado, precio_gs, created_at").order("created_at", { ascending: false }).limit(200);
    if (!soyAdmin) {
      if (ids.size === 0) return { libros: [] as LibroCard[], esAdmin: false };
      q = q.in("id", [...ids]);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { libros: await aTarjetas((data ?? []) as LibroRow[], soyAdmin ? "todos" : ids), esAdmin: soyAdmin };
  });

export type PaginaLectura = { n: number; imagen: string | null; audio: string | null; texto: string };

/** Abre un libro para leer. Solo con acceso (o administrador). Devuelve enlaces que vencen en 1 hora. */
export const leerLibro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const db = await admin();
    const [soyAdmin, acceso, libro, perfil] = await Promise.all([
      esAdmin(context.supabase, context.userId),
      db.from("libro_accesos").select("id").eq("libro_id", data.id).eq("user_id", context.userId).maybeSingle(),
      db.from("libros").select("id, titulo, autor, publicado").eq("id", data.id).maybeSingle(),
      db.from("profiles").select("full_name, email").eq("id", context.userId).maybeSingle(),
    ]);
    if (!libro.data) return { estado: "no-existe" as const };
    if (!soyAdmin && !acceso.data) return { estado: "sin-acceso" as const, titulo: libro.data.titulo as string };

    const { data: pags, error } = await db
      .from("libro_paginas")
      .select("n, imagen_path, audio_path, texto")
      .eq("libro_id", data.id)
      .order("n")
      .limit(MAX_PAGINAS);
    if (error) throw new Error(error.message);
    const filas = (pags ?? []) as { n: number; imagen_path: string | null; audio_path: string | null; texto: string }[];
    const urls = await firmar(filas.flatMap((p) => [p.imagen_path, p.audio_path]));

    const nombre = ((perfil.data?.full_name as string | null) ?? "").trim();
    const correo = ((perfil.data?.email as string | null) ?? "").trim();
    return {
      estado: "ok" as const,
      titulo: libro.data.titulo as string,
      autor: libro.data.autor as string,
      vistaPrevia: soyAdmin && !acceso.data,
      marca: marcaDeAgua(nombre, correo),
      paginas: filas.map<PaginaLectura>((p) => ({
        n: p.n,
        imagen: p.imagen_path ? (urls.get(p.imagen_path) ?? null) : null,
        audio: p.audio_path ? (urls.get(p.audio_path) ?? null) : null,
        texto: p.texto ?? "",
      })),
    };
  });

/* ───────────────────────── Administración ───────────────────────── */

export type LibroAdmin = LibroCard & {
  portadaPath: string | null;
  lista: { n: number; imagen: string | null; audio: string | null; texto: string }[];
  accesos: { id: string; nombre: string; correo: string; nota: string; fecha: string }[];
};

/** Todo para el panel: libros, sus páginas y quién tiene acceso. */
export const adminLibros = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data, error } = await db
      .from("libros")
      .select("id, titulo, autor, descripcion, portada_path, publicado, precio_gs, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as LibroRow[];
    const ids = rows.map((r) => r.id);
    const tarjetas = await aTarjetas(rows, "todos");
    const [pags, accs] = ids.length
      ? await Promise.all([
          db.from("libro_paginas").select("libro_id, n, imagen_path, audio_path, texto").in("libro_id", ids).order("n").limit(MAX_PAGINAS * 20),
          db.from("libro_accesos").select("id, libro_id, user_id, nota, created_at").in("libro_id", ids).order("created_at", { ascending: false }).limit(5000),
        ])
      : [{ data: [] }, { data: [] }];
    const accRows = (accs.data ?? []) as { id: string; libro_id: string; user_id: string; nota: string; created_at: string }[];
    const userIds = [...new Set(accRows.map((a) => a.user_id))];
    const perfiles = new Map<string, { full_name: string | null; email: string | null }>();
    for (let i = 0; i < userIds.length; i += 200) {
      const { data: ps } = await db.from("profiles").select("id, full_name, email").in("id", userIds.slice(i, i + 200));
      for (const p of (ps ?? []) as { id: string; full_name: string | null; email: string | null }[]) perfiles.set(p.id, p);
    }
    const pagRows = (pags.data ?? []) as { libro_id: string; n: number; imagen_path: string | null; audio_path: string | null; texto: string }[];
    const libros: LibroAdmin[] = tarjetas.map((t, i) => ({
      ...t,
      portadaPath: rows[i].portada_path,
      lista: pagRows.filter((p) => p.libro_id === t.id).map((p) => ({ n: p.n, imagen: p.imagen_path, audio: p.audio_path, texto: p.texto ?? "" })),
      accesos: accRows
        .filter((a) => a.libro_id === t.id)
        .map((a) => ({
          id: a.id,
          nombre: perfiles.get(a.user_id)?.full_name ?? "",
          correo: perfiles.get(a.user_id)?.email ?? "",
          nota: a.nota,
          fecha: a.created_at,
        })),
    }));
    return { libros };
  });

const DatosLibro = z.object({
  titulo: z.string().trim().min(1).max(200),
  autor: z.string().trim().max(200).default(""),
  descripcion: z.string().trim().max(2000).default(""),
});

export const crearLibro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DatosLibro.parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: row, error } = await db
      .from("libros")
      .insert({ titulo: data.titulo, autor: data.autor, descripcion: data.descripcion, creado_por: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const actualizarLibro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    DatosLibro.partial()
      .extend({
        id: z.string().uuid(),
        publicado: z.boolean().optional(),
        portadaPath: z.string().max(300).nullable().optional(),
        precioGs: z.number().int().min(1000).max(10000000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.titulo !== undefined) cambios.titulo = data.titulo;
    if (data.autor !== undefined) cambios.autor = data.autor;
    if (data.descripcion !== undefined) cambios.descripcion = data.descripcion;
    if (data.publicado !== undefined) cambios.publicado = data.publicado;
    if (data.precioGs !== undefined) cambios.precio_gs = data.precioGs;
    if (data.portadaPath !== undefined) {
      if (data.portadaPath !== null && !partirRuta(data.portadaPath)) throw new Error("Ruta inválida");
      cambios.portada_path = data.portadaPath;
    }
    const db = await admin();
    const { error } = await db.from("libros").update(cambios).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarLibro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: archivos } = await db.storage.from("libros").list(data.id, { limit: 1000 });
    const paths = ((archivos ?? []) as { name: string }[]).map((f) => `${data.id}/${f.name}`);
    if (paths.length) await db.storage.from("libros").remove(paths);
    const { error } = await db.from("libros").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MimeLibro = keyof typeof EXT;
const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav" } as const;

/** Enlace para subir un archivo directo al depósito «libros» (lo usa el panel). */
export const urlParaSubir = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        libroId: z.string().uuid(),
        tipo: z.enum(["pagina", "audio", "portada"]),
        n: z.number().int().min(0).max(MAX_PAGINAS),
        mime: z.enum(Object.keys(EXT) as [keyof typeof EXT, ...(keyof typeof EXT)[]]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const esImagen = data.mime.startsWith("image/");
    if ((data.tipo === "audio") === esImagen) throw new Error("Tipo de archivo incorrecto");
    const sello = Date.now().toString(36);
    const nombre = data.tipo === "portada" ? `portada-${sello}` : `${data.tipo === "pagina" ? "p" : "a"}${String(data.n).padStart(4, "0")}-${sello}`;
    const path = `${data.libroId}/${nombre}.${EXT[data.mime]}`;
    const db = await admin();
    const { data: s, error } = await db.storage.from("libros").createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, ruta: `libros/${path}`, token: s.token as string };
  });

/** Crea o actualiza una página (imagen, audio y texto). */
export const guardarPagina = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        libroId: z.string().uuid(),
        n: z.number().int().min(1).max(MAX_PAGINAS),
        imagen: z.string().max(300).nullable().optional(),
        audio: z.string().max(300).nullable().optional(),
        texto: z.string().max(20000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    for (const r of [data.imagen, data.audio]) if (r && !partirRuta(r)) throw new Error("Ruta inválida");
    const db = await admin();
    const fila: Record<string, unknown> = { libro_id: data.libroId, n: data.n };
    if (data.imagen !== undefined) fila.imagen_path = data.imagen;
    if (data.audio !== undefined) fila.audio_path = data.audio;
    if (data.texto !== undefined) fila.texto = data.texto;
    const { error } = await db.from("libro_paginas").upsert(fila, { onConflict: "libro_id,n" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarPagina = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ libroId: z.string().uuid(), n: z.number().int().min(1).max(MAX_PAGINAS) }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: pag } = await db.from("libro_paginas").select("imagen_path, audio_path").eq("libro_id", data.libroId).eq("n", data.n).maybeSingle();
    const propios = [pag?.imagen_path, pag?.audio_path]
      .map((r: string | null | undefined) => partirRuta(r))
      .filter((p): p is { bucket: string; path: string } => !!p && p.bucket === "libros")
      .map((p) => p.path);
    if (propios.length) await db.storage.from("libros").remove(propios);
    const { error } = await db.from("libro_paginas").delete().eq("libro_id", data.libroId).eq("n", data.n);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Dar acceso a un libro por correo (cuando la persona pagó). La persona tiene que tener cuenta en Jaikuaa. */
export const darAcceso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ libroId: z.string().uuid(), email: z.string().trim().toLowerCase().email().max(200), nota: z.string().trim().max(300).default("") }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: perfiles } = await db.from("profiles").select("id, full_name").ilike("email", data.email).limit(2);
    const lista = (perfiles ?? []) as { id: string; full_name: string | null }[];
    if (lista.length === 0) return { estado: "sin-cuenta" as const };
    if (lista.length > 1) return { estado: "duplicado" as const };
    const { error } = await db
      .from("libro_accesos")
      .upsert({ libro_id: data.libroId, user_id: lista[0].id, otorgado_por: context.userId, nota: data.nota }, { onConflict: "libro_id,user_id" });
    if (error) throw new Error(error.message);
    return { estado: "ok" as const, nombre: lista[0].full_name ?? "" };
  });

export const quitarAcceso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await exigirAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db.from("libro_accesos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
