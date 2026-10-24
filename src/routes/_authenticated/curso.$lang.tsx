import { createFileRoute, Link, Outlet, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getLanguage } from "@/lib/languages";

export const Route = createFileRoute("/_authenticated/curso/$lang")({
  head: ({ params }) => {
    const lang = getLanguage(params.lang);
    return { meta: [{ title: `Jaikuaa — Curso de ${lang?.name ?? "idioma"}` },
      { name: "description", content: "Accedé a las lecciones de tu curso de idiomas en Jaikuaa." },
      { property: "og:title", content: `Jaikuaa — Curso de ${lang?.name ?? "idioma" },
      { property: "og:description", content: "Accedé a las lecciones de tu curso de idiomas en Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] };
  },
  loader: ({ params }) => {
    const lang = getLanguage(params.lang);
    if (!lang) throw notFound();
    return { lang };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Idioma no encontrado</h1>
        <p className="mt-2 text-muted-foreground">Ese curso todavía no existe en Jaikuaa.</p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Ocurrió un error</h1>
        <Button variant="cta" className="mt-4" onClick={() => reset()}>
          Reintentar
        </Button>
      </div>
    </div>
  ),
  component: () => <Outlet />,
});
