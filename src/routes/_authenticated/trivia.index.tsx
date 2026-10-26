import { createFileRoute, Link } from "@tanstack/react-router";
import { ValidationNotice } from "@/components/validation-notice";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { TRIVIA, TRIVIA_ORDER } from "@/lib/trivia";
import { TriviaRoulette } from "@/components/games/trivia-roulette";
import { TRIVIA_ART } from "@/lib/trivia-art";
import bannerTrivia from "@/assets/covers/cover-trivia-duelo.webp";

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

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-4xl">
          <section className="relative overflow-hidden rounded-3xl shadow-elegant">
            <img
              src={bannerTrivia}
              alt="Jai, presentador de un programa de preguntas, junto a una ruleta de colores"
              className="aspect-[16/10] w-full object-cover sm:aspect-[16/8]"
              width={800}
              height={600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1638]/90 via-[#0B1638]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Jaikuaápa</h1>
              <p className="mt-1 max-w-xl text-base text-white/85 sm:text-lg">
                Girá la ruleta y demostrá cuánto sabés del Paraguay.
              </p>
            </div>
          </section>

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
                  <img src={TRIVIA_ART[id]} alt="" className="mx-auto h-24 w-24 object-contain drop-shadow-md transition-transform group-hover:scale-105 sm:h-28 sm:w-28" loading="lazy" />
                  <div className="mt-3 font-display text-lg font-bold text-foreground">
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
