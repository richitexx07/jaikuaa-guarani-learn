/** Los pedidos impresos de la persona («Mis libros»): qué pidió y en qué estado está el envío. */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Truck } from "lucide-react";
import { misPedidosImpresos } from "@/lib/tienda.functions";
import { ESTADO_PEDIDO_NOMBRE } from "@/lib/obras";

export function MisPedidosImpresos() {
  const cargar = useServerFn(misPedidosImpresos);
  const { data } = useQuery({ queryKey: ["mis-pedidos-impresos"], queryFn: () => cargar(), retry: false, staleTime: 60_000 });
  const pedidos = data?.pedidos ?? [];
  if (pedidos.length === 0) return null;
  return (
    <section className="mt-8" aria-labelledby="t-mis-pedidos">
      <h2 id="t-mis-pedidos" className="flex items-center gap-1.5 font-display text-xl font-bold text-foreground">
        <Truck className="h-5 w-5" /> Tus pedidos impresos
      </h2>
      <ul className="mt-3 space-y-2">
        {pedidos.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <span>
              <span className="font-semibold text-foreground">{p.titulo}</span>
              <span className="block text-xs text-muted-foreground">
                Pedido el {new Date(p.fecha).toLocaleDateString("es-PY", { day: "numeric", month: "long" })} · envío a {p.ciudad}
              </span>
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.estado === "entregado" ? "bg-emerald-100 text-emerald-900" : p.estado === "cancelado" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-900"}`}>
              {ESTADO_PEDIDO_NOMBRE[p.estado]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Te escribimos por WhatsApp para coordinar la entrega.</p>
    </section>
  );
}
