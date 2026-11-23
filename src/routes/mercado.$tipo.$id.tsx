import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, Headphones, Heart, Loader2, MapPin, MessageCircle, Minus, Plus, Share2, ShieldCheck, ShoppingBag, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { alternarFavorito, dejarResena, miEstadoItem, verItemMercado, type FichaMercado } from "@/lib/mercado.functions";
import { CATEGORIA_NOMBRE, ENTREGA_NOMBRE, MAX_CANTIDAD } from "@/lib/mercado";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { CabeceraMercado, Estrellas, Fila, ICONO_CATEGORIA, MC as C, Precio } from "@/components/mercado/partes";
import { useCarrito } from "@/components/mercado/carrito";
import { Avisame, useMercadoAbierto } from "@/components/mercado/avisame";
import { SiteFooter } from "@/components/site-footer";

/** Ficha de un producto u obra del Mercado: fotos, precio, compra, vendedor, opiniones y parecidos. */
export const Route = createFileRoute("/mercado/$tipo/$id")({
  head: () => ({
    meta: [
      { title: "Mercado Jaikuaa" },
      { name: "description", content: "Producto del Mercado Jaikuaa: libros, artesanía, música, clases y experiencias paraguayas." },
      { property: "og:title", content: "Producto — Mercado Jaikuaa" },
      { property: "og:description", content: "Obras y productos paraguayos en el Mercado Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FichaPage,
});

function FichaPage() {
  const { tipo: tipoParam, id } = Route.useParams();
  const tipo = tipoParam === "obra" ? "obra" : "producto";
  const cargar = useServerFn(verItemMercado);
  const { data, isLoading } = useQuery({ queryKey: ["mercado-item", tipo, id], queryFn: () => cargar({ data: { tipo, id } }), retry: false, staleTime: 60_000 });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F6F3EC" }}>
      <CabeceraMercado />
      <main className="mercado-claro mx-auto w-full max-w-6xl flex-1 px-3 pb-16 pt-4 sm:px-6">
        {isLoading && (
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        )}
        {!isLoading && data?.estado !== "ok" && (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="font-semibold" style={{ color: C.tinta }}>Este producto no está disponible.</p>
            <Link to="/mercado" className="mt-3 inline-block font-semibold underline" style={{ color: C.azul }}>Volver al Mercado</Link>
          </div>
        )}
        {data?.estado === "ok" && <Ficha f={data.ficha} />}
      </main>
      <SiteFooter />
    </div>
  );
}

function Ficha({ f }: { f: FichaMercado }) {
  const [foto, setFoto] = useState(0);
  const Icono = ICONO_CATEGORIA[f.categoria];
  const fecha = f.fechaEvento ? new Date(f.fechaEvento).toLocaleString("es-PY", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <>
      <nav aria-label="Ruta" className="mb-3 text-sm text-muted-foreground">
        <Link to="/mercado" className="hover:underline">Mercado</Link> ›{" "}
        <Link to="/mercado" search={{ cat: f.categoria }} className="hover:underline">{CATEGORIA_NOMBRE[f.categoria]}</Link>
      </nav>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Fotos */}
        <section aria-label="Fotos" className="rounded-3xl bg-white p-3 shadow-sm">
          <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: C.azul }}>
            {f.fotos[foto] ? (
              <img src={f.fotos[foto]} alt={f.titulo} className={`h-full w-full ${f.tipo === "obra" ? "object-contain p-6" : "object-cover"}`} />
            ) : (
              <div className="grid h-full place-items-center"><Icono className="h-16 w-16" style={{ color: C.dorado }} aria-hidden /></div>
            )}
          </div>
          {f.fotos.length > 1 && (
            <ul className="mt-2 flex gap-2 overflow-x-auto">
              {f.fotos.map((u, i) => (
                <li key={u}>
                  <button type="button" onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`} aria-pressed={i === foto} className={`h-16 w-16 overflow-hidden rounded-xl ring-2 ${i === foto ? "ring-[#1E3A5F]" : "ring-transparent"}`}>
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Compra */}
        <section aria-label="Comprar" className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm">
          <span className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: C.papel, color: C.tinta }}>
            <Icono className="h-3.5 w-3.5" aria-hidden /> {CATEGORIA_NOMBRE[f.categoria]}
          </span>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl" style={{ color: C.tinta }}>{f.titulo}</h1>
          <a href="#opiniones" className="w-fit">
            <Estrellas valor={f.estrellas} cantidad={f.resenas} tamano="lg" />
          </a>
          {f.ventas > 0 && <p className="text-xs text-muted-foreground">{f.ventas === 1 ? "1 vendido" : `${f.ventas} vendidos`}</p>}
          <Precio gs={f.precioGs} antes={f.precioAnteriorGs} grande />
          <ul className="space-y-1.5 text-sm text-foreground/85">
            {f.entrega === "lectura" ? (
              <li className="flex items-center gap-2"><Headphones className="h-4 w-4" style={{ color: C.azul }} /> Se lee en el celular, con voz humana real{f.paginas ? ` · ${f.paginas} páginas` : ""}</li>
            ) : (
              <li className="flex items-center gap-2"><Truck className="h-4 w-4" style={{ color: C.azul }} /> {ENTREGA_NOMBRE[f.entrega]}</li>
            )}
            {f.envio && <li className="flex items-center gap-2"><Truck className="h-4 w-4" style={{ color: C.azul }} /> {f.envio}</li>}
            {fecha && <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4" style={{ color: C.azul }} /> {fecha}</li>}
            {f.lugar && <li className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: C.azul }} /> {f.lugar}</li>}
            {f.duracion && <li className="flex items-center gap-2"><Clock className="h-4 w-4" style={{ color: C.azul }} /> {f.duracion}</li>}
            {f.stock !== null && f.stock > 0 && f.stock <= 5 && <li className="font-semibold text-amber-700">¡Quedan {f.stock}!</li>}
            {f.enPreventa && <li className="font-semibold" style={{ color: C.rojo }}>En preventa: lo reservás ahora y se abre cuando esté listo.</li>}
          </ul>
          <Comprar f={f} />
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Pago seguro con Pagopar. Ante cualquier problema, te ayudamos por WhatsApp.</p>

          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-black/5 p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: C.azul }}><Store className="h-5 w-5" style={{ color: C.dorado }} /></span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-xs text-muted-foreground">Lo vende</p>
              <p className="truncate font-semibold" style={{ color: C.tinta }}>{f.vendedor}{f.vendedorCiudad || f.ciudad ? ` · ${f.vendedorCiudad || f.ciudad}` : ""}</p>
            </div>
            {f.vendedorSlug && (
              <Link to="/autor/$slug" params={{ slug: f.vendedorSlug }} className="text-sm font-semibold underline" style={{ color: C.azul }}>Ver vitrina</Link>
            )}
          </div>
          {f.vitrina && (
            <a
              href={f.vitrina.tipo === "tembiapo" ? `/tembiapo/maestro/${f.vitrina.slug}` : `/purahei/${f.vitrina.slug}`}
              className="text-sm font-semibold underline"
              style={{ color: C.azul }}
            >
              Conocé la historia de {f.vitrina.nombre} en {f.vitrina.tipo === "tembiapo" ? "Tembiapo Jaikuaa" : "Purahéi Jaikuaa"}
            </a>
          )}
        </section>
      </div>

      {f.descripcion && (
        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="t-desc">
          <h2 id="t-desc" className="font-display text-xl font-bold" style={{ color: C.tinta }}>Descripción</h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{f.descripcion}</p>
        </section>
      )}

      <Opiniones f={f} />
      <Fila titulo="También te puede gustar" items={f.parecidos} />
    </>
  );
}

function Comprar({ f }: { f: FichaMercado }) {
  const { agregar } = useCarrito();
  const navigate = useNavigate();
  const [cant, setCant] = useState(1);
  const fav = useServerFn(alternarFavorito);
  const estado = useServerFn(miEstadoItem);
  const qc = useQueryClient();
  const [sesion, setSesion] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSesion(!!data.session));
  }, []);
  const { data: mio } = useQuery({ queryKey: ["mercado-mio", f.tipo, f.id], queryFn: () => estado({ data: { tipo: f.tipo, id: f.id } }), enabled: sesion, retry: false });
  const url = typeof window !== "undefined" ? window.location.href : `https://www.jaikuaa.com/mercado/${f.tipo}/${f.id}`;
  const compartir = async () => {
    const texto = `Mirá esto en el Mercado Jaikuaa: ${f.titulo}`;
    try {
      if (navigator.share) await navigator.share({ title: f.titulo, text: texto, url });
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`, "_blank", "noopener");
    } catch {
      /* la persona canceló */
    }
  };
  const max = f.tipo === "obra" || f.entrega === "digital" ? 1 : Math.min(MAX_CANTIDAD, f.stock ?? MAX_CANTIDAD);
  const agotado = f.agotado;
  const yaLaTengo = f.tipo === "obra" && mio?.accesoLectura;
  const { abierto } = useMercadoAbierto();
  // En preinscripción los productos se muestran como vitrina; las obras de la Librería se siguen vendiendo.
  const prontoAbre = f.tipo === "producto" && f.entrega !== "cotizacion" && !abierto;

  return (
    <div className="space-y-2">
      {f.entrega === "cotizacion" ? (
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Mba'éichapa! Quiero una cotización de «${f.titulo}» del Mercado Jaikuaa para mi institución o empresa. Somos ___ personas.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold"
          style={{ background: C.dorado, color: C.noche }}
        >
          <MessageCircle className="h-5 w-5" /> Pedir cotización por WhatsApp
        </a>
      ) : prontoAbre ? (
        <div className="space-y-2 rounded-2xl border border-black/10 p-4">
          <p className="font-display text-lg font-bold" style={{ color: C.tinta }}>Próximamente a la venta</p>
          <p className="text-sm text-foreground/80">Estamos abriendo el Mercado. Dejanos tu contacto y te avisamos apenas puedas comprarlo.</p>
          <Avisame interes={f.categoria} compacto />
        </div>
      ) : yaLaTengo ? (
        <Link to="/leer/$id" params={{ id: f.id }} className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold" style={{ background: C.tinta, color: "#fff" }}>
          <Check className="h-5 w-5" /> Ya es tuyo: leer
        </Link>
      ) : (
        <>
          {max > 1 && !agotado && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: C.tinta }}>Cantidad</span>
              <div className="flex items-center rounded-full border border-black/10">
                <button type="button" aria-label="Menos" className="grid h-10 w-10 place-items-center" onClick={() => setCant((c) => Math.max(1, c - 1))}><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-bold" aria-live="polite">{cant}</span>
                <button type="button" aria-label="Más" className="grid h-10 w-10 place-items-center" onClick={() => setCant((c) => Math.min(max, c + 1))}><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          )}
          <button
            type="button"
            disabled={agotado || !f.precioGs}
            onClick={() => {
              agregar({ tipo: f.tipo, id: f.id, cantidad: cant });
              void navigate({ to: "/mercado/carrito" });
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold disabled:opacity-50"
            style={{ background: C.dorado, color: C.noche }}
          >
            {agotado ? "Agotado" : f.enPreventa ? "Reservar ahora" : "Comprar ahora"}
          </button>
          <button
            type="button"
            disabled={agotado || !f.precioGs}
            onClick={() => {
              agregar({ tipo: f.tipo, id: f.id, cantidad: cant });
              toast.success("Agregado al carrito", { action: { label: "Ver carrito", onClick: () => void navigate({ to: "/mercado/carrito" }) } });
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 text-base font-bold disabled:opacity-50"
            style={{ borderColor: C.tinta, color: C.tinta }}
          >
            <ShoppingBag className="h-5 w-5" /> Agregar al carrito
          </button>
        </>
      )}
      <div className="flex gap-2">
        {f.tipo === "obra" && f.paginas > 0 && !yaLaTengo && (
          <Link to="/muestra/$id" params={{ id: f.id }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-sm font-semibold" style={{ color: C.tinta }}>
            <Headphones className="h-4 w-4" /> Muestra gratis
          </Link>
        )}
        <button
          type="button"
          onClick={async () => {
            if (!sesion) {
              toast("Ingresá a tu cuenta para guardar favoritos.");
              return;
            }
            await fav({ data: { tipo: f.tipo, id: f.id } });
            void qc.invalidateQueries({ queryKey: ["mercado-mio", f.tipo, f.id] });
          }}
          aria-pressed={!!mio?.favorito}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-sm font-semibold"
          style={{ color: C.tinta }}
        >
          <Heart className="h-4 w-4" style={mio?.favorito ? { fill: C.rojo, color: C.rojo } : undefined} /> {mio?.favorito ? "En favoritos" : "Favorito"}
        </button>
        <button type="button" onClick={() => void compartir()} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-sm font-semibold" style={{ color: C.tinta }}>
          <Share2 className="h-4 w-4" /> Compartir
        </button>
      </div>
    </div>
  );
}

function Opiniones({ f }: { f: FichaMercado }) {
  const total = f.distribucion.reduce((s, n) => s + n, 0);
  const estado = useServerFn(miEstadoItem);
  const enviar = useServerFn(dejarResena);
  const qc = useQueryClient();
  const [sesion, setSesion] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSesion(!!data.session));
  }, []);
  const { data: mio } = useQuery({ queryKey: ["mercado-mio", f.tipo, f.id], queryFn: () => estado({ data: { tipo: f.tipo, id: f.id } }), enabled: sesion, retry: false });
  const [estrellas, setEstrellas] = useState(0);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (mio?.miResena) {
      setEstrellas(mio.miResena.estrellas);
      setTexto(mio.miResena.texto);
    }
  }, [mio?.miResena]);

  return (
    <section id="opiniones" className="mt-5 rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="t-op">
      <h2 id="t-op" className="font-display text-xl font-bold" style={{ color: C.tinta }}>Opiniones de compradores</h2>
      {total === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Todavía nadie opinó. Las opiniones son solo de quienes lo compraron.</p>
      ) : (
        <div className="mt-3 grid gap-5 sm:grid-cols-[200px_1fr]">
          <div>
            <p className="font-display text-4xl font-bold" style={{ color: C.tinta }}>{f.estrellas?.toFixed(1)}</p>
            <Estrellas valor={f.estrellas} />
            <p className="text-xs text-muted-foreground">{total === 1 ? "1 opinión" : `${total} opiniones`}</p>
            <ul className="mt-3 space-y-1">
              {[5, 4, 3, 2, 1].map((n) => (
                <li key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{n}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                    <span className="block h-full rounded-full" style={{ width: `${(f.distribucion[n - 1] / total) * 100}%`, background: C.dorado }} />
                  </span>
                  <span className="w-5 text-right text-muted-foreground">{f.distribucion[n - 1]}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="divide-y divide-black/5">
            {f.resenasLista.map((r, i) => (
              <li key={i} className="py-3">
                <div className="flex items-center gap-2">
                  <Estrellas valor={r.estrellas} />
                  <span className="text-sm font-semibold" style={{ color: C.tinta }}>{r.nombre}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.fecha).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {r.texto && <p className="mt-1 text-sm text-foreground/85">{r.texto}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mio?.comprado && (
        <form
          className="mt-4 space-y-2 rounded-2xl p-4"
          style={{ background: C.papel }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!estrellas) return;
            setEnviando(true);
            try {
              await enviar({ data: { tipo: f.tipo, id: f.id, estrellas, texto } });
              toast.success("¡Gracias por tu opinión!");
              void qc.invalidateQueries({ queryKey: ["mercado-item", f.tipo, f.id] });
              void qc.invalidateQueries({ queryKey: ["mercado-mio", f.tipo, f.id] });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
            } finally {
              setEnviando(false);
            }
          }}
        >
          <p className="text-sm font-semibold" style={{ color: C.tinta }}>{mio.miResena ? "Tu opinión (podés cambiarla)" : "¿Qué te pareció?"}</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Estrellas">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={estrellas === n} aria-label={`${n} estrellas`} onClick={() => setEstrellas(n)} className="text-3xl leading-none" style={{ color: n <= estrellas ? C.dorado : "#0000002a" }}>
                ★
              </button>
            ))}
          </div>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} rows={3} placeholder="Contá tu experiencia (opcional)" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-base" aria-label="Tu opinión" />
          <button type="submit" disabled={!estrellas || enviando} className="rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50" style={{ background: C.tinta, color: "#fff" }}>
            {enviando ? "Guardando…" : "Publicar opinión"}
          </button>
        </form>
      )}
    </section>
  );
}
