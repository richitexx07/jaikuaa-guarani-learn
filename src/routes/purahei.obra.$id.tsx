import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookA, Loader2, Mic2, Pause, Play, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BotonWhatsapp, ChipEstilo, PH } from "@/components/purahei/partes";
import { verObra, verObraParaRevisar, type ObraCompleta } from "@/lib/purahei.functions";
import { marcarGlosario, type Termino } from "@/lib/purahei";
import { callarVoz } from "@/lib/voz-unica";

export const Route = createFileRoute("/purahei/obra/$id")({
  validateSearch: (s: Record<string, unknown>): { revisar?: 1 } => (s.revisar === 1 || s.revisar === "1" ? { revisar: 1 } : {}),
  head: () => ({
    meta: [
      { title: "Letra — Purahéi Jaikuaa" },
      { name: "description", content: "La letra en guaraní y castellano, con glosario revisado por docentes especialistas y la voz real del artista." },
    ],
  }),
  component: VisorPage,
});

type Modo = "ambos" | "gn" | "es";

function VisorPage() {
  const { id } = Route.useParams();
  const { revisar } = Route.useSearch();
  const publica = useServerFn(verObra);
  const staff = useServerFn(verObraParaRevisar);
  const { data: o, isLoading } = useQuery({
    queryKey: ["purahei-obra", id, revisar],
    queryFn: async () => (revisar ? staff({ data: { id } }) : publica({ data: { id } })),
    retry: false,
  });
  const [modo, setModo] = useState<Modo>("ambos");
  const [termino, setTermino] = useState<Termino | null>(null);
  const [glosario, setGlosario] = useState(false);

  if (isLoading) return <Pantalla><p className="mt-16 flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando la letra…</p></Pantalla>;
  if (!o) {
    return (
      <Pantalla>
        <div className="mt-16 rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-display text-xl font-bold">No encontramos esta obra</p>
          <p className="mt-1 text-sm text-muted-foreground">Puede que todavía no esté publicada.</p>
          <Link to="/purahei" className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary">Ir a la vitrina</Link>
        </div>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <header className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Link to="/purahei/$slug" params={{ slug: o.artista.slug }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1 ring-border" aria-label={`Volver a ${o.artista.nombre}`}><ArrowLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold leading-tight text-foreground">{o.titulo}</p>
            <p className="truncate text-xs text-muted-foreground">{o.artista.nombre}</p>
          </div>
          {o.glosario.length > 0 && (
            <button type="button" onClick={() => setGlosario(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary ring-1 ring-border">
              <BookA className="h-4 w-4" aria-hidden /> Glosario
            </button>
          )}
        </div>
      </header>

      {revisar && <AvisoRevision o={o} />}

      <section className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <ChipEstilo estilo={o.estilo} />
          {o.anio && <span className="text-sm text-muted-foreground">{o.anio}</span>}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {o.autor && <><dt className="text-muted-foreground">Autor</dt><dd className="font-semibold text-foreground">{o.autor}</dd></>}
          {o.interprete && <><dt className="text-muted-foreground">Intérprete</dt><dd className="font-semibold text-foreground">{o.interprete}</dd></>}
          {o.productor && <><dt className="text-muted-foreground">Producción</dt><dd className="font-semibold text-foreground">{o.productor}</dd></>}
        </dl>
        {o.descripcion && <p className="mt-3 text-foreground/85">{o.descripcion}</p>}
      </section>

      {o.audio && <Reproductor src={o.audio} titulo={o.titulo} />}

      <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1" role="tablist" aria-label="Cómo ver la letra">
        {([["ambos", "Bilingüe"], ["gn", "Guaraní"], ["es", "Castellano"]] as [Modo, string][]).map(([m, t]) => (
          <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => setModo(m)} className={`min-h-11 rounded-xl text-sm font-semibold transition ${modo === m ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      <ol className="mt-5 space-y-5 pb-36">
        {o.versos.map((v, i) => (
          <li key={i} className="leading-snug">
            {modo !== "es" && (
              <p className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {marcarGlosario(v.gn, o.glosario).map((p, k) => p.termino ? (
                  <button key={k} type="button" onClick={() => setTermino(p.termino!)} className="rounded underline decoration-dotted decoration-2 underline-offset-4" style={{ textDecorationColor: PH.rojo }}>{p.t}</button>
                ) : <span key={k}>{p.t}</span>)}
              </p>
            )}
            {modo !== "gn" && v.es && <p className={modo === "es" ? "font-display text-2xl text-foreground" : "mt-1 text-base italic text-muted-foreground"}>{v.es}</p>}
          </li>
        ))}
        <li className="flex items-center gap-2 pt-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" aria-hidden /> Letra y glosario revisados por docentes especialistas.</li>
      </ol>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2">
          {o.karaoke && (
            <Link to="/juegos/karaoke" search={{ obra: o.id }} className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold" style={{ background: PH.dorado, color: PH.noche }}>
              <Mic2 className="h-5 w-5" aria-hidden /> Cantala en Purahéi
            </Link>
          )}
          {o.artista.whatsapp && !o.karaoke && <BotonWhatsapp numero={o.artista.whatsapp} artista={o.artista.nombre} contacto={o.artista.contacto} className="flex-1" />}
        </div>
      </div>

      <Dialog open={!!termino} onOpenChange={(v) => { if (!v) setTermino(null); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl">
          <DialogTitle className="font-display text-2xl">{termino?.termino}</DialogTitle>
          <DialogDescription className="whitespace-pre-line text-base text-foreground">{termino?.nota}</DialogDescription>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Glosario revisado por docentes especialistas</p>
        </DialogContent>
      </Dialog>
      <Dialog open={glosario} onOpenChange={setGlosario}>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl">
          <DialogTitle className="font-display text-2xl">Glosario poético</DialogTitle>
          <DialogDescription>Las palabras y expresiones de «{o.titulo}», explicadas por docentes especialistas.</DialogDescription>
          <dl className="space-y-3">
            {o.glosario.map((g) => (
              <div key={g.termino} className="rounded-2xl bg-muted/60 p-3">
                <dt className="font-display text-lg font-bold text-foreground">{g.termino}</dt>
                <dd className="whitespace-pre-line text-sm text-foreground/85">{g.nota}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </Pantalla>
  );
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background"><main className="mx-auto w-full max-w-3xl px-4 sm:px-6">{children}</main></div>;
}

function AvisoRevision({ o }: { o: ObraCompleta }) {
  return (
    <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <b>Vista de revisión.</b> {o.publicado ? "Esta obra está publicada." : "Esta obra todavía no está publicada."} {o.revisado ? "Ya tiene revisión docente." : "Falta la revisión de un docente."}
    </div>
  );
}

/** La voz real del artista: reproducir, pausar, ir a un momento y escuchar más despacio. */
function Reproductor({ src, titulo }: { src: string; titulo: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [sonando, setSonando] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [lento, setLento] = useState(false);
  useEffect(() => () => { audio.current?.pause(); }, []);
  function alternar() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) { callarVoz(); void a.play(); } else a.pause();
  }
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return (
    <div className="mt-5 flex items-center gap-3 rounded-3xl p-3 text-white" style={{ background: `linear-gradient(135deg, ${PH.marino}, ${PH.noche})` }}>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
      />
      <button type="button" onClick={alternar} className="grid h-14 w-14 shrink-0 place-items-center rounded-full" style={{ background: PH.dorado, color: PH.noche }} aria-label={sonando ? "Pausar" : `Escuchar ${titulo}`}>
        {sonando ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="h-6 w-6" fill="currentColor" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Con la voz del artista</p>
        <input
          type="range"
          min={0}
          max={dur || 1}
          step={0.1}
          value={pos}
          onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); }}
          className="mt-1 w-full accent-[#F6C445]"
          aria-label="Ir a un momento de la canción"
        />
        <p className="text-xs text-white/70">{mmss(pos)} / {mmss(dur)}</p>
      </div>
      <button
        type="button"
        onClick={() => { const n = !lento; setLento(n); if (audio.current) { audio.current.playbackRate = n ? 0.75 : 1; audio.current.preservesPitch = true; } }}
        className="h-11 shrink-0 rounded-full px-3 text-sm font-bold ring-1 ring-white/40"
        aria-pressed={lento}
      >
        {lento ? "0,75×" : "1×"}
      </button>
    </div>
  );
}
