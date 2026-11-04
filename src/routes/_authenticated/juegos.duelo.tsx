import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, Volume2 } from "lucide-react";
import { LessonFilter, NotEnough, pickDistinct, shuffle, useGameWords } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";
import { useSDT } from "@/lib/i18n-sopa-duelo";
import { LiveDuel, LiveDuelStart, type LiveRound } from "@/components/games/live-duel";
import { ponerSalaEnLaUrl, salaDeLaUrl } from "@/lib/use-sala";
import { NEW_SERIES, PauseButton, RefereeMenu, SeriesLine, addResult, useEndTitle, type DuelEnd, type DuelSeries } from "@/components/games/duel-referee";

export const Route = createFileRoute("/_authenticated/juegos/duelo")({
  head: () => ({
    meta: [
      { title: "Duelo Cara a Cara | Jaikuaa" },
      { name: "description", content: "Dos jugadores, un celular: el primero que toca la traducción correcta de la palabra guaraní gana el punto." },
      { property: "og:title", content: "Duelo Cara a Cara | Jaikuaa" },
      { property: "og:description", content: "Duelo de reflejos en guaraní para dos personas en el mismo celular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Duel,
});

const TARGET = 5;
const MIN_WORDS = 8;
const LOCK_MS = 1000;
const NEXT_MS = 1300;

type Round = { word: GameWord; options: string[] };

function Duel() {
  const [lesson, setLesson] = useState<number | null>(null);
  const q = useGameWords(lesson);
  const [match, setMatch] = useState(0);
  const [series, setSeries] = useState<DuelSeries>(NEW_SERIES);
  const [remote, setRemote] = useState<{ code: string; host: boolean } | null>(() => {
    const c = salaDeLaUrl();
    return c ? { code: c, host: false } : null;
  });
  const pool = useMemo(() => {
    const seen = new Set<string>();
    return pickDistinct(q.data?.words ?? [], 500).filter((w) => {
      const k = w.es.trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [q.data]);

  return (
    <GameStage
      title="Duelo Cara a Cara"
      sponsorSlot="duelo"
      css={CSS}
      background={`linear-gradient(160deg, ${V.rojo} 0%, ${V.rojo} 48%, #FFFFFF 48%, #FFFFFF 52%, ${V.azul} 52%, ${V.azul} 100%)`}
    >
      {!remote && (
        <div className="dv-filter flex justify-center">
          <LessonFilter value={lesson} onChange={setLesson} />
        </div>
      )}
      <div className="mt-6">
        {remote ? (
          <LiveDuel
            key={remote.code}
            ns="duelo"
            code={remote.code}
            host={remote.host}
            path="/juegos/duelo"
            title="Duelo Cara a Cara"
            target={TARGET}
            theme={{ mine: V.azul, rival: V.rojo, ink: V.tinta, accent: V.oro }}
            xpRef="duelo"
            buildRounds={() => liveRounds(pool)}
            onExit={() => {
              setRemote(null);
              ponerSalaEnLaUrl(null);
            }}
          />
        ) : q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : pool.length < MIN_WORDS ? (
          <NotEnough min={MIN_WORDS} />
        ) : (
          <Board key={`${lesson}-${match}`} pool={pool} series={series} onResult={(r) => setSeries((s) => addResult(s, r))} onRematch={() => { setSeries((s) => ({ ...s, match: s.match + 1 })); setMatch((m) => m + 1); }} onRemote={(code, host) => { ponerSalaEnLaUrl(code); setRemote({ code, host }); }} />
        )}
      </div>
    </GameStage>
  );
}

/* Rojo contra azul, como la bandera: cada jugador tiene su color. */
const V = { rojo: "#D52B1E", azul: "#0038A8", tinta: "#101426", oro: "#F6C445" };
const COLOR = [V.azul, V.rojo] as const;

const CSS = `
.dv-filter label { color: #fff; } .dv-filter select { background: rgba(0,0,0,.25); color: #fff; border-color: rgba(255,255,255,.4); } .dv-filter select option { color: #000; }
.dv-rayo { animation: dv-rayo 1.8s ease-in-out infinite; transform-origin: center; }
@keyframes dv-rayo { 0%, 100% { transform: scale(1) rotate(0) } 10% { transform: scale(1.15) rotate(-6deg) } 20% { transform: scale(1) } }
.dv-punto { animation: dv-punto .5s cubic-bezier(.2,1.5,.4,1) 1; }
@keyframes dv-punto { from { transform: scale(1.8) } }
.dv-shake { animation: dv-shake .3s ease-in-out 2; }
@keyframes dv-shake { 25% { transform: translateX(-5px) } 75% { transform: translateX(5px) } }
@media (prefers-reduced-motion: reduce) { .dv-rayo, .dv-punto, .dv-shake { animation: none !important } }
`;

function Rayo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" className={`dv-rayo ${className}`} aria-hidden>
      <path d="M26 0 L4 34 H18 L12 60 L36 22 H22 Z" fill={V.oro} stroke={V.tinta} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function makeRound(pool: GameWord[], used: Set<string>): Round {
  const fresh = pool.filter((w) => !used.has(w.gn));
  const word = shuffle(fresh.length ? fresh : pool)[0]!;
  const distractors = shuffle(pool.filter((w) => w.es !== word.es)).slice(0, 2).map((w) => w.es);
  return { word, options: shuffle([word.es, ...distractors]) };
}

/** Preguntas para el duelo a distancia: las arma el anfitrión y las manda al otro celular. */
function liveRounds(pool: GameWord[]): LiveRound[] {
  const used = new Set<string>();
  return Array.from({ length: TARGET * 2 + 6 }, () => {
    const r = makeRound(pool, used);
    used.add(r.word.gn);
    return { prompt: r.word.gn, sub: "¿Qué significa?", options: r.options, answer: r.options.indexOf(r.word.es), audio: r.word.hasAudio ? r.word.gn : undefined };
  });
}

function Board({ pool, series, onResult, onRematch, onRemote }: { pool: GameWord[]; series: DuelSeries; onResult: (r: 0 | 1 | "draw") => void; onRematch: () => void; onRemote: (code: string, host: boolean) => void }) {
  const feedback = useGameFeedback();
  const tt = useSDT();
  const used = useRef(new Set<string>());
  const [round, setRound] = useState<Round>(() => makeRound(pool, used.current));
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [locked, setLocked] = useState<[boolean, boolean]>([false, false]);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [wrongPick, setWrongPick] = useState<[string | null, string | null]>([null, null]);
  const [started, setStarted] = useState(false);
  const recorded = useRef(false);
  const [menu, setMenu] = useState(false);
  const [end, setEnd] = useState<DuelEnd | null>(null);
  const endTitle = useEndTitle();
  const finished = end !== null || score[0] >= TARGET || score[1] >= TARGET;
  // XP solo para el dueño de la sesión (Jugador 1): 3 por punto + 5 si gana jugando (no por rendición), máx. 20.
  const xp = Math.min(20, score[0] * 3 + (end === null && score[0] >= TARGET ? 5 : 0));
  const champ: 0 | 1 = end?.kind === "forfeit" ? (end.loser === 0 ? 1 : 0) : score[0] > score[1] ? 0 : 1;

  const say = useCallback((w: GameWord) => { if (w.hasAudio) void playGuarani(w.gn); }, []);

  useEffect(() => { if (started && !finished) say(round.word); }, [round, started, say]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    onResult(end?.kind === "draw" ? "draw" : champ);
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "duelo", xp });
  }, [finished, xp, feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(p: 0 | 1, option: string) {
    if (!started || finished || menu || winner !== null || locked[p]) return;
    if (option === round.word.es) {
      feedback("success");
      setWinner(p);
      const next: [number, number] = [...score] as [number, number];
      next[p] += 1;
      setScore(next);
      used.current.add(round.word.gn);
      if (next[p] < TARGET) {
        window.setTimeout(() => {
          setWinner(null);
          setLocked([false, false]);
          setWrongPick([null, null]);
          setRound(makeRound(pool, used.current));
        }, NEXT_MS);
      }
    } else {
      feedback("error");
      setLocked((l) => (p === 0 ? [true, l[1]] : [l[0], true]));
      setWrongPick((w) => (p === 0 ? [option, w[1]] : [w[0], option]));
      window.setTimeout(() => {
        setLocked((l) => (p === 0 ? [false, l[1]] : [l[0], false]));
        setWrongPick((w) => (p === 0 ? [null, w[1]] : [w[0], null]));
      }, LOCK_MS);
    }
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-md space-y-5 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="font-display text-5xl font-bold sm:text-6xl">J1</span>
          <Rayo className="h-20 w-14" />
          <span className="font-display text-5xl font-bold sm:text-6xl">J2</span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">{tt("duelTitle")}</h1>
        <div className="rounded-3xl bg-white p-5 text-left shadow-2xl" style={{ color: V.tinta }}>
          <p className="font-display text-lg font-bold">{tt("tablePhone")}</p>
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            {tt("rules", { n: TARGET })}
          </p>
          <button type="button" className="mt-4 h-14 w-full rounded-2xl tap-3d-dark font-display text-xl font-bold text-white" style={{ background: V.tinta }} onClick={() => setStarted(true)}>
            {tt("startDuel")}
          </button>
          <LiveDuelStart theme={{ mine: V.azul, rival: V.rojo, ink: V.tinta, accent: V.oro }} onStart={onRemote} />
        </div>
      </div>
    );
  }

  if (finished) {
    const w = champ;
    const draw = end?.kind === "draw";
    return (
      <div className="mx-auto max-w-md space-y-4">
      <div className="space-y-4 rounded-3xl p-6 text-center text-white shadow-2xl ring-4 ring-white" style={{ background: draw ? V.tinta : COLOR[w] }}>
        <svg viewBox="0 0 64 64" className="mx-auto h-20 w-20" aria-hidden>
          <path d="M18 8 H46 V22 Q46 38 32 40 Q18 38 18 22 Z" fill={V.oro} />
          <path d="M18 12 H8 Q8 26 20 28 M46 12 H56 Q56 26 44 28" fill="none" stroke={V.oro} strokeWidth="4" />
          <rect x="28" y="40" width="8" height="10" fill={V.oro} />
          <rect x="20" y="50" width="24" height="6" rx="2" fill={V.oro} />
        </svg>
        <p className="font-display text-3xl font-bold">{endTitle(end, w, tt("wonDuel", { n: tt("player", { n: w + 1 }) }))}</p>
        <p className="font-display text-6xl font-bold tabular-nums">{score[0]} — {score[1]}</p>
        {xp > 0 && <p className="font-bold" style={{ color: V.oro }}>+{xp} XP</p>}
        <p className="text-xs opacity-80">{tt("xpNote")}</p>
        <SeriesLine series={series} className="text-white/90" />
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onRematch} className="inline-flex h-12 items-center gap-2 rounded-2xl tap-3d-dark bg-white px-6 font-bold" style={{ color: draw ? V.tinta : COLOR[w] }}><RotateCcw className="h-5 w-5" /> {tt("rematch")}</button>
          <ShareResult text={tt("share", { a: score[0], b: score[1] })} />
        </div>
      </div>
      <div className="rounded-3xl bg-white p-4" style={{ color: V.tinta }}>
        <p className="text-center font-display font-bold">{tt("remoteRematch")}</p>
        <LiveDuelStart theme={{ mine: V.azul, rival: V.rojo, ink: V.tinta, accent: V.oro }} onStart={onRemote} />
      </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] touch-manipulation select-none flex-col overflow-hidden overscroll-none" style={{ background: V.tinta }}>
      <RefereeMenu open={menu} onClose={() => setMenu(false)} onEnd={setEnd} colors={COLOR} ink={V.tinta} />
      <PlayerHalf p={1} round={round} winner={winner} locked={locked[1]} wrong={wrongPick[1]} onPick={pick} rotated />
      <div className="relative flex shrink-0 items-center justify-between gap-2 bg-white px-2 py-2" style={{ color: V.tinta }}>
        <PauseButton onClick={() => setMenu(true)} className="hover:bg-black/5" />
        <span key={`a${score[0]}`} className="dv-punto font-display text-4xl font-bold tabular-nums" style={{ color: V.azul }}>{score[0]}</span>
        <Rayo className="h-10 w-7" />
        <span key={`b${score[1]}`} className="dv-punto rotate-180 font-display text-4xl font-bold tabular-nums" style={{ color: V.rojo }}>{score[1]}</span>
        <button type="button" className="inline-flex h-11 touch-manipulation items-center gap-1.5 rounded-full px-3 text-sm font-bold ring-2 ring-current/30 hover:bg-black/5 disabled:opacity-30" onClick={() => say(round.word)} disabled={!round.word.hasAudio} aria-label={tt("listen")}><Volume2 className="h-4 w-4" aria-hidden />{tt("listenShort")}</button>
        <span className="sr-only" aria-live="polite">{tt("scoreSr", { a: score[0], b: score[1] })}</span>
      </div>
      <PlayerHalf p={0} round={round} winner={winner} locked={locked[0]} wrong={wrongPick[0]} onPick={pick} />
    </div>
  );
}

function PlayerHalf({ p, round, winner, locked, wrong, onPick, rotated }: {
  p: 0 | 1; round: Round; winner: 0 | 1 | null; locked: boolean; wrong: string | null;
  onPick: (p: 0 | 1, o: string) => void; rotated?: boolean;
}) {
  const tt = useSDT();
  const won = winner === p;
  const lost = winner !== null && winner !== p;
  return (
    <section
      aria-label={tt("player", { n: p + 1 })}
      className={`flex min-h-0 flex-1 flex-col justify-center gap-3 px-5 py-3 text-white transition-[filter] ${rotated ? "rotate-180" : ""} ${locked ? "dv-shake" : ""}`}
      style={{ background: COLOR[p], filter: lost ? "saturate(.4) brightness(.8)" : "none" }}
    >
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{tt("player", { n: p + 1 })}</span>
        <span className="rounded-full bg-black/20 px-3 py-0.5">{won ? tt("point") : lost ? tt("rivalPoint") : locked ? tt("locked") : tt("meaning")}</span>
      </div>
      <div className="text-center font-display text-4xl font-bold">{round.word.gn}</div>
      <div className="grid gap-2">
        {round.options.map((o) => {
          const correct = winner !== null && o === round.word.es;
          const isWrong = wrong === o;
          return (
            <button
              key={o}
              type="button"
              disabled={locked || winner !== null}
              onPointerDown={(e) => { e.preventDefault(); onPick(p, o); }}
              className="min-h-12 whitespace-normal break-words rounded-2xl px-3 text-lg font-bold transition active:scale-[.98]"
              style={{
                background: correct ? "#fff" : isWrong ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.16)",
                color: correct ? "#2F7A4A" : "#fff",
                boxShadow: correct ? `0 0 0 3px ${V.oro}` : "inset 0 0 0 2px rgba(255,255,255,.35)",
                opacity: (locked || winner !== null) && !correct && !isWrong ? 0.55 : 1,
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
