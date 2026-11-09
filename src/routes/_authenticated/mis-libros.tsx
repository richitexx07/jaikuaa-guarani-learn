import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Loader2, Settings2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { misLibros, type LibroCard } from "@/lib/libros.functions";
import { Portada } from "@/components/libreria/portada";

/** «Mis libros»: la biblioteca de cada persona con los libros que compró en la Librería Jaikuaa. */
export const Route = createFileRoute("/_authenticated/mis-libros")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Mis libros" },
      { name: "description", content: "Tus libros de la Librería Jaikuaa: leelos en el celular y escuchá cada página con voz humana real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MisLibrosPage,
});

function MisLibrosPage() {
  const cargar = useServerFn(misLibros);
  const { data, isLoading, error } = useQuery({ queryKey: ["mis-libros"], queryFn: () => cargar(), retry: false });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Mis libros</h1>
              <p className="mt-1 text-sm text-muted-foreground">Leé en el celular y escuchá cada página con voz humana real.</p>
            </div>
            {data?.esAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/libros">
                  <Settings2 className="mr-1.5 h-4 w-4" /> Administrar libros
                </Link>
              </Button>
            )}
          </div>

          {isLoading && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu biblioteca…
            </p>
          )}
          {error && <p className="mt-8 text-sm text-destructive">No pudimos cargar tus libros. Probá de nuevo en un rato.</p>}

          {data && data.libros.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-semibold text-foreground">Todavía no tenés libros</p>
              <p className="mt-1 text-sm text-muted-foreground">Cuando compres un libro de la Librería Jaikuaa, aparece acá con esta misma cuenta.</p>
              <Button asChild className="mt-4">
                <Link to="/libreria">Ir a la Librería</Link>
              </Button>
            </div>
          )}

          {data && data.libros.length > 0 && (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {data.libros.map((l) => (
                <li key={l.id}>
                  <TarjetaLibro libro={l} admin={data.esAdmin} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function TarjetaLibro({ libro, admin }: { libro: LibroCard; admin: boolean }) {
  return (
    <Link to="/leer/$id" params={{ id: libro.id }} className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Portada libro={libro} className="transition group-hover:-translate-y-0.5" />
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{libro.titulo}</p>
      <p className="text-xs text-muted-foreground">
        {libro.paginas} {libro.paginas === 1 ? "página" : "páginas"}
        {admin && !libro.publicado ? " · sin publicar" : ""}
      </p>
    </Link>
  );
}
