import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { CreditCard, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { itemsDelCarrito, pagarCarrito, validarCupon } from "@/lib/mercado.functions";
import { aplicarDescuento, CATEGORIA_NOMBRE, MAX_CANTIDAD } from "@/lib/mercado";
import { formatoGs } from "@/lib/pagopar";
import { leerRefCompra } from "@/lib/ambassador";
import { CabeceraMercado, MC as C } from "@/components/mercado/partes";
import { useCarrito } from "@/components/mercado/carrito";

/** Carrito del Mercado: varias cosas, un cupón y un solo pago con Pagopar. */
export const Route = createFileRoute("/mercado/carrito")({
  head: () => ({ meta: [{ title: "Tu carrito — Mercado Jaikuaa" }, { name: "robots", content: "noindex" }] }),
  component: CarritoPage,
});

const campo = "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-base text-[#1B2433]";

function CarritoPage() {
  const { lineas, cambiar, vaciar } = useCarrito();
  const cargar = useServerFn(itemsDelCarrito);
  const pagar = useServerFn(pagarCarrito);
  const probarCupon = useServerFn(validarCupon);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["mercado-carrito", lineas.map((l) => `${l.tipo}:${l.id}`).join(",")],
    queryFn: () => cargar({ data: { lineas: lineas.map(({ tipo, id }) => ({ tipo, id })) } }),
    enabled: lineas.length > 0,
  });
  const [cupon, setCupon] = useState("");
  const [cuponOk, setCuponOk] = useState<{ codigo: string; porcentaje: number } | null>(null);
  const [cuponMsg, setCuponMsg] = useState<string | null>(null);
  const [contacto, setContacto] = useState({ nombre: "", telefono: "", ciudad: "", direccion: "", referencia: "" });
  const [pagando, setPagando] = useState(false);

  const filas = useMemo(() => {
    const porClave = new Map((data?.items ?? []).map((i) => [`${i.tipo}:${i.id}`, i]));
    return lineas.map((l) => ({ l, item: porClave.get(`${l.tipo}:${l.id}`) ?? null }));
  }, [lineas, data]);
  const validas = filas.filter((f) => f.item && f.item.precioGs && f.item.entrega !== "cotizacion" && !f.item.agotado);
  const montos = validas.map((f) => f.item!.precioGs! * f.l.cantidad);
  const bruto = montos.reduce((s, m) => s + m, 0);
  const { descuento } = aplicarDescuento(montos, cuponOk?.porcentaje ?? 0);
  const total = bruto - descuento;
  const aMano = validas.some((f) => ["fisico", "servicio", "experiencia"].includes(f.item!.entrega));
  const conEnvio = validas.some((f) => f.item!.entrega === "fisico");
  const set = (k: keyof typeof contacto) => (e: React.ChangeEvent<HTMLInputElement>) => setContacto((c) => ({ ...c, [k]: e.target.value }));
  const contactoListo =
    !aMano ||
    (contacto.nombre.trim().length >= 2 &&
      contacto.telefono.replace(/\D/g, "").length >= 6 &&
      (!conEnvio || (contacto.ciudad.trim().length >= 2 && contacto.direccion.trim().length >= 4)));

  async function irAPagar() {
    setPagando(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        toast("Ingresá a tu cuenta para pagar: tu compra queda guardada con ella.");
        await navigate({ to: "/auth", search: { mode: "login" } });
        return;
      }
      const r = await pagar({
        data: {
          lineas: validas.map((f) => ({ tipo: f.l.tipo, id: f.l.id, cantidad: f.l.cantidad })),
          cupon: cuponOk?.codigo ?? null,
          contacto: aMano ? contacto : undefined,
          ref: leerRefCompra(),
        },
      });
      if (r.estado === "pagar") {
        vaciar();
        window.location.href = r.url;
      } else if (r.estado === "prueba-ok") {
        vaciar();
        await navigate({ to: "/pagos/$ref", params: { ref: r.ordenId } });
      } else toast("El pago en línea llega muy pronto. Mientras tanto, escribinos por WhatsApp.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar el pago.");
    } finally {
      setPagando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F6F3EC" }}>
      <CabeceraMercado />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-16 pt-5 sm:px-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: C.tinta }}>Tu carrito</h1>
        {lineas.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
            <ShoppingBag className="mx-auto h-10 w-10" style={{ color: C.azul }} aria-hidden />
            <p className="mt-3 font-semibold" style={{ color: C.tinta }}>Tu carrito está vacío</p>
            <Link to="/mercado" className="mt-3 inline-block rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>Ir al Mercado</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px]">
            <section aria-label="Productos" className="space-y-3">
              {isLoading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Revisando precios…</p>
              )}
              {filas.map(({ l, item }) => (
                <article key={`${l.tipo}:${l.id}`} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: C.azul }}>
                    {item?.foto && <img src={item.foto} alt="" className={`h-full w-full ${l.tipo === "obra" ? "object-contain p-1" : "object-cover"}`} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item ? (
                      <Link to="/mercado/$tipo/$id" params={{ tipo: l.tipo, id: l.id }} className="line-clamp-2 font-semibold hover:underline" style={{ color: C.tinta }}>{item.titulo}</Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">{isLoading ? "…" : "Este producto ya no está disponible."}</p>
                    )}
                    {item && <p className="text-xs text-muted-foreground">{CATEGORIA_NOMBRE[item.categoria]} · {item.vendedor}</p>}
                    {item?.agotado && <p className="text-xs font-bold text-destructive">Agotado: sacalo para seguir.</p>}
                    {item?.entrega === "cotizacion" && <p className="text-xs font-bold text-destructive">Se pide por cotización: sacalo del carrito.</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {item && l.tipo === "producto" && item.entrega !== "digital" && (
                        <div className="flex items-center rounded-full border border-black/10">
                          <button type="button" aria-label="Menos" className="grid h-9 w-9 place-items-center" onClick={() => cambiar(l, l.cantidad - 1)}><Minus className="h-4 w-4" /></button>
                          <span className="w-7 text-center text-sm font-bold">{l.cantidad}</span>
                          <button
                            type="button"
                            aria-label="Más"
                            className="grid h-9 w-9 place-items-center"
                            onClick={() => cambiar(l, Math.min(l.cantidad + 1, MAX_CANTIDAD, item.stock ?? MAX_CANTIDAD))}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <button type="button" onClick={() => cambiar(l, 0)} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" /> Sacar
                      </button>
                      {item?.precioGs && <span className="ml-auto font-display font-bold" style={{ color: C.tinta }}>{formatoGs(item.precioGs * l.cantidad)}</span>}
                    </div>
                  </div>
                </article>
              ))}

              {aMano && (
                <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="t-entrega">
                  <h2 id="t-entrega" className="font-semibold" style={{ color: C.tinta }}>{conEnvio ? "¿A dónde te lo mandamos?" : "¿Cómo te contactamos?"}</h2>
                  <p className="text-xs text-muted-foreground">Te escribimos por WhatsApp para coordinar {conEnvio ? "la entrega" : "el día y la hora"}.</p>
                  <input className={campo} placeholder="Nombre y apellido" autoComplete="name" value={contacto.nombre} onChange={set("nombre")} maxLength={120} aria-label="Nombre y apellido" />
                  <input className={campo} placeholder="Celular con WhatsApp" inputMode="tel" autoComplete="tel" value={contacto.telefono} onChange={set("telefono")} maxLength={30} aria-label="Celular" />
                  <input className={campo} placeholder={conEnvio ? "Ciudad" : "Ciudad (opcional)"} autoComplete="address-level2" value={contacto.ciudad} onChange={set("ciudad")} maxLength={80} aria-label="Ciudad" />
                  {conEnvio && <input className={campo} placeholder="Dirección (calle y número)" autoComplete="street-address" value={contacto.direccion} onChange={set("direccion")} maxLength={200} aria-label="Dirección" />}
                  <input className={campo} placeholder={conEnvio ? "Referencia (opcional)" : "Algo que debamos saber (opcional)"} value={contacto.referencia} onChange={set("referencia")} maxLength={200} aria-label="Referencia" />
                </section>
              )}
            </section>

            <aside className="h-fit space-y-3 rounded-2xl bg-white p-4 shadow-sm lg:sticky lg:top-20" aria-label="Resumen">
              <h2 className="font-semibold" style={{ color: C.tinta }}>Resumen</h2>
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCuponMsg(null);
                  const r = await probarCupon({ data: { codigo: cupon } });
                  if (r.ok) {
                    setCuponOk({ codigo: r.codigo, porcentaje: r.porcentaje });
                    setCuponMsg(`Cupón ${r.codigo}: ${r.porcentaje}% menos`);
                  } else {
                    setCuponOk(null);
                    setCuponMsg(r.motivo);
                  }
                }}
              >
                <label className="relative flex-1">
                  <span className="sr-only">Cupón de descuento</span>
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input value={cupon} onChange={(e) => setCupon(e.target.value)} placeholder="Cupón" className={`${campo} pl-9 uppercase`} />
                </label>
                <button type="submit" disabled={!cupon.trim()} className="rounded-xl border border-black/10 px-3 text-sm font-semibold disabled:opacity-50" style={{ color: C.tinta }}>Aplicar</button>
              </form>
              {cuponMsg && <p className={`text-xs font-semibold ${cuponOk ? "text-emerald-700" : "text-destructive"}`} role="status">{cuponMsg}</p>}
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatoGs(bruto)}</dd></div>
                {descuento > 0 && <div className="flex justify-between text-emerald-700"><dt>Descuento</dt><dd>−{formatoGs(descuento)}</dd></div>}
                <div className="flex justify-between border-t border-black/5 pt-2 font-display text-lg font-bold" style={{ color: C.tinta }}><dt>Total</dt><dd>{formatoGs(total)}</dd></div>
              </dl>
              <button
                type="button"
                disabled={!validas.length || validas.length !== filas.length || !contactoListo || pagando || isLoading}
                onClick={() => void irAPagar()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold disabled:opacity-50"
                style={{ background: C.dorado, color: C.noche }}
              >
                {pagando ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />} Pagar {formatoGs(total)}
              </button>
              {validas.length !== filas.length && !isLoading && <p className="text-xs text-destructive">Sacá del carrito lo que ya no está disponible.</p>}
              {!contactoListo && <p className="text-xs text-muted-foreground">Completá tus datos de contacto para seguir.</p>}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Pagás en la página segura de Pagopar.</p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
