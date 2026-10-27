import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { LessonFilter, NotEnough, useGameWords } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { Volume2 } from "lucide-react";
import { RetoBanner, RetoFinal, useRetoPartida } from "@/components/games/reto";
import { leccionDeReto, orderedBy, shufflerFor, type Reto } from "@/lib/reto";
import { useGameFeedback } from "@/components/games/game-kit";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/juegos/memoria")({
  head: () => ({
    meta: [
      { title: "Memoria | Jaikuaa" },
      { name: "description", content: "Uní cada palabra en guaraní con su traducción al español." },
      { property: "og:title", content: "Memoria | Jaikuaa" },
      { property: "og:description", content: "Juego de memoria con palabras guaraníes y audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Memory,
});

const PAIRS = 6;

function Memory() {
  const { reto, seed, otra } = useRetoPartida("memoria");
  const [lesson, setLesson] = useState<number | null>(() => leccionDeReto(reto));
  const q = useGameWords(lesson);
  const words = useMemo(() => {
    // Traducciones distintas para que cada par sea inequívoco.
    const seenEs = new Set<string>();
    return shufflerFor(seed)(orderedBy(q.data?.words ?? [], (w) => w.gn)).filter((w) => {
      const k = w.es.trim().toLowerCase();
      if (seenEs.has(k)) return false;
      seenEs.add(k);
      return true;
    }).slice(0, PAIRS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, seed]);

  return (
    <GameStage
      title="Memoria"
      sponsorSlot="memoria"
      css={CSS}
      background={`radial-gradient(60% 40% at 50% 30%, #1E3D6B 0%, transparent 70%), ${M.fondo}`}
    >
      <Encaje />
      <div className="relative">
        <div className="mm-filter flex justify-center">
          <LessonFilter value={lesson} onChange={(v) => { otra(); setLesson(v); }} />
        </div>
      </div>
      <div className="relative mt-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : words.length < PAIRS ? (
          <NotEnough min={PAIRS} />
        ) : (
          <>
            <RetoBanner reto={reto} className="mb-3" />
            <Board key={seed} words={words} seed={seed} reto={reto} lesson={lesson} onNext={otra} />
          </>
        )}
      </div>
    </GameStage>
  );
}

/* Paleta del ñandutí: fondo índigo, hilos de colores y tarjetas de papel crema. */
const M = { fondo: "#0F1F3D", carta: "#16305A", papel: "#FFF8EA", tinta: "#13294B", oro: "#F2C14E", rojo: "#D52B1E", verde: "#2FA36B", rosa: "#E0457B" };
const HILOS = [M.oro, M.rojo, M.verde, M.rosa, "#5BB8F0", "#F28C28"];

const CSS = `
.mm-filter label { color: rgba(255,255,255,.8); } .mm-filter select { background: rgba(255,255,255,.08); color: #fff; border-color: rgba(255,255,255,.25); } .mm-filter select option { color: #000; }
.mm .memory-back { background: radial-gradient(circle at 50% 40%, #21447A 0%, ${M.carta} 70%); border: 2px solid rgba(242,193,78,.35); color: ${M.oro}; }
.mm .memory-front { background: ${M.papel}; color: ${M.tinta}; border-width: 3px; }
.mm .memory-card[data-matched="true"] .memory-front { box-shadow: 0 0 0 3px var(--hilo), 0 0 22px -2px var(--hilo); }
.mm-spin { animation: mm-spin 90s linear infinite; transform-origin: center; }
@keyframes mm-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .mm-spin { animation: none } }
`;

/** Un ñandutí grande y tenue que gira despacio detrás de la mesa. */
function Encaje() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <svg viewBox="-100 -100 200 200" className="mm-spin absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 opacity-[.07]" fill="none" stroke="#fff" strokeWidth=".35">
        {[14, 30, 48, 66, 84, 96].map((r) => <circle key={r} r={r} />)}
        {Array.from({ length: 48 }, (_, i) => (
          <path key={i} d="M0 -14 L0 -96" transform={`rotate(${i * 7.5})`} />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} d="M0 -48 Q8 -57 0 -66 Q-8 -57 0 -48" transform={`rotate(${i * 15})`} />
        ))}
      </svg>
    </div>
  );
}

/** Rosetón de ñandutí para el dorso y el marcador de pares. */
function Roseton({ color = M.oro, lleno = true, className = "" }: { color?: string; lleno?: boolean; className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} fill="none" stroke={color} strokeWidth="2" aria-hidden opacity={lleno ? 1 : 0.3}>
      <circle r="44" strokeDasharray="3 4" />
      <circle r="30" />
      <circle r="14" />
      {Array.from({ length: 16 }, (_, k) => <path key={k} d="M0 -14 L0 -44" transform={`rotate(${k * 22.5})`} />)}
      {Array.from({ length: 8 }, (_, k) => <path key={k} d="M0 -30 Q7 -37 0 -44 Q-7 -37 0 -30" fill={lleno ? color : "none"} fillOpacity=".5" transform={`rotate(${k * 45 + 22.5})`} />)}
      <circle r="5" fill={color} />
    </svg>
  );
}

type Card = { id: number; pair: number; kind: "gn" | "es"; text: string; word: GameWord };

function Board({ words, seed, reto, lesson, onNext }: { words: GameWord[]; seed: number; reto: Reto | null; lesson: number | null; onNext: () => void }) {
  const feedback = useGameFeedback();
  const cards = useMemo<Card[]>(
    () =>
      shufflerFor(seed, 1)(
        words.flatMap((w, i) => [
          { id: i * 2, pair: i, kind: "gn" as const, text: w.gn, word: w },
          { id: i * 2 + 1, pair: i, kind: "es" as const, text: w.es, word: w },
        ]),
      ),
    [words],
  );
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const done = matched.size === PAIRS;
  const xp = Math.max(10, 20 - Math.max(0, attempts - PAIRS));
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    recordCompletion({ source: "game", sourceRef: "memoria", xp });
  }, [done, xp]);

  function flip(c: Card) {
    if (open.length === 2 || open.includes(c.id) || matched.has(c.pair)) return;
    if (c.kind === "gn" && c.word.hasAudio) void playGuarani(c.word.gn);
    const next = [...open, c.id];
    setOpen(next);
    if (next.length === 2) {
      setAttempts((a) => a + 1);
      const [a, b] = next.map((id) => cards.find((x) => x.id === id));
      if (!a || !b) return;
      if (a.pair === b.pair) {
        feedback("success");
        setMatched((m) => new Set(m).add(a.pair));
        setOpen([]);
      } else {
        feedback("error");
        window.setTimeout(() => setOpen([]), 900);
      }
    }
  }

  const stars = attempts <= PAIRS + 2 ? 3 : attempts <= PAIRS + 6 ? 2 : 1;
  return (
    <div className="mm space-y-4">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="flex gap-1" aria-label={`Pares encontrados: ${matched.size} de ${PAIRS}`}>
          {Array.from({ length: PAIRS }, (_, k) => (
            <Roseton key={k} color={HILOS[k % HILOS.length]} lleno={k < matched.size} className="h-7 w-7" />
          ))}
        </div>
        <p className="text-sm text-white/75">
          Intentos: <span className="font-display text-lg font-bold text-white">{attempts}</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {cards.map((c) => {
          const shown = open.includes(c.id) || matched.has(c.pair);
          const hilo = HILOS[c.pair % HILOS.length]!;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => flip(c)}
              data-shown={shown}
              data-matched={matched.has(c.pair)}
              aria-label={shown ? c.text : "Carta oculta"}
              className="memory-card aspect-[3/4] w-full rounded-xl"
              style={{ ["--hilo" as string]: hilo }}
            >
              <span className="memory-inner block">
                <span className="memory-face memory-back" aria-hidden>
                  <Roseton className="h-4/5 w-4/5" />
                </span>
                <span
                  className="memory-face memory-front flex-col gap-1 break-words text-center"
                  style={{ borderColor: matched.has(c.pair) ? hilo : c.kind === "gn" ? M.oro : "#C9D4E6" }}
                >
                  {c.kind === "gn" && <Volume2 className="h-4 w-4 opacity-50" aria-hidden />}
                  <span className={c.kind === "gn" ? "font-display text-base font-bold sm:text-xl" : "text-sm font-medium sm:text-base"}>{c.text}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-50">{c.kind === "gn" ? "Guaraní" : "Español"}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {done && (
        <div className="space-y-3 rounded-3xl p-6 text-center" style={{ background: M.papel, color: M.tinta }}>
          <Roseton color={M.rojo} className="mx-auto h-14 w-14" />
          <p className="font-display text-2xl font-bold">¡Tejiste los {PAIRS} pares en {attempts} intentos!</p>
          <p className="text-3xl tracking-widest" style={{ color: M.oro }} aria-label={`${stars} de 3 estrellas`}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <p className="font-bold" style={{ color: M.verde }}>+{xp} XP</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={onNext} className="h-12 rounded-2xl px-6 font-bold text-white" style={{ background: M.tinta }}>Jugar de nuevo</button>
          </div>
          <RetoFinal juego="memoria" seed={seed} puntaje={attempts} total={PAIRS} reto={reto} extra={lesson === null ? undefined : String(lesson)} menosEsMejor unidad="intentos" />
        </div>
      )}
    </div>
  );
}
