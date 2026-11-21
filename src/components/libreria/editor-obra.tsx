/**
 * Carga de una obra (libro o módulo), compartida por el panel del administrador y el portal del autor:
 * páginas en imagen (se achican y pasan a WebP), voz humana por página (grabada ahí mismo o subida) y texto.
 * Los permisos los controla el servidor: el autor solo toca su obra mientras está en borrador u observada.
 */
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Mic, RotateCcw, Save, Square, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { borrarPagina, guardarPagina, urlParaSubir, type MimeLibro } from "@/lib/libros.functions";
import { MAX_SEGUNDOS, duracion, elegirFormato, mimeBase } from "@/lib/grabar";

const MAX_ANCHO = 1400;

/** Achica y pasa a WebP las fotos de página: se leen igual de bien y cargan mucho más rápido. */
export async function prepararImagen(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const escala = Math.min(1, MAX_ANCHO / bmp.width);
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Sube un archivo al depósito «libros», en la carpeta de la obra. Devuelve la ruta para guardar. */
export function useSubirArchivo(libroId: string) {
  const subirUrl = useServerFn(urlParaSubir);
  return async (file: Blob, tipo: "pagina" | "audio" | "portada", n: number): Promise<string> => {
    const mime = (file.type || "image/webp") as MimeLibro;
    const s = await subirUrl({ data: { libroId, tipo, n, mime } });
    const { error } = await supabase.storage.from("libros").uploadToSignedUrl(s.path, s.token, file, { contentType: mime });
    if (error) throw new Error(error.message);
    return s.ruta;
  };
}

export type PaginaObra = { n: number; imagen: string | null; audio: string | null; texto: string };

export function EditorPaginas({
  libroId,
  lista,
  onCambio,
  soloLectura = false,
}: {
  libroId: string;
  lista: PaginaObra[];
  onCambio: () => void;
  soloLectura?: boolean;
}) {
  const subir = useSubirArchivo(libroId);
  const guardar = useServerFn(guardarPagina);
  const sacarPagina = useServerFn(borrarPagina);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const inPaginas = useRef<HTMLInputElement>(null);

  async function correr(etiqueta: string, fn: () => Promise<void>) {
    setOcupado(etiqueta);
    setAviso(null);
    try {
      await fn();
      onCambio();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setAviso(m === "Forbidden" ? "Esta obra ya no se puede cambiar (está en revisión o publicada)." : m || "Algo falló. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  }

  const subirPaginas = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const archivos = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    void correr(`Subiendo ${archivos.length} página(s)…`, async () => {
      let n = lista.reduce((m, p) => Math.max(m, p.n), 0);
      for (const f of archivos) {
        n += 1;
        setOcupado(`Subiendo página ${n}…`);
        const ruta = await subir(await prepararImagen(f), "pagina", n);
        await guardar({ data: { libroId, n, imagen: ruta } });
      }
    });
  };

  const subirAudio = (n: number, f: Blob | undefined) => {
    if (!f) return;
    void correr(`Subiendo la voz de la página ${n}…`, async () => {
      const ruta = await subir(f, "audio", n);
      await guardar({ data: { libroId, n, audio: ruta } });
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-foreground">Páginas</p>
        {!soloLectura && (
          <>
            <input ref={inPaginas} type="file" accept="image/*" multiple className="hidden" onChange={(e) => subirPaginas(e.target.files)} />
            <Button size="sm" variant="outline" disabled={!!ocupado} onClick={() => inPaginas.current?.click()}>
              <ImagePlus className="mr-1.5 h-4 w-4" /> Agregar páginas
            </Button>
          </>
        )}
      </div>
      {!soloLectura && <p className="mt-1 text-xs text-muted-foreground">Elegí varias imágenes juntas: se ordenan por el nombre del archivo (01, 02, 03…).</p>}
      {ocupado && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> {ocupado}
        </p>
      )}
      {aviso && <p className="mt-2 text-sm text-destructive" role="alert">{aviso}</p>}
      {lista.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Todavía no hay páginas.</p>
      ) : (
        <ol className="mt-3 divide-y divide-border rounded-xl border border-border">
          {lista.map((p) => (
            <FilaPagina
              key={p.n}
              n={p.n}
              tieneImagen={!!p.imagen}
              tieneAudio={!!p.audio}
              texto={p.texto}
              ocupado={!!ocupado}
              soloLectura={soloLectura}
              onAudio={(f) => subirAudio(p.n, f)}
              onTexto={(t) => void correr("Guardando texto…", async () => void (await guardar({ data: { libroId, n: p.n, texto: t } })))}
              onBorrar={() => {
                if (window.confirm(`¿Borrar la página ${p.n}?`)) void correr("Borrando página…", async () => void (await sacarPagina({ data: { libroId, n: p.n } })));
              }}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function FilaPagina({
  n,
  tieneImagen,
  tieneAudio,
  texto,
  ocupado,
  soloLectura,
  onAudio,
  onTexto,
  onBorrar,
}: {
  n: number;
  tieneImagen: boolean;
  tieneAudio: boolean;
  texto: string;
  ocupado: boolean;
  soloLectura: boolean;
  onAudio: (f: Blob | undefined) => void;
  onTexto: (t: string) => void;
  onBorrar: () => void;
}) {
  const inAudio = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [t, setT] = useState(texto);
  const puedeGrabar = usePuedeGrabar();
  return (
    <li className="px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="w-16 font-semibold text-foreground">Pág. {n}</span>
        <span className={tieneImagen ? "text-emerald-700" : "text-muted-foreground"}>{tieneImagen ? "Imagen ✓" : "Sin imagen"}</span>
        <span className={tieneAudio ? "text-emerald-700" : "text-muted-foreground"}>{tieneAudio ? "Voz ✓" : "Sin voz"}</span>
        {!soloLectura && (
          <span className="ml-auto flex flex-wrap gap-1">
            {puedeGrabar && (
              <Button size="sm" variant={grabando ? "secondary" : "ghost"} disabled={ocupado} onClick={() => setGrabando((v) => !v)} aria-expanded={grabando}>
                <Mic className="mr-1 h-4 w-4" /> {tieneAudio ? "Grabar de nuevo" : "Grabar voz"}
              </Button>
            )}
            <input
              ref={inAudio}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                onAudio(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => inAudio.current?.click()}>
              <Upload className="mr-1 h-4 w-4" /> {puedeGrabar ? "Subir audio" : tieneAudio ? "Cambiar voz" : "Voz"}
            </Button>
            <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
              Texto
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" disabled={ocupado} onClick={onBorrar} aria-label={`Borrar página ${n}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </span>
        )}
      </div>
      {grabando && !soloLectura && (
        <GrabadorVoz
          pagina={n}
          ocupado={ocupado}
          onCerrar={() => setGrabando(false)}
          onGuardar={(b) => {
            onAudio(b);
            setGrabando(false);
          }}
        />
      )}
      {abierto && !soloLectura && (
        <div className="mt-2 space-y-2">
          <textarea
            value={t}
            onChange={(e) => setT(e.target.value)}
            rows={4}
            maxLength={20000}
            aria-label={`Texto de la página ${n}`}
            placeholder="Texto de la página (opcional: ayuda a quien usa lector de pantalla)."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          />
          <Button size="sm" disabled={ocupado} onClick={() => onTexto(t)}>
            Guardar texto
          </Button>
        </div>
      )}
    </li>
  );
}

/** ¿Este navegador puede grabar? (se mira después de cargar, para que el servidor y el celular dibujen lo mismo) */
function usePuedeGrabar(): boolean {
  const [si, setSi] = useState(false);
  useEffect(() => {
    setSi(typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);
  return si;
}

type Fase = "inicio" | "grabando" | "lista";

/**
 * Grabar la voz de una página desde el celular o la computadora:
 * Grabar → Terminar → escucharla → Guardar esta voz (o grabar de nuevo).
 */
function GrabadorVoz({ pagina, ocupado, onGuardar, onCerrar }: { pagina: number; ocupado: boolean; onGuardar: (b: Blob) => void; onCerrar: () => void }) {
  const [fase, setFase] = useState<Fase>("inicio");
  const [seg, setSeg] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [grabacion, setGrabacion] = useState<{ blob: Blob; url: string } | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const microfono = useRef<MediaStream | null>(null);
  const reloj = useRef<number | null>(null);

  function soltar() {
    microfono.current?.getTracks().forEach((pista) => pista.stop());
    microfono.current = null;
    if (reloj.current !== null) window.clearInterval(reloj.current);
    reloj.current = null;
  }

  function terminar() {
    if (reloj.current !== null) window.clearInterval(reloj.current);
    reloj.current = null;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }

  // Al cerrar: soltar el micrófono y la grabación en memoria.
  useEffect(
    () => () => {
      if (rec.current && rec.current.state !== "inactive") {
        rec.current.onstop = null;
        rec.current.stop();
      }
      soltar();
    },
    [],
  );
  useEffect(() => () => (grabacion ? URL.revokeObjectURL(grabacion.url) : undefined), [grabacion]);

  async function empezar() {
    setError(null);
    setGrabacion(null);
    try {
      const pista = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      microfono.current = pista;
      const formato = elegirFormato((tipo) => MediaRecorder.isTypeSupported(tipo));
      const r = new MediaRecorder(pista, formato ? { mimeType: formato, audioBitsPerSecond: 64000 } : undefined);
      const trozos: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size > 0) trozos.push(e.data);
      };
      r.onstop = () => {
        soltar();
        const tipo = mimeBase(r.mimeType || formato || trozos[0]?.type || "");
        const blob = tipo ? new Blob(trozos, { type: tipo }) : null;
        if (!blob || blob.size === 0) {
          setError(
            tipo
              ? "La grabación salió vacía. Probá de nuevo."
              : "Este navegador graba en un formato que no podemos guardar. Probá con Chrome o subí un archivo de audio.",
          );
          setFase("inicio");
          return;
        }
        setGrabacion({ blob, url: URL.createObjectURL(blob) });
        setFase("lista");
      };
      rec.current = r;
      r.start(1000);
      setSeg(0);
      setFase("grabando");
      const inicio = Date.now();
      reloj.current = window.setInterval(() => {
        const s = (Date.now() - inicio) / 1000;
        setSeg(s);
        if (s >= MAX_SEGUNDOS) terminar();
      }, 250);
    } catch (e) {
      soltar();
      const nombre = e instanceof DOMException ? e.name : "";
      setError(
        nombre === "NotAllowedError"
          ? "Para grabar, permití el micrófono cuando el navegador lo pregunte (o en la configuración del sitio)."
          : nombre === "NotFoundError"
            ? "No encontramos un micrófono en este aparato."
            : "No se pudo empezar a grabar. Probá de nuevo o subí un archivo de audio.",
      );
      setFase("inicio");
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3" role="group" aria-label={`Grabar la voz de la página ${pagina}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Voz de la página {pagina}</p>
        <Button size="sm" variant="ghost" onClick={onCerrar} disabled={fase === "grabando"} aria-label="Cerrar la grabación">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {fase === "inicio" && (
        <>
          <p className="mt-1 text-xs text-muted-foreground">Buscá un lugar callado y hablá con el celular a un palmo de la boca. Antes de guardar, la escuchás.</p>
          <Button className="mt-3 h-12 w-full sm:w-auto" disabled={ocupado} onClick={() => void empezar()}>
            <Mic className="mr-1.5 h-5 w-5" /> Empezar a grabar
          </Button>
        </>
      )}

      {fase === "grabando" && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-destructive" aria-live="polite">
            <span className="h-3 w-3 animate-pulse rounded-full bg-destructive motion-reduce:animate-none" aria-hidden />
            Grabando {duracion(seg)}
          </span>
          <Button className="h-12" variant="destructive" onClick={terminar}>
            <Square className="mr-1.5 h-4 w-4" /> Terminar
          </Button>
        </div>
      )}

      {fase === "lista" && grabacion && (
        <div className="mt-2 space-y-3">
          <audio src={grabacion.url} controls className="w-full" aria-label={`Escuchar la grabación de la página ${pagina}`} />
          <div className="flex flex-wrap gap-2">
            <Button className="h-11" disabled={ocupado} onClick={() => onGuardar(grabacion.blob)}>
              <Save className="mr-1.5 h-4 w-4" /> Guardar esta voz
            </Button>
            <Button className="h-11" variant="outline" disabled={ocupado} onClick={() => void empezar()}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Grabar de nuevo
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
