import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  cancionKaraoke, ESTILOS, faltaParaPublicar, normalizarWhatsapp,
  type Enlace, type Estilo, type Karaoke, type Termino, type Verso,
} from "@/lib/purahei";

/**
 * Purahéi Jaikuaa: la vitrina de artistas y cantores paraguayos.
 * - El público ve solo artistas y obras publicadas; los archivos llegan con enlaces firmados que vencen en 1 hora.
 * - El administrador carga artistas, obras, permisos y archivos. Los docentes (rol editor) cargan la letra,
 *   el glosario y la versión del karaoke. Nadie del equipo técnico escribe guaraní.
 * - Una obra se publica solo con el permiso de sus dueños y la revisión de un docente distinto de quien la cargó.
 *   La base de datos también lo exige (constraint purahei_obra_publicable).
 */

const URL_TTL = 60 * 60;
const DEPOSITO = "purahei";

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

/** Firma rutas «purahei/…». Devuelve ruta → URL. */
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

type ArtistaRow = {
  id: string; slug: string; nombre: string; ciudad: string; bio: string; foto_path: string | null; whatsapp: string | null;
  contacto: string; enlaces: Enlace[]; permiso_imagen: boolean; publicado: boolean; created_at: string;
};
type ObraRow = {
  id: string; artista_id: string; titulo: string; autor: string; interprete: string; productor: string; anio: number | null;
  estilo: Estilo; descripcion: string; versos: Verso[]; glosario: Termino[]; karaoke: Karaoke | null; audio_path: string | null;
  permiso_autor: boolean; permiso_interprete: boolean; permiso_productor: boolean; cargado_por: string | null;
  revisado_por: string | null; revisado_at: string | null; publicado: boolean; created_at: string;
};
const COLS_ARTISTA = "id, slug, nombre, ciudad, bio, foto_path, whatsapp, contacto, enlaces, permiso_imagen, publicado, created_at";
const COLS_OBRA = "id, artista_id, titulo, autor, interprete, productor, anio, estilo, descripcion, versos, glosario, karaoke, audio_path, permiso_autor, permiso_interprete, permiso_productor, cargado_por, revisado_por, revisado_at, publicado, created_at";

export type ArtistaCard = { id: string; slug: string; nombre: string; ciudad: string; foto: string | null; obras: number; estilos: string[] };

/** La vitrina pública: artistas publicados con al menos una obra publicada o sin obras aún. */
export const vitrinaPurahei = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db.from("purahei_artistas").select(COLS_ARTISTA).eq("publicado", true).order("nombre").limit(200);
  if (error) throw new Error(error.message);
  const artistas = (data ?? []) as ArtistaRow[];
  const ids = artistas.map((a) => a.id);
  const { data: obras } = ids.length
    ? await db.from("purahei_obras").select("artista_id, estilo").eq("publicado", true).in("artista_id", ids).limit(2000)
    : { data: [] };
  const urls = await firmar(artistas.map((a) => a.foto_path));
  const porArtista = new Map<string, Estilo[]>();
  for (const o of (obras ?? []) as { artista_id: string; estilo: Estilo }[]) porArtista.set(o.artista_id, [...(porArtista.get(o.artista_id) ?? []), o.estilo]);
  return {
    artistas: artistas.map<ArtistaCard>((a) => ({
      id: a.id, slug: a.slug, nombre: a.nombre, ciudad: a.ciudad, foto: a.foto_path ? (urls.get(a.foto_path) ?? null) : null,
      obras: porArtista.get(a.id)?.length ?? 0, estilos: [...new Set(porArtista.get(a.id) ?? [])],
    })),
  };
});

export type ObraCard = { id: string; titulo: string; estilo: Estilo; anio: number | null; autor: string; karaoke: boolean; audio: boolean; publicado: boolean };
export type FichaArtista = {
  id: string; slug: string; nombre: string; ciudad: string; bio: string; foto: string | null; whatsapp: string | null;
  contacto: string; enlaces: Enlace[]; publicado: boolean; obras: ObraCard[];
};

function aObraCard(o: ObraRow): ObraCard {
  return { id: o.id, titulo: o.titulo, estilo: o.estilo, anio: o.anio, autor: o.autor, karaoke: !!o.karaoke && (o.karaoke.versos?.length ?? 0) >= 2, audio: !!o.audio_path, publicado: o.publicado };
}

/** La ficha de un artista con sus obras publicadas. */
export const fichaArtista = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(2).max(60) }).parse(d))
  .handler(async ({ data }): Promise<FichaArtista | null> => {
    const db = await admin();
    const { data: a } = await db.from("purahei_artistas").select(COLS_ARTISTA).eq("slug", data.slug).eq("publicado", true).maybeSingle();
    if (!a) return null;
    const art = a as ArtistaRow;
    const { data: obras } = await db.from("purahei_obras").select(COLS_OBRA).eq("artista_id", art.id).eq("publicado", true).order("created_at").limit(200);
    const urls = await firmar([art.foto_path]);
    return {
      id: art.id, slug: art.slug, nombre: art.nombre, ciudad: art.ciudad, bio: art.bio, foto: art.foto_path ? (urls.get(art.foto_path) ?? null) : null,
      whatsapp: art.whatsapp, contacto: art.contacto, enlaces: art.enlaces ?? [], publicado: art.publicado,
      obras: ((obras ?? []) as ObraRow[]).map(aObraCard),
    };
  });

export type ObraCompleta = {
  id: string; titulo: string; autor: string; interprete: string; productor: string; anio: number | null; estilo: Estilo;
  descripcion: string; versos: Verso[]; glosario: Termino[]; audio: string | null; karaoke: boolean; publicado: boolean;
  revisado: boolean; artista: { nombre: string; slug: string; whatsapp: string | null; contacto: string; foto: string | null; publicado: boolean };
};

async function cargarObra(id: string, staff: boolean): Promise<{ obra: ObraRow; artista: ArtistaRow } | null> {
  const db = await admin();
  const { data: o } = await db.from("purahei_obras").select(COLS_OBRA).eq("id", id).maybeSingle();
  if (!o) return null;
  const obra = o as ObraRow;
  const { data: a } = await db.from("purahei_artistas").select(COLS_ARTISTA).eq("id", obra.artista_id).maybeSingle();
  if (!a) return null;
  const artista = a as ArtistaRow;
  if (!staff && !(obra.publicado && artista.publicado)) return null;
  return { obra, artista };
}

async function completa(id: string, staff: boolean): Promise<ObraCompleta | null> {
  const r = await cargarObra(id, staff);
  if (!r) return null;
  const { obra: o, artista: a } = r;
  const urls = await firmar([o.audio_path, a.foto_path]);
  return {
    id: o.id, titulo: o.titulo, autor: o.autor, interprete: o.interprete, productor: o.productor, anio: o.anio, estilo: o.estilo,
    descripcion: o.descripcion, versos: o.versos ?? [], glosario: o.glosario ?? [], audio: o.audio_path ? (urls.get(o.audio_path) ?? null) : null,
    karaoke: aObraCard(o).karaoke, publicado: o.publicado, revisado: !!o.revisado_por,
    artista: { nombre: a.nombre, slug: a.slug, whatsapp: a.whatsapp, contacto: a.contacto, foto: a.foto_path ? (urls.get(a.foto_path) ?? null) : null, publicado: a.publicado },
  };
}

/** El visor de una obra publicada (letra bilingüe, glosario y voz real del artista). */
export const verObra = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => completa(data.id, false));

/** Lo mismo, para que docentes y administración revisen una obra antes de publicarla. */
export const verObraParaRevisar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.docente) throw new Error("Forbidden");
    return completa(data.id, true);
  });

/** La canción de una obra para Purahéi Karaoke (solo obras publicadas). */
export const karaokeDeObra = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const r = await cargarObra(data.id, false);
    if (!r) return null;
    const song = cancionKaraoke({ id: r.obra.id, titulo: r.obra.titulo, estilo: r.obra.estilo, versos: r.obra.versos ?? [], karaoke: r.obra.karaoke });
    return song ? { song, artista: r.artista.nombre, slug: r.artista.slug } : null;
  });

/** Las canciones de artistas que ya se pueden cantar en el karaoke. */
export const cancionesDeArtistas = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data: obras } = await db.from("purahei_obras").select("id, titulo, estilo, artista_id, karaoke").eq("publicado", true).not("karaoke", "is", null).limit(60);
  const lista = (obras ?? []) as { id: string; titulo: string; estilo: Estilo; artista_id: string; karaoke: Karaoke }[];
  if (!lista.length) return { canciones: [] as { id: string; titulo: string; estilo: Estilo; artista: string }[] };
  const { data: arts } = await db.from("purahei_artistas").select("id, nombre").eq("publicado", true).in("id", [...new Set(lista.map((o) => o.artista_id))]);
  const nombres = new Map(((arts ?? []) as { id: string; nombre: string }[]).map((a) => [a.id, a.nombre]));
  return {
    canciones: lista.filter((o) => nombres.has(o.artista_id) && (o.karaoke?.versos?.length ?? 0) >= 2)
      .map((o) => ({ id: o.id, titulo: o.titulo, estilo: o.estilo, artista: nombres.get(o.artista_id)! })),
  };
});

/* ------------------------------------ Panel ------------------------------------ */

export type ObraPanel = ObraRow & { faltan: string[]; cargueYo: boolean };
export type ArtistaPanel = ArtistaRow & { foto: string | null; obras: ObraPanel[] };

/** Todo lo de la vitrina, para el panel de administración y docentes. */
export const panelPurahei = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.docente) throw new Error("Forbidden");
    const db = await admin();
    const [{ data: arts }, { data: obras }] = await Promise.all([
      db.from("purahei_artistas").select(COLS_ARTISTA).order("created_at", { ascending: false }).limit(300),
      db.from("purahei_obras").select(COLS_OBRA).order("created_at").limit(2000),
    ]);
    const artistas = (arts ?? []) as ArtistaRow[];
    const urls = await firmar(artistas.map((a) => a.foto_path));
    const lista = ((obras ?? []) as ObraRow[]).map<ObraPanel>((o) => ({
      ...o,
      faltan: faltaParaPublicar({ permiso_autor: o.permiso_autor, permiso_interprete: o.permiso_interprete, permiso_productor: o.permiso_productor, revisado: !!o.revisado_por, tieneAudio: !!o.audio_path, versos: o.versos?.length ?? 0 }),
      cargueYo: o.cargado_por === context.userId,
    }));
    return {
      esAdmin: r.admin,
      artistas: artistas.map<ArtistaPanel>((a) => ({ ...a, foto: a.foto_path ? (urls.get(a.foto_path) ?? null) : null, obras: lista.filter((o) => o.artista_id === a.id) })),
    };
  });

const enlaceSchema = z.object({ nombre: z.string().max(60), url: z.string().url().max(300).startsWith("https://") });

/** Crea o actualiza un artista (solo administración). */
export const guardarArtista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/),
    nombre: z.string().min(1).max(120),
    ciudad: z.string().max(120),
    bio: z.string().max(3000),
    whatsapp: z.string().max(30),
    contacto: z.string().max(120),
    enlaces: z.array(enlaceSchema).max(8),
    permisoImagen: z.boolean(),
    fotoPath: z.string().max(300).startsWith(`${DEPOSITO}/`).nullable().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.admin) throw new Error("Forbidden");
    const fila: Record<string, unknown> = {
      slug: data.slug, nombre: data.nombre.trim(), ciudad: data.ciudad.trim(), bio: data.bio.trim(),
      whatsapp: data.whatsapp.trim() ? normalizarWhatsapp(data.whatsapp) : null, contacto: data.contacto.trim(), enlaces: data.enlaces,
      permiso_imagen: data.permisoImagen, updated_at: new Date().toISOString(),
    };
    if (data.whatsapp.trim() && !fila.whatsapp) throw new Error("El número de WhatsApp no es válido");
    if (data.fotoPath !== undefined) fila.foto_path = data.fotoPath;
    // Sin permiso de imagen, la ficha deja de estar a la vista.
    if (!data.permisoImagen) fila.publicado = false;
    const db = await admin();
    const q = data.id
      ? db.from("purahei_artistas").update(fila).eq("id", data.id).select("id").single()
      : db.from("purahei_artistas").insert({ ...fila, creado_por: context.userId }).select("id").single();
    const { data: out, error } = await q;
    if (error) throw new Error(error.code === "23505" ? "Ya hay un artista con esa dirección (slug)" : error.message);
    return { id: out.id as string };
  });

export const publicarArtista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), publicar: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.admin) throw new Error("Forbidden");
    const db = await admin();
    const { data: a } = await db.from("purahei_artistas").select("permiso_imagen").eq("id", data.id).single();
    if (data.publicar && !a?.permiso_imagen) throw new Error("Falta la autorización de imagen del artista");
    const { error } = await db.from("purahei_artistas").update({ publicado: data.publicar, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarArtista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.admin) throw new Error("Forbidden");
    const db = await admin();
    const { error } = await db.from("purahei_artistas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const versoSchema = z.object({ gn: z.string().min(1).max(400), es: z.string().max(400) });
const terminoSchema = z.object({ termino: z.string().min(1).max(80), nota: z.string().min(1).max(600) });
const karaokeSchema = z.object({
  bpm: z.number().int().min(60).max(140),
  versos: z.array(z.object({ verso: z.number().int().min(0).max(119), gap: z.number().int().min(0).max(40), wrong: z.array(z.string().min(1).max(60)).length(2) })).max(40),
}).nullable();

/**
 * Crea o actualiza una obra.
 * - Administración: datos, permisos, grabación y también la letra.
 * - Docentes: la letra, el glosario y la versión del karaoke.
 * Si cambia la letra, el glosario o el karaoke, la obra vuelve a necesitar revisión y deja de estar publicada.
 */
export const guardarObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    artistaId: z.string().uuid(),
    titulo: z.string().min(1).max(200).optional(),
    autor: z.string().max(200).optional(),
    interprete: z.string().max(200).optional(),
    productor: z.string().max(200).optional(),
    anio: z.number().int().min(1500).max(2100).nullable().optional(),
    estilo: z.enum(ESTILOS as [Estilo, ...Estilo[]]).optional(),
    descripcion: z.string().max(2000).optional(),
    permisoAutor: z.boolean().optional(),
    permisoInterprete: z.boolean().optional(),
    permisoProductor: z.boolean().optional(),
    audioPath: z.string().max(300).startsWith(`${DEPOSITO}/`).nullable().optional(),
    versos: z.array(versoSchema).max(120).optional(),
    glosario: z.array(terminoSchema).max(80).optional(),
    karaoke: karaokeSchema.optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.docente) throw new Error("Forbidden");
    const datosDeAdmin = ["titulo", "autor", "interprete", "productor", "anio", "estilo", "descripcion", "permisoAutor", "permisoInterprete", "permisoProductor", "audioPath"] as const;
    if (!r.admin && datosDeAdmin.some((k) => data[k] !== undefined)) throw new Error("Solo la administración cambia los datos y permisos de la obra");
    if (!data.id && !r.admin) throw new Error("Solo la administración crea obras");
    const fila: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const map: [keyof typeof data, string][] = [
      ["titulo", "titulo"], ["autor", "autor"], ["interprete", "interprete"], ["productor", "productor"], ["anio", "anio"], ["estilo", "estilo"],
      ["descripcion", "descripcion"], ["permisoAutor", "permiso_autor"], ["permisoInterprete", "permiso_interprete"], ["permisoProductor", "permiso_productor"], ["audioPath", "audio_path"],
    ];
    for (const [k, col] of map) if (data[k] !== undefined) fila[col] = data[k];
    const contenido = data.versos !== undefined || data.glosario !== undefined || data.karaoke !== undefined;
    if (data.versos !== undefined) fila.versos = data.versos.map((v) => ({ gn: v.gn.trim(), es: v.es.trim() }));
    if (data.glosario !== undefined) fila.glosario = data.glosario.map((g) => ({ termino: g.termino.trim(), nota: g.nota.trim() }));
    if (data.karaoke !== undefined) fila.karaoke = data.karaoke;
    if (contenido) { fila.cargado_por = context.userId; fila.revisado_por = null; fila.revisado_at = null; fila.publicado = false; }
    // Cambiar permisos o la grabación también saca la obra de la vitrina hasta volver a publicarla.
    if (data.permisoAutor === false || data.permisoInterprete === false || data.permisoProductor === false || data.audioPath !== undefined) fila.publicado = false;
    const db = await admin();
    const q = data.id
      ? db.from("purahei_obras").update(fila).eq("id", data.id).eq("artista_id", data.artistaId).select("id").single()
      : db.from("purahei_obras").insert({ titulo: "Obra sin título", ...fila, artista_id: data.artistaId, cargado_por: context.userId }).select("id").single();
    const { data: out, error } = await q;
    if (error) throw new Error(error.message);
    return { id: out.id as string };
  });

/** Un docente revisa la obra (no puede ser quien la cargó). */
export const revisarObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.docente) throw new Error("Forbidden");
    const db = await admin();
    const { data: o } = await db.from("purahei_obras").select("cargado_por, versos").eq("id", data.id).single();
    if (!o) throw new Error("No existe la obra");
    if (o.cargado_por === context.userId) throw new Error("La revisión la hace un docente distinto de quien cargó la letra");
    if (!(o.versos as Verso[] | null)?.length) throw new Error("Todavía no hay letra para revisar");
    const { error } = await db.from("purahei_obras").update({ revisado_por: context.userId, revisado_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publicarObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), publicar: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.admin) throw new Error("Forbidden");
    const db = await admin();
    if (data.publicar) {
      const { data: o } = await db.from("purahei_obras").select(COLS_OBRA).eq("id", data.id).single();
      const obra = o as ObraRow;
      const faltan = faltaParaPublicar({ permiso_autor: obra.permiso_autor, permiso_interprete: obra.permiso_interprete, permiso_productor: obra.permiso_productor, revisado: !!obra.revisado_por, tieneAudio: !!obra.audio_path, versos: obra.versos?.length ?? 0 });
      if (faltan.length) throw new Error(`Falta: ${faltan.join(", ")}`);
    }
    const { error } = await db.from("purahei_obras").update({ publicado: data.publicar, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const borrarObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.admin) throw new Error("Forbidden");
    const db = await admin();
    const { error } = await db.from("purahei_obras").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav" } as const;
export type MimePurahei = keyof typeof EXT;

/** Enlace para subir la foto del artista o la grabación de una obra (solo administración). */
export const urlSubidaPurahei = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    tipo: z.enum(["foto", "audio"]),
    mime: z.enum(Object.keys(EXT) as [MimePurahei, ...MimePurahei[]]),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await roles(context.supabase, context.userId);
    if (!r.admin) throw new Error("Forbidden");
    if ((data.tipo === "foto") !== data.mime.startsWith("image/")) throw new Error("Tipo de archivo incorrecto");
    const path = `${data.tipo === "foto" ? "artistas" : "obras"}/${data.id}/${data.tipo}-${Date.now().toString(36)}.${EXT[data.mime]}`;
    const db = await admin();
    const { data: s, error } = await db.storage.from(DEPOSITO).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, ruta: `${DEPOSITO}/${path}`, token: s.token as string };
  });
