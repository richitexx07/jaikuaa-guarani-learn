/** En las vitrinas de Tembiapo y Purahéi: si esa pieza o ese artista tiene productos en el Mercado, llevar a comprarlos. */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingBag } from "lucide-react";
import { productosEnlazados } from "@/lib/mercado.functions";
import { formatoGs } from "@/lib/pagopar";
import { LIB_COLORES as C } from "@/components/libreria/arte";

export function EnElMercado({ pieza, artista }: { pieza?: string; artista?: string }) {
  const cargar = useServerFn(productosEnlazados);
  const { data } = useQuery({ queryKey: ["en-el-mercado", pieza ?? "", artista ?? ""], queryFn: () => cargar({ data: { pieza, artista } }), staleTime: 5 * 60_000 });
  const lista = data?.productos ?? [];
  if (lista.length === 0) return null;
  return (
    <div className="mt-4 space-y-2">
      {lista.map((p) => (
        <Link
          key={p.id}
          to="/mercado/$tipo/$id"
          params={{ tipo: "producto", id: p.id }}
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 font-bold shadow-sm"
          style={{ background: C.dorado, color: C.noche }}
        >
          <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> {lista.length === 1 ? "Comprar en el Mercado" : p.titulo}</span>
          <span>{p.precioGs ? formatoGs(p.precioGs) : "A cotizar"}</span>
        </Link>
      ))}
    </div>
  );
}
