import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { LessonFilter, NotEnough, useGameWords } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { leccionDeReto, orderedBy, shufflerFor } from "@/lib/reto";
import { useGameFeedback } from "@/components/games/game-kit";
import { ACHEGETY, displayLetter, splitAchegety } from "@/lib/achegety";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import type { GameWord } from "@/lib/games.functions";
import { useGT } from "@/lib/i18n-games";

export const Route = createFileRoute("/_authenticated/juegos/ahorcado")({
  head: () => ({
    meta: [
      { title: "Ahorcado con chipas | Jaikuaa" },
      { name: "description", content: "Adiviná la palabra guaraní letra por letra antes de quedarte sin chipas." },
      { property: "og:title", content: "Ahorcado con chipas | Jaikuaa" },
      { property: "og:description", content: "Juego de palabras guaraníes con el alfabeto Achegety." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hangman,
});

const LIVES = 6;
const XP_WIN = 15;
const XP_LOSS = 5;

function Hangman() {
  const partida = useRetoPartida("ahorcado", { total: LIVES });
  const { reto, seed, otra } = partida;
  const [lesson, setLesson] = useState<number | null>(() => leccionDeReto(reto));
  // Si el reto llega después (se carga de internet), usa su lección.
  useEffect(() => { if (reto) setLesson(leccionDeReto(reto)); }, [reto?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = useGameWords(lesson);
  const pool = useMemo(
    () => (q.data?.words ?? []).filter((w) => !/\s/.test(w.gn.trim()) && splitAchegety(w.gn.trim())),
    [q.data],
  );
  const word = useMemo<GameWord | null>(() => shufflerFor(seed)(orderedBy(pool, (w) => w.gn))[0] ?? null, [pool, seed]);

  return (
    <GameStage
      title="Ahorcado con chipas"
      sponsorSlot="ahorcado"
      css={CSS}
      ink={A.tinta}
      background={`linear-gradient(180deg, #FBF1DC 0%, #F6E2BC 62%, ${A.madera} 62%, #6E3F18 100%)`}
    >
      <div className="ah-filter flex justify-center">
        <LessonFilter value={lesson} onChange={(v) => { otra(); setLesson(v); }} />
      </div>
      <div className="mt-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !word ? (
          <NotEnough min={1} />
        ) : (
          <>
            <RetoBanner partida={partida} extra={lesson === null ? undefined : String(lesson)} className="mb-3" />
            <Board key={`${word.gn}-${seed}`} word={word} partida={partida} lesson={lesson} onNext={otra} />
          </>
        )}
      </div>
    </GameStage>
  );
}

/* Paleta de la mesa: mantel crema, canasta de karanda'y, chipa dorada. */
const A = { tinta: "#3A1F0E", madera: "#8A5221", canasta: "#A86A2E", chipa: "#E7B46A", verde: "#2F7A4A", rojo: "#C8331F", papel: "#FFF8EA" };

const CSS = `
.ah-filter label { color: ${A.tinta}; } .ah-filter select { background: ${A.papel}; border-color: #D9BE8E; }
.ah-bite { animation: ah-bite .6s cubic-bezier(.3,0,.6,1) 1 both; }
@keyframes ah-bite { 0% { transform: scale(1) } 30% { transform: scale(1.15) rotate(-8deg) } 100% { transform: translateY(-30px) scale(.3); opacity: 0 } }
.ah-in { animation: ah-in .35s cubic-bezier(.2,1.4,.4,1) 1 both; }
@keyframes ah-in { from { transform: translateY(-14px) scale(.6); opacity: 0 } }
.ah-shake { animation: ah-shake .35s ease-in-out 1; }
@keyframes ah-shake { 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
@media (prefers-reduced-motion: reduce) { .ah-bite, .ah-in, .ah-shake { animation: none !important; } .ah-bite { opacity: 0 } }
`;

/** Canasta con las chipas que quedan. Cada error se come una. */
function Canasta({ quedan }: { quedan: number }) {
  const pos: [number, number, number][] = [[62, 74, 22], [104, 64, 23], [146, 74, 22], [82, 92, 20], [126, 92, 20], [104, 100, 19]];
  return (
    <svg viewBox="0 0 208 150" className="mx-auto w-60 sm:w-72" aria-hidden>
      <ellipse cx="104" cy="144" rx="84" ry="6" fill="#000" opacity=".18" />
      <path d="M24 86 Q104 -6 184 86" fill="none" stroke="#7A4317" strokeWidth="8" strokeLinecap="round" />
      {pos.map(([x, y, r], i) => {
        const viva = i < quedan;
        return (
          <g key={i} className={viva ? "" : "ah-bite"} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <g transform={`translate(${x} ${y})`}>
              <circle r={r} fill={A.chipa} />
              <circle r={r} fill="none" stroke="#A8692C" strokeWidth={r * 0.12} opacity=".55" />
              <circle r={r * 0.36} fill="#7A4317" />
              <circle cx={-r * 0.45} cy={-r * 0.5} r={r * 0.09} fill="#A8692C" />
              <circle cx={r * 0.55} cy={-r * 0.3} r={r * 0.08} fill="#A8692C" />
              <circle cx={r * 0.2} cy={r * 0.62} r={r * 0.08} fill="#A8692C" />
            </g>
          </g>
        );
      })}
      <path d="M22 96 H186 L170 144 H38Z" fill={A.canasta} />
      {[0, 1, 2, 3].map((r) => (
        <path key={r} d={`M${25 + r * 4} ${106 + r * 11} H${183 - r * 4}`} stroke="#6E3F18" strokeWidth="3" />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${36 + i * 13.6} 98 L${42 + i * 12.4} 142`} stroke="#C98B4B" strokeWidth="2.2" opacity=".7" />
      ))}
      <path d="M22 96 H186" stroke="#6E3F18" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Board({ word, partida, lesson, onNext }: { word: GameWord; partida: Partida; lesson: number | null; onNext: () => void }) {
  const feedback = useGameFeedback();
  const { g: tr } = useGT();
  const tokens = useMemo(() => splitAchegety(word.gn.trim()) ?? [], [word]);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const wrong = [...guessed].filter((g) => !tokens.includes(g)).length;
  const won = tokens.every((t) => guessed.has(t));
  const [gaveUp, setGaveUp] = useState(false);
  const [sure, setSure] = useState(false);
  const lost = wrong >= LIVES || gaveUp;
  const done = won || lost;
  // Rendirse no suma XP (así nadie junta puntos rindiéndose); perder jugando sí suma un poco.
  const xpGained = won ? XP_WIN : gaveUp ? 0 : XP_LOSS;
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback(won ? "victory" : "error");
    if (xpGained > 0) recordCompletion({ source: "game", sourceRef: "ahorcado", xp: xpGained });
    if (word.hasAudio) void playGuarani(word.gn);
  }, [done, won, word]);

  const quedan = LIVES - wrong;
  return (
    <div className="space-y-5">
      <div className="mx-auto w-fit max-w-full -rotate-1 rounded-lg px-6 py-3 text-center shadow-lg" style={{ background: "#5E3413", color: A.papel }}>
        <div className="text-xs font-semibold opacity-75">{tr("hintEs")}</div>
        <div className="font-display text-2xl font-bold">{word.es}</div>
      </div>

      <div key={wrong} className={wrong ? "ah-shake" : ""}>
        <Canasta quedan={quedan} />
      </div>
      <p className="-mt-2 text-center text-sm font-semibold" aria-label={tr("chipasLeftLabel", { n: quedan })}>
        {quedan === 1 ? tr("oneChipa") : tr("nChipas", { n: quedan })}
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {tokens.map((t, i) => {
          const visible = guessed.has(t) || lost;
          return (
            <span
              key={i}
              className="flex h-14 min-w-11 items-center justify-center rounded-xl border-b-[6px] px-1.5 font-display text-2xl font-bold shadow"
              style={{ background: A.papel, borderColor: guessed.has(t) ? A.verde : lost ? A.rojo : "#D9BE8E", color: guessed.has(t) ? A.verde : A.rojo }}
            >
              {visible ? <span key={`${t}-v`} className="ah-in">{displayLetter(t)}</span> : ""}
            </span>
          );
        })}
      </div>

      {done ? (
        <div className="space-y-3 rounded-3xl p-5 text-center shadow-xl" style={{ background: A.papel }}>
          <p className="font-display text-3xl font-bold">{won ? tr("wellDone") : gaveUp ? tr("gaveUpTitle") : tr("outOfChipas")}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-lg">
            <span className="font-display text-2xl font-bold" style={{ color: A.verde }}>{word.gn}</span>
            {word.hasAudio && <SpeakerButton gn={word.gn} size="md" />}
            <span className="opacity-70">— {word.es}</span>
          </div>
          {gaveUp && <p className="text-sm leading-snug opacity-80">{tr("gaveUpNote")}</p>}
          {xpGained > 0 && <p className="font-bold" style={{ color: A.verde }}>+{xpGained} XP</p>}
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={onNext} className="h-12 rounded-2xl tap-3d-dark px-6 font-bold text-white" style={{ background: A.rojo }}>{tr("anotherWord")}</button>
          </div>
          <RetoFinal partida={partida} puntaje={won ? LIVES - wrong : 0} extra={lesson === null ? undefined : String(lesson)} />
        </div>
      ) : (
        <>
        <div className="grid touch-manipulation grid-cols-6 gap-1.5 rounded-3xl p-2 select-none sm:grid-cols-9" style={{ background: "rgba(0,0,0,.18)" }}>
          {ACHEGETY.map((k) => {
            const used = guessed.has(k);
            const hit = used && tokens.includes(k);
            return (
              <button
                key={k}
                type="button"
                disabled={used}
                onClick={() => { feedback(tokens.includes(k) ? "success" : "error"); setGuessed((s) => new Set(s).add(k)); }}
                className="h-12 rounded-xl font-display text-lg font-bold shadow transition active:translate-y-0.5"
                style={{
                  background: !used ? A.papel : hit ? A.verde : "#C9AE84",
                  color: !used ? A.tinta : hit ? "#fff" : "#8A6F4A",
                  opacity: used && !hit ? 0.55 : 1,
                  boxShadow: !used ? "0 3px 0 #C9A66B" : "none",
                }}
              >
                {displayLetter(k)}
              </button>
            );
          })}
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => (sure ? setGaveUp(true) : setSure(true))}
            onBlur={() => setSure(false)}
            className="min-h-11 touch-manipulation rounded-2xl px-4 text-sm font-semibold underline-offset-4 hover:underline"
            style={{ color: sure ? A.rojo : A.papel, background: sure ? A.papel : "rgba(0,0,0,.2)" }}
          >
            {sure ? tr("confirmGiveUp") : tr("giveUp")}
          </button>
        </div>
        </>
      )}
    </div>
  );
}
