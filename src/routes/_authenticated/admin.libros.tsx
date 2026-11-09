import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { BookPlus, Eye, ImagePlus, Loader2, Mic, Trash2, UserPlus, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  actualizarLibro,
  adminLibros,
  borrarLibro,
  borrarPagina,
  crearLibro,
  darAcceso,
  guardarPagina,
  quitarAcceso,
  urlParaSubir,
  type LibroAdmin,
  type MimeLibro,
} from "@/lib/libros.functions";
import { Portada } from "@/components/libreria/portada";

/**
 * Panel de la Librería (solo administrador):
 * cargar libros (portada, páginas en imagen, voz por página y texto), publicarlos en el catálogo
 * y dar acceso a quien pagó, por su correo de Jaikuaa.
 */
export const Route = createFileRoute("/_authenticated/admin/libros")({
  head: () => ({ meta: [{ title: "Jaikuaa — Librería: administrar" }, { name: "robots", content: "noindex" }] }),
  component: AdminLibrosPage,
});

const MAX_ANCHO = 1400;

/** Achica y pasa a WebP las fotos de página: se leen igual de bien y cargan mucho más rápido. */
async function prepararImagen(file: File): Promise<Blob> {
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

function AdminLibrosPage() {
  const listar = useServerFn(adminLibros);
  const crear = useServerFn(crearLibro);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-libros"], queryFn: () => listar(), retry: false });
  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ["admin-libros"] });
    void qc.invalidateQueries({ queryKey: ["mis-libros"] });
  };

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const nuevo = useMutation({
    mutationFn: () => crear({ data: { titulo, autor, descripcion } }),
    onSuccess: () => {
      setTitulo("");
      setAutor("");
      setDescripcion("");
      refrescar();
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/mis-libros">Mis libros</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Librería: administrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cargá el libro, sus páginas (fotos o imágenes) y, si querés, la voz de cada página. Cuando alguien te paga,
            dale acceso con su correo de Jaikuaa: el libro aparece en su «Mis libros». Ningún libro se publica sin la
            autorización escrita del autor.
          </p>

          <form
            className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (titulo.trim()) nuevo.mutate();
            }}
          >
            <p className="font-semibold text-foreground">Nuevo libro</p>
            <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
            <Input placeholder="Autor o editorial" value={autor} onChange={(e) => setAutor(e.target.value)} maxLength={200} />
            <textarea
              placeholder="Descripción corta (se ve en el catálogo)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={2000}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={!titulo.trim() || nuevo.isPending}>
              {nuevo.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <BookPlus className="mr-1.5 h-4 w-4" />}
              Crear libro
            </Button>
            {nuevo.error && <p className="text-sm text-destructive">No se pudo crear. Probá de nuevo.</p>}
          </form>

          {isLoading && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </p>
          )}
          {error && <p className="mt-8 text-sm text-destructive">Solo el administrador puede ver esta página.</p>}

          <div className="mt-6 space-y-5">
            {data?.libros.map((l) => <LibroPanel key={l.id} libro={l} onCambio={refrescar} />)}
          </div>
        </div>
      </main>
    </div>
  );
}

function LibroPanel({ libro, onCambio }: { libro: LibroAdmin; onCambio: () => void }) {
  const actualizar = useServerFn(actualizarLibro);
  const borrar = useServerFn(borrarLibro);
  const subirUrl = useServerFn(urlParaSubir);
  const guardar = useServerFn(guardarPagina);
  const sacarPagina = useServerFn(borrarPagina);
  const dar = useServerFn(darAcceso);
  const quitar = useServerFn(quitarAcceso);

  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState("");
  const inPaginas = useRef<HTMLInputElement>(null);
  const inPortada = useRef<HTMLInputElement>(null);

  async function subir(file: Blob, tipo: "pagina" | "audio" | "portada", n: number): Promise<string> {
    const mime = (file.type || "image/webp") as MimeLibro;
    const s = await subirUrl({ data: { libroId: libro.id, tipo, n, mime } });
    const { error } = await supabase.storage.from("libros").uploadToSignedUrl(s.path, s.token, file, { contentType: mime });
    if (error) throw new Error(error.message);
    return s.ruta;
  }

  async function correr(etiqueta: string, fn: () => Promise<void>) {
    setOcupado(etiqueta);
    setAviso(null);
    try {
      await fn();
      onCambio();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Algo falló. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  }

  const subirPaginas = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const lista = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    void correr(`Subiendo ${lista.length} página(s)…`, async () => {
      let n = libro.lista.reduce((m, p) => Math.max(m, p.n), 0);
      for (const f of lista) {
        n += 1;
        setOcupado(`Subiendo página ${n}…`);
        const ruta = await subir(await prepararImagen(f), "pagina", n);
        await guardar({ data: { libroId: libro.id, n, imagen: ruta } });
      }
    });
  };

  const subirAudio = (n: number, f: File | undefined) => {
    if (!f) return;
    void correr(`Subiendo la voz de la página ${n}…`, async () => {
      const ruta = await subir(f, "audio", n);
      await guardar({ data: { libroId: libro.id, n, audio: ruta } });
    });
  };

  const subirPortada = (f: File | undefined) => {
    if (!f) return;
    void correr("Subiendo portada…", async () => {
      const ruta = await subir(await prepararImagen(f), "portada", 0);
      await actualizar({ data: { id: libro.id, portadaPath: ruta } });
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="w-24 shrink-0">
          <Portada libro={libro} />
          <input ref={inPortada} type="file" accept="image/*" className="hidden" onChange={(e) => subirPortada(e.target.files?.[0])} />
          <button type="button" onClick={() => inPortada.current?.click()} className="mt-1 w-full text-xs font-semibold text-primary hover:underline">
            Cambiar portada
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-foreground">{libro.titulo}</h2>
          {libro.autor && <p className="text-sm text-muted-foreground">{libro.autor}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {libro.paginas} páginas · {libro.accesos.length} con acceso ·{" "}
            <span className={libro.publicado ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
              {libro.publicado ? "Publicado en el catálogo" : "Sin publicar"}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/leer/$id" params={{ id: libro.id }}>
                <Eye className="mr-1.5 h-4 w-4" /> Ver como lector
              </Link>
            </Button>
            <Button
              size="sm"
              variant={libro.publicado ? "outline" : "default"}
              disabled={!!ocupado}
              onClick={() => void correr("Guardando…", async () => void (await actualizar({ data: { id: libro.id, publicado: !libro.publicado } })))}
            >
              {libro.publicado ? "Sacar del catálogo" : "Publicar en el catálogo"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={!!ocupado}
              onClick={() => {
                if (window.confirm(`¿Borrar «${libro.titulo}» con todas sus páginas? No se puede deshacer.`))
                  void correr("Borrando…", async () => void (await borrar({ data: { id: libro.id } })));
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Borrar
            </Button>
          </div>
        </div>
      </div>

      {ocupado && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {ocupado}
        </p>
      )}
      {aviso && <p className="mt-3 text-sm text-destructive">{aviso}</p>}

      {/* Páginas */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Páginas</p>
          <input ref={inPaginas} type="file" accept="image/*" multiple className="hidden" onChange={(e) => subirPaginas(e.target.files)} />
          <Button size="sm" variant="outline" disabled={!!ocupado} onClick={() => inPaginas.current?.click()}>
            <ImagePlus className="mr-1.5 h-4 w-4" /> Agregar páginas
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Elegí varias imágenes juntas: se ordenan por el nombre del archivo (01, 02, 03…).</p>
        {libro.lista.length > 0 && (
          <ol className="mt-3 divide-y divide-border rounded-xl border border-border">
            {libro.lista.map((p) => (
              <FilaPagina
                key={p.n}
                n={p.n}
                tieneImagen={!!p.imagen}
                tieneAudio={!!p.audio}
                texto={p.texto}
                ocupado={!!ocupado}
                onAudio={(f) => subirAudio(p.n, f)}
                onTexto={(t) => void correr("Guardando texto…", async () => void (await guardar({ data: { libroId: libro.id, n: p.n, texto: t } })))}
                onBorrar={() => {
                  if (window.confirm(`¿Borrar la página ${p.n}?`)) void correr("Borrando página…", async () => void (await sacarPagina({ data: { libroId: libro.id, n: p.n } })));
                }}
              />
            ))}
          </ol>
        )}
      </div>

      {/* Acceso */}
      <div className="mt-5">
        <p className="font-semibold text-foreground">Quién tiene acceso</p>
        <p className="mt-1 text-xs text-muted-foreground">Cuando te paguen, escribí el correo con el que la persona entra a Jaikuaa.</p>
        <form
          className="mt-2 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            void correr("Dando acceso…", async () => {
              const r = await dar({ data: { libroId: libro.id, email, nota } });
              if (r.estado === "sin-cuenta") throw new Error("Ese correo no tiene cuenta en Jaikuaa. Pedile que se registre primero.");
              if (r.estado === "duplicado") throw new Error("Hay más de una cuenta con ese correo. Revisalo con soporte.");
              setEmail("");
              setNota("");
            });
          }}
        >
          <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="sm:flex-1" />
          <Input placeholder="Nota (opcional, ej. pagó por transferencia)" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} className="sm:flex-1" />
          <Button type="submit" disabled={!email.trim() || !!ocupado}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Dar acceso
          </Button>
        </form>
        {libro.accesos.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {libro.accesos.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-medium text-foreground">{a.nombre || "Sin nombre"}</span>{" "}
                  <span className="text-muted-foreground">{a.correo}</span>
                  {a.nota && <span className="text-muted-foreground"> · {a.nota}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Quitar acceso a ${a.correo}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(`¿Quitar el acceso de ${a.correo}?`)) void correr("Quitando acceso…", async () => void (await quitar({ data: { id: a.id } })));
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FilaPagina({
  n,
  tieneImagen,
  tieneAudio,
  texto,
  ocupado,
  onAudio,
  onTexto,
  onBorrar,
}: {
  n: number;
  tieneImagen: boolean;
  tieneAudio: boolean;
  texto: string;
  ocupado: boolean;
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
        <span className={tieneImagen ? "text-emerald-600" : "text-muted-foreground"}>{tieneImagen ? "Imagen ✓" : "Sin imagen"}</span>
        <span className={tieneAudio ? "text-emerald-600" : "text-muted-foreground"}>{tieneAudio ? "Voz ✓" : "Sin voz"}</span>
        <span className="ml-auto flex gap-1">
          <input ref={inAudio} type="file" accept="audio/*" className="hidden" onChange={(e) => onAudio(e.target.files?.[0])} />
          <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => inAudio.current?.click()}>
            <Mic className="mr-1 h-4 w-4" /> {tieneAudio ? "Cambiar voz" : "Voz"}
          </Button>
          <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => setAbierto((v) => !v)}>
            Texto
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" disabled={ocupado} onClick={onBorrar} aria-label={`Borrar página ${n}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      </div>
      {abierto && (
        <div className="mt-2 space-y-2">
          <textarea
            value={t}
            onChange={(e) => setT(e.target.value)}
            rows={4}
            maxLength={20000}
            placeholder="Texto de la página (opcional: ayuda a quien usa lector de pantalla). Sin guaraní que no esté revisado."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button size="sm" disabled={ocupado} onClick={() => onTexto(t)}>
            Guardar texto
          </Button>
        </div>
      )}
    </li>
  );
}
