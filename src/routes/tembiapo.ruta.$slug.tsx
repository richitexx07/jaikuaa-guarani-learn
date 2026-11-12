import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, Loader2, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { Nanduti } from "@/components/libreria/arte";
import { TarjetaArtesano } from "@/components/tembiapo/partes";
import { verRuta } from "@/lib/tembiapo.functions";
import { TB } from "@/lib/tembiapo";

export const Route = createFileRoute("/tembiapo/ruta/$slug")({
  head: () => ({
    meta: [
      { title: "Ruta cultural — Tembiapo Jaikuaa" },
      { name: "description", content: "Un recorrido por los pueblos donde nacen los oficios del Paraguay, para visitar los talleres y conocer a sus artesanos." },
    ],
  }),
  component: RutaPage,
});

function RutaPage() {
  const { slug } = Route.useParams();
  const cargar = useServerFn(verRuta);
  const { data: r, isLoading } = useQuery({ queryKey: ["tembiapo-ruta", slug], queryFn: () => cargar({ data: { slug } }) });
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        {isLoading ? (
          <p className="mx-auto mt-10 flex max-w-5xl items-center gap-2 px-4 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
        ) : !r ? (
          <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
            <Link to="/tembiapo" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold" style={{ color: TB.marino }}><ArrowLeft className="h-4 w-4" /> Tembiapo Jaikuaa</Link>
            <div className="mt-10 rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: TB.hilo, background: TB.lino }}>
              <p className="font-display text-xl font-bold">No encontramos esta ruta</p>
              <p className="mt-1 text-sm text-muted-foreground">Puede que todavía no esté publicada.</p>
            </div>
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(160deg, ${TB.marino}, ${TB.noche})` }}>
              {r.foto && <img src={r.foto} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
              <Nanduti className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 text-white opacity-20" />
              <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
                <Link to="/tembiapo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden /> Tembiapo Jaikuaa</Link>
                <p className="mt-5 text-sm font-semibold text-white/80">Ruta cultural</p>
                <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{r.nombre}</h1>
                {r.lugares.length > 0 && (
                  <ol className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {r.lugares.map((l, k) => (
                      <li key={l} className="flex items-center gap-2">
                        {k > 0 && <span aria-hidden className="h-px w-4 bg-white/50" />}
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1"><MapPin className="h-3.5 w-3.5" aria-hidden /> {l}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="h-1.5" style={{ background: TB.rojo }} aria-hidden />
            </section>

            <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
              {r.descripcion && <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-foreground/90">{r.descripcion}</p>}
              <h2 className="mt-8 font-display text-2xl font-bold text-foreground">Los talleres de esta ruta</h2>
              {r.artesanos.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Pronto sumamos a los artesanos de esta ruta.</p>
              ) : (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {r.artesanos.map((a) => <li key={a.id}><TarjetaArtesano a={a} /></li>)}
                </ul>
              )}
              {r.auspiciante && (
                <p className="mt-10 flex flex-wrap items-center gap-2 rounded-2xl p-4 text-sm" style={{ background: TB.lino }}>
                  Esta ruta se recorre con el apoyo de
                  {r.auspicianteUrl
                    ? <a href={r.auspicianteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold" style={{ color: TB.marino }}>{r.auspiciante} <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
                    : <b style={{ color: TB.marino }}>{r.auspiciante}</b>}
                </p>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
