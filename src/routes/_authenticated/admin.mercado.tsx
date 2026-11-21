import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, MessageSquareWarning, PackagePlus, PenLine, Star, Tag, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminMercado,
  crearProducto,
  decidirProducto,
  editarProducto,
  guardarCupon,
  resolverPostulacion,
  vitrinasParaEnlazar,
  type PostulacionAdmin,
  type ProductoTienda,
} from "@/lib/mercado.functions";
import { CATEGORIAS_PRODUCTO, CATEGORIA_NOMBRE, ENTREGAS, ENTREGA_NOMBRE, type CategoriaProducto, type Cupon, type Entrega } from "@/lib/mercado";
import { ESTADO_NOMBRE } from "@/lib/obras";
import { formatoGs } from "@/lib/pagopar";
import { BrandLogo } from "@/components/brand-logo";
import { EditorProducto } from "@/components/mercado/editor-producto";
import { PanelTienda } from "@/components/libreria/admin-tienda";

/**
 * Panel del Mercado (solo administrador): postulaciones de vendedores, revisión y publicación de productos
 * (con autorización firmada y porcentaje del vendedor), productos cargados por Jaikuaa para artesanos o artistas sin
 * cuenta, enlace con Tembiapo y Purahéi, cupones, pedidos por atender y reparto.
 */
export const Route = createFileRoute("/_authenticated/admin/mercado")({
  head: () => ({ meta: [{ title: "Jaikuaa — Mercado: administrar" }, { name: "robots", content: "noindex" }] }),
  component: AdminMercadoPage,
});

const select = "h-10 rounded-lg border border-input bg-background px-2 text-base";

function AdminMercadoPage() {
  const cargar = useServerFn(adminMercado);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-mercado"], queryFn: () => cargar(), retry: false });
  const refrescar = () => void qc.invalidateQueries({ queryKey: ["admin-mercado"] });
  const [filtro, setFiltro] = useState<"revision" | "todos">("revision");
  const productos = (data?.productos ?? []).filter((p) => filtro === "todos" || p.estado_revision === "en_revision");
  const enRevision = (data?.productos ?? []).filter((p) => p.estado_revision === "en_revision").length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard"><BrandLogo withWordmark={false} /></Link>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/mercado">Ver el Mercado</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/libros">Librería</Link></Button>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Mercado: administrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aprobás vendedores, revisás y publicás sus productos, cargás productos para artesanos o artistas sin cuenta y creás cupones. Nada se publica sin la autorización escrita del vendedor.
          </p>
          {isLoading && <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>}
          {error && <p className="mt-6 text-sm text-destructive">Solo el administrador puede ver esta página.</p>}
          {data && (
            <>
              <Postulaciones lista={data.postulaciones} onCambio={refrescar} />
              <NuevoProductoJaikuaa onCreado={refrescar} />
              <section className="mt-6" aria-labelledby="t-prods">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="t-prods" className="mr-auto font-semibold text-foreground">Productos</h2>
                  <Button size="sm" variant={filtro === "revision" ? "default" : "outline"} onClick={() => setFiltro("revision")}>En revisión ({enRevision})</Button>
                  <Button size="sm" variant={filtro === "todos" ? "default" : "outline"} onClick={() => setFiltro("todos")}>Todos ({data.productos.length})</Button>
                </div>
                {productos.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{filtro === "revision" ? "No hay productos esperando revisión." : "Todavía no hay productos."}</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {productos.map((p) => (
                      <ProductoAdmin key={p.id} p={p} onCambio={refrescar} />
                    ))}
                  </div>
                )}
              </section>
              <Cupones lista={data.cupones} onCambio={refrescar} />
              <PanelTienda />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Postulaciones({ lista, onCambio }: { lista: PostulacionAdmin[]; onCambio: () => void }) {
  const resolver = useServerFn(resolverPostulacion);
  const [ocupado, setOcupado] = useState<string | null>(null);
  if (lista.length === 0) return null;
  return (
    <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4" aria-labelledby="t-post">
      <h2 id="t-post" className="font-semibold text-amber-900">Quieren vender ({lista.length})</h2>
      <ul className="mt-3 space-y-2">
        {lista.map((x) => {
          const tel = x.whatsapp.replace(/\D/g, "").replace(/^0/, "595");
          return (
            <li key={x.id} className="rounded-xl bg-white p-3 text-sm">
              <p className="font-semibold text-foreground">{x.nombre} <span className="font-normal text-muted-foreground">· {x.categoria === "libreria" ? "Libros, módulos o cursos" : CATEGORIA_NOMBRE[x.categoria as CategoriaProducto] ?? x.categoria}{x.ciudad ? ` · ${x.ciudad}` : ""}</span></p>
              <p className="text-muted-foreground">{x.correo} · {x.whatsapp}</p>
              {x.descripcion && <p className="mt-1 whitespace-pre-line text-foreground/85">{x.descripcion}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" /> Escribirle</a>
                <Button
                  size="sm"
                  disabled={ocupado === x.id}
                  onClick={async () => {
                    if (!window.confirm(`¿Habilitar a ${x.nombre} como vendedor? Hacelo cuando ya tengas su autorización firmada.`)) return;
                    setOcupado(x.id);
                    try {
                      await resolver({ data: { id: x.id, aprobar: true, nota: "" } });
                      onCambio();
                    } finally {
                      setOcupado(null);
                    }
                  }}
                >
                  <UserCheck className="mr-1.5 h-4 w-4" /> Habilitar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={ocupado === x.id}
                  onClick={async () => {
                    const nota = window.prompt("Motivo (lo ve la persona):", "") ?? "";
                    setOcupado(x.id);
                    try {
                      await resolver({ data: { id: x.id, aprobar: false, nota } });
                      onCambio();
                    } finally {
                      setOcupado(null);
                    }
                  }}
                >
                  <UserX className="mr-1.5 h-4 w-4" /> No por ahora
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function NuevoProductoJaikuaa({ onCreado }: { onCreado: () => void }) {
  const crear = useServerFn(crearProducto);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!abierto)
    return (
      <Button className="mt-6" variant="outline" onClick={() => setAbierto(true)}>
        <PackagePlus className="mr-1.5 h-4 w-4" /> Cargar producto de un artesano o artista sin cuenta
      </Button>
    );
  return (
    <form
      className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setAviso(null);
        try {
          await crear({
            data: {
              titulo: String(fd.get("titulo") ?? ""),
              categoria: String(fd.get("categoria")) as CategoriaProducto,
              entrega: String(fd.get("entrega")) as Entrega,
              vendedorNombre: String(fd.get("vendedor") ?? ""),
              descripcion: "", precioGs: null, precioAnteriorGs: null, stock: null, ciudad: "", lugar: "", fechaEvento: null, duracion: "", envio: "",
            },
          });
          setAbierto(false);
          onCreado();
        } catch (err) {
          setAviso(err instanceof Error ? err.message : "No se pudo crear.");
        }
      }}
    >
      <p className="font-semibold">Producto cargado por Jaikuaa</p>
      <p className="text-xs text-muted-foreground">Para quien no tiene cuenta: el reparto con esa persona lo llevás aparte.</p>
      <Input name="titulo" required maxLength={160} placeholder="Nombre del producto" />
      <Input name="vendedor" required maxLength={120} placeholder="Quién lo hace (ej. nombre del maestro artesano)" />
      <div className="flex flex-wrap gap-2">
        <select name="categoria" className={select} defaultValue="artesania">
          {CATEGORIAS_PRODUCTO.map((c) => <option key={c} value={c}>{CATEGORIA_NOMBRE[c]}</option>)}
        </select>
        <select name="entrega" className={select} defaultValue="fisico">
          {ENTREGAS.map((x) => <option key={x} value={x}>{ENTREGA_NOMBRE[x]}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Crear</Button>
        <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
      {aviso && <p className="text-sm text-destructive">{aviso}</p>}
    </form>
  );
}

function ProductoAdmin({ p, onCambio }: { p: ProductoTienda; onCambio: () => void }) {
  const decidir = useServerFn(decidirProducto);
  const editar = useServerFn(editarProducto);
  const vitrinas = useServerFn(vitrinasParaEnlazar);
  const [editando, setEditando] = useState(false);
  const [enlazando, setEnlazando] = useState(false);
  const [nota, setNota] = useState(p.nota_revision);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { data: opciones } = useQuery({ queryKey: ["vitrinas-enlazar"], queryFn: () => vitrinas(), enabled: enlazando, staleTime: 5 * 60_000 });

  async function correr(fn: () => Promise<unknown>) {
    setOcupado(true);
    setAviso(null);
    try {
      await fn();
      onCambio();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Algo falló.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">{p.fotos[0] && <img src={p.fotos[0].url} alt="" className="h-full w-full object-cover" />}</div>
        <div className="min-w-0 flex-1 text-sm">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{CATEGORIA_NOMBRE[p.categoria]} · {ENTREGA_NOMBRE[p.entrega]}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{p.publicado ? "Publicado" : ESTADO_NOMBRE[p.estado_revision]}</span>
            {p.destacado && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Destacado</span>}
          </div>
          <h3 className="mt-1 font-semibold text-foreground">{p.titulo}</h3>
          <p className="text-muted-foreground">
            {p.vendedor_nombre || "Sin nombre"} · {p.precio_gs ? formatoGs(p.precio_gs) : p.entrega === "cotizacion" ? "A cotizar" : "sin precio"} · {p.fotos.length} fotos
            {p.stock !== null ? ` · stock ${p.stock}` : ""}
            {p.ref_pieza ? " · enlazado a Tembiapo" : ""}
            {p.ref_artista ? " · enlazado a Purahéi" : ""}
          </p>
          {p.descripcion && <p className="mt-1 line-clamp-3 text-foreground/80">{p.descripcion}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={p.autorizacion_firmada}
            disabled={ocupado}
            onChange={(e) => void correr(() => decidir({ data: { id: p.id, autorizacionFirmada: e.target.checked } }))}
          />
          <span className="font-semibold">Autorización escrita firmada</span>
        </label>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = String(new FormData(e.currentTarget).get("pct") ?? "").replace(/\D/g, "");
            void correr(() => decidir({ data: { id: p.id, porcentajeVendedor: v ? Math.min(100, Number(v)) : null } }));
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="font-semibold">% del vendedor</span>
            <input name="pct" inputMode="numeric" defaultValue={p.porcentaje_vendedor ?? ""} placeholder="Ej. 80" className="h-10 w-24 rounded-lg border border-input bg-background px-2 text-base" />
          </label>
          <Button type="submit" size="sm" variant="secondary" disabled={ocupado}>Guardar</Button>
        </form>
      </div>

      {(p.estado_revision === "en_revision" || p.estado_revision === "observado") && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={2000} placeholder="Qué tiene que corregir (si pedís cambios)" aria-label="Nota para el vendedor" className="w-full rounded-md border border-input bg-background px-3 py-2 text-base" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" disabled={ocupado} onClick={() => void correr(() => decidir({ data: { id: p.id, estadoRevision: "aprobado", notaRevision: "" } }))}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Aprobar</Button>
            <Button size="sm" variant="outline" disabled={ocupado || !nota.trim()} onClick={() => void correr(() => decidir({ data: { id: p.id, estadoRevision: "observado", notaRevision: nota } }))}><MessageSquareWarning className="mr-1.5 h-4 w-4" /> Pedir cambios</Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={p.publicado ? "outline" : "default"}
          disabled={ocupado || (!p.publicado && !p.autorizacion_firmada)}
          title={!p.publicado && !p.autorizacion_firmada ? "Primero marcá la autorización firmada" : undefined}
          onClick={() => void correr(() => decidir({ data: { id: p.id, publicado: !p.publicado } }))}
        >
          {p.publicado ? "Sacar del Mercado" : "Publicar"}
        </Button>
        <Button size="sm" variant="outline" disabled={ocupado} onClick={() => void correr(() => decidir({ data: { id: p.id, destacado: !p.destacado } }))}>
          <Star className="mr-1.5 h-4 w-4" /> {p.destacado ? "Quitar de destacados" : "Destacar"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditando((v) => !v)} aria-expanded={editando}><PenLine className="mr-1.5 h-4 w-4" /> Editar</Button>
        <Button size="sm" variant="outline" onClick={() => setEnlazando((v) => !v)} aria-expanded={enlazando}>Enlazar con Tembiapo o Purahéi</Button>
        {p.publicado && (
          <Button asChild size="sm" variant="ghost"><Link to="/mercado/$tipo/$id" params={{ tipo: "producto", id: p.id }}><ExternalLink className="mr-1.5 h-4 w-4" /> Ver</Link></Button>
        )}
      </div>
      {aviso && <p className="mt-2 text-sm text-destructive" role="alert">{aviso}</p>}

      {enlazando && (
        <div className="mt-3 grid gap-2 rounded-xl bg-muted/50 p-3 text-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Pieza de Tembiapo (copia sus fotos si este producto no tiene)</span>
            <select
              className={select}
              value={p.ref_pieza ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                const pieza = opciones?.piezas.find((x) => x.id === id);
                void correr(async () => {
                  await decidir({ data: { id: p.id, refPieza: id } });
                  if (pieza && p.fotos.length === 0 && pieza.fotos.length) await editar({ data: { id: p.id, fotos: pieza.fotos.slice(0, 8) } });
                });
              }}
            >
              <option value="">Ninguna</option>
              {opciones?.piezas.map((x) => <option key={x.id} value={x.id}>{x.titulo}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Artista de Purahéi</span>
            <select className={select} value={p.ref_artista ?? ""} onChange={(e) => void correr(() => decidir({ data: { id: p.id, refArtista: e.target.value || null } }))}>
              <option value="">Ninguno</option>
              {opciones?.artistas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </label>
          {!p.vendedor_id && (
            <form
              className="flex items-end gap-2 sm:col-span-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = String(new FormData(e.currentTarget).get("v") ?? "");
                void correr(() => decidir({ data: { id: p.id, vendedorNombre: v } }));
              }}
            >
              <label className="flex flex-1 flex-col gap-1">
                <span className="font-semibold">Nombre que se muestra como vendedor</span>
                <Input name="v" defaultValue={p.vendedor_nombre} maxLength={120} />
              </label>
              <Button size="sm" type="submit" variant="secondary">Guardar</Button>
            </form>
          )}
        </div>
      )}

      {editando && (
        <div className="mt-4 border-t border-border pt-4">
          <EditorProducto p={p} onCambio={onCambio} />
        </div>
      )}
    </article>
  );
}

function Cupones({ lista, onCambio }: { lista: Cupon[]; onCambio: () => void }) {
  const guardar = useServerFn(guardarCupon);
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4" aria-labelledby="t-cup">
      <h2 id="t-cup" className="flex items-center gap-1.5 font-semibold text-foreground"><Tag className="h-4 w-4" /> Cupones de descuento</h2>
      <form
        className="mt-3 flex flex-wrap items-end gap-2 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const n = (k: string) => {
            const v = String(fd.get(k) ?? "").replace(/\D/g, "");
            return v ? Number(v) : null;
          };
          const vence = String(fd.get("vence") ?? "");
          setAviso(null);
          try {
            await guardar({ data: { codigo: String(fd.get("codigo") ?? ""), porcentaje: n("pct") ?? 10, vence: vence || null, usosMax: n("usos"), activo: true } });
            form.reset();
            onCambio();
          } catch (err) {
            setAviso(err instanceof Error ? err.message : "No se pudo guardar.");
          }
        }}
      >
        <label className="flex flex-col gap-1"><span className="font-semibold">Código</span><Input name="codigo" required placeholder="LANZAMIENTO" className="h-10 w-40 uppercase" /></label>
        <label className="flex flex-col gap-1"><span className="font-semibold">% de descuento</span><Input name="pct" inputMode="numeric" required placeholder="10" className="h-10 w-24" /></label>
        <label className="flex flex-col gap-1"><span className="font-semibold">Vence (opcional)</span><Input type="date" name="vence" className="h-10" /></label>
        <label className="flex flex-col gap-1"><span className="font-semibold">Usos máximos (opcional)</span><Input name="usos" inputMode="numeric" className="h-10 w-28" /></label>
        <Button type="submit" size="sm">Crear cupón</Button>
      </form>
      {aviso && <p className="mt-2 text-sm text-destructive">{aviso}</p>}
      {lista.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {lista.map((c) => (
            <li key={c.codigo} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span>
                <span className="font-mono font-semibold">{c.codigo}</span> · {c.porcentaje}% · {c.usos} {c.usos === 1 ? "uso" : "usos"}
                {c.usosMax ? ` de ${c.usosMax}` : ""}
                {c.vence ? ` · vence ${c.vence}` : ""}
                {!c.activo && <span className="font-semibold text-amber-700"> · pausado</span>}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await guardar({ data: { codigo: c.codigo, porcentaje: c.porcentaje, vence: c.vence, usosMax: c.usosMax, activo: !c.activo } });
                  onCambio();
                }}
              >
                {c.activo ? "Pausar" : "Activar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
