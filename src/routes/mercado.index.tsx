import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { BadgeCheck, Loader2, ShieldCheck, Store, Truck, X } from "lucide-react";
import { catalogoMercado } from "@/lib/mercado.functions";
import { CATEGORIAS, CATEGORIA_NOMBRE, ORDENES, ORDEN_NOMBRE, filtrarMercado, ordenarMercado, type Categoria, type Orden } from "@/lib/mercado";
import { CabeceraMercado, Fila, Grilla, ICONO_CATEGORIA, MC as C } from "@/components/mercado/partes";
import { Avisame, useMercadoAbierto } from "@/components/mercado/avisame";
import { SiteFooter } from "@/components/site-footer";

/**
 * Mercado Jaikuaa: el mercado de todo el ecosistema (Librería, Tembiapo, Purahéi, Expertos, experiencias y empresas).
 * Portada con buscador, categorías, destacados, novedades y lo mejor valorado; al buscar o elegir categoría,
 * resultados con orden y filtro de disponibles.
 */
const Busqueda = z.object({ q: z.string().max(100).optional().catch(undefined), cat: z.enum(CATEGORIAS).optional().catch(undefined) });

export const Route = createFileRoute("/mercado/")({
  validateSearch: (s) => Busqueda.parse(s),
  head: () => ({
    meta: [
      { title: "Mercado Jaikuaa — Lo mejor del Paraguay en un solo lugar" },
      {
        name: "description",
        content: "Libros y módulos con voz humana, artesanía de maestros artesanos, música, clases, traducciones y experiencias paraguayas. Pagos con Pagopar.",
      },
      { property: "og:title", content: "Mercado Jaikuaa" },
      { property: "og:description", content: "Libros, artesanía, música, clases y experiencias paraguayas en un solo lugar." },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/mercado" }],
  }),
  component: MercadoPage,
});

function MercadoPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const cargar = useServerFn(catalogoMercado);
  const { data, isLoading, error } = useQuery({ queryKey: ["mercado-catalogo"], queryFn: () => cargar(), staleTime: 2 * 60 * 1000 });
  const items = useMemo(() => data?.items ?? [], [data]);
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [disponibles, setDisponibles] = useState(false);
  const texto = search.q ?? "";
  const cat = search.cat ?? null;
  const filtrando = !!(texto.trim() || cat);
  const resultado = useMemo(
    () => ordenarMercado(filtrarMercado(items, { texto, categoria: cat, conStock: disponibles }), orden),
    [items, texto, cat, disponibles, orden],
  );
  const setBusqueda = (q: string) => void navigate({ search: (s) => ({ ...s, q: q || undefined }), replace: true });
  const setCat = (c: Categoria | null) => void navigate({ search: (s) => ({ ...s, cat: c ?? undefined }) });
  const conItems = CATEGORIAS.filter((c) => items.some((i) => i.categoria === c));
  const { abierto, cargando } = useMercadoAbierto();
  const preinscripcion = !cargando && !abierto;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F6F3EC" }}>
      <CabeceraMercado busqueda={texto} onBuscar={setBusqueda} />

      {/* Categorías */}
      <nav aria-label="Categorías" className="border-b border-black/5 bg-white">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 sm:px-6">
          <li>
            <button
              type="button"
              onClick={() => setCat(null)}
              aria-pressed={!cat}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold"
              style={!cat ? { background: C.tinta, color: "#fff" } : { color: C.tinta }}
            >
              Todo
            </button>
          </li>
          {CATEGORIAS.map((c) => {
            const Icono = ICONO_CATEGORIA[c];
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setCat(cat === c ? null : c)}
                  aria-pressed={cat === c}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold"
                  style={cat === c ? { background: C.tinta, color: "#fff" } : { color: C.tinta }}
                >
                  <Icono className="h-4 w-4" aria-hidden /> {CATEGORIA_NOMBRE[c]}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-16 sm:px-6">
        {!filtrando && preinscripcion && (
          <section className="mt-4 overflow-hidden rounded-3xl text-white" style={{ background: `linear-gradient(120deg, ${C.noche}, ${C.azul})` }} aria-labelledby="t-abriendo">
            <div className="grid gap-6 px-5 py-7 sm:px-10 sm:py-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold" style={{ color: C.dorado }}>Inscripciones abiertas</p>
                <h1 id="t-abriendo" className="mt-1 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">Estamos abriendo el Mercado Jaikuaa</h1>
                <p className="mt-3 max-w-xl text-[15px] text-white/85 sm:text-lg">
                  Libros con voz humana, artesanía de maestros artesanos, música, clases, traducciones y experiencias, en un solo lugar. Ya estamos recibiendo a quienes van a vender. Muy pronto abrimos las compras.
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-white/90">
                  <li><strong style={{ color: C.dorado }}>¿Hacés algo que vale la pena?</strong> Inscribite ahora y tu vitrina queda lista para la apertura.</li>
                  <li><strong style={{ color: C.dorado }}>¿Querés comprar?</strong> Dejanos tu contacto y te avisamos cuando abra.</li>
                </ul>
                <Link to="/mercado/vender" hash="postular" className="mt-5 inline-block rounded-full px-5 py-3 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>
                  Quiero vender: inscribirme
                </Link>
              </div>
              <div id="avisame" className="rounded-2xl bg-white p-4 text-left sm:p-5">
                <Avisame />
              </div>
            </div>
          </section>
        )}

        {!filtrando && !preinscripcion && (
          <section className="relative mt-4 overflow-hidden rounded-3xl px-5 py-7 text-white sm:px-10 sm:py-12" style={{ background: `linear-gradient(120deg, ${C.noche}, ${C.azul})` }}>
            <p className="text-sm font-semibold" style={{ color: C.dorado }}>Hecho en Paraguay</p>
            <h1 className="mt-1 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">Lo mejor de nuestra tierra, en un solo lugar</h1>
            <p className="mt-3 max-w-xl text-[15px] text-white/85 sm:text-lg">
              Libros con voz humana, artesanía de maestros artesanos, música, clases, traducciones y experiencias. Comprás en guaraníes y pagás con Pagopar.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#lo-nuevo" className="rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>Ver el Mercado</a>
              <Link to="/mercado/vender" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-bold text-white">Quiero vender</Link>
            </div>
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-20" style={{ background: C.dorado }} />
          </section>
        )}

        {!filtrando && (
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            {[
              [ShieldCheck, "Pagos seguros con Pagopar"],
              [BadgeCheck, "Opiniones solo de quien compró"],
              [Truck, "Envíos y servicios coordinados por WhatsApp"],
            ].map(([I, t]) => {
              const Icono = I as typeof ShieldCheck;
              return (
                <li key={t as string} className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold shadow-sm" style={{ color: C.tinta }}>
                  <Icono className="h-5 w-5 shrink-0" style={{ color: C.azul }} aria-hidden /> {t as string}
                </li>
              );
            })}
          </ul>
        )}

        {isLoading && (
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando el Mercado…
          </p>
        )}
        {error && <p className="mt-10 text-center text-sm text-destructive">No pudimos cargar el Mercado. Probá de nuevo en un rato.</p>}

        {filtrando ? (
          <section className="mt-5" aria-label="Resultados">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="mr-auto font-display text-2xl font-bold" style={{ color: C.tinta }}>
                {cat ? CATEGORIA_NOMBRE[cat] : "Resultados"}
                {texto.trim() && <span className="text-base font-semibold text-muted-foreground"> para «{texto.trim()}»</span>}
              </h1>
              <label className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.tinta }}>
                <input type="checkbox" checked={disponibles} onChange={(e) => setDisponibles(e.target.checked)} className="h-4 w-4" /> Solo disponibles
              </label>
              <select aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm">
                {ORDENES.map((o) => (
                  <option key={o} value={o}>{ORDEN_NOMBRE[o]}</option>
                ))}
              </select>
              <button type="button" onClick={() => void navigate({ search: {} })} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:underline">
                <X className="h-4 w-4" /> Limpiar
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {resultado.length === 1 ? "1 resultado" : `${resultado.length} resultados`}
            </p>
            {resultado.length === 0 && !isLoading ? (
              <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="font-semibold" style={{ color: C.tinta }}>No encontramos nada con esa búsqueda.</p>
                <p className="mt-1 text-sm text-muted-foreground">Probá con otras palabras o mirá todas las categorías.</p>
              </div>
            ) : (
              <div className="mt-4">
                <Grilla items={resultado} />
              </div>
            )}
          </section>
        ) : (
          !isLoading &&
          (items.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
              <Store className="mx-auto h-10 w-10" style={{ color: C.azul }} aria-hidden />
              <p className="mt-3 font-display text-xl font-bold" style={{ color: C.tinta }}>Estamos llenando las estanterías</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Autores, artesanos, artistas y docentes están cargando sus productos. Si querés vender lo tuyo, postulate.
              </p>
              <Link to="/mercado/vender" className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-bold" style={{ background: C.dorado, color: C.noche }}>
                Quiero vender en el Mercado
              </Link>
            </div>
          ) : (
            <div id="lo-nuevo">
              <Fila titulo={preinscripcion ? "Un adelanto de lo que viene" : "Destacados"} items={ordenarMercado(items, "relevancia").slice(0, 12)} />
              <Fila titulo="Recién llegados" items={ordenarMercado(items, "nuevos").slice(0, 12)} />
              <Fila titulo="Los mejor valorados" items={ordenarMercado(items.filter((i) => (i.estrellas ?? 0) >= 4), "valorados").slice(0, 12)} />
              {conItems.map((c) => (
                <Fila
                  key={c}
                  titulo={CATEGORIA_NOMBRE[c]}
                  items={ordenarMercado(items.filter((i) => i.categoria === c), "relevancia").slice(0, 12)}
                  accion={
                    <button type="button" onClick={() => setCat(c)} className="text-sm font-semibold underline-offset-2 hover:underline" style={{ color: C.azul }}>
                      Ver todo
                    </button>
                  }
                />
              ))}
            </div>
          ))
        )}

        <section className="mt-12 flex flex-col items-start gap-3 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8" style={{ background: C.papel }}>
          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: C.tinta }}>¿Hacés algo que vale la pena?</h2>
            <p className="mt-1 max-w-xl text-sm text-foreground/80">
              Libros, artesanía, música, clases o experiencias: vendelo en el Mercado Jaikuaa. Tenés tu propia vitrina, cobrás con Pagopar y ves tus ventas cada mes.
            </p>
          </div>
          <Link to="/mercado/vender" className="shrink-0 rounded-full px-5 py-3 text-sm font-bold" style={{ background: C.tinta, color: "#fff" }}>
            Quiero vender
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
