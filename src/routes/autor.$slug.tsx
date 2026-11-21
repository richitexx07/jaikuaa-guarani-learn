import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, UserRound } from "lucide-react";
import { vitrinaAutor } from "@/lib/libros.functions";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { SiteFooter } from "@/components/site-footer";
import { ListaObras } from "@/components/libreria/catalogo";
import { LIB_COLORES as C } from "@/components/libreria/arte";

/**
 * Vitrina pública de un autor, docente o editorial de la Librería: su presentación y sus obras publicadas.
 * El autor la arma desde «Mis obras»; solo se ve si está habilitado y la dejó visible.
 */
export const Route = createFileRoute("/autor/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: "Librería Jaikuaa — Autor" },
      { name: "description", content: "Obras de este autor en la Librería Jaikuaa: libros, módulos y cursos con voz humana real." },
    ],
    links: [{ rel: "canonical", href: `https://www.jaikuaa.com/autor/${params.slug}` }],
  }),
  component: VitrinaPage,
});

function VitrinaPage() {
  const { slug } = Route.useParams();
  const cargar = useServerFn(vitrinaAutor);
  const { data, isLoading, error } = useQuery({ queryKey: ["vitrina-autor", slug], queryFn: () => cargar({ data: { slug } }), retry: false, staleTime: 5 * 60 * 1000 });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: C.papel }}>
      <MarketingHeader />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          {isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </p>
          )}
          {(error || data?.estado === "no-existe") && (
            <div className="rounded-2xl bg-white p-6 text-center shadow-elegant">
              <p className="font-semibold" style={{ color: C.tinta }}>Esta vitrina no está disponible.</p>
              <Link to="/libreria" className="mt-3 inline-block font-semibold underline" style={{ color: C.azul }}>
                Ver todas las obras de la Librería
              </Link>
            </div>
          )}
          {data?.estado === "ok" && (
            <>
              <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                {data.foto ? (
                  <img src={data.foto} alt={data.nombre} className="h-28 w-28 shrink-0 rounded-full object-cover shadow-md" />
                ) : (
                  <span className="grid h-28 w-28 shrink-0 place-items-center rounded-full shadow-md" style={{ background: C.azul }} aria-hidden>
                    <UserRound className="h-12 w-12" style={{ color: C.dorado }} />
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Autor de la Librería Jaikuaa</p>
                  <h1 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: C.tinta }}>{data.nombre}</h1>
                  {data.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{data.bio}</p>}
                </div>
              </header>
              <h2 className="mt-10 font-display text-2xl font-bold" style={{ color: C.tinta }}>
                {data.obras.length === 1 ? "Su obra" : "Sus obras"}
              </h2>
              {data.obras.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Pronto vas a encontrar acá sus obras.</p>
              ) : (
                <ListaObras obras={data.obras} />
              )}
              <p className="mt-10 text-center">
                <Link to="/libreria" className="font-semibold underline" style={{ color: C.azul }}>
                  Ver toda la Librería
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
