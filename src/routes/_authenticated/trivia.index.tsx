import { createFileRoute, Link } from "@tanstack/react-router";
import { ValidationNotice } from "@/components/validation-notice";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { TRIVIA, TRIVIA_ORDER } from "@/lib/trivia";
import { TriviaRoulette } from "@/components/games/trivia-roulette";

export const Route = createFileRoute("/_authenticated/trivia/")({
  head: () => ({
    meta: [
      { title: "Jaikuaápa — Trivia | Jaikuaa" },
      { name: "description", content: "Preguntados paraguayo: gastronomía, mitos, deportes, música, historia y naturaleza." },
      { property: "og:title", content: "Jaikuaápa — Trivia | Jaikuaa" },
      { property: "og:description", content: "Elegí una categoría de trivia paraguaya para practicar en Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TriviaLanding,
});

function TriviaLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ValidationNotice />
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              🧠 Trivia
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Jaikuaápa
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
              Girá la ruleta y demostrá cuánto sabés del Paraguay.
            </p>
          </div>

          <section className="mt-8">
            <TriviaRoulette />
          </section>

          <h2 className="mt-10 text-center font-display text-lg font-bold text-foreground">
            O elegí tu tema
          </h2>
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TRIVIA_ORDER.map((id) => {
              const cat = TRIVIA[id];
              return (
                <Link
                  key={id}
                  to="/trivia/$category"
                  params={{ category: id }}
                  className="group relative flex flex-col rounded-2xl border-2 border-primary/20 bg-card p-4 sm:p-6 text-left shadow-elegant card-hover hover:border-primary hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Gratis
                  </span>
                  <div className="text-4xl" aria-hidden>
                    {cat.emoji}
                  </div>
                  <div className="mt-4 font-display text-lg font-bold text-foreground">
                    {cat.title}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{cat.subtitle}</p>
                  <span className="mt-4 text-sm font-medium text-primary">
                    Jugar →
                  </span>
                </Link>
              );
            })}
          </section>

          <p className="mt-10 text-center">
            <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary/80">
              En proceso de validación
            </span>
          </p>

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
