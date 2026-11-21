/**
 * Botones de compra de la Librería. Llevan a Pagopar si el cobro en línea está activo;
 * en modo prueba solo el administrador simula la compra. Sin sesión, manda a ingresar.
 * - Digital (libro, módulo o curso): queda en «Mis libros».
 * - Impreso: pide los datos de envío antes de pagar; el envío se coordina a mano.
 * Si la persona llegó con el enlace de un embajador, la venta se le acredita.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookCopy, CreditCard, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { comprarLibro } from "@/lib/pagos.functions";
import { formatoGs } from "@/lib/pagopar";
import { leerRefCompra } from "@/lib/ambassador";
import { LIB_COLORES as C } from "@/components/libreria/arte";

type Envio = { nombre: string; telefono: string; ciudad: string; direccion: string; referencia: string };

function useComprar(libroId: string) {
  const comprar = useServerFn(comprarLibro);
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  async function sesion(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    toast("Ingresá a tu cuenta para comprar: queda guardado con tu cuenta.");
    await navigate({ to: "/auth", search: { mode: "login" } });
    return false;
  }

  async function iniciar(formato: "digital" | "fisico", envio?: Envio) {
    setCargando(true);
    try {
      if (!(await sesion())) return;
      const r = await comprar({ data: { libroId, formato, envio, ref: leerRefCompra() } });
      if (r.estado === "pagar") window.location.href = r.url;
      else if (r.estado === "prueba-ok") await navigate({ to: "/pagos/$ref", params: { ref: r.pagoId } });
      else if (r.estado === "ya-lo-tenes") await navigate({ to: "/leer/$id", params: { id: libroId } });
      else toast("El pago en línea llega muy pronto. Mientras tanto, pedilo por WhatsApp.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar el pago.");
    } finally {
      setCargando(false);
    }
  }
  return { cargando, iniciar, sesion };
}

export function ComprarLibro({ libroId, precioGs, preventa = false }: { libroId: string; precioGs: number; preventa?: boolean }) {
  const { cargando, iniciar } = useComprar(libroId);
  return (
    <button
      type="button"
      onClick={() => void iniciar("digital")}
      disabled={cargando}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-60"
      style={{ background: C.tinta, color: C.papel }}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} {preventa ? "Reservar" : "Comprar"} · {formatoGs(precioGs)}
    </button>
  );
}

const campo = "h-11 w-full rounded-lg border border-[#1B2A44]/25 bg-white px-3 text-base text-[#1B2A44]";

/** Edición impresa: abre el formulario de envío y después va al pago. */
export function ComprarImpreso({ libroId, precioGs }: { libroId: string; precioGs: number }) {
  const { cargando, iniciar, sesion } = useComprar(libroId);
  const [abierto, setAbierto] = useState(false);
  const [e, setE] = useState<Envio>({ nombre: "", telefono: "", ciudad: "", direccion: "", referencia: "" });
  const listo = e.nombre.trim().length >= 2 && e.telefono.replace(/\D/g, "").length >= 6 && e.ciudad.trim().length >= 2 && e.direccion.trim().length >= 4;
  const set = (k: keyof Envio) => (ev: React.ChangeEvent<HTMLInputElement>) => setE((x) => ({ ...x, [k]: ev.target.value }));

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => void sesion().then((ok) => ok && setAbierto(true))}
        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold"
        style={{ borderColor: C.tinta, color: C.tinta }}
      >
        <BookCopy className="h-4 w-4" /> Impreso · {formatoGs(precioGs)}
      </button>
    );
  }
  return (
    <form
      className="w-full space-y-2 rounded-xl border border-[#1B2A44]/20 bg-[#FBF7EE] p-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (listo) void iniciar("fisico", e);
      }}
    >
      <p className="flex items-center gap-1.5 text-sm font-bold text-[#1B2A44]">
        <Truck className="h-4 w-4" /> ¿A dónde te lo mandamos?
      </p>
      <input className={campo} placeholder="Nombre y apellido" autoComplete="name" value={e.nombre} onChange={set("nombre")} maxLength={120} aria-label="Nombre y apellido" />
      <input className={campo} placeholder="Celular (para coordinar la entrega)" inputMode="tel" autoComplete="tel" value={e.telefono} onChange={set("telefono")} maxLength={30} aria-label="Celular" />
      <input className={campo} placeholder="Ciudad" autoComplete="address-level2" value={e.ciudad} onChange={set("ciudad")} maxLength={80} aria-label="Ciudad" />
      <input className={campo} placeholder="Dirección (calle y número)" autoComplete="street-address" value={e.direccion} onChange={set("direccion")} maxLength={200} aria-label="Dirección" />
      <input className={campo} placeholder="Referencia (opcional)" value={e.referencia} onChange={set("referencia")} maxLength={200} aria-label="Referencia" />
      <p className="text-xs text-[#1B2A44]/70">Te escribimos por WhatsApp para coordinar la entrega.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!listo || cargando}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-50"
          style={{ background: C.tinta, color: C.papel }}
        >
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pagar {formatoGs(precioGs)}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#1B2A44]">
          Cancelar
        </button>
      </div>
    </form>
  );
}
