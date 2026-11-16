import { createFileRoute, Link } from "@tanstack/react-router";
import { MonitorPlay, Users, Volume2 } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { SiteFooter } from "@/components/site-footer";
import { GUEST_LESSONS } from "@/lib/guest-lessons";

/**
 * Modo aula: el docente elige una lección y la proyecta a toda la clase.
 * Para los primeros grados, sin celulares en manos de los chicos: el docente guía, la clase escucha y repite.
 */
export const Route = createFileRoute("/clase/")({
  head: () => ({
    meta: [
      { title: "Modo aula — Jaikuaa" },
      { name: "description", content: "Proyectá una lección de guaraní a toda la clase: voces reales, palabra por palabra, y los chicos repiten. Sin celulares en manos de los alumnos." },
      { property: "og:title", content: "Modo aula de Jaikuaa" },
      { property: "og:description", content: "Guaraní para toda la clase, con el docente al frente y voces reales." },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/clase" }],
  }),
  component: AulaInicio,
});

const COMO = [
  { icon: MonitorPlay, t: "Proyectá o conectá a un televisor", d: "Abrí esta página en la computadora del aula o en tu celular conectado a una pantalla." },
  { icon: Volume2, t: "Tocá «Escuchar»", d: "Suena la voz real de una profesora de guaraní. Usá un parlante si el aula es grande." },
  { icon: Users, t: "La clase repite", d: "Todos repiten en voz alta y después ven qué significa. Vos marcás el ritmo." },
];

function AulaInicio() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Modo aula</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Para usar Jaikuaa con toda la clase desde primer grado: el docente guía, los chicos escuchan la voz real y repiten. Ningún alumno necesita un celular.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {COMO.map((c, i) => (
            <li key={c.t} className="rounded-2xl border border-border/60 bg-card p-5">
              <c.icon className="h-7 w-7 text-primary" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold text-foreground">{i + 1}. {c.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground">Elegí la lección</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {GUEST_LESSONS.map((n) => (
            <Link
              key={n}
              to="/clase/$n"
              params={{ n: String(n) }}
              className="flex h-20 items-center justify-center rounded-2xl bg-primary font-display text-2xl font-bold text-primary-foreground shadow-lg transition active:scale-[.98]"
            >
              Lección {n}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Vamos sumando más lecciones al modo aula. Todo el contenido está revisado por docentes especialistas.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
