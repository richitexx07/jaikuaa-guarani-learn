import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFoundingSponsors } from "@/lib/sponsors.functions";
import { DisplayToggles } from "@/components/display-toggles";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Aprendé guaraní. Cambiá tu vida." },
      { name: "description", content: "Una plataforma paraguaya para aprender guaraní, con el guaraní en el corazón." },
      { property: "og:title", content: "Jaikuaa — Aprendé guaraní. Cambiá tu vida." },
      { property: "og:description", content: "Una plataforma paraguaya para aprender guaraní, con el guaraní en el corazón." },
      { name: "twitter:title", content: "Jaikuaa — Aprendé guaraní. Cambiá tu vida." },
      { name: "twitter:description", content: "Una plataforma paraguaya para aprender guaraní, con el guaraní en el corazón." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "keywords", content: "aprender guaraní, guaraní, curso de guaraní, idioma guaraní, Paraguay, Jaikuaa" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/" }],
  }),
  component: Index,
});


function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <LiveAudioPreview />
        <FoundingSponsors />
      </main>
      <Footer />
    </div>
  );
}


function Header() {
  return (
    <header className="w-full border-b border-border/50 bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
        >
          <BrandLogo />
        </a>
        <div className="flex items-center gap-3">
          <nav aria-label="Studio">
            <a href="/embajadores" className="text-sm font-semibold text-primary hover:underline">Invitar a alguien</a>
            <a href="/studio" className="text-sm text-muted-foreground hover:text-foreground">Studio</a>
          </nav>
          <DisplayToggles />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Aprendé guaraní.
          <br />
          <span className="text-accent">Cambiá tu vida.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Una plataforma paraguaya para aprender guaraní, con el guaraní en el corazón.
        </p>
        <p className="mx-auto mt-3 text-sm font-medium text-primary/80">
          +109 palabras con voz humana paraguaya 🇵🇾
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button variant="cta" size="lg" asChild>
            <Link to="/comenzar">Empezar gratis</Link>
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link to="/auth" search={{ mode: "login" }}>Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

const AUDIO_SAMPLES = [
  { gn: "Mba'éichapa", es: "¿Cómo estás?" },
  { gn: "Aguyje", es: "Gracias" },
  { gn: "Jaguarete", es: "Jaguar" },
  { gn: "Kuarahy", es: "Sol" },
  { gn: "Yvoty", es: "Flor" },
  { gn: "Che vy'a", es: "Estoy feliz" },
];

function LiveAudioPreview() {
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Escuchá guaraní real 🔊
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Voces humanas paraguayas. Tocá una palabra para escucharla.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIO_SAMPLES.map((s) => (
            <div
              key={s.gn}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
            >
              <SpeakerButton gn={s.gn} size="md" />
              <div className="min-w-0">
                <div className="font-display text-base font-semibold text-card-foreground">
                  {s.gn}
                </div>
                <div className="text-sm text-muted-foreground">{s.es}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/** Muro de Auspiciantes Fundadores: se carga desde el panel; vacío = no se muestra. */
function FoundingSponsors() {
  const fn = useServerFn(getFoundingSponsors);
  const q = useQuery({ queryKey: ["founding-sponsors"], queryFn: () => fn(), staleTime: 10 * 60_000 });
  const names = q.data?.names ?? [];
  if (names.length === 0) return null;
  return (
    <section className="border-t border-border/50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Auspiciantes Fundadores
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Empresas paraguayas que acompañan el lanzamiento de Jaikuaa.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-3">
          {names.map((n) => (
            <li
              key={n}
              className="rounded-xl border border-border/60 bg-card px-5 py-3 font-display text-base font-semibold text-card-foreground shadow-sm"
            >
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Footer() {
  return <SiteFooter />;
}
