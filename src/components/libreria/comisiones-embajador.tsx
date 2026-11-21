/** En «Embajadores»: lo que la persona gana por las ventas de la Librería que llegan con su enlace. */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen } from "lucide-react";
import { misComisionesLibreria } from "@/lib/tienda.functions";
import { formatoGs } from "@/lib/pagopar";

export function ComisionesLibreria() {
  const cargar = useServerFn(misComisionesLibreria);
  const { data } = useQuery({ queryKey: ["mis-comisiones-libreria"], queryFn: () => cargar(), retry: false, staleTime: 60_000 });
  if (!data || (data.porcentaje === 0 && data.ventas === 0)) return null;
  return (
    <section className="mt-4 rounded-3xl border border-border bg-card p-5" aria-labelledby="t-com-lib">
      <h2 id="t-com-lib" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
        <BookOpen className="h-5 w-5 text-primary" /> Librería Jaikuaa
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cuando alguien compra un libro, módulo o curso con tu enlace, te corresponde una parte de la venta.{" "}
        <Link to="/libreria" className="font-semibold text-primary underline">Ver la Librería</Link>
      </p>
      {data.ventas > 0 ? (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ["Ventas con tu enlace", String(data.ventas)],
            ["Te corresponde", formatoGs(data.devengadoGs)],
            ["Por cobrar", formatoGs(data.saldoGs)],
          ].map(([t, v]) => (
            <div key={t} className="rounded-xl bg-muted/60 p-3">
              <dt className="text-xs text-muted-foreground">{t}</dt>
              <dd className="mt-0.5 font-display text-base font-bold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-foreground">Todavía no hay ventas con tu enlace.</p>
      )}
    </section>
  );
}
