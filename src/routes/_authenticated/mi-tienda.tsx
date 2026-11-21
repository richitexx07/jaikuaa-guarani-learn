import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, ExternalLink, Loader2, MessageCircle, PackagePlus, PenLine, Send, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  borrarProducto,
  crearProducto,
  enviarProductoARevision,
  marcarPedidoVendedor,
  miTienda,
  type PedidoTienda,
  type ProductoTienda,
} from "@/lib/mercado.functions";
import { CATEGORIAS_PRODUCTO, CATEGORIA_NOMBRE, ENTREGAS, ENTREGA_NOMBRE, type CategoriaProducto, type Entrega } from "@/lib/mercado";
import { ESTADO_NOMBRE } from "@/lib/obras";
import { formatoGs } from "@/lib/pagopar";
import { CabeceraMercado, MC as C } from "@/components/mercado/partes";
import { EditorProducto } from "@/components/mercado/editor-producto";

/**
 * «Mi tienda»: el panel de cada vendedor del Mercado. Pedidos por atender, sus productos (cargar, fotos, mandar a
 * revisión) y cuánto le corresponde. Publicar, el porcentaje y la autorización firmada los define Jaikuaa.
 */
export const Route = createFileRoute("/_authenticated/mi-tienda")({
  head: () => ({ meta: [{ title: "Mi tienda — Mercado Jaikuaa" }, { name: "robots", content: "noindex" }] }),
  component: MiTiendaPage,
});

const select = "h-11 rounded-lg border border-input bg-background px-2 text-base";
const ESTADO_COLOR = {
  borrador: "bg-muted text-muted-foreground",
  en_revision: "bg-amber-100 text-amber-900",
  observado: "bg-orange-100 text-orange-900",
  aprobado: "bg-emerald-100 text-emerald-900",
} as const;

function MiTiendaPage() {
  const cargar = useServerFn(miTienda);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["mi-tienda"], queryFn: () => cargar(), retry: false });
  const refrescar = () => void qc.invalidateQueries({ queryKey: ["mi-tienda"] });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F6F3EC" }}>
      <CabeceraMercado />
      <main className="mercado-claro mx-auto w-full max-w-4xl flex-1 px-3 pb-16 pt-5 sm:px-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: C.tinta }}>Mi tienda</h1>
        {isLoading && <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>}
        {error && <p className="mt-6 text-sm text-destructive">No pudimos cargar tu tienda. Probá de nuevo en un rato.</p>}
        {data?.estado === "no-vendedor" && (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <p className="font-semibold" style={{ color: C.tinta }}>Todavía no vendés en el Mercado.</p>
            <p className="mt-1 text-sm text-muted-foreground">Postulate: te escribimos por WhatsApp, firmamos la autorización y te habilitamos este panel.</p>
            <Link to="/mercado/vender" hash="postular" className="mt-3 inline-block rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>Quiero vender</Link>
          </div>
        )}
        {data?.estado === "ok" && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Mba'éichapa, {data.nombre || "vendedor"}. Cargá tus productos con buenas fotos, mandalos a revisión y atendé tus pedidos.</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Te corresponde", formatoGs(data.saldo.devengadoGs)],
                ["Ya te pagamos", formatoGs(data.saldo.pagadoGs)],
                ["Por cobrar", formatoGs(data.saldo.saldoGs)],
              ].map(([t, v]) => (
                <div key={t} className="rounded-2xl bg-white p-3 shadow-sm">
                  <dt className="text-xs text-muted-foreground">{t}</dt>
                  <dd className="mt-0.5 font-display text-base font-bold sm:text-lg" style={{ color: C.tinta }}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              ¿También escribís libros o módulos?{" "}
              <Link to="/mis-obras" className="inline-flex items-center gap-1 font-semibold underline" style={{ color: C.azul }}>
                <BookOpen className="h-3.5 w-3.5" /> Cargalos en Mis obras
              </Link>
            </p>
            <Pedidos pedidos={data.pedidos} onCambio={refrescar} />
            <NuevoProducto onCreado={refrescar} />
            <section className="mt-6 space-y-4" aria-label="Mis productos">
              {data.productos.map((p) => (
                <ProductoPanel key={p.id} p={p} onCambio={refrescar} />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Pedidos({ pedidos, onCambio }: { pedidos: PedidoTienda[]; onCambio: () => void }) {
  const marcar = useServerFn(marcarPedidoVendedor);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const pendientes = pedidos.filter((p) => p.estado === "por_enviar" || p.estado === "enviado");
  if (pedidos.length === 0) return null;
  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="t-ped">
      <h2 id="t-ped" className="flex items-center gap-2 font-semibold" style={{ color: C.tinta }}>
        <Truck className="h-4 w-4" /> Pedidos por atender
        {pendientes.length > 0 && <span className="rounded-full bg-amber-100 px-2 text-xs font-bold text-amber-900">{pendientes.length}</span>}
      </h2>
      {pendientes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Estás al día.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {pendientes.map((p) => {
            const tel = p.telefono.replace(/\D/g, "").replace(/^0/, "595");
            const servicio = p.entrega !== "fisico";
            return (
              <li key={p.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                <p className="font-semibold">{p.titulo}{p.cantidad > 1 ? ` ×${p.cantidad}` : ""}</p>
                <p>{p.nombre} · {p.telefono}</p>
                {!servicio ? <p className="text-muted-foreground">{p.direccion}, {p.ciudad}{p.referencia ? ` (${p.referencia})` : ""}</p> : p.referencia && <p className="text-muted-foreground">{p.referencia}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                    <MessageCircle className="h-3.5 w-3.5" /> Escribirle
                  </a>
                  <Button
                    size="sm"
                    disabled={ocupado === p.id}
                    onClick={async () => {
                      setOcupado(p.id);
                      try {
                        await marcar({ data: { id: p.id, estado: p.estado === "por_enviar" ? "enviado" : "entregado" } });
                        onCambio();
                      } finally {
                        setOcupado(null);
                      }
                    }}
                  >
                    {p.estado === "por_enviar" ? (servicio ? "Ya coordinamos" : "Ya lo envié") : servicio ? "Ya se realizó" : "Ya lo recibió"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NuevoProducto({ onCreado }: { onCreado: () => void }) {
  const crear = useServerFn(crearProducto);
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<CategoriaProducto>("artesania");
  const [entrega, setEntrega] = useState<Entrega>("fisico");
  const m = useMutation({
    mutationFn: () => crear({ data: { titulo, categoria, entrega, descripcion: "", precioGs: null, precioAnteriorGs: null, stock: null, ciudad: "", lugar: "", fechaEvento: null, duracion: "", envio: "" } }),
    onSuccess: () => {
      setTitulo("");
      setAbierto(false);
      onCreado();
    },
  });
  if (!abierto)
    return (
      <Button className="mt-6" onClick={() => setAbierto(true)}>
        <PackagePlus className="mr-1.5 h-4 w-4" /> Nuevo producto
      </Button>
    );
  return (
    <form
      className="mt-6 space-y-2 rounded-2xl bg-white p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (titulo.trim()) m.mutate();
      }}
    >
      <p className="font-semibold" style={{ color: C.tinta }}>Nuevo producto</p>
      <Input placeholder="Nombre del producto" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} className="h-11" />
      <div className="grid gap-2 sm:grid-cols-2">
        <select aria-label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaProducto)} className={select}>
          {CATEGORIAS_PRODUCTO.map((c) => (
            <option key={c} value={c}>{CATEGORIA_NOMBRE[c]}</option>
          ))}
        </select>
        <select aria-label="Cómo se entrega" value={entrega} onChange={(e) => setEntrega(e.target.value as Entrega)} className={select}>
          {ENTREGAS.map((x) => (
            <option key={x} value={x}>{ENTREGA_NOMBRE[x]}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!titulo.trim() || m.isPending}>{m.isPending ? "Creando…" : "Crear y completar"}</Button>
        <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
      {m.error && <p className="text-sm text-destructive">{m.error instanceof Error ? m.error.message : "No se pudo crear."}</p>}
    </form>
  );
}

function ProductoPanel({ p, onCambio }: { p: ProductoTienda; onCambio: () => void }) {
  const enviar = useServerFn(enviarProductoARevision);
  const borrar = useServerFn(borrarProducto);
  const [abierto, setAbierto] = useState(p.editable && p.estado_revision === "borrador" && p.fotos.length === 0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
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
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: C.azul }}>
          {p.fotos[0] && <img src={p.fotos[0].url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: C.papel, color: C.tinta }}>{CATEGORIA_NOMBRE[p.categoria]}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ESTADO_COLOR[p.estado_revision]}`}>{p.publicado ? "Publicado" : ESTADO_NOMBRE[p.estado_revision]}</span>
          </div>
          <h2 className="mt-1 font-semibold" style={{ color: C.tinta }}>{p.titulo}</h2>
          <p className="text-xs text-muted-foreground">
            {p.precio_gs ? formatoGs(p.precio_gs) : p.entrega === "cotizacion" ? "A cotizar" : "Sin precio"}
            {p.stock !== null ? ` · ${p.stock} disponibles` : ""} · {p.ventas} {p.ventas === 1 ? "venta" : "ventas"}
            {p.porcentaje_vendedor !== null ? ` · Tu parte: ${p.porcentaje_vendedor}%` : ""}
          </p>
        </div>
      </div>
      {p.estado_revision === "observado" && p.nota_revision && (
        <p className="mt-3 rounded-xl border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900"><span className="font-semibold">Te pedimos estos cambios:</span> {p.nota_revision}</p>
      )}
      {p.estado_revision === "en_revision" && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Lo estamos revisando. Mirá esta página para ver si ya está publicado o si te pedimos algún cambio.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {p.publicado && (
          <Button asChild size="sm" variant="outline">
            <Link to="/mercado/$tipo/$id" params={{ tipo: "producto", id: p.id }}><ExternalLink className="mr-1.5 h-4 w-4" /> Ver en el Mercado</Link>
          </Button>
        )}
        {p.editable && (
          <>
            <Button size="sm" variant="outline" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}><PenLine className="mr-1.5 h-4 w-4" /> Editar</Button>
            <Button
              size="sm"
              disabled={ocupado}
              onClick={() => {
                if (window.confirm("¿Mandar a revisión? Mientras lo revisamos no se puede cambiar.")) void correr(() => enviar({ data: { id: p.id } }));
              }}
            >
              <Send className="mr-1.5 h-4 w-4" /> Mandar a revisión
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={ocupado}
              onClick={() => {
                if (window.confirm(`¿Borrar «${p.titulo}»? No se puede deshacer.`)) void correr(() => borrar({ data: { id: p.id } }));
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Borrar
            </Button>
          </>
        )}
      </div>
      {aviso && <p className="mt-2 text-sm text-destructive" role="alert">{aviso}</p>}
      {abierto && p.editable && (
        <div className="mt-4 border-t border-border pt-4">
          <EditorProducto p={p} onCambio={onCambio} />
        </div>
      )}
    </article>
  );
}
