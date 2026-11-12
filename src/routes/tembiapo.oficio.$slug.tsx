import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, MessageCircle, Mic2, Store } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { Nanduti } from "@/components/libreria/arte";
import { IconoOficio, TarjetaOficio } from "@/components/tembiapo/partes";
import { enlaceSumarme, OFICIOS, oficioPorSlug, TB } from "@/lib/tembiapo";

export const Route = createFileRoute("/tembiapo/oficio/$slug")({
  loader: ({ params }) => {
    const o = oficioPorSlug(params.slug);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.nombre} — Tembiapo Jaikuaa` },
          { name: "description", content: `${loaderData.resumen} Conocé a sus artesanos y escribiles directo.` },
          { property: "og:title", content: `${loaderData.nombre} — Tembiapo Jaikuaa` },
        ]
      : [{ title: "Tembiapo Jaikuaa" }],
  }),
  component: OficioPage,
});

function OficioPage() {
  const o = Route.useLoaderData();
  const otros = OFICIOS.filter((x) => x.slug !== o.slug).slice(0, 4);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(160deg, ${TB.marino}, ${TB.noche})` }}>
          <Nanduti className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 text-white opacity-20" />
          <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
            <Link to="/tembiapo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Tembiapo Jaikuaa
            </Link>
            <span className="mt-5 grid h-16 w-16 place-items-center rounded-2xl bg-white/10"><IconoOficio slug={o.slug} className="h-9 w-9" /></span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{o.nombre}</h1>
            <p className="mt-2 max-w-xl text-lg text-white/85">{o.resumen}</p>
            {o.lugares.length > 0 && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4" aria-hidden />
                {o.lugares.map((l) => <span key={l} className="rounded-full bg-white/10 px-3 py-1">{l}</span>)}
              </p>
            )}
          </div>
          <div className="h-1.5" style={{ background: TB.rojo }} aria-hidden />
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">El oficio</h2>
              <p className="mt-2 text-lg leading-relaxed text-muted-foreground">{o.detalle}</p>

              <h2 className="mt-8 font-display text-2xl font-bold text-foreground">Sus artesanos</h2>
              <div className="mt-3 rounded-3xl border border-dashed p-6 text-center" style={{ borderColor: TB.hilo, background: TB.lino }}>
                <Store className="mx-auto h-9 w-9" style={{ color: TB.marino }} aria-hidden />
                <p className="mt-2 font-display text-lg font-bold text-foreground">Pronto, los primeros maestros de {o.nombre.toLowerCase().startsWith("arte") ? "este arte" : "este oficio"}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Cada ficha sale con el permiso del artesano, sus fotos, su historia y su WhatsApp.</p>
              </div>
            </div>

            <aside className="rounded-3xl p-5 ring-1" style={{ background: TB.lino, ["--tw-ring-color" as string]: TB.hilo }}>
              <span className="grid h-11 w-11 place-items-center rounded-full text-white" style={{ background: TB.marino }}><Mic2 className="h-5 w-5" aria-hidden /></span>
              <h2 className="mt-3 font-display text-xl font-bold" style={{ color: TB.noche }}>Las palabras del oficio</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada oficio tiene su vocabulario en guaraní: herramientas, puntos, materiales y diseños. Lo vamos a sumar con la voz de los propios artesanos y revisado por docentes especialistas.
              </p>
              <a href={enlaceSumarme(o.nombre)} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl font-display font-bold text-white" style={{ background: TB.rojo }}>
                <MessageCircle className="h-5 w-5" aria-hidden /> Soy artesano de {o.nombre.toLowerCase().startsWith("arte") ? "este arte" : "este oficio"}
              </a>
            </aside>
          </div>
        </section>

        <section className="bg-muted/40">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <h2 className="font-display text-xl font-bold text-foreground">Otros oficios</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {otros.map((x) => <li key={x.slug}><TarjetaOficio o={x} /></li>)}
            </ul>
            <Link to="/tembiapo" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-display font-bold text-primary ring-1 ring-border">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Ver todos los oficios
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
