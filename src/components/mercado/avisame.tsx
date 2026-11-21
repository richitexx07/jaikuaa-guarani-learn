import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BellRing, Check } from "lucide-react";
import { anotarInteresado, estadoMercado } from "@/lib/mercado.functions";
import { CATEGORIAS, CATEGORIA_NOMBRE, type Categoria } from "@/lib/mercado";
import { MC as C } from "@/components/mercado/partes";

/** Si las ventas de productos del Mercado están abiertas. Mientras carga se asume que no (nunca se ofrece comprar de más). */
export function useMercadoAbierto(): { abierto: boolean; cargando: boolean } {
  const ver = useServerFn(estadoMercado);
  const { data, isLoading } = useQuery({ queryKey: ["mercado-estado"], queryFn: () => ver(), staleTime: 60_000 });
  return { abierto: data?.abierto === true, cargando: isLoading };
}

const campo = "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-base text-[#1B2433]";

/** «Avisame cuando abra»: nombre y WhatsApp o correo, sin cuenta. */
export function Avisame({ interes, compacto = false }: { interes?: Categoria; compacto?: boolean }) {
  const anotar = useServerFn(anotarInteresado);
  const [estado, setEstado] = useState<"listo" | "enviando" | "ok">("listo");
  const [error, setError] = useState("");

  if (estado === "ok") {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900" role="status">
        <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> ¡Listo! Te avisamos apenas abran las ventas.
      </p>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setEstado("enviando");
        setError("");
        try {
          await anotar({
            data: {
              nombre: String(fd.get("nombre") ?? ""),
              contacto: String(fd.get("contacto") ?? ""),
              interes: String(fd.get("interes") ?? interes ?? "todo") as Categoria | "todo",
              trampa: String(fd.get("sitio_web") ?? ""),
            },
          });
          setEstado("ok");
        } catch {
          setError("Revisá tu nombre y tu WhatsApp o correo, y probá de nuevo.");
          setEstado("listo");
        }
      }}
    >
      {!compacto && (
        <p className="flex items-center gap-2 font-display text-lg font-bold" style={{ color: C.tinta }}>
          <BellRing className="h-5 w-5" style={{ color: C.azul }} aria-hidden /> Avisame cuando abra
        </p>
      )}
      <div className={compacto ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
        <input name="nombre" required minLength={2} maxLength={120} autoComplete="name" className={campo} placeholder="Tu nombre" aria-label="Tu nombre" />
        <input name="contacto" required minLength={5} maxLength={120} autoComplete="tel" className={campo} placeholder="Tu WhatsApp o correo" aria-label="Tu WhatsApp o correo" />
      </div>
      {!interes && (
        <select name="interes" className={campo} aria-label="¿Qué te interesa?" defaultValue="todo">
          <option value="todo">Me interesa todo</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{CATEGORIA_NOMBRE[c]}</option>
          ))}
        </select>
      )}
      {/* Campo trampa para robots: las personas no lo ven. */}
      <input name="sitio_web" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold disabled:opacity-50"
        style={{ background: C.dorado, color: C.noche }}
      >
        <BellRing className="h-5 w-5" aria-hidden /> {estado === "enviando" ? "Anotando…" : "Avisame cuando abra"}
      </button>
      <p className="text-xs text-muted-foreground">Solo lo usamos para avisarte de la apertura del Mercado.</p>
    </form>
  );
}
