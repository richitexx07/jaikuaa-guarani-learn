import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHeader } from "@/components/marketing/page-parts";
import { BotonWhatsappArtesano, FotoArtesano } from "@/components/tembiapo/partes";
import { verPieza } from "@/lib/tembiapo.functions";
import { nombreOficio, TB } from "@/lib/tembiapo";

export const Route = createFileRoute("/tembiapo/pieza/$id")({
  head: () => ({
    meta: [
      { title: "Pieza — Tembiapo Jaikuaa" },
      { name: "description", content: "Una pieza hecha a mano por un artesano del Paraguay. Consultale directo por WhatsApp." },
    ],
  }),
  component: PiezaPage,
});

function PiezaPage() {
  const { id } = Route.useParams();
  const cargar = useServerFn(verPieza);
  const { data: p, isLoading } = useQuery({ queryKey: ["tembiapo-pieza", id], queryFn: () => cargar({ data: { id } }) });
  const [i, setI] = useState(0);
  const datos = p ? ([["Técnica", p.tecnica], ["Materiales", p.materiales], ["Medidas", p.medidas], ["Tiempo de trabajo", p.tiempo]] as const).filter(([, v]) => v) : [];
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        {isLoading ? (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
        ) : !p ? (
          <>
            <Link to="/tembiapo" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold" style={{ color: TB.marino }}><ArrowLeft className="h-4 w-4" /> Tembiapo Jaikuaa</Link>
            <div className="mt-10 rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: TB.hilo, background: TB.lino }}>
              <p className="font-display text-xl font-bold">No encontramos esta pieza</p>
              <p className="mt-1 text-sm text-muted-foreground">Puede que ya no esté en la vitrina.</p>
            </div>
          </>
        ) : (
          <>
            <Link to="/tembiapo/maestro/$slug" params={{ slug: p.artesano.slug }} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold" style={{ color: TB.marino }}>
              <ArrowLeft className="h-4 w-4" /> {p.artesano.nombre}
            </Link>
            <div className="mt-2 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              <section aria-label="Fotos de la pieza">
                <img src={p.fotos[i] ?? p.fotos[0]} alt={p.titulo} className="aspect-square w-full rounded-3xl object-cover shadow-elegant" />
                {p.fotos.length > 1 && (
                  <ul className="mt-3 flex gap-2 overflow-x-auto">
                    {p.fotos.map((f, k) => (
                      <li key={f}>
                        <button type="button" onClick={() => setI(k)} aria-label={`Foto ${k + 1}`} aria-pressed={k === i} className="block h-16 w-16 overflow-hidden rounded-xl ring-2" style={{ ["--tw-ring-color" as string]: k === i ? TB.rojo : "transparent" }}>
                          <img src={f} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <p className="text-sm font-semibold" style={{ color: TB.rojo }}>{nombreOficio(p.artesano.oficio)}</p>
                <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">{p.titulo}</h1>
                {p.descripcion && <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">{p.descripcion}</p>}
                {datos.length > 0 && (
                  <dl className="mt-5 grid grid-cols-2 gap-3">
                    {datos.map(([k, v]) => (
                      <div key={k} className="rounded-2xl p-3" style={{ background: TB.lino }}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="font-semibold text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <Link to="/tembiapo/maestro/$slug" params={{ slug: p.artesano.slug }} className="mt-6 flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
                  <FotoArtesano src={p.artesano.foto} nombre={p.artesano.nombre} className="h-14 w-14 shrink-0 rounded-xl" />
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">Hecha a mano por</span>
                    <b className="block truncate font-display text-lg text-foreground">{p.artesano.nombre}</b>
                    {p.artesano.ciudad && <span className="text-xs text-muted-foreground">{p.artesano.ciudad}</span>}
                  </span>
                </Link>
                {p.artesano.whatsapp && <BotonWhatsappArtesano numero={p.artesano.whatsapp} nombre={p.artesano.nombre} contacto={p.artesano.contacto} pieza={p.titulo} className="mt-5" />}
              </section>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
