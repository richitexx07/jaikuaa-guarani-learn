import { createFileRoute, Link } from "@tanstack/react-router";
import { LanzamientoBanner } from "@/components/lanzamiento-banner";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFoundingSponsors } from "@/lib/sponsors.functions";
import { EarlyAccessBadge } from "@/components/early-access-badge";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { NandutiDisc } from "@/components/nanduti-disc";
import { RespaldosStrip } from "@/components/respaldos-strip";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";
import bannerCurso from "@/assets/banners/banner-curso.webp";
import bannerEscolar from "@/assets/banners/banner-escolar.webp";
import coverKaraoke from "@/assets/covers/cover-karaoke.webp";
import coverConsultorio from "@/assets/covers/cover-consultorio.webp";
import coverTekojoja from "@/assets/covers/cover-tekojoja.webp";
import { RetoCard } from "@/components/games/reto-card";
import { useIsGuest } from "@/lib/guest";
import { MarketingHeader } from "@/components/marketing/page-parts";



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
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg?v=2" },
      { name: "keywords", content: "aprender guaraní, guaraní, curso de guaraní, idioma guaraní, Paraguay, Jaikuaa" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/" }],
  }),
  component: Index,
});


function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader idioma={<LanguageSwitcher current="es" />} />
      <main className="flex-1">
        <div className="px-4 pt-3 sm:px-6">
          <LanzamientoBanner className="mx-auto max-w-5xl" />
        </div>
        <Hero />
        <RetoPortada />
        <Adentro />
        <ParaElTrabajo />
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


/** «¿Quién sabe más guaraní?»: retar a alguien por WhatsApp desde la portada. */
function RetoPortada() {
  const guest = useIsGuest();
  return (
    <section className="px-4 pb-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <RetoCard guest={guest} />
      </div>
    </section>
  );
}


const HERO_CSS = `
.hero-jai { animation: hero-rise .9s cubic-bezier(.2,.8,.2,1) both .1s; }
.hero-disc { animation: hero-fade 1.2s ease-out both; }
@keyframes hero-rise { from { opacity: 0; transform: translateY(28px) scale(.96); } }
@keyframes hero-fade { from { opacity: 0; transform: scale(.85); } }
.hero-cta { animation: hero-cta 2.4s ease-in-out infinite 1.5s; }
@keyframes hero-cta { 0%,100% { box-shadow: 0 10px 24px -10px rgba(213,43,30,.55) } 50% { box-shadow: 0 10px 34px -6px rgba(213,43,30,.85) } }
@media (prefers-reduced-motion: reduce) { .hero-jai, .hero-disc, .hero-cta { animation: none; } }
`;

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-6 sm:px-6 sm:pt-10 lg:py-20">
      <style>{HERO_CSS}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="relative order-2 text-center lg:order-1 lg:text-left">
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

          {/* Menos fricción: primero se estudia (o se juega) sin cuenta; la cuenta se pide después. Estudiar va primero. */}
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 lg:mx-0">
            <Link
              to="/curso/$lang/leccion/$n"
              params={{ lang: "guarani", n: "1" }}
              className="hero-cta flex h-16 items-center justify-center gap-3 rounded-2xl bg-accent px-6 font-display text-xl font-bold text-accent-foreground shadow-lg transition active:scale-[.98]"
            >
              <span aria-hidden>📚</span> Estudiá ahora, sin cuenta
            </Link>
            <Link
              to="/juegos/penales"
              search={{ de: "portada" } as never}
              className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-primary px-6 font-display text-xl font-bold text-primary-foreground shadow-lg transition active:scale-[.98]"
            >
              <span aria-hidden>⚽</span> Jugá ahora, sin cuenta
            </Link>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/auth" search={{ mode: "login" }}>Ya tengo cuenta: iniciar sesión</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm lg:text-left">
            <Link to="/juegos" className="font-semibold text-primary underline underline-offset-4">
              O mirá todos los juegos
            </Link>
          </p>
          <EarlyAccessBadge className="mt-7 lg:mx-0" />
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
  // Orden pedido por Richard: primero lo escolar, después las lecciones y al final los juegos.
  { img: bannerEscolar, title: "Guaraní Escolar", desc: "Por grado, para entender la tarea y llegar tranquilo al examen." },
  { img: bannerCurso, title: "Un curso paso a paso", desc: "Lecciones cortas, para hacer en la parada del colectivo o en la ronda de tereré." },
  { img: coverKaraoke, title: "15 juegos", desc: "Karaoke con arpa, penales, cocina paraguaya, duelos con amigos y guaraní para el trabajo." },
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

/** Guaraní para el trabajo: médico y jurídico, a la vista desde la portada (se juegan sin cuenta). */
const TRABAJO = [
  { img: coverConsultorio, to: "/juegos/consultorio", title: "Guaraní médico", desc: "Consultorio de Jai: atendé a pacientes que hablan guaraní." },
  { img: coverTekojoja, to: "/juegos/tekojoja", title: "Guaraní jurídico", desc: "Tekojoja, Juzgado de Paz: resolvé casos y aprendé términos jurídicos." },
] as const;

function ParaElTrabajo() {
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Guaraní para el trabajo
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">Para quienes atienden a la gente en su idioma.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {TRABAJO.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elegant transition active:scale-[.99] hover:border-accent/40"
            >
              <img src={t.img} alt="" className="aspect-[4/3] w-full object-cover" width={800} height={600} loading="lazy" decoding="async" />
              <div className="p-5">
                <p className="font-display text-lg font-bold text-foreground">{t.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                <p className="mt-3 text-sm font-semibold text-primary">Probalo sin cuenta</p>
              </div>
            </Link>
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
