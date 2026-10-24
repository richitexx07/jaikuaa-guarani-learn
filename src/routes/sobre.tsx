import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Jaikuaa — Nuestra misión" },
      { name: "description", content: "Jaikuaa es una plataforma paraguaya para aprender guaraní, con voz humana real y hecha íntegramente en Paraguay." },
      { property: "og:title", content: "Sobre Jaikuaa" },
      { property: "og:description", content: "Conozcamos juntos. Una plataforma paraguaya para aprender guaraní, con voz humana real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Título e intro */}
        <section className="px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Sobre Jaikuaa
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Jaikuaa —que en guaraní significa "conozcamos, aprendamos juntos"— es una plataforma paraguaya para aprender guaraní, con voz humana real y hecha íntegramente en Paraguay. Nacimos de una convicción: nuestra lengua merece una herramienta digital a su altura.
            </p>
          </div>
        </section>

        {/* Nuestra misión */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-elegant sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Nuestra misión
              </span>
              <p className="mt-5 text-lg leading-relaxed text-foreground sm:text-xl">
                Que cualquier paraguayo, en cualquier lugar, pueda aprender y fortalecer su guaraní de forma gratuita, moderna y con orgullo. Creemos que el guaraní no es una materia difícil ni un idioma del pasado: es identidad viva, y queremos que se aprenda con alegría.
              </p>
            </div>
          </div>
        </section>

        {/* Qué nos hace diferentes */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              Qué nos hace diferentes
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <ValueCard emoji="🎙️" title="Voz humana real">
                Pronunciación paraguaya auténtica. Nada de voz robótica.
              </ValueCard>
              <ValueCard emoji="🏠" title="Para toda la vida">
                Contenido pensado para la escuela, la familia y el trabajo.
              </ValueCard>
              <ValueCard emoji="✅" title="Puro y jopara">
                Distinción clara entre el guaraní puro (teete) y el jopara del habla cotidiana.
              </ValueCard>
              <ValueCard emoji="🎮" title="Aprendizaje con juego">
                Para que enseñar y aprender no aburra.
              </ValueCard>
              <ValueCard emoji="🎁" title="Guaraní básico gratis">
                El curso básico de guaraní es gratuito para los paraguayos.
              </ValueCard>
            </div>
          </div>
        </section>

        {/* Nuestro compromiso con las instituciones */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-elegant sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Nuestro compromiso
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-foreground sm:text-3xl">
                Con las instituciones
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Jaikuaa cree en construir junto a quienes cuidan nuestra lengua. Trabajamos con respeto y admiración hacia las instituciones que velan por el guaraní, y buscamos que el contenido de la plataforma se desarrolle y valide de la mano de los expertos, para que sea siempre riguroso y confiable.
              </p>
            </div>
          </div>
        </section>

        {/* Datos del proyecto */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              Datos del proyecto
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FactCard label="Marca en trámite" value="DINAPI Solicitud Nº 2658897" />
              <FactCard label="Desarrollo" value="Hecho en Paraguay" />
              <FactCard label="Sitio oficial" value="jaikuaa.com" />
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant sm:p-10">
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Contacto
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                ¿Sos una institución, docente o empresa que quiere sumarse a la misión del guaraní? Escribinos.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button variant="cta" size="lg" asChild>
                  <a href="mailto:contacto@jaikuaa.com">
                    <Mail className="h-4 w-4" />
                    contacto@jaikuaa.com
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/">Volver al inicio</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cierre destacado */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Jaikuaa — conozcamos juntos. 🐆
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ValueCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elegant card-hover">
      <div className="text-4xl" aria-hidden>{emoji}</div>
      <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-secondary p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
