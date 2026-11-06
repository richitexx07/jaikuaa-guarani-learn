import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFoundingSponsors } from "@/lib/sponsors.functions";
import { DisplayToggles } from "@/components/display-toggles";
import { EarlyAccessBadge } from "@/components/early-access-badge";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { NandutiDisc } from "@/components/nanduti-disc";
import { RespaldosStrip } from "@/components/respaldos-strip";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";
import bannerCurso from "@/assets/banners/banner-curso.webp";
import bannerEscolar from "@/assets/banners/banner-escolar.webp";
import coverKaraoke from "@/assets/covers/cover-karaoke.webp";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Aprendé y jugá en guaraní" },
      { name: "description", content: "Jaikuaa es una plataforma paraguaya para aprender guaraní con voces humanas, juegos y actividades. Acceso anticipado para conocer la comunidad." },
      { property: "og:title", content: "Jaikuaa — Aprendé y jugá en guaraní" },
      { property: "og:description", content: "Aprendé guaraní con voces humanas, juegos y actividades en Jaikuaa, una plataforma paraguaya en acceso anticipado." },
      { property: "og:url", content: "https://www.jaikuaa.com/" },
      { name: "twitter:title", content: "Jaikuaa — Aprendé y jugá en guaraní" },
      { name: "twitter:description", content: "Aprendé guaraní con voces humanas, juegos y actividades en Jaikuaa, una plataforma paraguaya en acceso anticipado." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg" }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg" },
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
        <Adentro />
        <LiveAudioPreview />
        <FoundingSponsors />
        <div className="border-t border-border/50 px-4 py-12 sm:px-6">
          <RespaldosStrip />
        </div>
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
          <Link to="/libreria" className="rounded-full border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5">
            Librería
          </Link>
          <LanguageSwitcher current="es" />
          <DisplayToggles />
        </div>
      </div>
    </header>
  );
}

const HERO_CSS = `
.hero-jai { animation: hero-rise .9s cubic-bezier(.2,.8,.2,1) both .1s; }
.hero-disc { animation: hero-fade 1.2s ease-out both; }
@keyframes hero-rise { from { opacity: 0; transform: translateY(28px) scale(.96); } }
@keyframes hero-fade { from { opacity: 0; transform: scale(.85); } }
@media (prefers-reduced-motion: reduce) { .hero-jai, .hero-disc { animation: none; } }
`;

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-6 sm:px-6 sm:pt-10 lg:py-20">
      <style>{HERO_CSS}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="relative order-2 text-center lg:order-1 lg:text-left">
          <EarlyAccessBadge className="mb-7 lg:mx-0" />
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Aprendé y jugá
            <br />
            <span className="text-accent">en guaraní.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0">
            Un ratito por día, desde el celular. Lecciones cortas, juegos y voces de paraguayos de verdad.
          </p>
          <p className="mt-3 text-sm font-medium text-primary/80">
            Ya son más de 100 palabras grabadas por paraguayos, y seguimos grabando.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button variant="cta" size="lg" asChild>
              <Link to="/comenzar">Empezar gratis</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/auth" search={{ mode: "login" }}>Iniciar sesión</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm lg:text-left">
            <Link to="/juegos" className="font-semibold text-primary underline underline-offset-4">
              ¿Primero querés probar? Jugá sin registrarte
            </Link>
          </p>
          <p className="mx-auto mt-6 max-w-md text-xs text-muted-foreground lg:mx-0">
            No vendemos tus datos ni los compartimos con terceros para publicidad.
          </p>
        </div>

        <div className="relative order-1 mx-auto aspect-square w-full max-w-[15rem] sm:max-w-sm lg:order-2 lg:max-w-lg">
          <div className="hero-disc absolute inset-0">
            <NandutiDisc className="h-full w-full text-primary" />
          </div>
          <img
            src={jaiBienvenida}
            alt="Jai, el jaguarete de Jaikuaa, saluda con auriculares y el celular en la mano"
            className="hero-jai absolute inset-[6%] h-[88%] w-[88%] object-contain drop-shadow-2xl"
            width={640}
            height={640}
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}

const ADENTRO = [
  { img: bannerCurso, title: "Un curso paso a paso", desc: "Lecciones cortas, para hacer en la parada del colectivo o en la ronda de tereré." },
  { img: coverKaraoke, title: "15 juegos", desc: "Karaoke con arpa, penales, cocina paraguaya, duelos con amigos y guaraní para el trabajo." },
  { img: bannerEscolar, title: "Guaraní Escolar", desc: "Por grado, para entender la tarea y llegar tranquilo al examen." },
];

function Adentro() {
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Adentro de Jaikuaa
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {ADENTRO.map((a) => (
            <figure key={a.title} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elegant">
              <img src={a.img} alt="" className="aspect-[16/10] w-full object-cover" width={800} height={500} loading="lazy" decoding="async" />
              <figcaption className="p-5">
                <p className="font-display text-lg font-bold text-foreground">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              </figcaption>
            </figure>
          ))}
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
            Escuchá cómo suena
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Grabado por paraguayos, no por una máquina. Tocá una palabra.
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
