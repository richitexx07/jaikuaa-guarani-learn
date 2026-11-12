import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHeart, MessageCircle, Mic2, Route as RutaIcon, ShieldCheck, Store, Camera } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { Nanduti } from "@/components/libreria/arte";
import { FichaEjemplo, TarjetaOficio } from "@/components/tembiapo/partes";
import { enlaceSumarme, OFICIOS, TB } from "@/lib/tembiapo";

export const Route = createFileRoute("/tembiapo/")({
  head: () => ({
    meta: [
      { title: "Tembiapo Jaikuaa — Maestros artesanos y saberes vivos del Paraguay" },
      { name: "description", content: "Conocé a quienes hacen el ñandutí, el ao po'i, la filigrana y la cerámica del Paraguay, escuchá las palabras de su oficio y escribiles directo para comprar sus piezas." },
      { property: "og:title", content: "Tembiapo Jaikuaa — Artesanos del Paraguay" },
      { property: "og:description", content: "La vitrina de maestros artesanos y saberes vivos del Paraguay, con contacto directo y sin comisiones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/tembiapo" }],
  }),
  component: TembiapoPage,
});

const PASOS = [
  { icon: MessageCircle, t: "Nos escribís", d: "Nos contás qué hacés y dónde está tu taller." },
  { icon: Camera, t: "Armamos tu ficha", d: "Con fotos de tus piezas y tu historia, contada como vos quieras. Vos aprobás todo antes de publicar." },
  { icon: Mic2, t: "Grabás las palabras de tu oficio", d: "Con tu voz. Docentes especialistas revisan cómo se escriben en guaraní." },
  { icon: Store, t: "Salís a la vitrina", d: "Con tu WhatsApp, para que te compren directo. Jaikuaa no cobra comisión." },
];

function TembiapoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden text-white" style={{ background: `radial-gradient(120% 90% at 85% 0%, #2B527F 0%, ${TB.marino} 45%, ${TB.noche} 100%)` }}>
          <Nanduti className="pointer-events-none absolute -right-28 -top-24 h-[26rem] w-[26rem] text-white opacity-20" />
          <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"><HandHeart className="h-4 w-4" aria-hidden /> Vitrina de artesanos</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">Tembiapo Jaikuaa</h1>
            <p className="mt-2 font-display text-xl text-white/90 sm:text-2xl">Maestros artesanos y saberes vivos del Paraguay</p>
            <p className="mt-3 max-w-xl text-lg text-white/85">
              Conocé a quienes hacen el ñandutí, el ao po'i, la filigrana y la cerámica. Escuchá las palabras de su oficio con su propia voz y, si querés una pieza, escribiles directo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#oficios" className="inline-flex min-h-12 items-center rounded-2xl bg-white px-5 font-display font-bold" style={{ color: TB.noche }}>Ver los oficios</a>
              <a href="#sumate" className="inline-flex min-h-12 items-center rounded-2xl px-5 font-display font-bold text-white" style={{ background: TB.rojo }}>Soy artesano: quiero sumarme</a>
            </div>
          </div>
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${TB.rojo} 0 33%, #FFFFFF 33% 66%, #0038A8 66%)` }} aria-hidden />
        </section>

        <section id="oficios" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-10 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Los oficios</h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">Cada oficio tiene su pueblo, sus manos y sus palabras. Tocá uno para conocerlo.</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {OFICIOS.map((o) => (
              <li key={o.slug}><TarjetaOficio o={o} /></li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
          <div className="rounded-3xl border border-dashed p-6 text-center sm:p-8" style={{ borderColor: TB.hilo, background: TB.lino }}>
            <Store className="mx-auto h-10 w-10" style={{ color: TB.marino }} aria-hidden />
            <p className="mt-3 font-display text-xl font-bold text-foreground">Los primeros maestros artesanos están por llegar</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Estamos invitando a los primeros artesanos. Cada ficha sale con su permiso, sus fotos y su historia, y con su WhatsApp para comprarle directo.</p>
          </div>
        </section>

        <section className="text-white" style={{ background: TB.marino }}>
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"><RutaIcon className="h-4 w-4" aria-hidden /> Próximamente</p>
              <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Rutas culturales</h2>
              <p className="mt-2 max-w-xl text-white/85">Recorridos por los pueblos donde nacen los oficios, para visitar los talleres, conocer a sus maestros y comprarles en persona. Las estamos armando junto con los artesanos.</p>
            </div>
            <Nanduti className="hidden h-36 w-36 text-white/40 sm:block" />
          </div>
        </section>

        <section id="sumate" className="scroll-mt-20 bg-muted/40">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">¿Sos artesano o artesana?</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">Tu trabajo llega a estudiantes de guaraní, a turistas y a paraguayos en todo el mundo. Vos decidís qué se muestra, y quien quiera una pieza te escribe directo.</p>
              <ol className="mt-6 grid gap-3">
                {PASOS.map((p, i) => (
                  <li key={p.t} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{ background: TB.marino }}><p.icon className="h-5 w-5" aria-hidden /></span>
                    <span>
                      <b className="block font-display text-foreground">{i + 1}. {p.t}</b>
                      <span className="text-sm text-muted-foreground">{p.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={enlaceSumarme()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-display font-bold text-white" style={{ background: TB.rojo }}>
                  <MessageCircle className="h-5 w-5" aria-hidden /> Quiero sumarme
                </a>
                <Link to="/purahei" className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-display font-bold text-primary ring-1 ring-border">
                  Ver Purahéi, la vitrina de artistas
                </Link>
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Nada se publica sin tu permiso por escrito. Podés pedir que bajemos tu ficha cuando quieras.</p>
            </div>
            <div>
              <p className="mb-3 text-center font-display font-bold text-foreground">Así se va a ver tu ficha</p>
              <div className="mx-auto max-w-sm"><FichaEjemplo /></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
