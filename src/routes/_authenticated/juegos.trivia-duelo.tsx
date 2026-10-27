import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { shuffle } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { ROULETTE, TRIVIA, type TriviaCategoryId, type TriviaQuestion } from "@/lib/trivia";
import { claveTrivia, getTexto } from "@/lib/juego-textos";
import { useJuegoTextos } from "@/lib/use-juego-textos";
import { LiveDuel, LiveDuelStart, type LiveRound } from "@/components/games/live-duel";
import { salaDeLaUrl } from "@/lib/use-sala";

export const Route = createFileRoute("/_authenticated/juegos/trivia-duelo")({
  head: () => ({
    meta: [
      { title: "Duelo de Trivia Paraguaya | Jaikuaa" },
      { name: "description", content: "Dos jugadores, un celular: el primero que acierta la pregunta sobre cultura paraguaya gana el punto." },
      { property: "og:title", content: "Duelo de Trivia Paraguaya | Jaikuaa" },
      { property: "og:description", content: "Trivia de gastronomía, mitos, deportes, música, historia y naturaleza para dos personas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TriviaDuel,
});

const TARGET = 5;
const NEXT_MS = 1800;
type Q = TriviaQuestion & { cat: string; emoji: string; catId: TriviaCategoryId; n: number };

function buildDeck(): Q[] {
  return shuffle(ROULETTE.flatMap((id) => TRIVIA[id].questions.map((q, n) => ({ ...q, cat: TRIVIA[id].title, emoji: TRIVIA[id].emoji, catId: id, n }))));
}

function TriviaDuel() {
  const [match, setMatch] = useState(0);
  const { idx: textos } = useJuegoTextos();
  const [remote, setRemote] = useState<{ code: string; host: boolean } | null>(() => {
    const c = salaDeLaUrl();
    return c ? { code: c, host: false } : null;
  });
  const theme = { mine: TV.j1, rival: TV.j2, ink: TV.tinta, accent: TV.oro };
  return (
    <>
      <ValidationNotice />
      <GameStage
        title="Duelo de Trivia"
        sponsorSlot="trivia-duelo"
        css={CSS}
        background={`radial-gradient(70% 45% at 50% 0%, #1F4A8F 0%, transparent 70%), ${TV.estudio}`}
      >
        {remote ? (
          <LiveDuel
            ns="trivia-duelo"
            code={remote.code}
            host={remote.host}
            path="/juegos/trivia-duelo"
            title="Duelo de Trivia"
            target={TARGET}
            theme={theme}
            xpRef="trivia-duelo"
            oneChance
            buildRounds={(): LiveRound[] =>
              buildDeck().slice(0, TARGET * 2 + 6).map((q) => ({
                prompt: q.q,
                pre: getTexto(textos, "trivia", claveTrivia(q.catId, q.n), "pregunta"),
                sub: `${q.emoji} ${q.cat}`,
                options: q.options,
                answer: q.answer,
              }))
            }
            onExit={() => {
              setRemote(null);
              if (window.location.search.includes("sala=")) window.history.replaceState(window.history.state, "", "/juegos/trivia-duelo");
            }}
          />
        ) : (
          <Board key={match} onRematch={() => setMatch((m) => m + 1)} onRemote={(code, host) => setRemote({ code, host })} theme={theme} />
        )}
      </GameStage>
    </>
  );
}

/* Estudio de concurso: azul noche, luces doradas y un pulsador de concurso (sin ruleta: hay chicos jugando). */
const TV = { estudio: "#0B1F45", oro: "#F6C445", j1: "#0E7C86", j2: "#7A3FB0", tinta: "#0B1F45" };
const JC = [TV.j1, TV.j2] as const;

const CSS = `
.tv-pulse { animation: tv-pulse 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes tv-pulse { 50% { transform: scale(1.06) } }
.tv-bulbs span { animation: tv-bulb 1.2s steps(2) infinite; }
.tv-bulbs span:nth-child(2n) { animation-delay: .6s; }
@keyframes tv-bulb { 50% { opacity: .3 } }
.tv-punto { animation: tv-punto .5s cubic-bezier(.2,1.5,.4,1) 1; }
@keyframes tv-punto { from { transform: scale(1.8) } }
@media (prefers-reduced-motion: reduce) { .tv-pulse, .tv-bulbs span, .tv-punto { animation: none !important } }
`;

/** Pulsador de concurso: el botón que aprieta quien sabe la respuesta. */
function Pulsador({ className = "", late = true }: { className?: string; late?: boolean }) {
  return (
    <svg viewBox="-60 -60 120 120" className={className} aria-hidden>
      <ellipse cx="0" cy="40" rx="50" ry="12" fill="#081633" opacity=".55" />
      <path d="M-46 18 Q-46 40 0 40 Q46 40 46 18 L46 8 Q46 -6 0 -6 Q-46 -6 -46 8 Z" fill="#F3E3B5" />
      <ellipse cx="0" cy="8" rx="46" ry="14" fill="#E8D49A" />
      <g className={late ? "tv-pulse" : ""}>
        <path d="M-34 6 Q-34 -30 0 -30 Q34 -30 34 6 Q34 16 0 16 Q-34 16 -34 6 Z" fill="#D52B1E" />
        <ellipse cx="0" cy="-14" rx="26" ry="10" fill="#FF6B5E" opacity=".75" />
        <ellipse cx="-10" cy="-20" rx="8" ry="3.5" fill="#FFFFFF" opacity=".6" />
      </g>
      {[[-50, -40], [48, -44], [-30, -54], [36, -24]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`} fill="#F6C445" />
      ))}
    </svg>
  );
}

function Focos() {
  return (
    <div className="tv-bulbs flex justify-center gap-3" aria-hidden>
      {Array.from({ length: 11 }, (_, i) => <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: TV.oro, boxShadow: `0 0 8px ${TV.oro}` }} />)}
    </div>
  );
}

function Board({ onRematch, onRemote, theme }: { onRematch: () => void; onRemote: (code: string, host: boolean) => void; theme: { mine: string; rival: string; ink: string; accent: string } }) {
  const feedback = useGameFeedback();
  const [deck] = useState(buildDeck);
  const { idx: textos } = useJuegoTextos();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  // Respuesta de cada jugador en esta pregunta (índice o null)
  const [picks, setPicks] = useState<[number | null, number | null]>([null, null]);
  const [winner, setWinner] = useState<0 | 1 | "none" | null>(null);
  const [started, setStarted] = useState(false);
  const recorded = useRef(false);
  const q = deck[idx % deck.length]!;
  const finished = score[0] >= TARGET || score[1] >= TARGET;
  const xp = Math.min(20, score[0] * 3 + (score[0] >= TARGET ? 5 : 0));

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "trivia-duelo", xp });
  }, [finished, xp, feedback]);

  function next(sc: [number, number]) {
    if (sc[0] >= TARGET || sc[1] >= TARGET) return;
    window.setTimeout(() => { setPicks([null, null]); setWinner(null); setIdx((i) => i + 1); }, NEXT_MS);
  }

  function pick(p: 0 | 1, option: number) {
    if (!started || finished || winner !== null || picks[p] !== null) return;
    const np: [number | null, number | null] = p === 0 ? [option, picks[1]] : [picks[0], option];
    setPicks(np);
    if (option === q.answer) {
      // Acierto: punto para quien respondió primero bien
      feedback("success");
      setWinner(p);
      const sc: [number, number] = [...score] as [number, number];
      sc[p] += 1;
      setScore(sc);
      next(sc);
    } else {
      feedback("error");
      const other = p === 0 ? 1 : 0;
      // Error: si el rival ya falló también, nadie suma
      if (np[other] !== null) { setWinner("none"); next(score); }
    }
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-md space-y-5 text-center">
        <Focos />
        <Pulsador className="mx-auto h-44 w-44 drop-shadow-2xl" />
        <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">Duelo de Trivia</h1>
        <p className="text-white/75">¿Quién sabe más del Paraguay?</p>
        <div className="rounded-3xl bg-white p-5 text-left shadow-2xl" style={{ color: TV.tinta }}>
          <p className="font-display text-lg font-bold">Apoyen el celular sobre la mesa</p>
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            Gastronomía, mitos, deportes, música, historia y naturaleza del Paraguay. Cada uno tiene una sola chance por pregunta:
            el primero que acierta gana el punto. Si fallás, tu rival puede responder tranquilo. Gana quien llega a {TARGET}.
          </p>
          <button type="button" className="mt-4 h-14 w-full rounded-2xl font-display text-xl font-bold" style={{ background: TV.oro, color: TV.tinta }} onClick={() => setStarted(true)}>
            ¡Empezar duelo!
          </button>
          <LiveDuelStart theme={theme} onStart={onRemote} />
        </div>
      </div>
    );
  }

  if (finished) {
    const w = score[0] > score[1] ? 0 : 1;
    const champ = w === 0 ? "Jugador 1" : "Jugador 2";
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <Focos />
        <div className="space-y-3 rounded-3xl p-6 text-white shadow-2xl ring-4" style={{ background: JC[w], ["--tw-ring-color" as string]: TV.oro }}>
          <p className="text-5xl" aria-hidden>🏆</p>
          <p className="font-display text-3xl font-bold">¡{champ} ganó la trivia!</p>
          <p className="font-display text-6xl font-bold tabular-nums">{score[0]} — {score[1]}</p>
          {xp > 0 && <p className="font-bold" style={{ color: TV.oro }}>+{xp} XP</p>}
          <p className="text-xs opacity-80">El XP se suma a la cuenta con sesión iniciada (Jugador 1).</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onRematch} className="inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-bold" style={{ background: TV.oro, color: TV.tinta }}><RotateCcw className="h-5 w-5" /> Revancha ya</button>
          <ShareResult text={`¡Jugamos un Duelo de Trivia Paraguaya en Jaikuaa y terminó ${score[0]} a ${score[1]}! ¿Cuánto sabés del Paraguay? 🇵🇾`} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden" style={{ background: TV.estudio }}>
      <Half p={1} q={q} gn={q ? getTexto(textos, "trivia", claveTrivia(q.catId, q.n), "pregunta") : undefined} pick={picks[1]} winner={winner} onPick={pick} rotated />
      <div className="relative shrink-0 px-2 py-2 text-white" style={{ background: TV.estudio }}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" onClick={onRematch} aria-label="Salir del duelo"><X /></button>
          <span key={`a${score[0]}`} className="tv-punto font-display text-4xl font-bold tabular-nums" style={{ color: "#5FE0E8" }}>{score[0]}</span>
          <div className="flex items-center gap-2">
            <Pulsador className="h-10 w-10" late={winner === null} />
            <span className="max-w-[9rem] truncate text-xs font-semibold" style={{ color: TV.oro }}>{q.emoji} {q.cat}</span>
          </div>
          <span key={`b${score[1]}`} className="tv-punto rotate-180 font-display text-4xl font-bold tabular-nums" style={{ color: "#D3A6FF" }}>{score[1]}</span>
          <span className="h-10 w-10" aria-hidden />
          <span className="sr-only" aria-live="polite">{score[0]} a {score[1]}</span>
        </div>
        {winner !== null && <p className="px-2 pb-1 pt-1 text-center text-xs text-white/90">{q.explanation}</p>}
      </div>
      <Half p={0} q={q} gn={q ? getTexto(textos, "trivia", claveTrivia(q.catId, q.n), "pregunta") : undefined} pick={picks[0]} winner={winner} onPick={pick} />
    </div>
  );
}

function Half({ p, q, gn, pick, winner, onPick, rotated }: {
  p: 0 | 1; q: Q; gn?: string; pick: number | null; winner: 0 | 1 | "none" | null;
  onPick: (p: 0 | 1, o: number) => void; rotated?: boolean;
}) {
  const won = winner === p;
  const status = won ? "¡Punto!" : winner === "none" ? "Nadie acertó" : winner !== null ? "Punto rival" : pick !== null ? "Fallaste, esperá…" : "¡Rápido!";
  return (
    <section
      aria-label={`Jugador ${p + 1}`}
      className={`flex min-h-0 flex-1 flex-col justify-center gap-2.5 px-4 py-2 text-white ${rotated ? "rotate-180" : ""}`}
      style={{ background: JC[p], filter: winner !== null && !won ? "saturate(.5) brightness(.85)" : "none" }}
    >
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>Jugador {p + 1}</span>
        <span className="rounded-full bg-black/20 px-3 py-0.5">{status}</span>
      </div>
      {gn && <div lang="gn" className="text-center font-display text-lg font-bold leading-snug sm:text-xl">{gn}</div>}
      <div className={gn ? "text-center text-sm leading-snug text-white/85" : "text-center font-display text-lg font-bold leading-snug sm:text-xl"}>{q.q}</div>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((o, i) => {
          const reveal = winner !== null && i === q.answer;
          const wrong = pick === i && i !== q.answer;
          return (
            <button
              key={o}
              type="button"
              disabled={pick !== null || winner !== null}
              onPointerDown={(e) => { e.preventDefault(); onPick(p, i); }}
              className="min-h-12 whitespace-normal break-words rounded-2xl px-2 py-1.5 text-sm font-bold transition active:scale-[.98] sm:text-base"
              style={{
                background: reveal ? "#fff" : wrong ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.15)",
                color: reveal ? "#2F7A4A" : "#fff",
                boxShadow: reveal ? `0 0 0 3px ${TV.oro}` : "inset 0 0 0 2px rgba(255,255,255,.3)",
                opacity: (pick !== null || winner !== null) && !reveal && !wrong ? 0.6 : 1,
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </section>
  );
}
