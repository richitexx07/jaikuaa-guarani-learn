import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, Volume2, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { withOfflineCache } from "@/lib/offline-data";
import { getMostradorAudio, listMostrador } from "@/lib/mostrador.functions";
import { agruparPorSituacion, isRubro, RUBROS, type Frase, type RubroId } from "@/lib/mostrador";
import { countOffline, playFrase, prefetchFrases, saveOffline, stopFrase } from "@/lib/mostrador-audio";
import jaiAtencion from "@/assets/jai-atencion-pro.webp";

export const Route = createFileRoute("/_authenticated/mostrador/")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Atendé en guaraní" },
      {
        name: "description",
        content: "Modo mostrador: hacé escuchar frases en guaraní grabadas por hablantes paraguayos al atender a una persona.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { rubro?: RubroId } =>
    typeof s.rubro === "string" && isRubro(s.rubro) ? { rubro: s.rubro } : {},
  component: MostradorPage,
});

function MostradorPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const rubro: RubroId = search.rubro ?? "salud";
  const listFn = useServerFn(listMostrador);
  const audioFn = useServerFn(getMostradorAudio);

  const { data, isLoading, error } = useQuery({
    queryKey: ["mostrador", rubro],
    queryFn: () =>
      withOfflineCache(`mostrador:${rubro}`, () => listFn({ data: { rubro, todas: false } }), {
        label: "Las frases",
      }),
  });
  const frases = useMemo(() => data?.frases ?? [], [data]);
  const grupos = useMemo(() => agruparPorSituacion(frases), [frases]);
  const ids = useMemo(() => frases.filter((f) => f.hasAudio).map((f) => f.id), [frases]);

  const { data: audio } = useQuery({
    queryKey: ["mostrador-audio", rubro, ids.join(",")],
    enabled: ids.length > 0 && typeof navigator !== "undefined" && navigator.onLine !== false,
    staleTime: 30 * 60 * 1000,
    queryFn: () => audioFn({ data: { ids: ids.slice(0, 80) } }),
  });
  const urls = audio?.urls ?? {};
  useEffect(() => { if (audio?.urls) prefetchFrases(audio.urls); }, [audio?.urls]);

  const [guardadas, setGuardadas] = useState(0);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    let alive = true;
    void countOffline(ids).then((n) => alive && setGuardadas(n));
    return () => {
      alive = false;
    };
  }, [ids]);

  const [abierta, setAbierta] = useState<{ lista: Frase[]; i: number } | null>(null);
  const [sonando, setSonando] = useState<string | null>(null);

  async function escuchar(f: Frase) {
    setSonando(f.id);
    const ok = await playFrase(f.id, urls[f.id]);
    setSonando(null);
    if (!ok) toast.error("No se pudo reproducir la grabación. Probá de nuevo.");
  }

  async function guardarSinSenal() {
    if (Object.keys(urls).length === 0) return toast.error("Necesitás señal para bajar las grabaciones.");
    setGuardando(true);
    const n = await saveOffline(urls);
    setGuardando(false);
    setGuardadas(await countOffline(ids));
    toast.success(n > 0 ? "Listo: estas frases ya suenan sin señal." : "No se pudo guardar. Probá con mejor señal.");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Modo mostrador</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">Atendé en guaraní</h1>
            </div>
            <img src={jaiAtencion} alt="Jai, listo para atender" className="h-24 w-auto shrink-0 drop-shadow-lg sm:h-32" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Elegí la frase y hacésela escuchar a la persona que atendés: la grabó un hablante paraguayo y la validaron
            docentes especialistas. Tocá <Maximize2 className="inline h-3.5 w-3.5" aria-hidden /> para mostrarla en
            grande.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3" role="tablist" aria-label="Rubro">
            {RUBROS.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={r.id === rubro}
                onClick={() => navigate({ search: { rubro: r.id }, replace: true })}
                className={`rounded-2xl border p-4 text-left transition ${
                  r.id === rubro
                    ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {r.emoji}
                </span>
                <span className="mt-1 block font-display text-base font-bold">{r.label}</span>
                <span className={`block text-xs ${r.id === rubro ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {r.desc}
                </span>
              </button>
            ))}
          </div>

          {data?.isStaff && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
              <span className="font-semibold text-foreground">Para docentes:</span>{" "}
              <Link to="/mostrador/editar" search={{ rubro }} className="font-semibold text-primary hover:underline">
                cargar el guaraní, grabar y validar →
              </Link>
            </div>
          )}

          {isLoading && (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          )}
          {error && <p className="mt-8 text-center text-sm text-destructive">{(error as Error).message}</p>}

          {!isLoading && !error && frases.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-primary/40 bg-card p-6 text-center">
              <p className="font-display text-lg font-bold text-foreground">Las frases se están preparando</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Docentes especialistas escriben cada frase en guaraní, otro docente la valida y un hablante paraguayo la
                graba. Apenas estén listas, aparecen acá.
              </p>
              {(data?.pendientes ?? 0) > 0 && (
                <p className="mt-3 text-xs font-semibold text-primary">{data?.pendientes} frases en preparación</p>
              )}
            </div>
          )}

          {frases.length > 0 && ids.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 text-sm">
              {guardadas >= ids.length ? (
                <span className="flex items-center gap-2 font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Listas para usar sin señal
                </span>
              ) : (
                <>
                  <span className="text-muted-foreground">¿Atendés donde no hay señal?</span>
                  <Button size="sm" variant="outline" onClick={guardarSinSenal} disabled={guardando}>
                    {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Guardar en el teléfono
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="mt-6 space-y-8">
            {grupos.map((g) => (
              <section key={g.nombre} aria-labelledby={`sit-${g.nombre}`}>
                <h2 id={`sit-${g.nombre}`} className="font-display text-lg font-bold text-foreground">
                  {g.nombre}
                </h2>
                {g.tipo === "escuchar" && (
                  <p className="mt-0.5 text-xs text-muted-foreground">Escuchalas para reconocerlas cuando te respondan.</p>
                )}
                <ul className="mt-3 space-y-2">
                  {g.frases.map((f, i) => (
                    <li key={f.id} className="flex items-stretch gap-2 rounded-2xl border bg-card p-3 shadow-sm">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setAbierta({ lista: g.frases, i })}
                        aria-label={`Mostrar en grande: ${f.es}`}
                      >
                        <span className="block text-sm text-muted-foreground">{f.es}</span>
                        <span className="mt-0.5 block font-display text-lg font-bold leading-snug text-foreground">
                          {f.gn}
                        </span>
                      </button>
                      <div className="flex shrink-0 flex-col gap-2">
                        <Button
                          variant="cta"
                          className="h-12 gap-1.5 rounded-full px-4"
                          onClick={() => void escuchar(f)}
                          disabled={sonando === f.id}
                          aria-label={`Hacer escuchar: ${f.es}`}
                        >
                          {sonando === f.id ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
                          Escuchar
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-9 gap-1 px-3 text-xs"
                          onClick={() => setAbierta({ lista: g.frases, i })}
                          aria-label={`Mostrar en grande: ${f.es}`}
                        >
                          <Maximize2 className="h-4 w-4" aria-hidden /> En grande
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>

      {abierta && (
        <PantallaGrande
          lista={abierta.lista}
          i={abierta.i}
          sonando={sonando}
          onEscuchar={escuchar}
          onMover={(i) => setAbierta({ ...abierta, i })}
          onCerrar={() => {
            stopFrase();
            setAbierta(null);
          }}
        />
      )}
    </div>
  );
}

/** La frase en grande, para girar el teléfono hacia la persona que se atiende. */
function PantallaGrande({
  lista,
  i,
  sonando,
  onEscuchar,
  onMover,
  onCerrar,
}: {
  lista: Frase[];
  i: number;
  sonando: string | null;
  onEscuchar: (f: Frase) => void;
  onMover: (i: number) => void;
  onCerrar: () => void;
}) {
  const f = lista[i];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);
  if (!f) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={f.es}
      className="fixed inset-0 z-50 flex flex-col bg-primary text-primary-foreground"
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm opacity-80">
          {f.situacion} · {i + 1} de {lista.length}
        </span>
        <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/10" onClick={onCerrar} aria-label="Cerrar">
          <X className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-display text-4xl font-bold leading-tight sm:text-6xl" lang="gn">
          {f.gn}
        </p>
        <p className="text-lg opacity-80 sm:text-xl">{f.es}</p>
        <Button
          variant="cta"
          className="mt-2 h-16 rounded-full px-8 text-lg"
          onClick={() => onEscuchar(f)}
          disabled={sonando === f.id}
        >
          {sonando === f.id ? <Loader2 className="h-6 w-6 animate-spin" /> : <Volume2 className="h-6 w-6" />}
          Escuchar
        </Button>
      </div>
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          className="h-12 text-primary-foreground hover:bg-white/10"
          disabled={i === 0}
          onClick={() => onMover(i - 1)}
        >
          <ChevronLeft className="h-5 w-5" /> Anterior
        </Button>
        <Button
          variant="ghost"
          className="h-12 text-primary-foreground hover:bg-white/10"
          disabled={i === lista.length - 1}
          onClick={() => onMover(i + 1)}
        >
          Siguiente <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
