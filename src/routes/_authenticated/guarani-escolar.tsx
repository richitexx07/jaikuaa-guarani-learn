import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { ValidationNotice } from "@/components/validation-notice";

export const Route = createFileRoute("/_authenticated/guarani-escolar")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Guaraní Escolar" },
      { name: "description", content: "Explorá el espacio de guaraní escolar de Jaikuaa, organizado por grados y con materiales en validación." },
      { property: "og:title", content: "Jaikuaa — Guaraní Escolar" },
      { property: "og:description", content: "Guaraní para la escuela: actividades por grado y materiales en validación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuaraniEscolarLayout,
});

function GuaraniEscolarLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ValidationNotice />
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Outlet />
      </main>
    </div>
  );
}
