import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Expand, Loader2, RotateCcw, Snail, Volume2, X } from "lucide-react";
import { getCourseLessonGuest } from "@/lib/guest.functions";
import { getHumanAudioUrl, playGuarani, prefetchAudio } from "@/lib/audio";
import { avanzar, retroceder, type PasoAula } from "@/lib/modo-clase";

/**
 * Pantalla del modo aula: una palabra por vez, en grande, para proyectar.
 * Ver y escuchar → la clase repite → se muestra el significado. El docente avanza con el botón o con las flechas.
 */
export const Route = createFileRoute("/clase/$n")({
  loader: async ({ params }) => {
    const n = Number(params.n);
    if (!Number.isInteger(n) || n < 1) throw notFound();
    const { lesson } = await getCourseLessonGuest({ data: { n } });
    if (!lesson || lesson.vocab.length === 0) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Modo aula · Lección ${loaderData.lesson.n} — Jaikuaa` : "Modo aula — Jaikuaa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f2747] p-6 text-center text-white">
      <p className="font-display text-3xl font-bold">Esta lección todavía no está en el modo aula.</p>
      <Link to="/clase" className="rounded-full bg-white px-6 py-3 font-semibold text-[#0f2747]">Elegir otra lección</Link>
    </div>
  ),
  component: AulaLeccion,
});

function AulaLeccion() {
  const { lesson } = Route.useLoaderData();
  const words = lesson.vocab;
  const [pos, setPos] = useState<{ i: number; paso: PasoAula }>({ i: 0, paso: "ver" });
  const [fin, setFin] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [sinVoz, setSinVoz] = useState(false);
  const w = words[pos.i];

  // Se bajan los audios de antemano para que suenen al instante en el aula.
  useEffect(() => {
    for (const v of words) void prefetchAudio(v.gn);
  }, [words]);

  useEffect(() => {
    let vivo = true;
    setSinVoz(false);
    void getHumanAudioUrl(w.gn).then((u) => vivo && setSinVoz(u === null));
    return () => { vivo = false; };
  }, [w.gn]);

  const escuchar = useCallback(async (lento = false) => {
    if (sonando) return;
    setSonando(true);
    const ok = await playGuarani(w.gn, lento ? { rate: 0.8 } : undefined);
    setSonando(false);
    if (!ok) setSinVoz(true);
  }, [sonando, w.gn]);

  const siguiente = useCallback(() => {
    const r = avanzar(pos, words.length);
    if (r === "fin") setFin(true);
    else setPos(r);
  }, [pos, words.length]);
  const anterior = useCallback(() => { setFin(false); setPos((p) => retroceder(p)); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); siguiente(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); anterior(); }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); void escuchar(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [siguiente, anterior, escuchar]);

  const pantallaCompleta = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0f2747] text-white">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <Link to="/clase" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
          <X className="h-4 w-4" aria-hidden /> Salir
        </Link>
        <p className="truncate font-display text-lg font-semibold text-white/80">Lección {lesson.n} · {lesson.title}</p>
        <button type="button" onClick={pantallaCompleta} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
          <Expand className="h-4 w-4" aria-hidden /> Pantalla completa
        </button>
      </header>

      {fin ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
          <p className="font-display text-[clamp(3rem,9vw,8rem)] font-bold leading-none text-[#f2c14e]">¡Muy bien, clase!</p>
          <p className="max-w-2xl text-[clamp(1.25rem,2.5vw,2rem)] text-white/85">Terminamos las {words.length} palabras de la Lección {lesson.n}.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button type="button" onClick={() => { setFin(false); setPos({ i: 0, paso: "ver" }); }} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-xl font-bold text-[#0f2747]">
              <RotateCcw className="h-5 w-5" aria-hidden /> Repasar de nuevo
            </button>
            <Link to="/clase" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-4 text-xl font-bold hover:bg-white/20">Otra lección</Link>
          </div>
        </main>
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[clamp(1rem,2vw,1.5rem)] font-semibold text-white/60">Palabra {pos.i + 1} de {words.length}</p>
          <p lang="gn" className="mt-4 break-words font-display text-[clamp(3.5rem,12vw,11rem)] font-bold leading-[1.05]">{w.gn}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => void escuchar()}
              disabled={sonando}
              className="inline-flex items-center gap-3 rounded-full bg-[#f2c14e] px-9 py-5 text-[clamp(1.25rem,2.6vw,2rem)] font-bold text-[#0f2747] shadow-xl transition active:scale-[.97] disabled:opacity-70"
            >
              {sonando ? <Loader2 className="h-7 w-7 motion-safe:animate-spin" aria-hidden /> : <Volume2 className="h-7 w-7" aria-hidden />}
              Escuchar
            </button>
            <button type="button" onClick={() => void escuchar(true)} disabled={sonando} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-5 text-lg font-semibold hover:bg-white/20 disabled:opacity-60">
              <Snail className="h-5 w-5" aria-hidden /> Más despacio
            </button>
          </div>
          {sinVoz && <p className="mt-3 text-base text-white/70">Esta palabra todavía no tiene voz grabada: la lee el docente.</p>}

          <div className="mt-10 min-h-[7rem]">
            {pos.paso === "repetir" && (
              <p className="font-display text-[clamp(2rem,5vw,4rem)] font-bold text-[#f2c14e]">¡Ahora repitan todos!</p>
            )}
            {pos.paso === "significado" && (
              <p className="text-[clamp(1.75rem,4.5vw,3.5rem)] font-semibold text-white/90">Significa: <span className="text-white">{w.es}</span></p>
            )}
          </div>
        </main>
      )}

      {!fin && (
        <footer className="flex items-center justify-between gap-4 px-5 pb-6">
          <button type="button" onClick={anterior} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-4 text-lg font-semibold hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" aria-hidden /> Atrás
          </button>
          <div className="hidden gap-2 sm:flex" aria-hidden>
            {words.map((_, k) => (
              <span key={k} className={`h-2.5 w-2.5 rounded-full ${k < pos.i ? "bg-[#f2c14e]" : k === pos.i ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
          <button type="button" onClick={siguiente} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-bold text-[#0f2747]">
            {pos.paso === "ver" ? "Repetir" : pos.paso === "repetir" ? "Ver significado" : pos.i + 1 < words.length ? "Siguiente palabra" : "Terminar"}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </footer>
      )}
    </div>
  );
}
