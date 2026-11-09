/**
 * Los libros ya publicados en la Librería: portada, autor y dos caminos.
 * «Pedirlo» abre WhatsApp con el título listo (mientras no haya pasarela de pago) y «Leer» abre el lector,
 * que solo muestra el libro a quien ya tiene acceso. Si todavía no hay libros publicados, no muestra nada.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, MessageCircle } from "lucide-react";
import { catalogoLibros } from "@/lib/libros.functions";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { Portada } from "@/components/libreria/portada";
import { LIB_COLORES as C } from "@/components/libreria/arte";

export function CatalogoLibreria() {
  const cargar = useServerFn(catalogoLibros);
  const { data } = useQuery({ queryKey: ["catalogo-libros"], queryFn: () => cargar(), staleTime: 5 * 60 * 1000 });
  const libros = data?.libros ?? [];
  if (libros.length === 0) return null;

  return (
    <section className="px-4 pb-14 pt-2 sm:px-6" style={{ background: C.papel }} aria-labelledby="lb-catalogo">
      <div className="mx-auto max-w-4xl">
        <h2 id="lb-catalogo" className="text-center font-display text-3xl font-bold" style={{ color: C.tinta }}>
          Libros disponibles
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-[15px] text-muted-foreground">
          Pedí el tuyo y lo leés en el celular, con voz humana real en cada página. Queda guardado en «Mis libros».
        </p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {libros.map((l) => {
            const texto = `Mba'éichapa! Quiero el libro «${l.titulo}» de la Librería Jaikuaa.`;
            return (
              <li key={l.id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-elegant">
                <div className="w-28 shrink-0">
                  <Portada libro={l} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-display text-lg font-bold leading-tight" style={{ color: C.tinta }}>{l.titulo}</p>
                  {l.autor && <p className="mt-0.5 text-sm text-muted-foreground">{l.autor}</p>}
                  {l.descripcion && <p className="mt-2 line-clamp-4 text-sm text-foreground/80">{l.descripcion}</p>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <a
                      href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(texto)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold"
                      style={{ background: C.dorado, color: C.noche }}
                    >
                      <MessageCircle className="h-4 w-4" /> Pedirlo
                    </a>
                    <Link
                      to="/leer/$id"
                      params={{ id: l.id }}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold"
                      style={{ borderColor: C.tinta, color: C.tinta }}
                    >
                      <BookOpen className="h-4 w-4" /> Ya lo tengo: leer
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
