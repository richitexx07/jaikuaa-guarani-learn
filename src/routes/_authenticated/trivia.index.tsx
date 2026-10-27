import { createFileRoute, Link } from "@tanstack/react-router";
import { useTX } from "@/lib/i18n-pages";
import { ValidationNotice } from "@/components/validation-notice";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { SenderoJai } from "@/components/games/sendero-jai";
import bannerTrivia from "@/assets/covers/cover-trivia-duelo.webp";

export const Route = createFileRoute("/_authenticated/trivia/")({
  head: () => ({
    meta: [
      { title: "Jaikuaápa — Trivia | Jaikuaa" },
      { name: "description", content: "Preguntados paraguayo: recorré el Sendero de Jai por gastronomía, mitos, deportes, música, historia y naturaleza." },
      { property: "og:title", content: "Jaikuaápa — Trivia | Jaikuaa" },
      { property: "og:description", content: "Elegí una categoría de trivia paraguaya para practicar en Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TriviaLanding,
});

function TriviaLanding() {
  const tx = useTX();
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
            {tx("back")}
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-4xl">
          <section className="relative overflow-hidden rounded-3xl shadow-elegant">
            <img
              src={bannerTrivia}
              alt={tx("trAlt")}
              className="aspect-[16/10] w-full object-cover sm:aspect-[16/8]"
              width={800}
              height={600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1638]/90 via-[#0B1638]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Jaikuaápa</h1>
              <p className="mt-1 max-w-xl text-base text-white/85 sm:text-lg">
                {tx("trSub")}
              </p>
            </div>
          </section>

          <div className="mt-8">
            <SenderoJai />
          </div>

          <p className="mt-10 text-center">
            <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary/80">
              {tx("inValidation")}
            </span>
          </p>

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
