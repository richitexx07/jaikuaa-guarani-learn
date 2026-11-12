import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizarWhatsapp } from "@/lib/purahei";
import { faltaArtesano, OFICIO_IDS, type OficioId } from "@/lib/tembiapo";

/**
 * Tembiapo Jaikuaa: la vitrina de maestros artesanos.
 * - El público ve solo rutas, artesanos, piezas y palabras publicadas; las fotos y audios llegan con enlaces
 *   firmados que vencen en 1 hora.
 * - La administración carga rutas, artesanos, piezas, permisos y archivos.
 * - Los docentes (rol editor) cargan las palabras de cada oficio en guaraní y su significado; otro docente las revisa.
 *   Nadie del equipo técnico escribe guaraní. La base de datos también exige la revisión (constraint tembiapo_termino_publicable).
 */

const URL_TTL = 60 * 60;
const DEPOSITO = "tembiapo";
const oficioZ = z.enum(OFICIO_IDS as unknown as [OficioId, ...OficioId[]]);

// Las tablas nuevas todavía no están en los tipos generados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function roles(supabase: any, userId: string): Promise<{ admin: boolean; docente: boolean }> {
  const [a, e] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
  ]);
  return { admin: a.data === true, docente: a.data === true || e.data === true };
}

/** Firma rutas «tembiapo/…». Devuelve ruta → URL. */
async function firmar(rutas: (string | null | undefined)[]): Promise<Map<string, string>> {
  const paths = [...new Set(rutas.filter((r): r is string => !!r && r.startsWith(`${DEPOSITO}/`)).map((r) => r.slice(DEPOSITO.length + 1)))];
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const db = await admin();
  for (let i = 0; i < paths.length; i += 200) {
    const { data } = await db.storage.from(DEPOSITO).createSignedUrls(paths.slice(i, i + 200), URL_TTL);
    for (const s of (data ?? []) as { path: string | null; signedUrl: string | null }[]) {
      if (s.path && s.signedUrl) out.set(`${DEPOSITO}/${s.path}`, s.signedUrl);
    }
  }
  return out;
}
const url = (m: Map<string, string>, r: string | null | undefined) => (r ? (m.get(r) ?? null) : null);

/* ---------------------------------- Filas ---------------------------------- */

type RutaRow = {
  id: string; slug: string; nombre: string; descripcion: string; lugares: string[]; foto_path: string | null;
  auspiciante: string; auspiciante_url: string | null; orden: number; publicado: boolean;
};
type ArtesanoRow = {
  id: string; slug: string; nombre: string; oficio: OficioId; ciudad: string; departamento: string; comunidad: string;
  ruta_id: string | null; bio: string; foto_path: string | null; whatsapp: string | null; contacto: string;
  maestro_ipa: boolean; permiso_imagen: boolean; consentimiento_comunidad: boolean; publicado: boolean; created_at: string;
};
type PiezaRow = {
  id: string; artesano_id: string; titulo: string; descripcion: string; tecnica: string; materiales: string; medidas: string;
  tiempo: string; fotos: string[]; orden: number; publicado: boolean;
};
type TerminoRow = {
  id: string; oficio: OficioId; artesano_id: string | null; termino: string; significado: string; audio_path: string | null;
  cargado_por: string | null; revisado_por: string | null; revisado_at: string | null; publicado: boolean;
};
const COLS_RUTA = "id, slug, nombre, descripcion, lugares, foto_path, auspiciante, auspiciante_url, orden, publicado";
const COLS_ART = "id, slug, nombre, oficio, ciudad, departamento, comunidad, ruta_id, bio, foto_path, whatsapp, contacto, maestro_ipa, permiso_imagen, consentimiento_comunidad, publicado, created_at";
const COLS_PIEZA = "id, artesano_id, titulo, descripcion, tecnica, materiales, medidas, tiempo, fotos, orden, publicado";
const COLS_TERM = "id, oficio, artesano_id, termino, significado, audio_path, cargado_por, revisado_por, revisado_at, publicado";

/* --------------------------------- Público --------------------------------- */

export type ArtesanoCard = {
  id: string; slug: string; nombre: string; oficio: OficioId; ciudad: string; comunidad: string; foto: string | null;
  maestro: boolean; piezas: number; rutaId: string | null;
};
export type RutaCard = { id: string; slug: string; nombre: string; descripcion: string; lugares: string[]; foto: string | null; auspiciante: string; artesanos: number };

function aCard(a: ArtesanoRow, urls: Map<string, string>, piezas: number): ArtesanoCard {
  return { id: a.id, slug: a.slug, nombre: a.nombre, oficio: a.oficio, ciudad: a.ciudad, comunidad: a.comunidad, foto: url(urls, a.foto_path), maestro: a.maestro_ipa, piezas, rutaId: a.ruta_id };
}

/** La vitrina: artesanos y rutas publicados. */
export const vitrinaTembiapo = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const [{ data: arts, error }, { data: rutas }] = await Promise.all([
    db.from("tembiapo_artesanos").select(COLS_ART).eq("publicado", true).order("nombre").limit(500),
    db.from("tembiapo_rutas").select(COLS_RUTA).eq("publicado", true).order("orden").limit(50),
  ]);
  if (error) throw new Error(error.message);
  const artesanos = (arts ?? []) as ArtesanoRow[];
  const ids = artesanos.map((a) => a.id);
  const { data: piezas } = ids.length
    ? await db.from("tembiapo_piezas").select("artesano_id").eq("publicado", true).in("artesano_id", ids).limit(5000)
    : { data: [] };
  const cuenta = new Map<string, number>();
  for (const p of (piezas ?? []) as { artesano_id: string }[]) cuenta.set(p.artesano_id, (cuenta.get(p.artesano_id) ?? 0) + 1);
  const rs = (rutas ?? []) as RutaRow[];
  const urls = await firmar([...artesanos.map((a) => a.foto_path), ...rs.map((r) => r.foto_path)]);
  return {
    artesanos: artesanos.map((a) => aCard(a, urls, cuenta.get(a.id) ?? 0)),
    rutas: rs.map<RutaCard>((r) => ({
      id: r.id, slug: r.slug, nombre: r.nombre, descripcion: r.descripcion, lugares: r.lugares ?? [], foto: url(urls, r.foto_path),
      auspiciante: r.auspiciante, artesanos: artesanos.filter((a) => a.ruta_id === r.id).length,
    })),
  };
});

export type Termino = { id: string; termino: string; significado: string; audio: string | null };
export type PiezaCard = { id: string; titulo: string; tecnica: string; foto: string | null };

async function terminosPublicados(filtro: { oficio?: OficioId; artesanoId?: string }): Promise<Termino[]> {
  const db = await admin();
  let q = db.from("tembiapo_glosario").select(COLS_TERM).eq("publicado", true).order("termino").limit(300);
  if (filtro.oficio) q = q.eq("oficio", filtro.oficio);
  if (filtro.artesanoId) q = q.eq("artesano_id", filtro.artesanoId);
  const { data } = await q;
  const rows = (data ?? []) as TerminoRow[];
  const urls = await firmar(rows.map((t) => t.audio_path));
  return rows.map((t) => ({ id: t.id, termino: t.termino, significado: t.significado, audio: url(urls, t.audio_path) }));
}

/** Un oficio: sus artesanos publicados y sus palabras revisadas. */
export const oficioTembiapo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ oficio: oficioZ }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: arts } = await db.from("tembiapo_artesanos").select(COLS_ART).eq("publicado", true).eq("oficio", data.oficio).order("nombre").limit(200);
    const artesanos = (arts ?? []) as ArtesanoRow[];
    const urls = await firmar(artesanos.map((a) => a.foto_path));
    return { artesanos: artesanos.map((a) => aCard(a, urls, 0)), palabras: await terminosPublicados({ oficio: data.oficio }) };
  });

export type FichaArtesano = {
  id: string; slug: string; nombre: string; oficio: OficioId; ciudad: string; departamento: string; comunidad: string;
  bio: string; foto: string | null; whatsapp: string | null; contacto: string; maestro: boolean;
  ruta: { slug: string; nombre: string } | null; piezas: PiezaCard[]; palabras: Termino[];
};

/** La ficha de un artesano con sus piezas y sus palabras publicadas. */
export const fichaArtesano = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(2).max(60) }).parse(d))
  .handler(async ({ data }): Promise<FichaArtesano | null> => {
    const db = await admin();
    const { data: a } = await db.from("tembiapo_artesanos").select(COLS_ART).eq("slug", data.slug).eq("publicado", true).maybeSingle();
    if (!a) return null;
    const art = a as ArtesanoRow;
    const [{ data: ps }, { data: r }] = await Promise.all([
      db.from("tembiapo_piezas").select(COLS_PIEZA).eq("artesano_id", art.id).eq("publicado", true).order("orden").limit(100),
      art.ruta_id ? db.from("tembiapo_rutas").select("slug, nombre, publicado").eq("id", art.ruta_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const piezas = (ps ?? []) as PiezaRow[];
    const urls = await firmar([art.foto_path, ...piezas.map((p) => p.fotos?.[0])]);
    const ruta = r as { slug: string; nombre: string; publicado: boolean } | null;
    return {
      id: art.id, slug: art.slug, nombre: art.nombre, oficio: art.oficio, ciudad: art.ciudad, departamento: art.departamento,
      comunidad: art.comunidad, bio: art.bio, foto: url(urls, art.foto_path), whatsapp: art.whatsapp, contacto: art.contacto,
      maestro: art.maestro_ipa, ruta: ruta?.publicado ? { slug: ruta.slug, nombre: ruta.nombre } : null,
      piezas: piezas.map((p) => ({ id: p.id, titulo: p.titulo, tecnica: p.tecnica, foto: url(urls, p.fotos?.[0]) })),
      palabras: await terminosPublicados({ artesanoId: art.id }),
    };
  });

export type PiezaCompleta = {
  id: string; titulo: string; descripcion: string; tecnica: string; materiales: string; medidas: string; tiempo: string;
  fotos: string[]; artesano: { slug: string; nombre: string; oficio: OficioId; ciudad: string; whatsapp: string | null; contacto: string; foto: string | null };
};

/** Una pieza publicada, con su artesano. */
export const verPieza = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<PiezaCompleta | null> => {
    const db = await admin();
    const { data: p } = await db.from("tembiapo_piezas").select(COLS_PIEZA).eq("id", data.id).eq("publicado", true).maybeSingle();
    if (!p) return null;
    const pieza = p as PiezaRow;
    const { data: a } = await db.from("tembiapo_artesanos").select(COLS_ART).eq("id", pieza.artesano_id).eq("publicado", true).maybeSingle();
    if (!a) return null;
    const art = a as ArtesanoRow;
    const urls = await firmar([...(pieza.fotos ?? []), art.foto_path]);
    return {
      id: pieza.id, titulo: pieza.titulo, descripcion: pieza.descripcion, tecnica: pieza.tecnica, materiales: pieza.materiales,
      medidas: pieza.medidas, tiempo: pieza.tiempo, fotos: (pieza.fotos ?? []).map((f) => url(urls, f)).filter((x): x is string => !!x),
      artesano: { slug: art.slug, nombre: art.nombre, oficio: art.oficio, ciudad: art.ciudad, whatsapp: art.whatsapp, contacto: art.contacto, foto: url(urls, art.foto_path) },
    };
  });

/** Una ruta cultural publicada, con sus artesanos. */
export const verRuta = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(2).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: r } = await db.from("tembiapo_rutas").select(COLS_RUTA).eq("slug", data.slug).eq("publicado", true).maybeSingle();
    if (!r) return null;
    const ruta = r as RutaRow;
    const { data: arts } = await db.from("tembiapo_artesanos").select(COLS_ART).eq("publicado", true).eq("ruta_id", ruta.id).order("ciudad").limit(200);
    const artesanos = (arts ?? []) as ArtesanoRow[];
    const urls = await firmar([ruta.foto_path, ...artesanos.map((a) => a.foto_path)]);
    return {
      slug: ruta.slug, nombre: ruta.nombre, descripcion: ruta.descripcion, lugares: ruta.lugares ?? [], foto: url(urls, ruta.foto_path),
      auspiciante: ruta.auspiciante, auspicianteUrl: ruta.auspiciante_url, artesanos: artesanos.map((a) => aCard(a, urls, 0)),
    };
  });

/* ---------------------------------- Panel ---------------------------------- */

export type PiezaPanel = PiezaRow & { fotosUrl: (string | null)[] };
export type ArtesanoPanel = ArtesanoRow & { foto: string | null; falta: string[]; piezas: PiezaPanel[] };
export type { RutaRow as RutaPanel };
export type TerminoPanel = TerminoRow & { audio: string | null; cargueYo: boolean };

/** Todo Tembiapo, para la administración y los docentes. */
export const panelTembiapo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.docente) throw new Error("Forbidden");
    const db = await admin();
    const [{ data: rutas }, { data: arts }, { data: piezas }, { data: terms }] = await Promise.all([
      db.from("tembiapo_rutas").select(COLS_RUTA).order("orden").limit(100),
      db.from("tembiapo_artesanos").select(COLS_ART).order("created_at", { ascending: false }).limit(500),
      db.from("tembiapo_piezas").select(COLS_PIEZA).order("orden").limit(5000),
      db.from("tembiapo_glosario").select(COLS_TERM).order("created_at", { ascending: false }).limit(2000),
    ]);
    const artesanos = (arts ?? []) as ArtesanoRow[];
    const ps = (piezas ?? []) as PiezaRow[];
    const ts = (terms ?? []) as TerminoRow[];
    const rs = (rutas ?? []) as RutaRow[];
    const urls = await firmar([...artesanos.map((a) => a.foto_path), ...ps.flatMap((p) => p.fotos ?? []), ...ts.map((t) => t.audio_path), ...rs.map((x) => x.foto_path)]);
    return {
      esAdmin: r.admin,
      rutas: rs.map((x) => ({ ...x, foto: url(urls, x.foto_path) })),
      artesanos: artesanos.map<ArtesanoPanel>((a) => ({
        ...a, foto: url(urls, a.foto_path), falta: faltaArtesano(a),
        piezas: ps.filter((p) => p.artesano_id === a.id).map((p) => ({ ...p, fotosUrl: (p.fotos ?? []).map((f) => url(urls, f)) })),
      })),
      palabras: ts.map<TerminoPanel>((t) => ({ ...t, audio: url(urls, t.audio_path), cargueYo: t.cargado_por === context.userId })),
    };
  });

async function soloAdmin(context: { supabase: unknown; userId: string }) {
  const r = await roles(context.supabase, context.userId);
  if (!r.admin) throw new Error("Forbidden");
}

/** Crea o actualiza una ruta cultural (solo administración). */
export const guardarRuta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/),
    nombre: z.string().min(1).max(120),
    descripcion: z.string().max(3000),
    lugares: z.array(z.string().min(1).max(80)).max(20),
    auspiciante: z.string().max(120),
    auspicianteUrl: z.string().url().max(300).startsWith("https://").nullable(),
    orden: z.number().int().min(0).max(999),
    fotoPath: z.string().max(300).startsWith(`${DEPOSITO}/`).nullable().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await soloAdmin(context);
    const fila: Record<string, unknown> = {
      slug: data.slug, nombre: data.nombre.trim(), descripcion: data.descripcion.trim(), lugares: data.lugares.map((l) => l.trim()),
      auspiciante: data.auspiciante.trim(), auspiciante_url: data.auspicianteUrl, orden: data.orden, updated_at: new Date().toISOString(),
    };
    if (data.fotoPath !== undefined) fila.foto_path = data.fotoPath;
    const db = await admin();
    const q = data.id
      ? db.from("tembiapo_rutas").update(fila).eq("id", data.id).select("id").single()
      : db.from("tembiapo_rutas").insert(fila).select("id").single();
    const { data: out, error } = await q;
    if (error) throw new Error(error.code === "23505" ? "Ya hay una ruta con esa dirección (slug)" : error.message);
    return { id: out.id as string };
  });

/** Crea o actualiza un artesano (solo administración). */
export const guardarArtesano = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/),
    nombre: z.string().min(1).max(120),
    oficio: oficioZ,
    ciudad: z.string().max(120),
    departamento: z.string().max(60),
    comunidad: z.string().max(120),
    rutaId: z.string().uuid().nullable(),
    bio: z.string().max(3000),
    whatsapp: z.string().max(30),
    contacto: z.string().max(120),
    maestroIpa: z.boolean(),
    permisoImagen: z.boolean(),
    consentimientoComunidad: z.boolean(),
    fotoPath: z.string().max(300).startsWith(`${DEPOSITO}/`).nullable().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await soloAdmin(context);
    const wa = data.whatsapp.trim() ? normalizarWhatsapp(data.whatsapp) : null;
    if (data.whatsapp.trim() && !wa) throw new Error("El número de WhatsApp no es válido");
    const fila: Record<string, unknown> = {
      slug: data.slug, nombre: data.nombre.trim(), oficio: data.oficio, ciudad: data.ciudad.trim(), departamento: data.departamento.trim(),
      comunidad: data.comunidad.trim(), ruta_id: data.rutaId, bio: data.bio.trim(), whatsapp: wa, contacto: data.contacto.trim(),
      maestro_ipa: data.maestroIpa, permiso_imagen: data.permisoImagen, consentimiento_comunidad: data.consentimientoComunidad,
      updated_at: new Date().toISOString(),
    };
    if (data.fotoPath !== undefined) fila.foto_path = data.fotoPath;
    // Si deja de cumplir lo necesario, la ficha sale de la vitrina.
    if (faltaArtesano({ permiso_imagen: data.permisoImagen, oficio: data.oficio, consentimiento_comunidad: data.consentimientoComunidad }).length) fila.publicado = false;
    const db = await admin();
    const q = data.id
      ? db.from("tembiapo_artesanos").update(fila).eq("id", data.id).select("id").single()
      : db.from("tembiapo_artesanos").insert({ ...fila, creado_por: context.userId }).select("id").single();
    const { data: out, error } = await q;
    if (error) throw new Error(error.code === "23505" ? "Ya hay un artesano con esa dirección (slug)" : error.message);
    return { id: out.id as string };
  });

/** Crea o actualiza una pieza (solo administración). Cambiar las fotos la saca de la vitrina hasta volver a publicarla. */
export const guardarPieza = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    artesanoId: z.string().uuid(),
    titulo: z.string().min(1).max(160),
    descripcion: z.string().max(2000),
    tecnica: z.string().max(160),
    materiales: z.string().max(200),
    medidas: z.string().max(120),
    tiempo: z.string().max(120),
    orden: z.number().int().min(0).max(999),
    fotos: z.array(z.string().max(300).startsWith(`${DEPOSITO}/`)).max(6).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await soloAdmin(context);
    const fila: Record<string, unknown> = {
      titulo: data.titulo.trim(), descripcion: data.descripcion.trim(), tecnica: data.tecnica.trim(), materiales: data.materiales.trim(),
      medidas: data.medidas.trim(), tiempo: data.tiempo.trim(), orden: data.orden, updated_at: new Date().toISOString(),
    };
    if (data.fotos !== undefined) {
      fila.fotos = data.fotos;
      if (!data.fotos.length) fila.publicado = false;
    }
    const db = await admin();
    const q = data.id
      ? db.from("tembiapo_piezas").update(fila).eq("id", data.id).eq("artesano_id", data.artesanoId).select("id").single()
      : db.from("tembiapo_piezas").insert({ ...fila, artesano_id: data.artesanoId }).select("id").single();
    const { data: out, error } = await q;
    if (error) throw new Error(error.message);
    return { id: out.id as string };
  });

const TABLA = { ruta: "tembiapo_rutas", artesano: "tembiapo_artesanos", pieza: "tembiapo_piezas", palabra: "tembiapo_glosario" } as const;

/** Publicar o sacar de la vitrina (solo administración). La base de datos rechaza lo que no cumple. */
export const publicarTembiapo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tipo: z.enum(["ruta", "artesano", "pieza", "palabra"]), id: z.string().uuid(), publicar: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await soloAdmin(context);
    const db = await admin();
    if (data.publicar && data.tipo === "artesano") {
      const { data: a } = await db.from("tembiapo_artesanos").select("permiso_imagen, oficio, consentimiento_comunidad").eq("id", data.id).single();
      const falta = a ? faltaArtesano(a) : ["no existe"];
      if (falta.length) throw new Error(`Falta: ${falta.join(", ")}`);
    }
    const { error } = await db.from(TABLA[data.tipo]).update({ publicado: data.publicar, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) {
      if (error.code === "23514") throw new Error(data.tipo === "pieza" ? "La pieza necesita al menos una foto" : data.tipo === "palabra" ? "La palabra necesita su significado y la revisión de otro docente" : "No cumple lo necesario para publicarse");
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const borrarTembiapo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tipo: z.enum(["ruta", "artesano", "pieza", "palabra"]), id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await soloAdmin(context);
    const db = await admin();
    const { error } = await db.from(TABLA[data.tipo]).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Una palabra del oficio. La cargan docentes o la administración; si cambia el término o el significado,
 * vuelve a necesitar revisión y sale de la vitrina. La grabación (voz del artesano) la sube la administración.
 */
export const guardarPalabra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    oficio: oficioZ,
    artesanoId: z.string().uuid().nullable(),
    termino: z.string().trim().min(1).max(80),
    significado: z.string().trim().max(600),
    audioPath: z.string().max(300).startsWith(`${DEPOSITO}/`).nullable().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.docente) throw new Error("Forbidden");
    if (data.audioPath !== undefined && !r.admin) throw new Error("La grabación la sube la administración");
    const db = await admin();
    const fila: Record<string, unknown> = {
      oficio: data.oficio, artesano_id: data.artesanoId, termino: data.termino, significado: data.significado,
      updated_at: new Date().toISOString(),
    };
    if (data.audioPath !== undefined) fila.audio_path = data.audioPath;
    let cambiaTexto = true;
    if (data.id) {
      const { data: antes } = await db.from("tembiapo_glosario").select("termino, significado").eq("id", data.id).single();
      cambiaTexto = !antes || antes.termino !== data.termino || antes.significado !== data.significado;
    }
    if (cambiaTexto) Object.assign(fila, { cargado_por: context.userId, revisado_por: null, revisado_at: null, publicado: false });
    const q = data.id
      ? db.from("tembiapo_glosario").update(fila).eq("id", data.id).select("id").single()
      : db.from("tembiapo_glosario").insert(fila).select("id").single();
    const { data: out, error } = await q;
    if (error) throw new Error(error.message);
    return { id: out.id as string };
  });

/** Un docente revisa la palabra (no puede ser quien la cargó). */
export const revisarPalabra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.docente) throw new Error("Forbidden");
    const db = await admin();
    const { data: t } = await db.from("tembiapo_glosario").select("cargado_por, significado").eq("id", data.id).single();
    if (!t) throw new Error("No existe la palabra");
    if (t.cargado_por === context.userId) throw new Error("La revisión la hace un docente distinto de quien cargó la palabra");
    if (!String(t.significado ?? "").trim()) throw new Error("Falta el significado en castellano");
    const { error } = await db.from("tembiapo_glosario").update({ revisado_por: context.userId, revisado_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav" } as const;
export type MimeTembiapo = keyof typeof EXT;

/** Enlace para subir una foto (artesano, pieza o ruta) o la grabación de una palabra (solo administración). */
export const urlSubidaTembiapo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    tipo: z.enum(["artesano", "pieza", "ruta", "palabra"]),
    mime: z.enum(Object.keys(EXT) as [MimeTembiapo, ...MimeTembiapo[]]),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await soloAdmin(context);
    const esAudio = data.mime.startsWith("audio/");
    if ((data.tipo === "palabra") !== esAudio) throw new Error("Tipo de archivo incorrecto");
    const path = `${data.tipo}s/${data.id}/${Date.now().toString(36)}.${EXT[data.mime]}`;
    const db = await admin();
    const { data: s, error } = await db.storage.from(DEPOSITO).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, ruta: `${DEPOSITO}/${path}`, token: s.token as string };
  });
