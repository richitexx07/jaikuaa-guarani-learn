import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { BookPlus, Camera, ExternalLink, Eye, FileCheck2, Loader2, PenLine, Send, Settings2, Store, Trash2, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  borrarObraAutor,
  crearObra,
  editarObra,
  enviarARevision,
  guardarFotoAutor,
  guardarMiVitrina,
  miPortalAutor,
  urlFotoAutor,
  type ObraAutor,
  type SaldoAutor,
  type VitrinaAutor,
} from "@/lib/obras.functions";
import { supabase } from "@/integrations/supabase/client";
import { AREAS, AREA_NOMBRE, ESTADO_NOMBRE, VARIANTES, VARIANTE_NOMBRE, nombreMes, type Area, type TipoObra, type Variante } from "@/lib/obras";
import { formatoGs } from "@/lib/pagopar";
import { EditorPaginas, prepararImagen, useSubirArchivo } from "@/components/libreria/editor-obra";

/**
 * «Mis obras»: el portal de autores, docentes y editoriales de la Librería Jaikuaa.
 * Cargan su libro o módulo de especialización, lo mandan a revisión y ven sus ventas por mes.
 * Publicar, el precio final y el porcentaje los define Jaikuaa con el contrato firmado.
 */
export const Route = createFileRoute("/_authenticated/mis-obras")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Mis obras" },
      { name: "description", content: "Portal de autores y docentes de la Librería Jaikuaa: cargá tus libros y módulos y mirá tus ventas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MisObrasPage,
});

const select = "h-11 rounded-lg border border-input bg-background px-2 text-base";

const ESTADO_COLOR: Record<ObraAutor["estado"], string> = {
  borrador: "bg-muted text-muted-foreground",
  en_revision: "bg-amber-100 text-amber-900",
  observado: "bg-orange-100 text-orange-900",
  aprobado: "bg-emerald-100 text-emerald-900",
};

function MisObrasPage() {
  const cargar = useServerFn(miPortalAutor);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["mis-obras"], queryFn: () => cargar(), retry: false });
  const refrescar = () => void qc.invalidateQueries({ queryKey: ["mis-obras"] });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Mis obras</h1>

          {isLoading && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </p>
          )}
          {error && <p className="mt-6 text-sm text-destructive">No pudimos cargar tus obras. Probá de nuevo en un rato.</p>}

          {data?.estado === "no-autor" && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <p className="font-semibold text-foreground">¿Sos autor, docente o editorial?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Postulá tu obra en la Librería. Cuando firmemos la autorización, te habilitamos este portal con tu misma cuenta para que
                cargues tus libros o módulos de especialización y veas tus ventas.
              </p>
              <Button asChild className="mt-4">
                <Link to="/libreria" hash="postular">Postular mi obra</Link>
              </Button>
            </div>
          )}

          {data?.estado === "ok" && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.nombre ? `Mba'éichapa, ${data.nombre}. ` : "Mba'éichapa. "}
                Cargá tus obras con su voz, mandalas a revisión y seguí tus ventas mes a mes.
              </p>
              {data.esAdmin && (
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/admin/libros">
                    <Settings2 className="mr-1.5 h-4 w-4" /> Administrar la Librería
                  </Link>
                </Button>
              )}

              <ol className="mt-5 grid gap-2 text-sm sm:grid-cols-4">
                {[
                  "Cargás la obra: páginas, voz y texto.",
                  "La mandás a revisión.",
                  "Firmamos la autorización y el reparto.",
                  "La publicamos y ves tus ventas cada mes.",
                ].map((t, i) => (
                  <li key={t} className="rounded-xl bg-muted/60 p-3">
                    <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
                    <p className="mt-1 text-foreground">{t}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                La voz de cada página la podés grabar ahí mismo con el celular, o subir un audio que ya tengas. Cuando la obra está
                publicada, sus 2 primeras páginas se pueden ver y escuchar gratis, para que la gente se anime a comprarla.
              </p>

              {data.habilitado && <MiVitrina vitrina={data.vitrina} onCambio={refrescar} />}

              {data.habilitado ? (
                <NuevaObra onCreada={refrescar} />
              ) : (
                <p className="mt-6 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                  Tu cuenta de administrador no está habilitada como autor: las obras de Jaikuaa se cargan desde «Administrar la Librería».
                </p>
              )}

              <div className="mt-6 space-y-5">
                {data.obras.map((o) => (
                  <ObraPanel key={o.id} obra={o} onCambio={refrescar} />
                ))}
              </div>

              <Informe filas={data.informe} saldo={data.saldo} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function NuevaObra({ onCreada }: { onCreada: () => void }) {
  const crear = useServerFn(crearObra);
  const [tipo, setTipo] = useState<TipoObra>("libro");
  const [area, setArea] = useState<Area>("medico");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [variante, setVariante] = useState<Variante | "">("");
  const [publico, setPublico] = useState("");
  const m = useMutation({
    mutationFn: () => {
      const p = precio.replace(/\D/g, "");
      return crear({
        data: {
          titulo,
          descripcion,
          tipo,
          area: tipo === "libro" ? null : area,
          precioPropuestoGs: p ? Number(p) : null,
          variante: variante || null,
          publico,
        },
      });
    },
    onSuccess: () => {
      setTitulo("");
      setDescripcion("");
      setPrecio("");
      setPublico("");
      onCreada();
    },
  });
  return (
    <form
      className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (titulo.trim()) m.mutate();
      }}
    >
      <p className="font-semibold text-foreground">Nueva obra</p>
      <div className="flex flex-wrap gap-2">
        <select aria-label="¿Qué vas a cargar?" value={tipo} onChange={(e) => setTipo(e.target.value as TipoObra)} className={select}>
          <option value="libro">Un libro</option>
          <option value="modulo">Un módulo de especialización</option>
          <option value="curso">Un curso con video</option>
        </select>
        {tipo !== "libro" && (
          <select aria-label="Rubro" value={area} onChange={(e) => setArea(e.target.value as Area)} className={select}>
            {AREAS.map((a) => (
              <option key={a} value={a}>{AREA_NOMBRE[a]}</option>
            ))}
          </select>
        )}
      </div>
      <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} className="h-11" />
      <select aria-label="¿En qué lengua está?" value={variante} onChange={(e) => setVariante(e.target.value as Variante | "")} className={`${select} w-full`}>
        <option value="">¿En qué lengua está?</option>
        {VARIANTES.map((v) => (
          <option key={v} value={v}>{VARIANTE_NOMBRE[v]}</option>
        ))}
      </select>
      <Input placeholder="¿Para quién es? (ej. enfermeras y médicos de guardia)" value={publico} onChange={(e) => setPublico(e.target.value)} maxLength={300} className="h-11" />
      <textarea
        placeholder="Descripción corta: de qué trata y para quién es"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={2000}
        rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
      />
      <label className="block text-sm">
        <span className="font-semibold text-foreground">Precio que proponés (Gs., opcional)</span>
        <Input inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Lo definimos juntos al firmar" className="mt-1 h-11" />
      </label>
      <Button type="submit" disabled={!titulo.trim() || m.isPending}>
        {m.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <BookPlus className="mr-1.5 h-4 w-4" />}
        Crear y empezar a cargar
      </Button>
      {m.error && <p className="text-sm text-destructive">{m.error instanceof Error ? m.error.message : "No se pudo crear."}</p>}
    </form>
  );
}

function ObraPanel({ obra, onCambio }: { obra: ObraAutor; onCambio: () => void }) {
  const editar = useServerFn(editarObra);
  const enviar = useServerFn(enviarARevision);
  const borrar = useServerFn(borrarObraAutor);
  const subir = useSubirArchivo(obra.id);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [abiertoDatos, setAbiertoDatos] = useState(false);
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

  const tipoTexto = obra.tipo === "libro" ? "Libro" : `${obra.tipo === "modulo" ? "Módulo" : "Curso"}${obra.area ? ` · ${AREA_NOMBRE[obra.area]}` : ""}`;

  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-label={obra.titulo}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{tipoTexto}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTADO_COLOR[obra.estado]}`}>
          {obra.publicado ? "Publicada" : ESTADO_NOMBRE[obra.estado]}
        </span>
      </div>
      <h2 className="mt-1 font-display text-xl font-bold text-foreground">{obra.titulo}</h2>
      {obra.descripcion && <p className="mt-1 text-sm text-muted-foreground">{obra.descripcion}</p>}
      {(obra.variante || obra.publico) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {[obra.variante ? VARIANTE_NOMBRE[obra.variante] : null, obra.publico ? `Para: ${obra.publico}` : null].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {obra.lista.length} {obra.lista.length === 1 ? "página" : "páginas"}
        {obra.precioGs ? ` · Precio de venta ${formatoGs(obra.precioGs)}` : obra.precioPropuestoGs ? ` · Propusiste ${formatoGs(obra.precioPropuestoGs)}` : ""}
        {obra.porcentajeAutor !== null ? ` · Tu parte: ${obra.porcentajeAutor}%` : ""}
      </p>

      {obra.estado === "observado" && obra.nota && (
        <p className="mt-3 rounded-xl border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900" role="status">
          <span className="font-semibold">Te pedimos estos cambios:</span> {obra.nota}
        </p>
      )}
      {obra.estado === "en_revision" && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">La estamos revisando. Volvé a esta página para ver si ya está aprobada o si te pedimos algún cambio.</p>
      )}
      {obra.estado === "aprobado" && !obra.publicado && (
        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          <FileCheck2 className="mr-1 inline h-4 w-4" /> Aprobada. La publicamos cuando esté firmada la autorización y el reparto.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/leer/$id" params={{ id: obra.id }}>
            <Eye className="mr-1.5 h-4 w-4" /> Ver como lector
          </Link>
        </Button>
        {obra.editable && (
          <>
            <Button size="sm" variant="outline" onClick={() => setAbiertoDatos((v) => !v)} aria-expanded={abiertoDatos}>
              <PenLine className="mr-1.5 h-4 w-4" /> Datos y portada
            </Button>
            <Button
              size="sm"
              disabled={!!ocupado || obra.lista.length === 0}
              title={obra.lista.length === 0 ? "Primero cargá al menos una página" : undefined}
              onClick={() => {
                if (window.confirm("¿Mandar a revisión? Mientras la revisamos no se puede cambiar."))
                  void correr("Mandando a revisión…", async () => void (await enviar({ data: { id: obra.id } })));
              }}
            >
              <Send className="mr-1.5 h-4 w-4" /> Mandar a revisión
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={!!ocupado}
              onClick={() => {
                if (window.confirm(`¿Borrar «${obra.titulo}» con todas sus páginas? No se puede deshacer.`))
                  void correr("Borrando…", async () => void (await borrar({ data: { id: obra.id } })));
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Borrar
            </Button>
          </>
        )}
      </div>

      {abiertoDatos && obra.editable && (
        <form
          className="mt-3 space-y-2 rounded-xl bg-muted/50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const p = String(fd.get("precio") ?? "").replace(/\D/g, "");
            void correr("Guardando…", async () => {
              await editar({
                data: {
                  id: obra.id,
                  titulo: String(fd.get("titulo") ?? ""),
                  descripcion: String(fd.get("descripcion") ?? ""),
                  precioPropuestoGs: p ? Number(p) : null,
                  variante: (String(fd.get("variante") ?? "") || null) as Variante | null,
                  publico: String(fd.get("publico") ?? ""),
                },
              });
              setAbiertoDatos(false);
            });
          }}
        >
          <Input name="titulo" defaultValue={obra.titulo} maxLength={200} aria-label="Título" className="h-11" />
          <textarea name="descripcion" defaultValue={obra.descripcion} maxLength={2000} rows={3} aria-label="Descripción" className="w-full rounded-md border border-input bg-background px-3 py-2 text-base" />
          <select name="variante" defaultValue={obra.variante ?? ""} aria-label="Lengua de la obra" className={`${select} w-full`}>
            <option value="">¿En qué lengua está?</option>
            {VARIANTES.map((v) => (
              <option key={v} value={v}>{VARIANTE_NOMBRE[v]}</option>
            ))}
          </select>
          <Input name="publico" defaultValue={obra.publico} maxLength={300} aria-label="¿Para quién es?" placeholder="¿Para quién es?" className="h-11" />
          <Input name="precio" inputMode="numeric" defaultValue={obra.precioPropuestoGs ?? ""} aria-label="Precio que proponés (Gs.)" placeholder="Precio que proponés (Gs.)" className="h-11" />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!!ocupado}>Guardar datos</Button>
            <input
              ref={inPortada}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void correr("Subiendo portada…", async () => {
                  const ruta = await subir(await prepararImagen(f), "portada", 0);
                  await editar({ data: { id: obra.id, portadaPath: ruta } });
                });
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={!!ocupado} onClick={() => inPortada.current?.click()}>
              {obra.portadaPath ? "Cambiar portada" : "Subir portada"}
            </Button>
          </div>
        </form>
      )}

      {ocupado && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> {ocupado}
        </p>
      )}
      {aviso && <p className="mt-3 text-sm text-destructive" role="alert">{aviso}</p>}

      <div className="mt-4">
        <EditorPaginas libroId={obra.id} lista={obra.lista} onCambio={onCambio} soloLectura={!obra.editable} />
      </div>
    </section>
  );
}

function Informe({ filas, saldo }: { filas: { mes: string; titulo: string; ventas: number; cobradoGs: number; parteAutorGs: number | null }[]; saldo: SaldoAutor }) {
  return (
    <section className="mt-8" aria-labelledby="t-ventas">
      <h2 id="t-ventas" className="font-display text-xl font-bold text-foreground">Tus ventas</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ventas en línea confirmadas, por mes. Tu parte sale del porcentaje de tu contrato.</p>
      {(saldo.devengadoGs > 0 || saldo.pagadoGs > 0) && (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ["Te corresponde", saldo.devengadoGs],
            ["Ya te pagamos", saldo.pagadoGs],
            ["Por cobrar", saldo.saldoGs],
          ].map(([t, v]) => (
            <div key={t as string} className="rounded-xl bg-muted/60 p-3">
              <dt className="text-xs text-muted-foreground">{t}</dt>
              <dd className="mt-0.5 font-display text-base font-bold text-foreground sm:text-lg">{formatoGs(v as number)}</dd>
            </div>
          ))}
        </dl>
      )}
      {filas.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Todavía no hay ventas.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th scope="col" className="px-3 py-2">Mes</th>
                <th scope="col" className="px-3 py-2">Obra</th>
                <th scope="col" className="px-3 py-2 text-right">Ventas</th>
                <th scope="col" className="px-3 py-2 text-right">Cobrado</th>
                <th scope="col" className="px-3 py-2 text-right">Tu parte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((f) => (
                <tr key={`${f.mes}-${f.titulo}`}>
                  <td className="px-3 py-2 whitespace-nowrap">{nombreMes(f.mes)}</td>
                  <td className="px-3 py-2">{f.titulo}</td>
                  <td className="px-3 py-2 text-right">{f.ventas}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{formatoGs(f.cobradoGs)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{f.parteAutorGs === null ? "A definir" : formatoGs(f.parteAutorGs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** La vitrina pública del autor (jaikuaa.com/autor/…): nombre, presentación y foto. */
function MiVitrina({ vitrina, onCambio }: { vitrina: VitrinaAutor | null; onCambio: () => void }) {
  const guardar = useServerFn(guardarMiVitrina);
  const pedirUrl = useServerFn(urlFotoAutor);
  const guardarFoto = useServerFn(guardarFotoAutor);
  const [abierta, setAbierta] = useState(!vitrina?.slug);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const inFoto = useRef<HTMLInputElement>(null);

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

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4" aria-labelledby="t-vitrina">
      <div className="flex flex-wrap items-center gap-3">
        {vitrina?.fotoUrl ? (
          <img src={vitrina.fotoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-muted" aria-hidden>
            <UserRound className="h-7 w-7 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 id="t-vitrina" className="flex items-center gap-1.5 font-semibold text-foreground">
            <Store className="h-4 w-4" /> Tu vitrina en la Librería
          </h2>
          {vitrina?.slug ? (
            <p className="text-sm text-muted-foreground">
              {vitrina.vitrina ? "Visible en " : "Oculta. Dirección: "}
              <span className="font-medium text-foreground">jaikuaa.com/autor/{vitrina.slug}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Contá quién sos: la gente ve tu presentación y todas tus obras juntas.</p>
          )}
        </div>
        <div className="flex gap-2">
          {vitrina?.slug && vitrina.vitrina && (
            <Button asChild size="sm" variant="outline">
              <Link to="/autor/$slug" params={{ slug: vitrina.slug }}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Ver
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
            <PenLine className="mr-1.5 h-4 w-4" /> Editar
          </Button>
        </div>
      </div>

      {abierta && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void correr("Guardando tu vitrina…", async () => {
              await guardar({
                data: { nombre: String(fd.get("nombre") ?? ""), bio: String(fd.get("bio") ?? ""), vitrina: fd.get("visible") === "on" },
              });
              setAbierta(false);
            });
          }}
        >
          <Input name="nombre" defaultValue={vitrina?.nombre ?? ""} required minLength={2} maxLength={120} aria-label="Tu nombre como autor" placeholder="Tu nombre como autor (o el de tu editorial)" className="h-11" />
          <textarea
            name="bio"
            defaultValue={vitrina?.bio ?? ""}
            maxLength={1500}
            rows={4}
            aria-label="Tu presentación"
            placeholder="Tu presentación: quién sos, qué enseñás o escribís, dónde trabajás."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="visible" defaultChecked={vitrina?.vitrina ?? true} className="h-5 w-5" /> Que mi vitrina se vea en la Librería
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!!ocupado}>Guardar vitrina</Button>
            <input
              ref={inFoto}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                void correr("Subiendo tu foto…", async () => {
                  const img = await prepararImagen(f);
                  const mime = (img.type || "image/webp") as "image/webp" | "image/jpeg" | "image/png";
                  const u = await pedirUrl({ data: { mime } });
                  const { error } = await supabase.storage.from("libros").uploadToSignedUrl(u.path, u.token, img, { contentType: mime });
                  if (error) throw new Error(error.message);
                  await guardarFoto({ data: { ruta: u.ruta } });
                });
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={!!ocupado} onClick={() => inFoto.current?.click()}>
              <Camera className="mr-1.5 h-4 w-4" /> {vitrina?.fotoUrl ? "Cambiar foto" : "Subir foto"}
            </Button>
          </div>
        </form>
      )}
      {ocupado && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> {ocupado}
        </p>
      )}
      {aviso && <p className="mt-2 text-sm text-destructive" role="alert">{aviso}</p>}
    </section>
  );
}
