import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
import jaiProfe from "@/assets/jai-profe.webp";
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
        {/* Orden pedido por Richard: primero el curso para todos, después «Elegí tu camino» (nadie queda primero ni último);
            el cartel verde del reto abre la parte de juegos. */}
        <Lecciones />
        <Caminos />
        <RetoPortada />
        <Juegos />
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
              className="hero-cta flex h-16 items-center justify-center gap-3 rounded-2xl bg-success px-6 font-display text-xl font-bold text-success-foreground shadow-lg transition active:scale-[.98]"
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
          <p className="mt-2 text-sm lg:text-left">
            <Link to="/clase" className="font-semibold text-primary underline underline-offset-4">
              ¿Sos docente? Usá el modo aula con toda la clase
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

type Tarjeta = { img: string; title: string; desc: string; cta: string } & (
  | { to: "/curso/$lang/leccion/$n"; params: { lang: string; n: string } }
  | { to: "/juegos"; params?: undefined }
);

const CURSO: Tarjeta = {
  img: bannerCurso,
  title: "Un curso paso a paso, para todos",
  desc: "Lecciones cortas con voces reales, para hacer en la parada del colectivo o en la ronda de tereré.",
  cta: "Empezá la lección 1, sin cuenta",
  to: "/curso/$lang/leccion/$n",
  params: { lang: "guarani", n: "1" },
};

const JUEGOS: Tarjeta[] = [
  { img: coverKaraoke, title: "15 juegos", desc: "Karaoke con arpa, penales, cocina paraguaya, duelos con amigos y más.", cta: "Ver todos los juegos", to: "/juegos" },
];

const tarjetaCls = "block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elegant transition active:scale-[.99] hover:border-accent/40";

function TarjetaPortada({ t }: { t: Tarjeta }) {
  return (
    <Link to={t.to} params={t.params as never} className={tarjetaCls}>
      <img src={t.img} alt="" className="aspect-[16/10] w-full object-cover" width={800} height={500} loading="lazy" decoding="async" />
      <div className="p-5">
        <p className="font-display text-lg font-bold text-foreground">{t.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
        <p className="mt-3 text-sm font-semibold text-primary">{t.cta}</p>
      </div>
    </Link>
  );
}

function Lecciones() {
  return (
    <section className="px-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Lecciones
        </h2>
        <div className="mx-auto mt-8 max-w-2xl">
          <TarjetaPortada t={CURSO} />
        </div>
      </div>
    </section>
  );
}

/** Un enlace dentro de una tarjeta de camino: grande para el dedo, con aviso si pide cuenta. */
function EnlaceCamino({ children, pide }: { children: ReactNode; pide?: boolean }) {
  return (
    <span className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
      <span>{children}</span>
      {pide && <span className="shrink-0 text-xs font-medium text-muted-foreground">pide cuenta</span>}
    </span>
  );
}

const enlaceCls = "block rounded-xl transition active:scale-[.99] hover:bg-primary/10";

/**
 * Elegí tu camino: estudiantes, trabajo y docentes, al mismo nivel. Así una institución o un universitario
 * no se encuentra primero con «Guaraní Escolar». El aula con código sirve para escuelas, institutos y universidades.
 */
function Caminos() {
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Elegí tu camino
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elegant">
            <img src={bannerEscolar} alt="" className="aspect-[16/10] w-full object-cover" width={800} height={500} loading="lazy" decoding="async" />
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-foreground">Estudiantes</h3>
              <p className="mt-1 text-sm text-muted-foreground">Del colegio a la universidad: guaraní por grado y el aula de tu profe.</p>
              <div className="mt-4 grid gap-2">
                <Link to="/guarani-escolar" className={enlaceCls}><EnlaceCamino pide>Guaraní Escolar, por grado</EnlaceCamino></Link>
                <Link to="/aula" className={enlaceCls}><EnlaceCamino pide>Tengo el código de mi aula</EnlaceCamino></Link>
              </div>
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elegant">
            <div className="grid aspect-[16/10] grid-cols-2">
              <img src={coverConsultorio} alt="" className="h-full w-full object-cover" width={400} height={500} loading="lazy" decoding="async" />
              <img src={coverTekojoja} alt="" className="h-full w-full object-cover" width={400} height={500} loading="lazy" decoding="async" />
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-foreground">Trabajo</h3>
              <p className="mt-1 text-sm text-muted-foreground">Para quienes atienden a la gente en su idioma.</p>
              <div className="mt-4 grid gap-2">
                <Link to="/juegos/consultorio" className={enlaceCls}><EnlaceCamino>Guaraní médico</EnlaceCamino></Link>
                <Link to="/juegos/tekojoja" className={enlaceCls}><EnlaceCamino>Guaraní jurídico</EnlaceCamino></Link>
              </div>
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elegant">
            <div className="flex aspect-[16/10] items-end justify-center bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5">
              <img src={jaiProfe} alt="" className="h-[92%] w-auto object-contain drop-shadow-xl" width={400} height={400} loading="lazy" decoding="async" />
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-foreground">Docentes e instituciones</h3>
              <p className="mt-1 text-sm text-muted-foreground">Escuelas, institutos y universidades: usalo en clase y seguí el avance de cada alumno.</p>
              <div className="mt-4 grid gap-2">
                <Link to="/clase" className={enlaceCls}><EnlaceCamino>Proyectar en clase</EnlaceCamino></Link>
                <Link to="/aula/docente" className={enlaceCls}><EnlaceCamino pide>Armar mi aula con código</EnlaceCamino></Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Juegos() {
  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Juegos
        </h2>
        <div className="mx-auto mt-8 max-w-md">
          {JUEGOS.map((t) => (
            <TarjetaPortada key={t.title} t={t} />
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
