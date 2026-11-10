/**
 * Botón «Comprar» de un libro. Lleva a Pagopar si el cobro en línea está activo;
 * en modo prueba solo el administrador simula la compra. Sin sesión, manda a ingresar.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { comprarLibro } from "@/lib/pagos.functions";
import { formatoGs } from "@/lib/pagopar";
import { LIB_COLORES as C } from "@/components/libreria/arte";

export function ComprarLibro({ libroId, precioGs }: { libroId: string; precioGs: number }) {
  const comprar = useServerFn(comprarLibro);
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  async function tocar() {
    setCargando(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast("Ingresá a tu cuenta para comprar y guardar el libro en «Mis libros».");
        await navigate({ to: "/auth", search: { mode: "login" } });
        return;
      }
      const r = await comprar({ data: { libroId } });
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

  return (
    <button
      type="button"
      onClick={tocar}
      disabled={cargando}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-60"
      style={{ background: C.tinta, color: C.papel }}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Comprar · {formatoGs(precioGs)}
    </button>
  );
}
