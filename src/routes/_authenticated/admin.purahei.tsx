import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, Eye, ImagePlus, Loader2, Mic, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FotoArtista } from "@/components/purahei/partes";
import {
  borrarArtista, borrarObra, guardarArtista, guardarObra, panelPurahei, publicarArtista, publicarObra, revisarObra, urlSubidaPurahei,
  type ArtistaPanel, type MimePurahei, type ObraPanel,
} from "@/lib/purahei.functions";
import {
  BPM_ESTILO, ESTILOS, escribirEnlaces, escribirGlosario, escribirVersos, leerEnlaces, leerGlosario, leerVersos, NOMBRE_ESTILO, palabrasDe, slugDe,
  type Estilo, type VersoKaraoke,
} from "@/lib/purahei";

/**
 * Panel de Purahéi Jaikuaa.
 * - Administración: artistas, obras, permisos firmados, foto y grabación, publicar.
 * - Docentes: la letra, el glosario y los huecos del karaoke; y la revisión de lo que cargó otro docente.
 */
export const Route = createFileRoute("/_authenticated/admin/purahei")({
  head: () => ({ meta: [{ title: "Purahéi Jaikuaa — Panel" }, { name: "robots", content: "noindex" }] }),
  component: PanelPage,
});

const MAX_ANCHO = 1000;
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

function useSubir() {
  const pedir = useServerFn(urlSubidaPurahei);
  return async (id: string, tipo: "foto" | "audio", file: File): Promise<string> => {
    const blob = tipo === "foto" ? await prepararImagen(file) : file;
    const mime = (tipo === "foto" ? blob.type || "image/webp" : file.type || "audio/mpeg") as MimePurahei;
    const s = await pedir({ data: { id, tipo, mime } });
    const { error } = await supabase.storage.from("purahei").uploadToSignedUrl(s.path, s.token, blob, { contentType: mime });
    if (error) throw new Error(error.message);
    return s.ruta;
  };
}

const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo guardar");

function PanelPage() {
  const listar = useServerFn(panelPurahei);
  const { data, isLoading, error } = useQuery({ queryKey: ["purahei-panel"], queryFn: () => listar(), retry: false });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/dashboard"><BrandLogo withWordmark={false} /></Link>
          <Button asChild variant="outline" size="sm"><Link to="/purahei">Ver la vitrina</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="font-display text-2xl font-bold">Purahéi Jaikuaa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Una obra sale a la vitrina solo con el permiso escrito de sus dueños y la revisión de un docente distinto de quien cargó la letra.
        </p>
        {isLoading && <p className="mt-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>}
        {error && <p className="mt-6 text-destructive">Este panel es para administración y docentes.</p>}
        {data && (
          <>
            {data.esAdmin && <NuevoArtista />}
            <ul className="mt-6 space-y-4">
              {data.artistas.map((a) => <ArtistaItem key={a.id} a={a} esAdmin={data.esAdmin} />)}
              {data.artistas.length === 0 && <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Todavía no hay artistas cargados.</li>}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function NuevoArtista() {
  const qc = useQueryClient();
  const guardar = useServerFn(guardarArtista);
  const [nombre, setNombre] = useState("");
  const m = useMutation({
    mutationFn: () => guardar({ data: { slug: slugDe(nombre), nombre, ciudad: "", bio: "", whatsapp: "", contacto: "", enlaces: [], permisoImagen: false } }),
    onSuccess: () => { setNombre(""); void qc.invalidateQueries({ queryKey: ["purahei-panel"] }); toast.success("Artista creado"); },
    onError: err,
  });
  return (
    <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (nombre.trim()) m.mutate(); }}>
      <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del artista o grupo" className="h-11" />
      <Button type="submit" className="h-11" disabled={m.isPending || !nombre.trim()}><UserPlus className="mr-1.5 h-4 w-4" /> Agregar</Button>
    </form>
  );
}

function ArtistaItem({ a, esAdmin }: { a: ArtistaPanel; esAdmin: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const qc = useQueryClient();
  const nueva = useServerFn(guardarObra);
  const crearObra = useMutation({
    mutationFn: () => nueva({ data: { artistaId: a.id, titulo: "Obra nueva" } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["purahei-panel"] }),
    onError: err,
  });
  return (
    <li className="rounded-2xl bg-card ring-1 ring-border">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center gap-3 p-3 text-left">
        <FotoArtista src={a.foto} nombre={a.nombre} className="h-14 w-14 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <b className="block truncate font-display text-lg">{a.nombre}</b>
          <span className="text-xs text-muted-foreground">{a.publicado ? "Publicado" : "Sin publicar"} · {a.obras.length} {a.obras.length === 1 ? "obra" : "obras"}</span>
        </span>
        <ChevronDown className={`h-5 w-5 transition ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div className="space-y-5 border-t border-border p-4">
          {esAdmin && <EditarArtista a={a} />}
          <div>
            <h3 className="font-display font-bold">Obras</h3>
            <ul className="mt-2 space-y-3">
              {a.obras.map((o) => <ObraItem key={o.id} o={o} artistaId={a.id} esAdmin={esAdmin} />)}
            </ul>
            {esAdmin && <Button variant="outline" className="mt-3 h-11" onClick={() => crearObra.mutate()} disabled={crearObra.isPending}><Plus className="mr-1.5 h-4 w-4" /> Nueva obra</Button>}
          </div>
        </div>
      )}
    </li>
  );
}

function EditarArtista({ a }: { a: ArtistaPanel }) {
  const qc = useQueryClient();
  const guardar = useServerFn(guardarArtista);
  const publicar = useServerFn(publicarArtista);
  const borrar = useServerFn(borrarArtista);
  const subir = useSubir();
  const [f, setF] = useState({ nombre: a.nombre, slug: a.slug, ciudad: a.ciudad, bio: a.bio, whatsapp: a.whatsapp ?? "", contacto: a.contacto, enlaces: escribirEnlaces(a.enlaces ?? []), permisoImagen: a.permiso_imagen });
  const [subiendo, setSubiendo] = useState(false);
  const refrescar = () => void qc.invalidateQueries({ queryKey: ["purahei-panel"] });
  const m = useMutation({
    mutationFn: (fotoPath?: string) => guardar({ data: { id: a.id, ...f, enlaces: leerEnlaces(f.enlaces), ...(fotoPath ? { fotoPath } : {}) } }),
    onSuccess: () => { refrescar(); toast.success("Guardado"); },
    onError: err,
  });
  const pub = useMutation({ mutationFn: (v: boolean) => publicar({ data: { id: a.id, publicar: v } }), onSuccess: refrescar, onError: err });
  const del = useMutation({ mutationFn: () => borrar({ data: { id: a.id } }), onSuccess: refrescar, onError: err });
  const campo = (k: keyof typeof f) => ({ value: f[k] as string, onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">Nombre<Input className="mt-1 h-11" {...campo("nombre")} /></label>
        <label className="text-sm">Dirección de la ficha (jaikuaa.com/purahei/…)<Input className="mt-1 h-11" {...campo("slug")} /></label>
        <label className="text-sm">Ciudad<Input className="mt-1 h-11" {...campo("ciudad")} /></label>
        <label className="text-sm">WhatsApp para contrataciones<Input className="mt-1 h-11" inputMode="tel" placeholder="0981 123 456" {...campo("whatsapp")} /></label>
        <label className="text-sm sm:col-span-2">Quién atiende (artista o representante)<Input className="mt-1 h-11" {...campo("contacto")} /></label>
      </div>
      <label className="block text-sm">Su historia<Textarea className="mt-1" rows={4} {...campo("bio")} /></label>
      <label className="block text-sm">Enlaces (uno por renglón: «Nombre | https://…»)<Textarea className="mt-1 font-mono text-xs" rows={3} {...campo("enlaces")} /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" className="h-5 w-5" checked={f.permisoImagen} onChange={(e) => setF({ ...f, permisoImagen: e.target.checked })} />
        Tenemos su autorización de imagen firmada
      </label>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11" onClick={() => m.mutate(undefined)} disabled={m.isPending}>Guardar</Button>
        <label className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-semibold">
          {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Foto
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setSubiendo(true);
            try { m.mutate(await subir(a.id, "foto", file)); } catch (x) { err(x); } finally { setSubiendo(false); }
          }} />
        </label>
        <Button variant={a.publicado ? "outline" : "default"} className="h-11" onClick={() => pub.mutate(!a.publicado)} disabled={pub.isPending}>{a.publicado ? "Quitar de la vitrina" : "Publicar ficha"}</Button>
        {a.publicado && <Button asChild variant="outline" className="h-11"><Link to="/purahei/$slug" params={{ slug: a.slug }}><Eye className="mr-1.5 h-4 w-4" /> Ver ficha</Link></Button>}
        <Button variant="ghost" className="h-11 text-destructive" onClick={() => { if (confirm(`¿Borrar a ${a.nombre} y todas sus obras? No se puede deshacer.`)) del.mutate(); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

type Pestana = "datos" | "letra" | "glosario" | "karaoke";

function ObraItem({ o, artistaId, esAdmin }: { o: ObraPanel; artistaId: string; esAdmin: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<Pestana>(esAdmin ? "datos" : "letra");
  const qc = useQueryClient();
  const refrescar = () => void qc.invalidateQueries({ queryKey: ["purahei-panel"] });
  const revisar = useServerFn(revisarObra);
  const publicar = useServerFn(publicarObra);
  const borrar = useServerFn(borrarObra);
  const rev = useMutation({ mutationFn: () => revisar({ data: { id: o.id } }), onSuccess: () => { refrescar(); toast.success("Revisión registrada"); }, onError: err });
  const pub = useMutation({ mutationFn: (v: boolean) => publicar({ data: { id: o.id, publicar: v } }), onSuccess: refrescar, onError: err });
  const del = useMutation({ mutationFn: () => borrar({ data: { id: o.id } }), onSuccess: refrescar, onError: err });
  const pestañas: [Pestana, string][] = [...(esAdmin ? [["datos", "Datos y permisos"] as [Pestana, string]] : []), ["letra", "Letra"], ["glosario", "Glosario"], ["karaoke", "Karaoke"]];
  return (
    <li className="rounded-xl ring-1 ring-border">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center gap-2 p-3 text-left">
        <span className="min-w-0 flex-1">
          <b className="block truncate">{o.titulo}</b>
          <span className="text-xs text-muted-foreground">
            {o.publicado ? "Publicada" : "Sin publicar"} · {o.revisado_por ? "Revisada" : "Sin revisión"} · {NOMBRE_ESTILO[o.estilo]}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 transition ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div className="border-t border-border p-3">
          {o.faltan.length > 0 && !o.publicado && (
            <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Para publicar falta: {o.faltan.join(" · ")}</p>
          )}
          <div className="mb-3 flex flex-wrap gap-1">
            {pestañas.map(([k, t]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`h-9 rounded-full px-3 text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t}</button>
            ))}
          </div>
          {tab === "datos" && esAdmin && <DatosObra o={o} artistaId={artistaId} />}
          {tab === "letra" && <LetraObra o={o} artistaId={artistaId} />}
          {tab === "glosario" && <GlosarioObra o={o} artistaId={artistaId} />}
          {tab === "karaoke" && <KaraokeObra o={o} artistaId={artistaId} />}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button asChild variant="outline" className="h-11"><Link to="/purahei/obra/$id" params={{ id: o.id }} search={{ revisar: 1 }}><Eye className="mr-1.5 h-4 w-4" /> Ver como el público</Link></Button>
            {!o.revisado_por && !o.cargueYo && o.versos.length > 0 && (
              <Button className="h-11" onClick={() => rev.mutate()} disabled={rev.isPending}><ShieldCheck className="mr-1.5 h-4 w-4" /> Revisé la letra y el glosario</Button>
            )}
            {!o.revisado_por && o.cargueYo && <span className="self-center text-xs text-muted-foreground">La revisa otro docente (vos cargaste la letra).</span>}
            {esAdmin && (
              <Button variant={o.publicado ? "outline" : "default"} className="h-11" onClick={() => pub.mutate(!o.publicado)} disabled={pub.isPending || (!o.publicado && o.faltan.length > 0)}>
                {o.publicado ? "Quitar de la vitrina" : <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar</>}
              </Button>
            )}
            {esAdmin && <Button variant="ghost" className="h-11 text-destructive" onClick={() => { if (confirm(`¿Borrar «${o.titulo}»? No se puede deshacer.`)) del.mutate(); }}><Trash2 className="h-4 w-4" /></Button>}
          </div>
        </div>
      )}
    </li>
  );
}

type DatosGuardarObra = {
  id?: string; artistaId: string; titulo?: string; autor?: string; interprete?: string; productor?: string; anio?: number | null;
  estilo?: Estilo; descripcion?: string; permisoAutor?: boolean; permisoInterprete?: boolean; permisoProductor?: boolean;
  audioPath?: string | null; versos?: { gn: string; es: string }[]; glosario?: { termino: string; nota: string }[];
  karaoke?: { bpm: number; versos: VersoKaraoke[] } | null;
};

function useGuardarObra() {
  const qc = useQueryClient();
  const guardar = useServerFn(guardarObra);
  return useMutation({
    mutationFn: (d: DatosGuardarObra) => guardar({ data: d }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["purahei-panel"] }); toast.success("Guardado"); },
    onError: err,
  });
}

function DatosObra({ o, artistaId }: { o: ObraPanel; artistaId: string }) {
  const m = useGuardarObra();
  const subir = useSubir();
  const [subiendo, setSubiendo] = useState(false);
  const [f, setF] = useState({
    titulo: o.titulo, autor: o.autor, interprete: o.interprete, productor: o.productor, anio: o.anio ? String(o.anio) : "", estilo: o.estilo,
    descripcion: o.descripcion, permisoAutor: o.permiso_autor, permisoInterprete: o.permiso_interprete, permisoProductor: o.permiso_productor,
  });
  const txt = (k: "titulo" | "autor" | "interprete" | "productor" | "anio" | "descripcion") => ({ value: f[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });
  const check = (k: "permisoAutor" | "permisoInterprete" | "permisoProductor", t: string) => (
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} /> {t}</label>
  );
  const guardar = (audioPath?: string | null) => m.mutate({
    id: o.id, artistaId, titulo: f.titulo, autor: f.autor, interprete: f.interprete, productor: f.productor,
    anio: f.anio ? Number(f.anio) : null, estilo: f.estilo, descripcion: f.descripcion,
    permisoAutor: f.permisoAutor, permisoInterprete: f.permisoInterprete, permisoProductor: f.permisoProductor,
    ...(audioPath !== undefined ? { audioPath } : {}),
  });
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">Título<Input className="mt-1 h-11" {...txt("titulo")} /></label>
        <label className="text-sm">Autor (letra y música)<Input className="mt-1 h-11" {...txt("autor")} /></label>
        <label className="text-sm">Intérprete<Input className="mt-1 h-11" {...txt("interprete")} /></label>
        <label className="text-sm">Producción de la grabación<Input className="mt-1 h-11" {...txt("productor")} /></label>
        <label className="text-sm">Año<Input className="mt-1 h-11" inputMode="numeric" {...txt("anio")} /></label>
        <label className="text-sm">Estilo
          <select className="mt-1 h-11 w-full rounded-md border bg-background px-2" value={f.estilo} onChange={(e) => setF({ ...f, estilo: e.target.value as Estilo })}>
            {ESTILOS.map((e) => <option key={e} value={e}>{NOMBRE_ESTILO[e]}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm">Sobre la obra<Textarea className="mt-1" rows={3} {...txt("descripcion")} /></label>
      <fieldset className="rounded-xl bg-muted/50 p-3">
        <legend className="px-1 text-sm font-semibold">Permisos firmados</legend>
        {check("permisoAutor", "Del autor (letra y música)")}
        {check("permisoInterprete", "Del intérprete (si se usa su grabación)")}
        {check("permisoProductor", "Del productor de la grabación (si se usa)")}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11" onClick={() => guardar()} disabled={m.isPending}>Guardar</Button>
        <label className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-semibold">
          {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />} {o.audio_path ? "Cambiar grabación" : "Subir grabación"}
          <input type="file" accept="audio/*" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setSubiendo(true);
            try { guardar(await subir(o.id, "audio", file)); } catch (x) { err(x); } finally { setSubiendo(false); }
          }} />
        </label>
        {o.audio_path && <Button variant="ghost" className="h-11" onClick={() => guardar(null)}>Quitar grabación</Button>}
      </div>
    </div>
  );
}

function LetraObra({ o, artistaId }: { o: ObraPanel; artistaId: string }) {
  const m = useGuardarObra();
  const [t, setT] = useState(escribirVersos(o.versos ?? []));
  const n = leerVersos(t).length;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">La carga un docente. Un verso por renglón: «letra en guaraní | traducción al castellano». Al guardar, la obra vuelve a necesitar revisión.</p>
      <Textarea rows={10} value={t} onChange={(e) => setT(e.target.value)} className="font-mono text-sm" />
      <Button className="h-11" onClick={() => m.mutate({ id: o.id, artistaId, versos: leerVersos(t) })} disabled={m.isPending}>Guardar letra ({n} {n === 1 ? "verso" : "versos"})</Button>
    </div>
  );
}

function GlosarioObra({ o, artistaId }: { o: ObraPanel; artistaId: string }) {
  const m = useGuardarObra();
  const [t, setT] = useState(escribirGlosario(o.glosario ?? []));
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Lo escribe un docente. Uno por renglón: «palabra o expresión | explicación». La palabra se marca en la letra y al tocarla se abre la explicación.</p>
      <Textarea rows={8} value={t} onChange={(e) => setT(e.target.value)} className="font-mono text-sm" />
      <Button className="h-11" onClick={() => m.mutate({ id: o.id, artistaId, glosario: leerGlosario(t) })} disabled={m.isPending}>Guardar glosario</Button>
    </div>
  );
}

/** Los docentes eligen qué versos van al karaoke, qué palabra falta y dos opciones falsas. */
function KaraokeObra({ o, artistaId }: { o: ObraPanel; artistaId: string }) {
  const m = useGuardarObra();
  const versos = o.versos ?? [];
  const [bpm, setBpm] = useState(String(o.karaoke?.bpm ?? BPM_ESTILO[o.estilo]));
  const [filas, setFilas] = useState<Record<number, VersoKaraoke>>(() => Object.fromEntries((o.karaoke?.versos ?? []).map((k) => [k.verso, k])));
  if (!versos.length) return <p className="text-sm text-muted-foreground">Primero hay que cargar la letra.</p>;
  const usados = Object.values(filas);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Elegí al menos dos versos. En cada uno: la palabra que falta y dos opciones falsas (las escribe el docente).</p>
      <label className="text-sm">Pulsos por minuto<Input className="mt-1 h-11 w-28" inputMode="numeric" value={bpm} onChange={(e) => setBpm(e.target.value)} /></label>
      <ul className="space-y-2">
        {versos.map((v, i) => {
          const palabras = palabrasDe(v.gn);
          const k = filas[i];
          return (
            <li key={i} className="rounded-lg bg-muted/50 p-2">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-5 w-5" checked={!!k} onChange={(e) => {
                  const n = { ...filas };
                  if (e.target.checked) n[i] = { verso: i, gap: 0, wrong: ["", ""] }; else delete n[i];
                  setFilas(n);
                }} />
                <span><b>{v.gn}</b>{v.es && <span className="block text-xs text-muted-foreground">{v.es}</span>}</span>
              </label>
              {k && (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <select className="h-11 rounded-md border bg-background px-2 text-sm" value={k.gap} onChange={(e) => setFilas({ ...filas, [i]: { ...k, gap: Number(e.target.value) } })} aria-label="Palabra que falta">
                    {palabras.map((p, j) => <option key={j} value={j}>Falta: {p}</option>)}
                  </select>
                  {[0, 1].map((j) => (
                    <Input key={j} className="h-11" placeholder={`Opción falsa ${j + 1}`} value={k.wrong[j] ?? ""} onChange={(e) => { const w = [...k.wrong]; w[j] = e.target.value; setFilas({ ...filas, [i]: { ...k, wrong: w } }); }} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-11"
          disabled={m.isPending || usados.length < 2 || usados.some((k) => k.wrong.some((w) => !w.trim()))}
          onClick={() => m.mutate({ id: o.id, artistaId, karaoke: { bpm: Math.min(140, Math.max(60, Number(bpm) || BPM_ESTILO[o.estilo])), versos: usados.sort((a, b) => a.verso - b.verso).map((k) => ({ ...k, wrong: k.wrong.map((w) => w.trim()) })) } })}
        >
          Guardar karaoke ({usados.length} versos)
        </Button>
        {o.karaoke && <Button variant="ghost" className="h-11" onClick={() => m.mutate({ id: o.id, artistaId, karaoke: null })}>Quitar del karaoke</Button>}
      </div>
    </div>
  );
}
