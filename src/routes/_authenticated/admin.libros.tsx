import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { BookPlus, CheckCircle2, Eye, Loader2, MessageSquareWarning, PenLine, Trash2, UserPlus, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actualizarLibro, adminLibros, borrarLibro, crearLibro, darAcceso, quitarAcceso, type LibroAdmin } from "@/lib/libros.functions";
import { asignarAutor, deshabilitarAutor, habilitarAutor, listarAutores } from "@/lib/obras.functions";
import { AREAS, AREA_NOMBRE, ESTADO_NOMBRE, TIPO_NOMBRE, TIPOS_OBRA, VARIANTES, VARIANTE_NOMBRE, type Area, type TipoObra, type Variante } from "@/lib/obras";
import { PanelTienda } from "@/components/libreria/admin-tienda";
import { formatoGs } from "@/lib/pagopar";
import { Portada } from "@/components/libreria/portada";
import { EditorPaginas, prepararImagen, useSubirArchivo } from "@/components/libreria/editor-obra";

/**
 * Panel de la Librería (solo administrador): libros y módulos de especialización.
 * - Habilitar autores y docentes (cargan sus obras desde «Mis obras»).
 * - Revisar lo que mandan: aprobar o pedir cambios con una nota.
 * - Marcar la autorización escrita del autor (sin eso no se publica), el porcentaje del contrato y el precio.
 * - Dar acceso a mano a quien pagó por otro medio.
 */
export const Route = createFileRoute("/_authenticated/admin/libros")({
  head: () => ({ meta: [{ title: "Jaikuaa — Librería: administrar" }, { name: "robots", content: "noindex" }] }),
  component: AdminLibrosPage,
});

const select = "h-10 rounded-lg border border-input bg-background px-2 text-base";

function AdminLibrosPage() {
  const listar = useServerFn(adminLibros);
  const crear = useServerFn(crearLibro);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-libros"], queryFn: () => listar(), retry: false });
  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ["admin-libros"] });
    void qc.invalidateQueries({ queryKey: ["mis-libros"] });
    void qc.invalidateQueries({ queryKey: ["admin-autores"] });
  };

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoObra>("libro");
  const [area, setArea] = useState<Area>("medico");
  const nuevo = useMutation({
    mutationFn: () => crear({ data: { titulo, autor, descripcion, tipo, area: tipo === "libro" ? null : area } }),
    onSuccess: () => {
      setTitulo("");
      setAutor("");
      setDescripcion("");
      refrescar();
    },
  });

  const enRevision = data?.libros.filter((l) => l.estadoRevision === "en_revision") ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/mis-obras">Mis obras</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/mis-libros">Mis libros</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Librería: administrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Libros y módulos de especialización. Los autores habilitados cargan sus obras desde «Mis obras» y te las mandan a
            revisión. Nada se publica sin la autorización escrita del autor: marcala acá cuando la tengas firmada.
          </p>

          {enRevision.length > 0 && (
            <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {enRevision.length === 1 ? "Hay 1 obra esperando tu revisión" : `Hay ${enRevision.length} obras esperando tu revisión`}:{" "}
              {enRevision.map((l) => `«${l.titulo}»`).join(", ")}.
            </p>
          )}

          <PanelTienda />

          <PanelAutores />

          <form
            className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (titulo.trim()) nuevo.mutate();
            }}
          >
            <p className="font-semibold text-foreground">Nueva obra (cargada por Jaikuaa)</p>
            <div className="flex flex-wrap gap-2">
              <select aria-label="Tipo de obra" value={tipo} onChange={(e) => setTipo(e.target.value as TipoObra)} className={select}>
                {TIPOS_OBRA.map((t) => (
                  <option key={t} value={t}>{TIPO_NOMBRE[t]}</option>
                ))}
              </select>
              {tipo !== "libro" && (
                <select aria-label="Rubro del módulo" value={area} onChange={(e) => setArea(e.target.value as Area)} className={select}>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{AREA_NOMBRE[a]}</option>
                  ))}
                </select>
              )}
            </div>
            <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
            <Input placeholder="Autor o editorial" value={autor} onChange={(e) => setAutor(e.target.value)} maxLength={200} />
            <textarea
              placeholder="Descripción corta (se ve en el catálogo)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={2000}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            />
            <Button type="submit" disabled={!titulo.trim() || nuevo.isPending}>
              {nuevo.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <BookPlus className="mr-1.5 h-4 w-4" />}
              Crear
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

/** Autores y docentes habilitados para cargar obras. */
function PanelAutores() {
  const listar = useServerFn(listarAutores);
  const habilitar = useServerFn(habilitarAutor);
  const cambiar = useServerFn(deshabilitarAutor);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-autores"], queryFn: () => listar(), retry: false });
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const alta = useMutation({
    mutationFn: () => habilitar({ data: { email, nombre } }),
    onSuccess: (r) => {
      if (r.estado === "sin-cuenta") return setAviso("Ese correo no tiene cuenta en Jaikuaa. Pedile que se registre primero.");
      if (r.estado === "duplicado") return setAviso("Hay más de una cuenta con ese correo. Revisalo con soporte.");
      setAviso(null);
      setEmail("");
      setNombre("");
      void qc.invalidateQueries({ queryKey: ["admin-autores"] });
    },
    onError: () => setAviso("No se pudo habilitar. Probá de nuevo."),
  });
  const autores = data?.autores ?? [];

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4" aria-labelledby="t-autores">
      <h2 id="t-autores" className="font-semibold text-foreground">Autores y docentes habilitados</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Habilitá a quien ya postuló y firmó: con su correo de Jaikuaa entra a «Mis obras» y carga sus libros o módulos.
      </p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) alta.mutate();
        }}
      >
        <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="sm:flex-1" />
        <Input placeholder="Nombre como aparece en el catálogo" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={200} className="sm:flex-1" />
        <Button type="submit" disabled={!email.trim() || alta.isPending}>
          <UserPlus className="mr-1.5 h-4 w-4" /> Habilitar
        </Button>
      </form>
      {aviso && <p className="mt-2 text-sm text-destructive">{aviso}</p>}
      {autores.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {autores.map((a) => (
            <li key={a.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="font-medium text-foreground">{a.nombre || "Sin nombre"}</span>{" "}
                <span className="text-muted-foreground">{a.correo}</span>
                <span className="text-muted-foreground"> · {a.obras} {a.obras === 1 ? "obra" : "obras"}</span>
                {!a.habilitado && <span className="font-semibold text-amber-700"> · pausado</span>}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void cambiar({ data: { userId: a.userId, habilitado: !a.habilitado } }).then(() => qc.invalidateQueries({ queryKey: ["admin-autores"] }))
                }
              >
                {a.habilitado ? "Pausar" : "Volver a habilitar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ESTADO_COLOR: Record<LibroAdmin["estadoRevision"], string> = {
  borrador: "bg-muted text-muted-foreground",
  en_revision: "bg-amber-100 text-amber-900",
  observado: "bg-orange-100 text-orange-900",
  aprobado: "bg-emerald-100 text-emerald-900",
};

function LibroPanel({ libro, onCambio }: { libro: LibroAdmin; onCambio: () => void }) {
  const actualizar = useServerFn(actualizarLibro);
  const borrar = useServerFn(borrarLibro);
  const dar = useServerFn(darAcceso);
  const quitar = useServerFn(quitarAcceso);
  const asignar = useServerFn(asignarAutor);
  const subir = useSubirArchivo(libro.id);

  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState("");
  const [notaRev, setNotaRev] = useState(libro.notaRevision);
  const inPortada = useRef<HTMLInputElement>(null);

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

  const subirPortada = (f: File | undefined) => {
    if (!f) return;
    void correr("Subiendo portada…", async () => {
      const ruta = await subir(await prepararImagen(f), "portada", 0);
      await actualizar({ data: { id: libro.id, portadaPath: ruta } });
    });
  };

  const guardarNumeros = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const num = (k: string) => {
      const v = String(fd.get(k) ?? "").replace(/\D/g, "");
      return v ? Number(v) : null;
    };
    const pct = num("pct");
    const fecha = String(fd.get("fecha") ?? "");
    void correr("Guardando…", async () => {
      await actualizar({
        data: {
          id: libro.id,
          precioGs: num("precio"),
          porcentajeAutor: pct === null ? null : Math.min(100, pct),
          precioFisicoGs: num("fisico"),
          precioInstitucionalGs: num("inst"),
          enPreventa: fd.get("preventa") === "on",
          fechaDisponible: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
        },
      });
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {libro.tipo === "libro" ? "Libro" : `${TIPO_NOMBRE[libro.tipo]} · ${libro.area ? AREA_NOMBRE[libro.area] : "sin rubro"}`}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTADO_COLOR[libro.estadoRevision]}`}>{ESTADO_NOMBRE[libro.estadoRevision]}</span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-foreground">{libro.titulo}</h2>
          {libro.autor && <p className="text-sm text-muted-foreground">{libro.autor}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {libro.paginas} páginas · {libro.accesos.length} con acceso · {libro.ventas} {libro.ventas === 1 ? "venta" : "ventas"} en línea ·{" "}
            <span className={libro.publicado ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
              {libro.publicado ? "Publicada en el catálogo" : "Sin publicar"}
            </span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <select
              aria-label="Tipo de obra"
              value={libro.tipo}
              onChange={(e) => {
                const t = e.target.value as TipoObra;
                void correr("Guardando…", async () => void (await actualizar({ data: { id: libro.id, tipo: t, area: t === "libro" ? null : (libro.area ?? "medico") } })));
              }}
              className={select}
            >
              {TIPOS_OBRA.map((t) => (
                <option key={t} value={t}>{TIPO_NOMBRE[t]}</option>
              ))}
            </select>
            {libro.tipo !== "libro" && (
              <select
                aria-label="Rubro del módulo"
                value={libro.area ?? "medico"}
                onChange={(e) => void correr("Guardando…", async () => void (await actualizar({ data: { id: libro.id, area: e.target.value as Area } })))}
                className={select}
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>{AREA_NOMBRE[a]}</option>
                ))}
              </select>
            )}
            <select
              aria-label="Lengua de la obra"
              value={libro.variante ?? ""}
              onChange={(e) => void correr("Guardando…", async () => void (await actualizar({ data: { id: libro.id, variante: (e.target.value || null) as Variante | null } })))}
              className={select}
            >
              <option value="">Lengua: sin indicar</option>
              {VARIANTES.map((v) => (
                <option key={v} value={v}>{VARIANTE_NOMBRE[v]}</option>
              ))}
            </select>
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = String(new FormData(e.currentTarget).get("publico") ?? "");
              void correr("Guardando…", async () => void (await actualizar({ data: { id: libro.id, publico: v } })));
            }}
          >
            <Input name="publico" defaultValue={libro.publico} maxLength={300} placeholder="¿Para quién es? (público objetivo)" aria-label="Público objetivo" className="h-10" />
            <Button type="submit" size="sm" variant="secondary" disabled={!!ocupado}>Guardar</Button>
          </form>

          <form
            className="mt-3 flex flex-wrap items-end gap-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              guardarNumeros(e.currentTarget);
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">Precio de venta (Gs.)</span>
              <input name="precio" inputMode="numeric" defaultValue={libro.precioGs ?? ""} placeholder="Vacío = solo WhatsApp" className="h-10 w-40 rounded-lg border border-input bg-background px-2 text-base" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">% del autor (contrato)</span>
              <input name="pct" inputMode="numeric" defaultValue={libro.porcentajeAutor ?? ""} placeholder="Ej. 50" className="h-10 w-28 rounded-lg border border-input bg-background px-2 text-base" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">Impreso, con envío (Gs.)</span>
              <input name="fisico" inputMode="numeric" defaultValue={libro.precioFisicoGs ?? ""} placeholder="Vacío = sin impreso" className="h-10 w-40 rounded-lg border border-input bg-background px-2 text-base" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">Instituciones, por persona (Gs.)</span>
              <input name="inst" inputMode="numeric" defaultValue={libro.precioInstitucionalGs ?? ""} placeholder="Vacío = no se muestra" className="h-10 w-40 rounded-lg border border-input bg-background px-2 text-base" />
            </label>
            <label className="flex items-center gap-2 self-center pt-5">
              <input type="checkbox" name="preventa" defaultChecked={libro.enPreventa} className="h-5 w-5" />
              <span className="font-semibold text-foreground">En preventa</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">Lista desde (aprox.)</span>
              <input type="date" name="fecha" defaultValue={libro.fechaDisponible ?? ""} className="h-10 rounded-lg border border-input bg-background px-2 text-base" />
            </label>
            <Button type="submit" size="sm" variant="secondary" disabled={!!ocupado}>Guardar</Button>
            {libro.precioPropuestoGs && <span className="text-xs text-muted-foreground">El autor propone {formatoGs(libro.precioPropuestoGs)}</span>}
          </form>

          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5"
              checked={libro.autorizacionFirmada}
              disabled={!!ocupado}
              onChange={(e) => void correr("Guardando…", async () => void (await actualizar({ data: { id: libro.id, autorizacionFirmada: e.target.checked } })))}
            />
            <span>
              <span className="font-semibold text-foreground">Tengo la autorización escrita del autor, firmada</span>
              <span className="block text-xs text-muted-foreground">Sin esto no se puede publicar. Si la desmarcás, la obra sale del catálogo.</span>
            </span>
          </label>

          <AutorDeLaObra
            libro={libro}
            ocupado={!!ocupado}
            onAsignar={(correo) =>
              correr("Asignando autor…", async () => {
                const r = await asignar({ data: { libroId: libro.id, email: correo } });
                if (r.estado === "sin-cuenta") throw new Error("Ese correo no tiene cuenta en Jaikuaa.");
                if (r.estado === "duplicado") throw new Error("Hay más de una cuenta con ese correo.");
              })
            }
          />

          {(libro.estadoRevision === "en_revision" || libro.estadoRevision === "observado") && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">Revisión</p>
              <textarea
                value={notaRev}
                onChange={(e) => setNotaRev(e.target.value)}
                rows={2}
                maxLength={2000}
                aria-label="Nota para el autor"
                placeholder="Nota para el autor si pedís cambios (qué corregir)"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" disabled={!!ocupado} onClick={() => void correr("Aprobando…", async () => void (await actualizar({ data: { id: libro.id, estadoRevision: "aprobado", notaRevision: "" } })))}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!ocupado || !notaRev.trim()}
                  onClick={() => void correr("Mandando observaciones…", async () => void (await actualizar({ data: { id: libro.id, estadoRevision: "observado", notaRevision: notaRev } })))}
                >
                  <MessageSquareWarning className="mr-1.5 h-4 w-4" /> Pedir cambios
                </Button>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/leer/$id" params={{ id: libro.id }}>
                <Eye className="mr-1.5 h-4 w-4" /> Ver como lector
              </Link>
            </Button>
            <Button
              size="sm"
              variant={libro.publicado ? "outline" : "default"}
              disabled={!!ocupado || (!libro.publicado && !libro.autorizacionFirmada)}
              title={!libro.publicado && !libro.autorizacionFirmada ? "Primero marcá la autorización firmada" : undefined}
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
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> {ocupado}
        </p>
      )}
      {aviso && <p className="mt-3 text-sm text-destructive" role="alert">{aviso}</p>}

      <div className="mt-5">
        <EditorPaginas libroId={libro.id} lista={libro.lista} onCambio={onCambio} />
      </div>

      {/* Acceso */}
      <div className="mt-5">
        <p className="font-semibold text-foreground">Quién tiene acceso</p>
        <p className="mt-1 text-xs text-muted-foreground">Si te pagaron por transferencia o en mano, escribí el correo con el que la persona entra a Jaikuaa.</p>
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

function AutorDeLaObra({ libro, ocupado, onAsignar }: { libro: LibroAdmin; ocupado: boolean; onAsignar: (correo: string | null) => void }) {
  const [editando, setEditando] = useState(false);
  const [correo, setCorreo] = useState(libro.autorCorreo);
  if (!editando) {
    return (
      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">Cuenta del autor:</span>
        <span className="text-muted-foreground">{libro.autorCorreo || "ninguna (la carga Jaikuaa)"}</span>
        <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" onClick={() => setEditando(true)}>
          <PenLine className="h-3.5 w-3.5" /> Cambiar
        </button>
      </p>
    );
  }
  return (
    <form
      className="mt-3 flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        onAsignar(correo.trim() ? correo.trim() : null);
        setEditando(false);
      }}
    >
      <Input type="email" placeholder="Correo del autor (vacío = sin autor)" value={correo} onChange={(e) => setCorreo(e.target.value)} className="sm:flex-1" />
      <Button type="submit" size="sm" disabled={ocupado}>Guardar</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
    </form>
  );
}
