import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronRight, ExternalLink, Headphones, Loader2, MapPin, Mic2 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { BotonWhatsapp, ChipEstilo, FotoArtista, PH } from "@/components/purahei/partes";
import { fichaArtista } from "@/lib/purahei.functions";

export const Route = createFileRoute("/purahei/$slug")({
  head: () => ({
    meta: [
      { title: "Artista — Purahéi Jaikuaa" },
      { name: "description", content: "Ficha del artista en Purahéi Jaikuaa: su voz, sus letras en guaraní y castellano, y contacto directo por WhatsApp." },
      { property: "og:type", content: "profile" },
    ],
  }),
  component: FichaPage,
});

function FichaPage() {
  const { slug } = Route.useParams();
  const cargar = useServerFn(fichaArtista);
  const { data: a, isLoading } = useQuery({ queryKey: ["purahei-ficha", slug], queryFn: () => cargar({ data: { slug } }) });
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        <Link to="/purahei" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Todos los artistas</Link>
        {isLoading ? (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
        ) : !a ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="font-display text-xl font-bold">No encontramos este artista</p>
            <p className="mt-1 text-sm text-muted-foreground">Puede que su ficha todavía no esté publicada.</p>
          </div>
        ) : (
          <>
            <section className="mt-2 flex items-end gap-4">
              <FotoArtista src={a.foto} nombre={a.nombre} className="aspect-[4/5] w-32 shrink-0 rounded-3xl shadow-elegant sm:w-60" />
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: PH.rojo }}>Purahéi Jaikuaa</p>
                <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">{a.nombre}</h1>
                {a.ciudad && <p className="mt-1 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden /> {a.ciudad}</p>}
                {a.whatsapp && <BotonWhatsapp numero={a.whatsapp} artista={a.nombre} contacto={a.contacto} className="mt-5 hidden sm:block" />}
              </div>
            </section>
            {a.whatsapp && <BotonWhatsapp numero={a.whatsapp} artista={a.nombre} contacto={a.contacto} className="mt-5 sm:hidden" />}

            {a.bio && (
              <section className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">Su historia</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/90">{a.bio}</p>
              </section>
            )}

            <section className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Obras</h2>
              {a.obras.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Pronto vas a poder leer y escuchar sus obras.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {a.obras.map((o) => (
                    <li key={o.id}>
                      <Link to="/purahei/obra/$id" params={{ id: o.id }} className="flex min-h-16 items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border transition active:scale-[.99]">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-white" style={{ background: PH.marino }}><Mic2 className="h-5 w-5" aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate font-display text-lg text-foreground">{o.titulo}</b>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <ChipEstilo estilo={o.estilo} />
                            {o.anio && <span>{o.anio}</span>}
                            {o.audio && <span className="inline-flex items-center gap-1"><Headphones className="h-3 w-3" aria-hidden /> Con su voz</span>}
                            {o.karaoke && <span className="font-semibold" style={{ color: PH.rojo }}>Para cantar en Purahéi</span>}
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {a.enlaces.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-xl font-bold text-foreground">Escuchalo también en</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {a.enlaces.map((e) => (
                    <li key={e.url}>
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-primary ring-1 ring-border">
                        {e.nombre} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
