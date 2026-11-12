import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, Eye, ImagePlus, Loader2, Mic, Plus, Route as RutaIcon, ShieldCheck, Trash2, UserPlus, Volume2, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FotoArtesano } from "@/components/tembiapo/partes";
import {
  borrarTembiapo, guardarArtesano, guardarPalabra, guardarPieza, guardarRuta, panelTembiapo, publicarTembiapo, revisarPalabra, urlSubidaTembiapo,
  type ArtesanoPanel, type MimeTembiapo, type PiezaPanel, type RutaPanel, type TerminoPanel,
} from "@/lib/tembiapo.functions";
import { avisosArtesano, nombreOficio, OFICIO_IDS, type OficioId } from "@/lib/tembiapo";
import { slugDe } from "@/lib/purahei";

/**
 * Panel de Tembiapo Jaikuaa.
 * - Administración: artesanos (con sus permisos firmados), piezas con fotos, rutas culturales y las grabaciones.
 * - Docentes: las palabras de cada oficio en guaraní con su significado, y la revisión de lo que cargó otro docente.
 *   El equipo técnico no escribe guaraní: acá solo lo cargan docentes.
 */
export const Route = createFileRoute("/_authenticated/admin/tembiapo")({
  head: () => ({ meta: [{ title: "Tembiapo Jaikuaa — Panel" }, { name: "robots", content: "noindex" }] }),
  component: PanelPage,
});

type Panel = Awaited<ReturnType<typeof panelTembiapo>>;
type Ruta = Panel["rutas"][number];
const CLAVE = ["tembiapo-panel"];
const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo guardar");
const SELECT = "h-11 w-full rounded-md border bg-background px-2 text-sm";

const MAX_ANCHO = 1400;
async function prepararImagen(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, MAX_ANCHO / bmp.width);
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
    return (await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.86))) ?? file;
  } catch { return file; }
}

const AUDIO_EXT: Record<string, MimeTembiapo> = { mp3: "audio/mpeg", m4a: "audio/mp4", mp4: "audio/mp4", webm: "audio/webm", ogg: "audio/ogg", opus: "audio/ogg", wav: "audio/wav" };
function mimeAudio(file: File): MimeTembiapo {
  const t = file.type === "audio/mp3" ? "audio/mpeg" : file.type === "audio/aac" ? "audio/mp4" : file.type;
  if (["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/ogg", "audio/wav"].includes(t)) return t as MimeTembiapo;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const m = AUDIO_EXT[ext];
  if (!m) throw new Error("Formato de audio no admitido (usá mp3, m4a, ogg, webm o wav)");
  return m;
}

function useSubir() {
  const pedir = useServerFn(urlSubidaTembiapo);
  return async (id: string, tipo: "artesano" | "pieza" | "ruta" | "palabra", file: File): Promise<string> => {
    const esAudio = tipo === "palabra";
    const blob = esAudio ? file : await prepararImagen(file);
    const mime = esAudio ? mimeAudio(file) : ((blob.type || "image/webp") as MimeTembiapo);
    const s = await pedir({ data: { id, tipo, mime } });
    const { error } = await supabase.storage.from("tembiapo").uploadToSignedUrl(s.path, s.token, blob, { contentType: mime });
    if (error) throw new Error(error.message);
    return s.ruta;
  };
}

function useRefrescar() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: CLAVE });
}

type Pestana = "artesanos" | "palabras" | "rutas";

function PanelPage() {
  const listar = useServerFn(panelTembiapo);
  const { data, isLoading, error } = useQuery({ queryKey: CLAVE, queryFn: () => listar(), retry: false });
  const [tab, setTab] = useState<Pestana | null>(null);
  const actual: Pestana = tab ?? (data && !data.esAdmin ? "palabras" : "artesanos");
  const pendientes = data?.palabras.filter((p) => !p.revisado_por && !p.cargueYo).length ?? 0;
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/dashboard"><BrandLogo withWordmark={false} /></Link>
          <Button asChild variant="outline" size="sm"><Link to="/tembiapo">Ver la vitrina</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="font-display text-2xl font-bold">Tembiapo Jaikuaa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un artesano sale a la vitrina solo con su autorización de imagen firmada (y, en el arte indígena, el consentimiento de su comunidad).
          Una palabra sale solo con la revisión de un docente distinto de quien la cargó.
        </p>
        {isLoading && <p className="mt-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>}
        {error && <p className="mt-6 text-destructive">Este panel es para administración y docentes.</p>}
        {data && (
          <>
            <nav className="mt-5 flex flex-wrap gap-1" aria-label="Secciones">
              {([["artesanos", `Artesanos (${data.artesanos.length})`], ["palabras", `Palabras del oficio${pendientes ? ` · ${pendientes} para revisar` : ""}`], ...(data.esAdmin ? [["rutas", `Rutas (${data.rutas.length})`]] : [])] as [Pestana, string][]).map(([k, t]) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={`h-10 rounded-full px-4 text-sm font-semibold ${actual === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t}</button>
              ))}
            </nav>
            {actual === "artesanos" && <Artesanos data={data} />}
            {actual === "palabras" && <Palabras data={data} />}
            {actual === "rutas" && data.esAdmin && <Rutas rutas={data.rutas} />}
          </>
        )}
      </main>
    </div>
  );
}

/* -------------------------------- Artesanos -------------------------------- */

function Artesanos({ data }: { data: Panel }) {
  return (
    <>
      {data.esAdmin && <NuevoArtesano />}
      <ul className="mt-5 space-y-4">
        {data.artesanos.map((a) => <ArtesanoItem key={a.id} a={a} rutas={data.rutas} esAdmin={data.esAdmin} />)}
        {data.artesanos.length === 0 && (
          <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay artesanos cargados. También se crean desde <Link to="/admin/convenios" className="font-semibold text-primary">Convenios</Link>, cuando un artesano firma el suyo en línea.
          </li>
        )}
      </ul>
    </>
  );
}

function NuevoArtesano() {
  const refrescar = useRefrescar();
  const guardar = useServerFn(guardarArtesano);
  const [nombre, setNombre] = useState("");
  const [oficio, setOficio] = useState<OficioId>("nanduti");
  const m = useMutation({
    mutationFn: () => guardar({ data: {
      slug: slugDe(nombre), nombre, oficio, ciudad: "", departamento: "", comunidad: "", rutaId: null, bio: "", whatsapp: "", contacto: "",
      maestroIpa: false, permisoImagen: false, consentimientoComunidad: false,
    } }),
    onSuccess: () => { setNombre(""); refrescar(); toast.success("Artesano creado (sin publicar)"); },
    onError: err,
  });
  return (
    <form className="mt-5 grid gap-2 sm:grid-cols-[1fr_12rem_auto]" onSubmit={(e) => { e.preventDefault(); if (nombre.trim()) m.mutate(); }}>
      <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del artesano o taller" className="h-11" />
      <select className={SELECT} value={oficio} onChange={(e) => setOficio(e.target.value as OficioId)} aria-label="Oficio">
        {OFICIO_IDS.map((o) => <option key={o} value={o}>{nombreOficio(o)}</option>)}
      </select>
      <Button type="submit" className="h-11" disabled={m.isPending || !nombre.trim()}><UserPlus className="mr-1.5 h-4 w-4" /> Agregar</Button>
    </form>
  );
}

function ArtesanoItem({ a, rutas, esAdmin }: { a: ArtesanoPanel; rutas: Ruta[]; esAdmin: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const refrescar = useRefrescar();
  const nueva = useServerFn(guardarPieza);
  const crearPieza = useMutation({
    mutationFn: () => nueva({ data: { artesanoId: a.id, titulo: "Pieza nueva", descripcion: "", tecnica: "", materiales: "", medidas: "", tiempo: "", orden: a.piezas.length } }),
    onSuccess: refrescar,
    onError: err,
  });
  const avisos = avisosArtesano(a);
  return (
    <li className="rounded-2xl bg-card ring-1 ring-border">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center gap-3 p-3 text-left">
        <FotoArtesano src={a.foto} nombre={a.nombre} className="h-14 w-14 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <b className="block truncate font-display text-lg">{a.nombre}</b>
          <span className="text-xs text-muted-foreground">
            {nombreOficio(a.oficio)} · {a.publicado ? "Publicado" : "Sin publicar"} · {a.piezas.length} {a.piezas.length === 1 ? "pieza" : "piezas"}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 transition ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div className="space-y-5 border-t border-border p-4">
          {!a.publicado && a.falta.length > 0 && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Para publicar falta: {a.falta.join(" · ")}</p>}
          {avisos.length > 0 && <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">Conviene completar: {avisos.join(" · ")}</p>}
          {esAdmin ? <EditarArtesano a={a} rutas={rutas} /> : <p className="text-sm text-muted-foreground">Los datos y permisos los carga la administración. Las palabras de su oficio se cargan en la pestaña «Palabras del oficio».</p>}
          <div>
            <h3 className="font-display font-bold">Piezas</h3>
            <ul className="mt-2 space-y-3">
              {a.piezas.map((p) => <PiezaItem key={p.id} p={p} esAdmin={esAdmin} />)}
              {a.piezas.length === 0 && <li className="text-sm text-muted-foreground">Sin piezas todavía.</li>}
            </ul>
            {esAdmin && <Button variant="outline" className="mt-3 h-11" onClick={() => crearPieza.mutate()} disabled={crearPieza.isPending}><Plus className="mr-1.5 h-4 w-4" /> Nueva pieza</Button>}
          </div>
        </div>
      )}
    </li>
  );
}

function EditarArtesano({ a, rutas }: { a: ArtesanoPanel; rutas: Ruta[] }) {
  const refrescar = useRefrescar();
  const guardar = useServerFn(guardarArtesano);
  const publicar = useServerFn(publicarTembiapo);
  const borrar = useServerFn(borrarTembiapo);
  const subir = useSubir();
  const [f, setF] = useState({
    nombre: a.nombre, slug: a.slug, oficio: a.oficio, ciudad: a.ciudad, departamento: a.departamento, comunidad: a.comunidad,
    rutaId: a.ruta_id ?? "", bio: a.bio, whatsapp: a.whatsapp ?? "", contacto: a.contacto,
    maestroIpa: a.maestro_ipa, permisoImagen: a.permiso_imagen, consentimientoComunidad: a.consentimiento_comunidad,
  });
  const [subiendo, setSubiendo] = useState(false);
  const m = useMutation({
    mutationFn: (fotoPath?: string | null) => guardar({ data: { id: a.id, ...f, rutaId: f.rutaId || null, ...(fotoPath !== undefined ? { fotoPath } : {}) } }),
    onSuccess: () => { refrescar(); toast.success("Guardado"); },
    onError: err,
  });
  const pub = useMutation({ mutationFn: (v: boolean) => publicar({ data: { tipo: "artesano", id: a.id, publicar: v } }), onSuccess: refrescar, onError: err });
  const del = useMutation({ mutationFn: () => borrar({ data: { tipo: "artesano", id: a.id } }), onSuccess: refrescar, onError: err });
  type Txt = "nombre" | "slug" | "ciudad" | "departamento" | "comunidad" | "bio" | "whatsapp" | "contacto";
  const campo = (k: Txt) => ({ value: f[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });
  const check = (k: "maestroIpa" | "permisoImagen" | "consentimientoComunidad", t: string) => (
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} /> {t}</label>
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">Nombre<Input className="mt-1 h-11" {...campo("nombre")} /></label>
        <label className="text-sm">Dirección de la ficha (jaikuaa.com/tembiapo/maestro/…)<Input className="mt-1 h-11" {...campo("slug")} /></label>
        <label className="text-sm">Oficio
          <select className={`mt-1 ${SELECT}`} value={f.oficio} onChange={(e) => setF({ ...f, oficio: e.target.value as OficioId })}>
            {OFICIO_IDS.map((o) => <option key={o} value={o}>{nombreOficio(o)}</option>)}
          </select>
        </label>
        <label className="text-sm">Ruta cultural
          <select className={`mt-1 ${SELECT}`} value={f.rutaId} onChange={(e) => setF({ ...f, rutaId: e.target.value })}>
            <option value="">Ninguna</option>
            {rutas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </label>
        <label className="text-sm">Ciudad<Input className="mt-1 h-11" {...campo("ciudad")} /></label>
        <label className="text-sm">Departamento<Input className="mt-1 h-11" {...campo("departamento")} /></label>
        {f.oficio === "indigena" && <label className="text-sm sm:col-span-2">Pueblo o comunidad (como ellos se nombran)<Input className="mt-1 h-11" {...campo("comunidad")} /></label>}
        <label className="text-sm">WhatsApp para ventas<Input className="mt-1 h-11" inputMode="tel" placeholder="0981 123 456" {...campo("whatsapp")} /></label>
        <label className="text-sm">Quién atiende (artesano, familiar o taller)<Input className="mt-1 h-11" {...campo("contacto")} /></label>
      </div>
      <label className="block text-sm">Su historia (contada como el artesano quiere)<Textarea className="mt-1" rows={4} {...campo("bio")} /></label>
      <fieldset className="rounded-xl bg-muted/50 p-3">
        <legend className="px-1 text-sm font-semibold">Permisos y reconocimientos</legend>
        {check("permisoImagen", "Tenemos su autorización de imagen firmada (convenio o formulario)")}
        {f.oficio === "indigena" && check("consentimientoComunidad", "Tenemos el consentimiento escrito de su comunidad")}
        {check("maestroIpa", "Reconocido como maestro artesano por el Instituto Paraguayo de Artesanía (con constancia)")}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11" onClick={() => m.mutate(undefined)} disabled={m.isPending}>Guardar</Button>
        <label className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-semibold">
          {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {a.foto_path ? "Cambiar retrato" : "Retrato"}
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setSubiendo(true);
            try { m.mutate(await subir(a.id, "artesano", file)); } catch (x) { err(x); } finally { setSubiendo(false); e.target.value = ""; }
          }} />
        </label>
        <Button variant={a.publicado ? "outline" : "default"} className="h-11" onClick={() => pub.mutate(!a.publicado)} disabled={pub.isPending || (!a.publicado && a.falta.length > 0)}>
          {a.publicado ? "Quitar de la vitrina" : <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar ficha</>}
        </Button>
        {a.publicado && <Button asChild variant="outline" className="h-11"><Link to="/tembiapo/maestro/$slug" params={{ slug: a.slug }}><Eye className="mr-1.5 h-4 w-4" /> Ver ficha</Link></Button>}
        <Button variant="ghost" className="h-11 text-destructive" aria-label="Borrar artesano" onClick={() => { if (confirm(`¿Borrar a ${a.nombre}, sus piezas y sus palabras? No se puede deshacer.`)) del.mutate(); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function PiezaItem({ p, esAdmin }: { p: PiezaPanel; esAdmin: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const refrescar = useRefrescar();
  const guardar = useServerFn(guardarPieza);
  const publicar = useServerFn(publicarTembiapo);
  const borrar = useServerFn(borrarTembiapo);
  const subir = useSubir();
  const [f, setF] = useState({ titulo: p.titulo, descripcion: p.descripcion, tecnica: p.tecnica, materiales: p.materiales, medidas: p.medidas, tiempo: p.tiempo, orden: String(p.orden) });
  const [subiendo, setSubiendo] = useState(false);
  const m = useMutation({
    mutationFn: (fotos?: string[]) => guardar({ data: { id: p.id, artesanoId: p.artesano_id, ...f, orden: Math.max(0, Math.min(999, Number(f.orden) || 0)), ...(fotos ? { fotos } : {}) } }),
    onSuccess: () => { refrescar(); toast.success("Guardado"); },
    onError: err,
  });
  const pub = useMutation({ mutationFn: (v: boolean) => publicar({ data: { tipo: "pieza", id: p.id, publicar: v } }), onSuccess: refrescar, onError: err });
  const del = useMutation({ mutationFn: () => borrar({ data: { tipo: "pieza", id: p.id } }), onSuccess: refrescar, onError: err });
  const txt = (k: Exclude<keyof typeof f, "descripcion">) => ({ value: f[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });
  const portada = p.fotosUrl.find(Boolean) ?? null;
  return (
    <li className="rounded-xl ring-1 ring-border">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center gap-3 p-2.5 text-left">
        {portada ? <img src={portada} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-muted"><ImagePlus className="h-5 w-5 text-muted-foreground" /></span>}
        <span className="min-w-0 flex-1">
          <b className="block truncate">{p.titulo}</b>
          <span className="text-xs text-muted-foreground">{p.publicado ? "Publicada" : "Sin publicar"} · {p.fotos.length} {p.fotos.length === 1 ? "foto" : "fotos"}</span>
        </span>
        <ChevronDown className={`h-5 w-5 transition ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && esAdmin && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">Nombre de la pieza<Input className="mt-1 h-11" {...txt("titulo")} /></label>
            <label className="text-sm">Técnica<Input className="mt-1 h-11" {...txt("tecnica")} /></label>
            <label className="text-sm">Materiales<Input className="mt-1 h-11" {...txt("materiales")} /></label>
            <label className="text-sm">Medidas<Input className="mt-1 h-11" {...txt("medidas")} /></label>
            <label className="text-sm">Tiempo de trabajo<Input className="mt-1 h-11" placeholder="Ej.: tres semanas" {...txt("tiempo")} /></label>
            <label className="text-sm">Orden en la ficha<Input className="mt-1 h-11 w-24" inputMode="numeric" {...txt("orden")} /></label>
          </div>
          <label className="block text-sm">Sobre la pieza (en palabras del artesano)<Textarea className="mt-1" rows={3} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
          <div>
            <p className="text-sm font-semibold">Fotos (hasta 6; la primera es la portada)</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {p.fotos.map((ruta, k) => (
                <li key={ruta} className="relative">
                  {p.fotosUrl[k] ? <img src={p.fotosUrl[k] ?? ""} alt={`Foto ${k + 1}`} className="h-20 w-20 rounded-lg object-cover" /> : <span className="grid h-20 w-20 place-items-center rounded-lg bg-muted text-xs">Foto {k + 1}</span>}
                  <button type="button" aria-label={`Quitar foto ${k + 1}`} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-background shadow ring-1 ring-border" onClick={() => m.mutate(p.fotos.filter((_, j) => j !== k))}>
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {p.fotos.length < 6 && (
                <li>
                  <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed text-muted-foreground">
                    {subiendo ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                    <span className="sr-only">Agregar foto</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      setSubiendo(true);
                      try { m.mutate([...p.fotos, await subir(p.id, "pieza", file)]); } catch (x) { err(x); } finally { setSubiendo(false); e.target.value = ""; }
                    }} />
                  </label>
                </li>
              )}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button className="h-11" onClick={() => m.mutate(undefined)} disabled={m.isPending}>Guardar</Button>
            <Button variant={p.publicado ? "outline" : "default"} className="h-11" onClick={() => pub.mutate(!p.publicado)} disabled={pub.isPending || (!p.publicado && p.fotos.length === 0)}>
              {p.publicado ? "Quitar de la vitrina" : <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar</>}
            </Button>
            {p.publicado && <Button asChild variant="outline" className="h-11"><Link to="/tembiapo/pieza/$id" params={{ id: p.id }}><Eye className="mr-1.5 h-4 w-4" /> Ver</Link></Button>}
            <Button variant="ghost" className="h-11 text-destructive" aria-label="Borrar pieza" onClick={() => { if (confirm(`¿Borrar «${p.titulo}»? No se puede deshacer.`)) del.mutate(); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
          {!p.publicado && p.fotos.length === 0 && <p className="text-xs text-muted-foreground">Para publicarla hace falta al menos una foto.</p>}
        </div>
      )}
    </li>
  );
}

/* --------------------------------- Palabras -------------------------------- */

function Palabras({ data }: { data: Panel }) {
  const [filtro, setFiltro] = useState<OficioId | "todos" | "revisar">("todos");
  const lista = data.palabras.filter((p) => filtro === "todos" ? true : filtro === "revisar" ? !p.revisado_por && !p.cargueYo : p.oficio === filtro);
  return (
    <div className="mt-5">
      <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
        Las carga un docente: la palabra en guaraní tal como la dice el artesano y su significado en castellano. La revisa otro docente.
        La grabación es la voz del propio artesano y la sube la administración. Al cambiar la palabra o el significado, vuelve a necesitar revisión.
      </p>
      <NuevaPalabra artesanos={data.artesanos} />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold" htmlFor="filtro-palabras">Mostrar</label>
        <select id="filtro-palabras" className="h-10 rounded-md border bg-background px-2 text-sm" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
          <option value="todos">Todas</option>
          <option value="revisar">Para revisar</option>
          {OFICIO_IDS.map((o) => <option key={o} value={o}>{nombreOficio(o)}</option>)}
        </select>
      </div>
      <ul className="mt-3 space-y-3">
        {lista.map((t) => <PalabraItem key={t.id} t={t} artesanos={data.artesanos} esAdmin={data.esAdmin} />)}
        {lista.length === 0 && <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No hay palabras en esta lista.</li>}
      </ul>
    </div>
  );
}

function NuevaPalabra({ artesanos }: { artesanos: ArtesanoPanel[] }) {
  const refrescar = useRefrescar();
  const guardar = useServerFn(guardarPalabra);
  const [f, setF] = useState({ oficio: "nanduti" as OficioId, artesanoId: "", termino: "", significado: "" });
  const deEste = artesanos.filter((a) => a.oficio === f.oficio);
  const m = useMutation({
    mutationFn: () => guardar({ data: { oficio: f.oficio, artesanoId: f.artesanoId || null, termino: f.termino, significado: f.significado } }),
    onSuccess: () => { setF({ ...f, termino: "", significado: "" }); refrescar(); toast.success("Palabra cargada: falta la revisión de otro docente"); },
    onError: err,
  });
  return (
    <form className="mt-4 space-y-2 rounded-2xl bg-card p-3 ring-1 ring-border" onSubmit={(e) => { e.preventDefault(); if (f.termino.trim()) m.mutate(); }}>
      <p className="font-display font-bold">Cargar una palabra</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">Oficio
          <select className={`mt-1 ${SELECT}`} value={f.oficio} onChange={(e) => setF({ ...f, oficio: e.target.value as OficioId, artesanoId: "" })}>
            {OFICIO_IDS.map((o) => <option key={o} value={o}>{nombreOficio(o)}</option>)}
          </select>
        </label>
        <label className="text-sm">De un artesano (opcional)
          <select className={`mt-1 ${SELECT}`} value={f.artesanoId} onChange={(e) => setF({ ...f, artesanoId: e.target.value })}>
            <option value="">Del oficio en general</option>
            {deEste.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
        <label className="text-sm">Palabra en guaraní<Input className="mt-1 h-11" lang="gn" value={f.termino} onChange={(e) => setF({ ...f, termino: e.target.value })} /></label>
        <label className="text-sm">Significado en castellano<Input className="mt-1 h-11" value={f.significado} onChange={(e) => setF({ ...f, significado: e.target.value })} /></label>
      </div>
      <Button type="submit" className="h-11" disabled={m.isPending || !f.termino.trim()}><Plus className="mr-1.5 h-4 w-4" /> Cargar</Button>
    </form>
  );
}

function PalabraItem({ t, artesanos, esAdmin }: { t: TerminoPanel; artesanos: ArtesanoPanel[]; esAdmin: boolean }) {
  const refrescar = useRefrescar();
  const guardar = useServerFn(guardarPalabra);
  const revisar = useServerFn(revisarPalabra);
  const publicar = useServerFn(publicarTembiapo);
  const borrar = useServerFn(borrarTembiapo);
  const subir = useSubir();
  const [f, setF] = useState({ termino: t.termino, significado: t.significado });
  const [subiendo, setSubiendo] = useState(false);
  const cambio = f.termino !== t.termino || f.significado !== t.significado;
  const base = { id: t.id, oficio: t.oficio, artesanoId: t.artesano_id, termino: f.termino, significado: f.significado };
  const m = useMutation({
    mutationFn: (audioPath?: string | null) => guardar({ data: { ...base, ...(audioPath !== undefined ? { audioPath } : {}) } }),
    onSuccess: () => { refrescar(); toast.success("Guardado"); },
    onError: err,
  });
  const rev = useMutation({ mutationFn: () => revisar({ data: { id: t.id } }), onSuccess: () => { refrescar(); toast.success("Revisión registrada"); }, onError: err });
  const pub = useMutation({ mutationFn: (v: boolean) => publicar({ data: { tipo: "palabra", id: t.id, publicar: v } }), onSuccess: refrescar, onError: err });
  const del = useMutation({ mutationFn: () => borrar({ data: { tipo: "palabra", id: t.id } }), onSuccess: refrescar, onError: err });
  const artesano = artesanos.find((a) => a.id === t.artesano_id);
  const estado = t.publicado ? "Publicada" : t.revisado_por ? "Revisada, sin publicar" : "Falta revisión";
  return (
    <li className="rounded-xl bg-card p-3 ring-1 ring-border">
      <p className="text-xs text-muted-foreground">{nombreOficio(t.oficio)}{artesano ? ` · ${artesano.nombre}` : ""} · <b>{estado}</b>{t.cargueYo ? " · la cargaste vos" : ""}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Input className="h-11 font-semibold" lang="gn" aria-label="Palabra en guaraní" value={f.termino} onChange={(e) => setF({ ...f, termino: e.target.value })} />
        <Input className="h-11" aria-label="Significado en castellano" value={f.significado} onChange={(e) => setF({ ...f, significado: e.target.value })} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {cambio && <Button className="h-11" onClick={() => m.mutate(undefined)} disabled={m.isPending}>Guardar (vuelve a revisión)</Button>}
        {t.audio && <audio controls src={t.audio} className="h-11 max-w-full" preload="none" />}
        {!t.audio && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Volume2 className="h-3.5 w-3.5" /> Sin grabación del artesano</span>}
        {esAdmin && (
          <label className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-semibold">
            {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />} {t.audio_path ? "Cambiar grabación" : "Subir grabación"}
            <input type="file" accept="audio/*,.m4a,.opus" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              setSubiendo(true);
              try { m.mutate(await subir(t.id, "palabra", file)); } catch (x) { err(x); } finally { setSubiendo(false); e.target.value = ""; }
            }} />
          </label>
        )}
        {!t.revisado_por && !t.cargueYo && !cambio && t.significado.trim() && (
          <Button className="h-11" onClick={() => rev.mutate()} disabled={rev.isPending}><ShieldCheck className="mr-1.5 h-4 w-4" /> Revisé la palabra y su significado</Button>
        )}
        {esAdmin && (
          <Button variant={t.publicado ? "outline" : "default"} className="h-11" onClick={() => pub.mutate(!t.publicado)} disabled={pub.isPending || (!t.publicado && !t.revisado_por)}>
            {t.publicado ? "Quitar de la vitrina" : <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar</>}
          </Button>
        )}
        {esAdmin && <Button variant="ghost" className="h-11 text-destructive" aria-label="Borrar palabra" onClick={() => { if (confirm(`¿Borrar «${t.termino}»?`)) del.mutate(); }}><Trash2 className="h-4 w-4" /></Button>}
      </div>
    </li>
  );
}

/* ---------------------------------- Rutas ---------------------------------- */

function Rutas({ rutas }: { rutas: Ruta[] }) {
  const refrescar = useRefrescar();
  const guardar = useServerFn(guardarRuta);
  const [nombre, setNombre] = useState("");
  const m = useMutation({
    mutationFn: () => guardar({ data: { slug: slugDe(nombre), nombre, descripcion: "", lugares: [], auspiciante: "", auspicianteUrl: null, orden: rutas.length } }),
    onSuccess: () => { setNombre(""); refrescar(); toast.success("Ruta creada (sin publicar)"); },
    onError: err,
  });
  return (
    <div className="mt-5">
      <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
        Las rutas se definen junto con los artesanos y el Instituto Paraguayo de Artesanía. El auspiciante aparece solo con su acuerdo firmado.
      </p>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (nombre.trim()) m.mutate(); }}>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la ruta" className="h-11" />
        <Button type="submit" className="h-11" disabled={m.isPending || !nombre.trim()}><RutaIcon className="mr-1.5 h-4 w-4" /> Agregar</Button>
      </form>
      <ul className="mt-5 space-y-4">
        {rutas.map((r) => <RutaItem key={r.id} r={r} />)}
        {rutas.length === 0 && <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Todavía no hay rutas.</li>}
      </ul>
    </div>
  );
}

function RutaItem({ r }: { r: RutaPanel & { foto: string | null } }) {
  const [abierto, setAbierto] = useState(false);
  const refrescar = useRefrescar();
  const guardar = useServerFn(guardarRuta);
  const publicar = useServerFn(publicarTembiapo);
  const borrar = useServerFn(borrarTembiapo);
  const subir = useSubir();
  const [f, setF] = useState({ nombre: r.nombre, slug: r.slug, descripcion: r.descripcion, lugares: (r.lugares ?? []).join("\n"), auspiciante: r.auspiciante, auspicianteUrl: r.auspiciante_url ?? "", orden: String(r.orden) });
  const [subiendo, setSubiendo] = useState(false);
  const m = useMutation({
    mutationFn: (fotoPath?: string | null) => guardar({ data: {
      id: r.id, slug: f.slug, nombre: f.nombre, descripcion: f.descripcion,
      lugares: f.lugares.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 20),
      auspiciante: f.auspiciante, auspicianteUrl: f.auspicianteUrl.trim() || null, orden: Math.max(0, Math.min(999, Number(f.orden) || 0)),
      ...(fotoPath !== undefined ? { fotoPath } : {}),
    } }),
    onSuccess: () => { refrescar(); toast.success("Guardado"); },
    onError: err,
  });
  const pub = useMutation({ mutationFn: (v: boolean) => publicar({ data: { tipo: "ruta", id: r.id, publicar: v } }), onSuccess: refrescar, onError: err });
  const del = useMutation({ mutationFn: () => borrar({ data: { tipo: "ruta", id: r.id } }), onSuccess: refrescar, onError: err });
  const txt = (k: "nombre" | "slug" | "auspiciante" | "auspicianteUrl" | "orden") => ({ value: f[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });
  return (
    <li className="rounded-2xl bg-card ring-1 ring-border">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center gap-3 p-3 text-left">
        {r.foto ? <img src={r.foto} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" /> : <span className="grid h-14 w-20 shrink-0 place-items-center rounded-xl bg-muted"><RutaIcon className="h-5 w-5 text-muted-foreground" /></span>}
        <span className="min-w-0 flex-1">
          <b className="block truncate font-display text-lg">{r.nombre}</b>
          <span className="text-xs text-muted-foreground">{r.publicado ? "Publicada" : "Sin publicar"}{r.lugares?.length ? ` · ${r.lugares.join(" → ")}` : ""}</span>
        </span>
        <ChevronDown className={`h-5 w-5 transition ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div className="space-y-3 border-t border-border p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm">Nombre<Input className="mt-1 h-11" {...txt("nombre")} /></label>
            <label className="text-sm">Dirección (jaikuaa.com/tembiapo/ruta/…)<Input className="mt-1 h-11" {...txt("slug")} /></label>
            <label className="text-sm">Auspiciante (con acuerdo firmado)<Input className="mt-1 h-11" {...txt("auspiciante")} /></label>
            <label className="text-sm">Sitio del auspiciante (https://…)<Input className="mt-1 h-11" inputMode="url" {...txt("auspicianteUrl")} /></label>
            <label className="text-sm">Orden<Input className="mt-1 h-11 w-24" inputMode="numeric" {...txt("orden")} /></label>
          </div>
          <label className="block text-sm">Pueblos de la ruta, en orden (uno por renglón)<Textarea className="mt-1" rows={4} value={f.lugares} onChange={(e) => setF({ ...f, lugares: e.target.value })} /></label>
          <label className="block text-sm">Descripción<Textarea className="mt-1" rows={4} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11" onClick={() => m.mutate(undefined)} disabled={m.isPending}>Guardar</Button>
            <label className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-semibold">
              {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {r.foto_path ? "Cambiar foto" : "Foto"}
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setSubiendo(true);
                try { m.mutate(await subir(r.id, "ruta", file)); } catch (x) { err(x); } finally { setSubiendo(false); e.target.value = ""; }
              }} />
            </label>
            <Button variant={r.publicado ? "outline" : "default"} className="h-11" onClick={() => pub.mutate(!r.publicado)} disabled={pub.isPending}>
              {r.publicado ? "Quitar de la vitrina" : <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar</>}
            </Button>
            {r.publicado && <Button asChild variant="outline" className="h-11"><Link to="/tembiapo/ruta/$slug" params={{ slug: r.slug }}><Eye className="mr-1.5 h-4 w-4" /> Ver</Link></Button>}
            <Button variant="ghost" className="h-11 text-destructive" aria-label="Borrar ruta" onClick={() => { if (confirm(`¿Borrar la ruta «${r.nombre}»? Los artesanos quedan, sin ruta.`)) del.mutate(); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </li>
  );
}
