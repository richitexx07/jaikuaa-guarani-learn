/**
 * «Atajá»: ahora el Jai arquero sos vos. Suena una palabra en guaraní (solo voces reales) y elegís qué significa.
 * Si entendiste, te tirás al lado justo y atajás; si no, te vas al otro palo y es gol del rival.
 * El tiro lo anima el mismo estadio de Penales en modo espectador.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, RotateCcw } from "lucide-react";
import { usePM } from "@/lib/i18n-penales-modos";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import { celebrate } from "@/lib/confetti";
import { orderedBy, shufflerFor } from "@/lib/reto";
import type { GameWord } from "@/lib/games.functions";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { PenaltyPitch } from "./pitch";
import { G, resolveShot, zoneOf, type Dive, type Shot } from "./physics";
import { PAISES_MICSUR, type Kit } from "./camisetas";
import jaiArqueroImg from "@/assets/penales/jai-arquero-listo.webp";
import mimbiArqueraImg from "@/assets/penales/mimbi-arquera-listo.webp";
import { useMiKit } from "./camisetas";

const C = { noche: "#071A33", led: "#FFB23E", gol: "#3BE38A", mal: "#FF5A4E" };
const TOTAL = 5;
const LADOS: Dive[] = ["left", "center", "right"];

/** Dónde va el tiro: siempre adentro y a media altura, para que atajarlo dependa solo de entender la palabra. */
export function tiroDelRival(seed: number, n: number): { x: number; y: number } {
  const r = shufflerFor(seed, 100 + n);
  const [a, b] = r([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) as number[];
  const lado = LADOS[(a ?? 0) % 3]!;
  const ancho = G.w / 3;
  const x0 = lado === "left" ? G.x : lado === "center" ? G.x + ancho : G.x + 2 * ancho;
  return { x: Math.round(x0 + ancho * (0.3 + 0.04 * (b ?? 0))), y: Math.round(G.y + G.h * (0.45 + 0.04 * (b ?? 0))) };
}

/** El tiro ya resuelto: si entendiste, el arquero va al lado del tiro; si no, al otro. */
export function tiroResuelto(aim: { x: number; y: number }, entendio: boolean, now: number, reduce: boolean): { shot: Shot; dive: Dive } {
  const lado = zoneOf(aim.x);
  const alto = aim.y < G.y + G.h * 0.5;
  const dive: Dive = entendio ? (alto ? (`${lado}-high` as Dive) : lado) : LADOS.filter((l) => l !== lado)[now % 2]!;
  return { shot: resolveShot(aim, 0.7, true, now, reduce, dive), dive };
}

export function Atajar({ words, seed, muted, ledText, onModes, onAgain }: { words: GameWord[]; seed: number; muted: boolean; ledText: string; onModes: () => void; onAgain: () => void }) {
  const [miKit] = useMiKit();
  const jaiArquero = miKit.figura === "chica" ? mimbiArqueraImg : jaiArqueroImg;
  const pm = usePM();
  const conAudio = useMemo(() => words.filter((w) => w.hasAudio), [words]);
  const deck = useMemo(() => shufflerFor(seed)(orderedBy(conAudio, (w) => w.gn)).slice(0, TOTAL), [conAudio, seed]);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [tiro, setTiro] = useState<{ shot: Shot; dive: Dive } | null>(null);
  const [res, setRes] = useState<{ word: GameWord; saved: boolean }[]>([]);
  const [last, setLast] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const recorded = useRef(false);
  const word = deck[turn];
  const reduce = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const kitRival: Kit = useMemo(() => {
    const otros = PAISES_MICSUR.filter((p) => p !== "PY");
    return { pais: otros[(seed + turn) % otros.length]!, figura: (seed + turn) % 2 ? "chica" : "chico", nombre: "", numero: 9 };
  }, [seed, turn]);
  const options = useMemo(() => {
    if (!word) return [];
    const m = shufflerFor(seed, turn + 1);
    const vistos = new Set([word.es.trim().toLowerCase()]);
    const otros = m(orderedBy(words, (w) => w.gn)).filter((w) => {
      const k = w.es.trim().toLowerCase();
      if (!k || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
    return m([word, ...otros.slice(0, 2)]);
  }, [word, words, seed, turn]);
  const saves = res.filter((r) => r.saved).length;
  const xp = Math.min(20, saves * 4);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (started && word && !muted) void playGuarani(word.gn);
  }, [started, turn]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!finished || recorded.current) return;
    recorded.current = true;
    recordCompletion({ source: "game", sourceRef: "penales", xp });
    if (saves >= 3) celebrate("big");
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (conAudio.length < TOTAL) return <p className="py-8 text-center text-white/85">{pm("atajarFalta")}</p>;

  if (!started)
    return (
      <div className="space-y-4 py-4 text-center">
        <img src={jaiArquero} alt="" className="mx-auto h-48 w-auto drop-shadow-[0_12px_30px_rgba(0,0,0,.5)]" width={192} height={192} />
        <h1 className="font-display text-4xl font-bold leading-none">{pm("atajarTitulo")}</h1>
        <p className="mx-auto max-w-sm text-white/80">{pm("atajarBajada")}</p>
        <button type="button" onClick={() => setStarted(true)} className="h-16 w-full rounded-2xl tap-3d-dark font-display text-xl font-bold shadow-lg" style={{ background: C.led, color: C.noche }}>
          {pm("atajarEmpezar")}
        </button>
        <button type="button" onClick={onModes} className="h-11 rounded-2xl px-4 text-sm font-semibold text-white/80">{pm("volverModos")}</button>
      </div>
    );

  if (finished || !word)
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-5xl" aria-hidden>{res.map((r) => (r.saved ? "🧤" : "⚽")).join("")}</p>
        <h2 className="font-display text-3xl font-bold">{pm("atajarResultado", { n: saves })}</h2>
        <p className="font-bold" style={{ color: C.led }}>+{xp} XP</p>
        <ul className="divide-y divide-white/10 rounded-2xl bg-white/[.06] px-3 text-left">
          {res.map((r, i) => (
            <li key={i} className="flex items-center gap-2 py-3 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.saved ? C.gol : C.mal }} aria-label={r.saved ? pm("atajaste") : pm("teHicieron")} />
              <div className="min-w-0 flex-1">
                <span className="font-semibold">{r.word.gn}</span>
                <span className="text-white/60"> — {r.word.es}</span>
              </div>
              <SpeakerButton gn={r.word.gn} />
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className="inline-flex h-12 items-center gap-2 rounded-2xl tap-3d-dark px-6 font-bold" style={{ background: C.led, color: C.noche }}>
            <RotateCcw className="h-5 w-5" aria-hidden /> {pm("otraVez")}
          </button>
          <button type="button" onClick={onModes} className="h-12 rounded-2xl px-4 font-semibold text-white/80">{pm("volverModos")}</button>
        </div>
      </div>
    );

  function answer(o: GameWord) {
    if (choice !== null || !word) return;
    setChoice(o.gn);
    const entendio = o.gn === word.gn;
    const aim = tiroDelRival(seed, turn);
    timer.current = window.setTimeout(() => setTiro(tiroResuelto(aim, entendio, Math.floor(performance.now()), reduce)), reduce ? 50 : 450);
  }
  function next() {
    if (res.length >= TOTAL) {
      setFinished(true);
      return;
    }
    setTurn((t) => t + 1);
    setChoice(null);
    setTiro(null);
    setLast(null);
  }

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center justify-between rounded-2xl border-4 bg-black px-3 py-2" style={{ borderColor: "#1C2B44" }}>
        <span className="text-xs font-bold uppercase tracking-wide text-white/70">🧤 {pm("atajar")}</span>
        <div className="flex gap-1.5" aria-label={pm("atajarResultado", { n: saves })}>
          {Array.from({ length: TOTAL }, (_, i) => {
            const r = res[i];
            return <span key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: r ? (r.saved ? C.gol : C.mal) : "#2A3448", boxShadow: r ? `0 0 8px ${r.saved ? C.gol : C.mal}` : "none" }} />;
          })}
        </div>
        <strong className="pn-led font-display text-3xl" style={{ color: C.led }}>{saves}</strong>
      </div>
      <div className="overflow-hidden rounded-2xl ring-4 ring-black/40">
        <PenaltyPitch
          arquera={miKit.figura}
          key={`atajar-${turn}`}
          kit={kitRival}
          knew
          ready={false}
          muted={muted}
          ledText={ledText}
          guess={tiro?.dive}
          watch={{ aim: null, phase: null, shot: tiro?.shot ?? null }}
          onShot={(o) => {
            const saved = o === "save";
            setLast(saved);
            setRes((prev) => (prev.length > turn ? prev : [...prev, { word, saved }]));
          }}
        />
      </div>
      <div className="space-y-3 text-center">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.led }}>{pm("penNof", { n: turn + 1, t: TOTAL })}</p>
        <p className="text-sm text-white/75">{pm("atajarEscucha")}</p>
        <button type="button" onClick={() => void playGuarani(word.gn)} className="mx-auto inline-flex h-16 items-center gap-3 rounded-full px-6 font-display text-lg font-bold shadow-lg" style={{ background: "rgba(255,255,255,.12)", boxShadow: `inset 0 0 0 2px ${C.led}` }} aria-label={pm("atajarRepetir")}>
          <Volume2 className="h-7 w-7" style={{ color: C.led }} aria-hidden /> {pm("atajarRepetir")}
        </button>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {options.map((o) => {
            const ok = choice !== null && o.gn === word.gn;
            const bad = choice === o.gn && !ok;
            return (
              <button
                key={o.gn}
                type="button"
                disabled={choice !== null}
                onClick={() => answer(o)}
                className="pn-opt min-h-14 whitespace-normal break-words rounded-2xl tap-3d-dark px-3 py-3 font-display text-lg font-bold transition active:scale-95 disabled:cursor-default"
                style={ok ? { background: C.gol, color: C.noche, boxShadow: "none" } : bad ? { background: C.mal, color: "#fff", boxShadow: "none" } : choice !== null ? { opacity: 0.4 } : undefined}
              >
                {o.es}
              </button>
            );
          })}
        </div>
        {last !== null && (
          <>
            <p className="font-display text-2xl font-bold" style={{ color: last ? C.gol : C.mal }} aria-live="polite">
              {last ? pm("atajaste") : pm("teHicieron")}
            </p>
            <p className="text-sm text-white/80">{pm("eraLa", { gn: word.gn, es: word.es })}</p>
            <button type="button" className="h-14 w-full rounded-2xl tap-3d-dark font-display text-lg font-bold" style={{ background: C.led, color: C.noche }} onClick={next}>
              {res.length >= TOTAL ? pm("verResultado") : pm("siguiente")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
