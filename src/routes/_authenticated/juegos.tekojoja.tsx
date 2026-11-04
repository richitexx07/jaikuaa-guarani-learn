import { createFileRoute } from "@tanstack/react-router";
import { QuitGameButton } from "@/components/games/quit-game-button";
import { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { shufflerFor } from "@/lib/reto";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { CASES } from "@/lib/juegos-contenido";
import { applyTekojoja, type CaseConGn } from "@/lib/juego-textos";
import { useJuegoTextos } from "@/lib/use-juego-textos";
import { useJU } from "@/lib/i18n-juegos-ui";

export const Route = createFileRoute("/_authenticated/juegos/tekojoja")({
  head: () => ({
    meta: [
      { title: "Tekojoja · Juzgado de Paz | Jaikuaa" },
      { name: "description", content: "Resolvé casos de un Juzgado de Paz y aprendé el vocabulario jurídico, con contenido para validar por especialistas." },
      { property: "og:title", content: "Tekojoja · Juzgado de Paz | Jaikuaa" },
      { property: "og:description", content: "Juego de casos jurídicos cotidianos para aprender términos legales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tekojoja,
});

const ROUNDS = 5;

/* Sala del juzgado: bordó y madera, carpeta de expediente y sellos dorados. */
const J = { bordo: "#4A1F2B", madera: "#3A1621", oro: "#E8C26A", carpeta: "#F1E2BE", papel: "#FFFCF4", tinta: "#2B1A12", verde: "#2F7A4A", rojo: "#B3261E" };

const CSS = `
.tj-mazo { transform-origin: 80% 80%; transform: rotate(-28deg); }
.tj-golpe .tj-mazo { animation: tj-golpe .45s cubic-bezier(.6,0,.4,1) 1 both; }
@keyframes tj-golpe { 0% { transform: rotate(-28deg) } 60% { transform: rotate(8deg) } 100% { transform: rotate(0deg) } }
.tj-sello { animation: tj-sello .4s cubic-bezier(.2,1.6,.4,1) .25s 1 both; }
@keyframes tj-sello { from { transform: scale(2.4) rotate(-20deg); opacity: 0 } }
.tj-in { animation: tj-in .45s cubic-bezier(.2,.8,.2,1) 1 both; }
@keyframes tj-in { from { transform: translateX(30px) rotate(2deg); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .tj-golpe .tj-mazo, .tj-sello, .tj-in { animation: none !important } }
`;

function Mazo({ golpe }: { golpe: boolean }) {
  return (
    <svg viewBox="0 0 120 80" className={`h-16 w-24 ${golpe ? "tj-golpe" : ""}`} aria-hidden>
      <rect x="62" y="64" width="50" height="10" rx="3" fill="#6E3F18" />
      <rect x="70" y="58" width="34" height="8" rx="2" fill="#8A5221" />
      <g className="tj-mazo" style={{ transformBox: "view-box" }}>
        <rect x="10" y="44" width="62" height="7" rx="3" fill="#8A5221" transform="rotate(-20 40 48)" />
        <rect x="64" y="22" width="22" height="34" rx="5" fill="#6E3F18" transform="rotate(-20 75 39)" />
        <rect x="62" y="30" width="26" height="5" fill={J.oro} transform="rotate(-20 75 39)" />
      </g>
    </svg>
  );
}

function Tekojoja() {
  const partida = useRetoPartida("tekojoja", { total: ROUNDS });
  const { seed, otra } = partida;
  const { idx, loading } = useJuegoTextos();
  const tt = useJU();
  const all = useMemo(() => applyTekojoja(CASES, idx), [idx]);
  return (
    <GameStage
      title="Tekojoja · Juzgado de Paz"
      sponsorSlot="tekojoja"
      css={CSS}
      background={`repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 2px, transparent 2px 90px), linear-gradient(180deg, ${J.bordo} 0%, ${J.madera} 100%)`}
    >
      <ValidationNotice />
      {loading ? <p className="py-16 text-center text-sm text-white/70">{tt("tjLoading")}</p> : <><RetoBanner partida={partida} className="mb-3" /><Court key={seed} seed={seed} partida={partida} all={all} onAgain={otra} /></>}
    </GameStage>
  );
}

function Court({ onAgain, all, seed, partida }: { onAgain: () => void; all: CaseConGn[]; seed: number; partida: Partida }) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const cases = useMemo(() => shufflerFor(seed)(all).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const c = cases[i];
  const options = useMemo(() => (c ? shuffle([c.answer, ...c.wrong]) : []), [c]);
  const done = i >= ROUNDS;
  const xp = Math.min(20, score * 4);
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "tekojoja", xp });
  }, [done, xp]);

  if (done) {
    const stars = score >= 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
    return (
      <section className="space-y-5 pt-2 text-center">
        <div className="tj-in relative mx-auto max-w-md rounded-sm p-7 text-left shadow-2xl" style={{ background: J.papel, color: J.tinta }}>
          <p className="text-center text-xs font-semibold uppercase tracking-wide opacity-60">{tt("tjHeader")}</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold">{tt("tjResolution")}</h2>
          <p className="mt-4 leading-relaxed">{tt("tjResText")} <b>{tt("tjCases", { s: score, n: ROUNDS })}</b>.</p>
          <p className="mt-3 text-center text-3xl tracking-widest" style={{ color: J.oro }} aria-label={tt("stars", { n: stars })}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <div className="mt-6 flex items-end justify-between">
            <div className="w-36 border-t pt-1 text-center text-xs opacity-70" style={{ borderColor: J.tinta }}>{tt("tjJudge")}</div>
            <span className="tj-sello rotate-[-12deg] rounded-full border-4 px-3 py-2 text-xs font-bold uppercase" style={{ borderColor: J.verde, color: J.verde }}>+{xp} XP</span>
          </div>
        </div>
        <RetoFinal partida={partida} puntaje={score} />
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className="h-12 rounded-2xl tap-3d-dark px-6 font-bold" style={{ background: J.oro, color: J.tinta }}>{tt("tjNew")}</button>
        </div>
      </section>
    );
  }

  function choose(o: string) {
    if (pick) return;
    setPick(o);
    if (o === c.answer) { setScore((s) => s + 1); feedback("success"); } else feedback("error");
  }
  const ok = pick === c.answer;

  return (
    <section className="space-y-4 pt-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-bold">{tt("tjYouAre")}</p>
          <p className="text-sm text-white/70">{tt("tjRead")}</p>
        </div>
        <Mazo golpe={!!pick} />
      </div>

      <div key={i} className="tj-in relative">
        <div className="ml-4 h-5 w-32 rounded-t-lg" style={{ background: "#E3CF9F" }} />
        <div className="relative rounded-lg rounded-tl-none p-5 shadow-2xl" style={{ background: J.carpeta, color: J.tinta }}>
          <div className="flex items-center justify-between text-xs font-semibold opacity-70">
            <span>{tt("tjFile", { n: String(i + 1).padStart(3, "0") })}</span>
            <span>{tt("tjCaseOf", { i: i + 1, n: ROUNDS, s: score })}</span>
          </div>
          <div className="mt-3 rounded p-4" style={{ background: J.papel }}>
            <div className="flex gap-3">
              <span className="text-4xl" aria-hidden>{c.emoji}</span>
              <div className="min-w-0">
                {c.storyGn && <p lang="gn" className="mb-2 font-display text-lg font-bold leading-relaxed">{c.storyGn}</p>}
                <p className={c.storyGn ? "text-base leading-relaxed opacity-80" : "text-lg leading-relaxed"}>{c.story}</p>
              </div>
            </div>
          </div>
          {pick && (
            <span className="tj-sello absolute -top-3 right-3 rotate-[-8deg] rounded-md border-4 bg-[#FFFCF4]/85 px-3 py-1 font-display text-lg font-bold uppercase" style={{ borderColor: ok ? J.verde : J.rojo, color: ok ? J.verde : J.rojo }}>
              {ok ? tt("tjOk") : tt("tjReview")}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        {options.map((o) => {
          const right = o === c.answer;
          const estilo = pick
            ? right ? { background: J.verde, color: "#fff" } : o === pick ? { background: J.rojo, color: "#fff" } : { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.45)" }
            : { background: "rgba(255,255,255,.08)", color: "#fff", boxShadow: `inset 0 0 0 2px rgba(232,194,106,.45)` };
          return (
            <button key={o} type="button" onClick={() => choose(o)} disabled={!!pick} className="min-h-14 rounded-2xl tap-3d-dark px-4 py-3 text-left font-display text-lg font-bold transition active:scale-[.98]" style={estilo}>
              {o}
            </button>
          );
        })}
      </div>
      {pick && (
        <div className="space-y-3">
          <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(0,0,0,.25)" }}>
            <p>{c.why}</p>
            {c.answerGn ? (
              <p className="mt-2">
                {tt("tjTerm")} <b lang="gn" className="font-display text-base" style={{ color: J.oro }}>{c.answerGn}</b>
                <span className="mt-1 block text-xs text-white/60">{tt("tjBySpecialists")}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-white/60">{tt("tjPending")}</p>
            )}
          </div>
          <button type="button" className="h-14 w-full rounded-2xl tap-3d-dark font-display text-lg font-bold" style={{ background: J.oro, color: J.tinta }} onClick={() => { setI((n) => n + 1); setPick(null); }}>
            {i + 1 === ROUNDS ? tt("tjSeeRuling") : tt("tjNext")}
          </button>
        </div>
      )}
      <QuitGameButton className="text-white" onQuit={() => { setPick(null); setI(ROUNDS); }} />
    </section>
  );
}
