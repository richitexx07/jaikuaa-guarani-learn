import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { verPago } from "@/lib/pagos.functions";
import { verOrden } from "@/lib/mercado.functions";
import { formatoGs } from "@/lib/pagopar";
import { obraParaLeer } from "@/lib/pagos";

export const Route = createFileRoute("/_authenticated/pagos/$ref")({
  head: () => ({
    meta: [
      { title: "Tu pago — Jaikuaa" },
      { name: "description", content: "Estado de tu compra en Jaikuaa." },
      { property: "og:title", content: "Tu pago — Jaikuaa" },
      { property: "og:description", content: "Estado de tu compra en la Librería Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Resultado,
});

function Resultado() {
  const { ref } = Route.useParams();
  const ver = useServerFn(verPago);
  const verO = useServerFn(verOrden);
  // El aviso de Pagopar puede llegar unos segundos después: se vuelve a mirar mientras siga pendiente.
  // El pedido puede ser una compra suelta de la Librería o una orden del carrito del Mercado.
  const { data, isLoading } = useQuery({
    queryKey: ["pago", ref],
    queryFn: async () => {
      const [a, b] = await Promise.all([ver({ data: { ref } }), verO({ data: { ref } })]);
      if (a.pago) return { pago: a.pago, orden: null };
      if (b.orden) {
        const unicoItem = b.orden.items.length === 1 ? b.orden.items[0] : undefined;
        return {
          orden: b.orden,
          pago: {
            id: b.orden.id,
            ref_id: unicoItem?.ref_id ?? "",
            item_tipo: unicoItem?.item_tipo ?? "",
            formato: unicoItem?.formato ?? "",
            descripcion: unicoItem?.descripcion ?? `${b.orden.items.length} productos del Mercado`,
            monto_gs: b.orden.totalGs,
            estado: b.orden.estado,
            modo: b.orden.modo,
          },
        };
      }
      return { pago: null, orden: null };
    },
    refetchInterval: (q) => (q.state.data?.pago?.estado === "pendiente" ? 4000 : false),
  });
  const p = data?.pago;
  const esOrden = !!data?.orden;
  const lecturaId = obraParaLeer(p);

  return (
    <main className="mx-auto max-w-md px-4 py-12 pb-28 text-center">
      {isLoading ? (
        <p className="text-muted-foreground">Mirando tu pago…</p>
      ) : !p ? (
        <p className="text-muted-foreground">No encontramos este pago en tu cuenta.</p>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
          {p.estado === "pagado" ? <CheckCircle2 className="mx-auto h-14 w-14 text-primary" /> : p.estado === "pendiente" ? <Clock className="mx-auto h-14 w-14 text-muted-foreground" /> : <XCircle className="mx-auto h-14 w-14 text-destructive" />}
          <h1 className="mt-3 font-display text-2xl font-bold text-foreground">
            {p.estado === "pagado" ? "¡Listo, ya es tuyo!" : p.estado === "pendiente" ? "Esperando la confirmación del pago" : "El pago no se completó"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{p.descripcion} · {formatoGs(p.monto_gs)}</p>
          {p.estado === "pagado" && p.item_tipo === "obra" && p.formato === "fisico" && (
            <p className="mt-2 text-sm text-muted-foreground">Compraste la edición impresa. Podés ver el estado del envío en Mis compras; esta compra no incluye acceso digital.</p>
          )}
          {p.modo === "prueba" && <p className="mt-2 text-xs font-semibold text-muted-foreground">Compra de prueba (sin cobro real)</p>}
          <div className="mt-5 flex flex-col gap-2">
            {lecturaId && (
              <Link to="/leer/$id" params={{ id: lecturaId }} className="rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground">Leer ahora</Link>
            )}
            <Link to="/mis-compras" className={`rounded-2xl px-4 py-3 font-semibold ${p.estado === "pagado" && !lecturaId ? "bg-primary text-primary-foreground" : "border border-border text-foreground"}`}>Mis compras</Link>
            <Link to={esOrden ? "/mercado" : "/libreria"} className="text-sm font-semibold text-primary">{esOrden ? "Volver al Mercado" : "Volver a la Librería"}</Link>
          </div>
        </div>
      )}
    </main>
  );
}
