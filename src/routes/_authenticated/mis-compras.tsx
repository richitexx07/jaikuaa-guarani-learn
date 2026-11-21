import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, Download, Heart, Loader2, Package, Star } from "lucide-react";
import { toast } from "sonner";
import { descargarProducto, misCompras, misFavoritos, type CompraLinea } from "@/lib/mercado.functions";
import { ESTADO_PEDIDO_NOMBRE } from "@/lib/obras";
import { formatoGs } from "@/lib/pagopar";
import { CabeceraMercado, Grilla, MC as C } from "@/components/mercado/partes";

/** «Mis compras»: todo lo comprado en el Mercado y la Librería, con su estado, y los favoritos. */
export const Route = createFileRoute("/_authenticated/mis-compras")({
  head: () => ({ meta: [{ title: "Mis compras — Jaikuaa" }, { name: "robots", content: "noindex" }] }),
  component: MisComprasPage,
});

function MisComprasPage() {
  const [pestana, setPestana] = useState<"compras" | "favoritos">("compras");
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F6F3EC" }}>
      <CabeceraMercado />
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 pb-16 pt-5 sm:px-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: C.tinta }}>Mis compras</h1>
        <div role="tablist" aria-label="Secciones" className="mt-3 flex gap-2">
          {(["compras", "favoritos"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={pestana === t}
              onClick={() => setPestana(t)}
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={pestana === t ? { background: C.tinta, color: "#fff" } : { background: "#fff", color: C.tinta }}
            >
              {t === "compras" ? "Compras" : "Favoritos"}
            </button>
          ))}
        </div>
        {pestana === "compras" ? <Compras /> : <Favoritos />}
      </main>
    </div>
  );
}

function Compras() {
  const cargar = useServerFn(misCompras);
  const bajar = useServerFn(descargarProducto);
  const { data, isLoading } = useQuery({
    queryKey: ["mis-compras"],
    queryFn: () => cargar(),
    refetchInterval: (q) => (q.state.data?.compras.some((c) => c.estado === "pendiente") ? 8000 : false),
  });
  const compras = data?.compras ?? [];
  if (isLoading) return <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>;
  if (compras.length === 0)
    return (
      <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
        <Package className="mx-auto h-10 w-10" style={{ color: C.azul }} aria-hidden />
        <p className="mt-3 font-semibold" style={{ color: C.tinta }}>Todavía no compraste nada</p>
        <Link to="/mercado" className="mt-3 inline-block rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>Ir al Mercado</Link>
      </div>
    );
  return (
    <ul className="mt-4 space-y-3">
      {compras.map((c) => (
        <li key={c.pagoId} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold" style={{ color: C.tinta }}>{c.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(c.fecha).toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" })} · {formatoGs(c.montoGs)}
                {c.prueba ? " · prueba" : ""}
              </p>
            </div>
            <Estado c={c} />
          </div>
          {c.estado === "pagado" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {c.tipo === "obra" && c.entrega === "lectura" && (
                <Link to="/leer/$id" params={{ id: c.id }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold" style={{ background: C.tinta, color: "#fff" }}>
                  <BookOpen className="h-4 w-4" /> Leer
                </Link>
              )}
              {c.descargable && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const r = await bajar({ data: { id: c.id } });
                      window.location.href = r.url;
                    } catch {
                      toast.error("No se pudo descargar. Probá de nuevo.");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold"
                  style={{ background: C.tinta, color: "#fff" }}
                >
                  <Download className="h-4 w-4" /> Descargar
                </button>
              )}
              <Link to="/mercado/$tipo/$id" params={{ tipo: c.tipo, id: c.id }} hash="opiniones" className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-sm font-semibold" style={{ color: C.tinta }}>
                <Star className="h-4 w-4" /> Opinar
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Estado({ c }: { c: CompraLinea }) {
  let texto = "Pagado";
  let color = "bg-emerald-100 text-emerald-900";
  if (c.estado === "pendiente") {
    texto = "Esperando el pago";
    color = "bg-muted text-muted-foreground";
  } else if (c.pedido) {
    const servicio = c.entrega === "servicio" || c.entrega === "experiencia";
    texto =
      c.pedido.estado === "por_enviar"
        ? servicio ? "Pagado: te contactamos para coordinar" : "Pagado: preparando el envío"
        : c.pedido.estado === "enviado"
          ? servicio ? "Coordinado" : "En camino"
          : c.pedido.estado === "entregado"
            ? servicio ? "Realizado" : "Entregado"
            : ESTADO_PEDIDO_NOMBRE[c.pedido.estado];
    color = c.pedido.estado === "entregado" ? "bg-emerald-100 text-emerald-900" : c.pedido.estado === "cancelado" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-900";
  }
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>{texto}</span>;
}

function Favoritos() {
  const cargar = useServerFn(misFavoritos);
  const { data, isLoading } = useQuery({ queryKey: ["mis-favoritos"], queryFn: () => cargar() });
  if (isLoading) return <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>;
  if (!data?.items.length)
    return (
      <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
        <Heart className="mx-auto h-10 w-10" style={{ color: C.rojo }} aria-hidden />
        <p className="mt-3 font-semibold" style={{ color: C.tinta }}>Todavía no guardaste favoritos</p>
        <p className="mt-1 text-sm text-muted-foreground">Tocá «Favorito» en cualquier producto para tenerlo a mano.</p>
      </div>
    );
  return (
    <div className="mt-4">
      <Grilla items={data.items} />
    </div>
  );
}
