import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, Trophy, Gift, Megaphone, ShieldCheck, BarChart3, ArrowLeft } from "lucide-react";
import { PrivateGate } from "@/components/private-gate";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/ficha-auspiciantes")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Ficha comercial para auspiciantes — Jaikuaa" },
      { name: "description", content: "Ficha de una hoja con los espacios para marcas dentro de los juegos de Jaikuaa." },
      { property: "og:title", content: "Ficha comercial para auspiciantes — Jaikuaa" },
      { property: "og:description", content: "Tu marca dentro del juego, en un entorno sano y familiar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: () => (
    <PrivateGate>
      <Ficha />
    </PrivateGate>
  ),
});

const FORMATOS = [
  {
    icon: Trophy,
    titulo: "Valla en el estadio de Penales",
    texto: "Tu logo en las vallas detrás del arco, como en un partido grande. Se ve en cada tiro, sin cortar el juego.",
  },
  {
    icon: Megaphone,
    titulo: "Patrocinador del juego",
    texto: "«Este desafío llega gracias a [tu marca]». Tu nombre acompaña el juego de la semana con tus colores.",
  },
  {
    icon: Gift,
    titulo: "Premios por XP",
    texto: "La gente canjea sus puntos de estudio por un beneficio o descuento de tu marca. Llegás como el que premia el esfuerzo.",
  },
] as const;

const GARANTIAS = [
  { icon: ShieldCheck, texto: "Entorno sano y familiar: sin chat libre, sin apuestas, sin comentarios tóxicos alrededor de tu logo." },
  { icon: BarChart3, texto: "Informe imprimible con las vistas reales de tu espacio, contadas una vez por persona por día." },
] as const;

function Ficha() {
  return (
    <div className="min-h-dvh bg-muted/60 px-3 py-5 print:bg-transparent print:p-0 sm:px-6 sm:py-8">
      <main className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-5 py-7 pb-20 text-foreground shadow-sm print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-8 print:shadow-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al panel
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Vista privada. Imprimila o guardala como PDF.</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            <Printer className="h-4 w-4" aria-hidden /> Imprimir / PDF
          </button>
        </div>
      </div>

      <header className="flex items-center justify-between border-b-4 border-secondary pb-4">
        <BrandLogo />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ficha para marcas</span>
      </header>

      <section className="mt-6">
        <h1 className="font-display text-3xl font-bold leading-tight text-primary">
          Tu marca no interrumpe el juego: es parte del juego.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Jaikuaa es la plataforma paraguaya para aprender guaraní jugando, con voces reales. El guaraní básico es
          gratis para todos; las marcas que nos acompañan hacen eso posible y se asocian con educación y orgullo
          nacional.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3 print:grid-cols-3">
        {FORMATOS.map(({ icon: Icon, titulo, texto }) => (
          <article key={titulo} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Icon className="h-7 w-7 text-secondary" aria-hidden />
            <h2 className="mt-2 font-display text-lg font-bold text-primary">{titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 space-y-3 rounded-xl bg-muted p-4">
        {GARANTIAS.map(({ icon: Icon, texto }) => (
          <p key={texto} className="flex items-start gap-3 text-sm">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            {texto}
          </p>
        ))}
      </section>

      <section className="mt-6 text-sm">
        <h2 className="font-display text-base font-bold text-primary">Respaldo</h2>
        <p className="mt-1 text-muted-foreground">
          Declarada de interés por el Senado (Decl. 547/2026) y la Cámara de Diputados (Decl. N.° 2001); Resolución
          SPL 116/2026. Jaikuaa desarrolla un plan piloto con el Ateneo de Lengua y Cultura Guaraní.
        </p>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Guaraní Global Tech E.A.S. · RUC 80174299-4 · www.jaikuaa.com</span>
        <span>Precios y espacios: a convenir según el paquete.</span>
      </footer>
    </main>
  );
}
