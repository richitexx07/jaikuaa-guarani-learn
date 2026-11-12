import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ImageIcon, Loader2, MapPin, Route as RutaIcon } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { BotonWhatsappArtesano, FotoArtesano, IconoOficio, ListaPalabras, SelloMaestro } from "@/components/tembiapo/partes";
import { fichaArtesano } from "@/lib/tembiapo.functions";
import { nombreOficio, TB } from "@/lib/tembiapo";

export const Route = createFileRoute("/tembiapo/maestro/$slug")({
  head: () => ({
    meta: [
      { title: "Artesano — Tembiapo Jaikuaa" },
      { name: "description", content: "Ficha del artesano en Tembiapo Jaikuaa: su historia, sus piezas, las palabras de su oficio con su voz y contacto directo por WhatsApp." },
      { property: "og:type", content: "profile" },
    ],
  }),
  component: FichaPage,
});

function FichaPage() {
  const { slug } = Route.useParams();
  const cargar = useServerFn(fichaArtesano);
  const { data: a, isLoading } = useQuery({ queryKey: ["tembiapo-ficha", slug], queryFn: () => cargar({ data: { slug } }) });
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        <Link to="/tembiapo" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold" style={{ color: TB.marino }}><ArrowLeft className="h-4 w-4" /> Tembiapo Jaikuaa</Link>
        {isLoading ? (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
        ) : !a ? (
          <div className="mt-10 rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: TB.hilo, background: TB.lino }}>
            <p className="font-display text-xl font-bold">No encontramos esta ficha</p>
            <p className="mt-1 text-sm text-muted-foreground">Puede que todavía no esté publicada.</p>
          </div>
        ) : (
          <>
            <section className="mt-2 grid gap-5 sm:grid-cols-[16rem_1fr] sm:items-end">
              <FotoArtesano src={a.foto} nombre={a.nombre} className="aspect-[4/5] w-40 rounded-3xl shadow-elegant sm:w-64" />
              <div className="min-w-0">
                {a.maestro && <SelloMaestro />}
                <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">{a.nombre}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                  <Link to="/tembiapo/oficio/$slug" params={{ slug: a.oficio }} className="inline-flex items-center gap-1 font-semibold" style={{ color: TB.marino }}>
                    <IconoOficio slug={a.oficio} className="h-4 w-4" /> {nombreOficio(a.oficio)}
                  </Link>
                  {(a.ciudad || a.departamento) && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden /> {[a.ciudad, a.departamento].filter(Boolean).join(", ")}</span>}
                </p>
                {a.comunidad && <p className="mt-1 text-sm text-muted-foreground">{a.comunidad}</p>}
                {a.whatsapp && <BotonWhatsappArtesano numero={a.whatsapp} nombre={a.nombre} contacto={a.contacto} className="mt-5 max-w-sm" />}
              </div>
            </section>

            {a.bio && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold text-foreground">Su historia</h2>
                <p className="mt-2 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-foreground/90">{a.bio}</p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-foreground">Sus piezas</h2>
              {a.piezas.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Pronto vas a poder ver sus piezas.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {a.piezas.map((p) => (
                    <li key={p.id}>
                      <Link to="/tembiapo/pieza/$id" params={{ id: p.id }} className="block h-full overflow-hidden rounded-2xl bg-card ring-1 ring-border transition active:scale-[.99] hover:shadow-elegant">
                        {p.foto
                          ? <img src={p.foto} alt={p.titulo} className="aspect-square w-full object-cover" loading="lazy" />
                          : <span className="grid aspect-square place-items-center" style={{ background: TB.lino }}><ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden /></span>}
                        <span className="block p-2.5">
                          <b className="block truncate text-sm text-foreground">{p.titulo}</b>
                          {p.tecnica && <span className="block truncate text-xs text-muted-foreground">{p.tecnica}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {a.palabras.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold text-foreground">Las palabras de su oficio</h2>
                <ListaPalabras palabras={a.palabras} />
              </section>
            )}

            {a.ruta && (
              <Link to="/tembiapo/ruta/$slug" params={{ slug: a.ruta.slug }} className="mt-10 flex min-h-16 items-center gap-3 rounded-2xl p-4 text-white" style={{ background: TB.marino }}>
                <RutaIcon className="h-6 w-6 shrink-0" aria-hidden />
                <span><span className="block text-xs text-white/75">Su taller está en la ruta</span><b className="font-display text-lg">{a.ruta.nombre}</b></span>
              </Link>
            )}

            {a.whatsapp && <BotonWhatsappArtesano numero={a.whatsapp} nombre={a.nombre} contacto={a.contacto} className="mt-10 sm:hidden" />}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
