/**
 * Las obras ya publicadas en la Librería: módulos de especialización (guaraní médico, jurídico, financiero…)
 * y libros. Cada una con portada, autor, comprar (o pedirla por WhatsApp) y una muestra gratis de sus primeras
 * páginas con voz, sin cuenta. Si todavía no hay obras publicadas, no muestra nada.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Headphones, MessageCircle } from "lucide-react";
import { catalogoLibros, type LibroCard } from "@/lib/libros.functions";
import { AREA_NOMBRE } from "@/lib/obras";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { Portada } from "@/components/libreria/portada";
import { ComprarLibro } from "@/components/libreria/comprar-libro";
import { LIB_COLORES as C } from "@/components/libreria/arte";

export function CatalogoLibreria() {
  const cargar = useServerFn(catalogoLibros);
  const { data } = useQuery({ queryKey: ["catalogo-libros"], queryFn: () => cargar(), staleTime: 5 * 60 * 1000 });
  const obras = data?.libros ?? [];
  if (obras.length === 0) return null;
  const modulos = obras.filter((o) => o.tipo === "modulo");
  const libros = obras.filter((o) => o.tipo !== "modulo");

  return (
    <section className="px-4 pb-14 pt-2 sm:px-6" style={{ background: C.papel }} aria-label="Obras disponibles">
      <div className="mx-auto max-w-4xl space-y-12">
        {modulos.length > 0 && (
          <Grupo
            id="lb-modulos"
            titulo="Módulos de especialización"
            bajada="Guaraní para tu trabajo: salud, justicia, finanzas y más. Con voz humana real en cada página, en tu celular."
            obras={modulos}
          />
        )}
        {libros.length > 0 && (
          <Grupo
            id="lb-catalogo"
            titulo="Libros disponibles"
            bajada="Pedí el tuyo y lo leés en el celular, con voz humana real en cada página. Queda guardado en «Mis libros»."
            obras={libros}
          />
        )}
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya compraste?{" "}
          <Link to="/mis-libros" className="font-semibold underline" style={{ color: C.tinta }}>
            Tus libros y módulos están en «Mis libros»
          </Link>
        </p>
      </div>
    </section>
  );
}

function Grupo({ id, titulo, bajada, obras }: { id: string; titulo: string; bajada: string; obras: LibroCard[] }) {
  return (
    <div aria-labelledby={id}>
      <h2 id={id} className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>
        {titulo}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-[15px] text-muted-foreground">{bajada}</p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {obras.map((l) => {
          const queEs = l.tipo === "modulo" ? "el módulo" : "el libro";
          const texto = `Mba'éichapa! Quiero ${queEs} «${l.titulo}» de la Librería Jaikuaa.`;
          return (
            <li key={l.id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-elegant">
              <div className="w-28 shrink-0">
                <Portada libro={l} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                {l.tipo === "modulo" && l.area && (
                  <span className="mb-1 self-start rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: C.dorado, color: C.noche }}>
                    {AREA_NOMBRE[l.area]}
                  </span>
                )}
                <p className="font-display text-lg font-bold leading-tight" style={{ color: C.tinta }}>{l.titulo}</p>
                {l.autor && <p className="mt-0.5 text-sm text-muted-foreground">{l.autor}</p>}
                {l.descripcion && <p className="mt-2 line-clamp-4 text-sm text-foreground/80">{l.descripcion}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  {l.precioGs && !l.tengo && <ComprarLibro libroId={l.id} precioGs={l.precioGs} />}
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(texto)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold"
                    style={{ background: C.dorado, color: C.noche }}
                  >
                    <MessageCircle className="h-4 w-4" /> Pedirlo
                  </a>
                  {l.tengo ? (
                    <Link
                      to="/leer/$id"
                      params={{ id: l.id }}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold"
                      style={{ borderColor: C.tinta, color: C.tinta }}
                    >
                      <BookOpen className="h-4 w-4" /> Leer
                    </Link>
                  ) : (
                    l.paginas > 0 && (
                      <Link
                        to="/muestra/$id"
                        params={{ id: l.id }}
                        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold"
                        style={{ borderColor: C.tinta, color: C.tinta }}
                      >
                        <Headphones className="h-4 w-4" /> Ver muestra gratis
                      </Link>
                    )
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
