/**
 * Carga de una obra (libro o módulo), compartida por el panel del administrador y el portal del autor:
 * páginas en imagen (se achican y pasan a WebP), voz humana por página y texto.
 * Los permisos los controla el servidor: el autor solo toca su obra mientras está en borrador u observada.
 */
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Mic, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { borrarPagina, guardarPagina, urlParaSubir, type MimeLibro } from "@/lib/libros.functions";

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

  const subirAudio = (n: number, f: File | undefined) => {
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
  onAudio: (f: File | undefined) => void;
  onTexto: (t: string) => void;
  onBorrar: () => void;
}) {
  const inAudio = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [t, setT] = useState(texto);
  return (
    <li className="px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="w-16 font-semibold text-foreground">Pág. {n}</span>
        <span className={tieneImagen ? "text-emerald-700" : "text-muted-foreground"}>{tieneImagen ? "Imagen ✓" : "Sin imagen"}</span>
        <span className={tieneAudio ? "text-emerald-700" : "text-muted-foreground"}>{tieneAudio ? "Voz ✓" : "Sin voz"}</span>
        {!soloLectura && (
          <span className="ml-auto flex gap-1">
            <input ref={inAudio} type="file" accept="audio/*" className="hidden" onChange={(e) => onAudio(e.target.files?.[0])} />
            <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => inAudio.current?.click()}>
              <Mic className="mr-1 h-4 w-4" /> {tieneAudio ? "Cambiar voz" : "Voz"}
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
