import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { LessonFilter, NotEnough, useGameWords, useIsWide } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { mulberry32, orderedBy, seededShuffle } from "@/lib/reto";
import { useGameFeedback } from "@/components/games/game-kit";
import { ACHEGETY, displayLetter, splitAchegety } from "@/lib/achegety";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import jaiPiensa from "@/assets/jai/jai-piensa.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiFesteja from "@/assets/jai/jai-trofeo.webp";
import type { GameWord } from "@/lib/games.functions";
import { useSDT } from "@/lib/i18n-sopa-duelo";

export const Route = createFileRoute("/_authenticated/juegos/sopa-de-letras")({
  head: () => ({
    meta: [
      { title: "Sopa de letras | Jaikuaa" },
      { name: "description", content: "Encontrá las palabras guaraníes escondidas en la grilla." },
      { property: "og:title", content: "Sopa de letras | Jaikuaa" },
      { property: "og:description", content: "Sopa de letras con el alfabeto guaraní y audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WordSearch,
});

const COUNT = 6;
const XP = 20;
// Relleno solo con letras simples (sin el puso) para que la grilla se lea mejor.
const FILLER = ACHEGETY.filter((t) => t !== "'");

type Placed = { word: GameWord; cells: number[] };
type Puzzle = { size: number; grid: string[]; placed: Placed[] };

function build(pool: { word: GameWord; tokens: string[] }[], size: number, seed: number): Puzzle | null {
  // Con la misma semilla sale la misma sopa (para los retos por WhatsApp).
  const rnd = mulberry32(seed);
  const sorted = orderedBy(pool, (x) => x.word.gn);
  for (let attempt = 0; attempt < 30; attempt++) {
    const grid: (string | null)[] = Array(size * size).fill(null);
    const placed: Placed[] = [];
    const used = new Set<string>();
    for (const item of seededShuffle(sorted, rnd)) {
      if (placed.length === COUNT) break;
      const key = item.word.gn.trim().toLowerCase();
      if (used.has(key) || item.tokens.length > size || item.tokens.length < 2) continue;
      let ok = false;
      for (let tries = 0; tries < 60 && !ok; tries++) {
        const horiz = rnd() < 0.5;
        const r = Math.floor(rnd() * (horiz ? size : size - item.tokens.length + 1));
        const c = Math.floor(rnd() * (horiz ? size - item.tokens.length + 1 : size));
        const cells = item.tokens.map((_, i) => (horiz ? r * size + c + i : (r + i) * size + c));
        if (cells.every((cell, i) => grid[cell] === null || grid[cell] === item.tokens[i])) {
          cells.forEach((cell, i) => (grid[cell] = item.tokens[i]!));
          placed.push({ word: item.word, cells });
          used.add(key);
          ok = true;
        }
      }
    }
    if (placed.length === COUNT) {
      return {
        size,
        grid: grid.map((g) => g ?? FILLER[Math.floor(rnd() * FILLER.length)]!),
        placed,
      };
    }
  }
  return null;
}

function WordSearch() {
  const partida = useRetoPartida("sopa", { total: COUNT, unidad: "segundos", menosEsMejor: true });
  const { reto, seed, otra } = partida;
  // En el reto viaja «lección:tamaño» para armar la misma sopa.
  const [retoLeccion, retoSize] = (reto?.x ?? "").split(":");
  const [lesson, setLesson] = useState<number | null>(() => (retoLeccion && /^\d+$/.test(retoLeccion) ? Number(retoLeccion) : null));
  useEffect(() => {
    const l = (reto?.x ?? "").split(":")[0];
    if (reto) setLesson(l && /^\d+$/.test(l) ? Number(l) : null);
  }, [reto?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = useGameWords(lesson);
  const wide = useIsWide();
  const size = reto && (retoSize === "8" || retoSize === "10") ? Number(retoSize) : wide ? 10 : 8;
  const puzzle = useMemo(() => {
    const pool = (q.data?.words ?? [])
      .filter((w) => !/\s/.test(w.gn.trim()))
      .map((w) => ({ word: w, tokens: splitAchegety(w.gn.trim()) }))
      .filter((x): x is { word: GameWord; tokens: string[] } => !!x.tokens);
    return build(pool, size, seed);
  }, [q.data, size, seed]);

  return (
    <GameStage
      title="Sopa de letras"
      sponsorSlot="sopa-de-letras"
      css={CSS}
      ink={S.tinta}
      background={`linear-gradient(90deg, transparent 0 46px, rgba(213,43,30,.35) 46px 48px, transparent 48px), repeating-linear-gradient(0deg, transparent 0 27px, #C9DCF0 27px 28px), ${S.hoja}`}
    >
      <div className="sp-filter flex justify-center">
        <LessonFilter value={lesson} onChange={(v) => { otra(); setLesson(v); }} />
      </div>
      <div className="mt-4">
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !puzzle ? (
          <NotEnough min={COUNT} />
        ) : (
          <>
            <RetoBanner partida={partida} extra={`${lesson ?? ""}:${size}`} className="mb-3" />
            <Board key={`${seed}-${size}`} puzzle={puzzle} partida={partida} extra={`${lesson ?? ""}:${size}`} onNext={otra} />
          </>
        )}
      </div>
    </GameStage>
  );
}

/* Hoja de cuaderno escolar con resaltadores de colores. */
const S = { hoja: "#F5F9FE", tinta: "#13294B", margen: "#D52B1E" };
const MARCADORES = ["#FFE066", "#8CE6B0", "#FFB3C7", "#A8D8FF", "#FFC48A", "#D4B8FF"];

const CSS = `
.sp-filter label { color: ${S.tinta}; } .sp-filter select { background: #fff; }
.sp-mark { animation: sp-mark .35s cubic-bezier(.2,.8,.2,1) 1 both; transform-origin: left center; }
@keyframes sp-mark { from { transform: scaleX(0) } }
.sp-cell { transition: transform .1s; }
.sp-cell[data-trail="true"] { transform: scale(1.12); }
.sp-jai { animation: sp-pop .45s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes sp-pop { from { transform: scale(.7); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .sp-mark, .sp-jai { animation: none } .sp-cell { transition: none } }
`;

function Board({ puzzle, partida, extra, onNext }: { puzzle: Puzzle; partida: Partida; extra: string; onNext: () => void }) {
  const feedback = useGameFeedback();
  const tt = useSDT();
  const { size, grid, placed } = puzzle;
  const [start, setStart] = useState<number | null>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [miss, setMiss] = useState<number[]>([]);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sure, setSure] = useState(false);
  const solved = found.size === placed.length;
  const done = solved || revealed;
  const recorded = useRef(false);
  const t0 = useRef(Date.now());
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (solved) setSegundos(Math.max(1, Math.round((Date.now() - t0.current) / 1000)));
  }, [solved]);

  useEffect(() => {
    // Rendirse muestra las palabras pero no suma XP.
    if (!solved || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    recordCompletion({ source: "game", sourceRef: "sopa-de-letras", xp: XP });
  }, [solved]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Pista: marca la primera letra de una palabra que falta. */
  function giveHint() {
    const left = placed.map((p, i) => (found.has(i) ? -1 : i)).filter((i) => i >= 0);
    if (!left.length) return;
    const i = left[Math.floor(Math.random() * left.length)]!;
    setHintCell(placed[i]!.cells[0]!);
  }

  const foundCells = new Set(placed.flatMap((p, i) => (found.has(i) ? p.cells : [])));

  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);

  function lineOf(a: number, b: number): number[] {
    const [r1, c1, r2, c2] = [Math.floor(a / size), a % size, Math.floor(b / size), b % size];
    const line: number[] = [];
    if (r1 === r2) for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) line.push(r1 * size + c);
    else if (c1 === c2) for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) line.push(r * size + c1);
    return line;
  }

  function check(from: number, cell: number) {
    const line = lineOf(from, cell);
    setStart(null);
    const idx = placed.findIndex(
      (p, i) => !found.has(i) && p.cells.length === line.length && p.cells.every((x, j) => x === line[j]),
    );
    if (idx >= 0) {
      feedback("success");
      setFound((f) => new Set(f).add(idx));
      if (hintCell !== null && placed[idx]!.cells[0] === hintCell) setHintCell(null);
      if (placed[idx]!.word.hasAudio) void playGuarani(placed[idx]!.word.gn);
    } else {
      feedback("error");
      setMiss(line.length ? line : [from, cell]);
      window.setTimeout(() => setMiss([]), 600);
    }
  }

  function cellAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest("[data-cell]");
    return el ? Number(el.getAttribute("data-cell")) : null;
  }

  function down(e: PointerEvent, cell: number) {
    if (done) return;
    e.preventDefault();
    if (start !== null && start !== cell) { check(start, cell); return; }
    setDrag({ from: cell, to: cell });
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    const c = cellAt(e.clientX, e.clientY);
    if (c !== null && c !== drag.to) setDrag({ ...drag, to: c });
  }
  function up() {
    if (!drag) return;
    const { from, to } = drag;
    setDrag(null);
    if (from !== to) check(from, to);
    else setStart((s) => (s === from ? null : from));
  }

  const trail = new Set(drag ? lineOf(drag.from, drag.to) : []);

  /** Rectángulo de resaltador sobre las celdas de una palabra (en % de la grilla). */
  function marca(cells: number[]) {
    const r1 = Math.floor(cells[0]! / size), c1 = cells[0]! % size;
    const r2 = Math.floor(cells[cells.length - 1]! / size), c2 = cells[cells.length - 1]! % size;
    const u = 100 / size;
    return { left: `${Math.min(c1, c2) * u + u * 0.08}%`, top: `${Math.min(r1, r2) * u + u * 0.12}%`, width: `${(Math.abs(c2 - c1) + 1) * u - u * 0.16}%`, height: `${(Math.abs(r2 - r1) + 1) * u - u * 0.24}%` };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-2 pr-4 ring-1 ring-[#C9DCF0]">
        <img
          key={found.size}
          src={solved ? jaiFesteja : found.size > 0 && !revealed ? jaiAplaude : jaiPiensa}
          alt=""
          className="sp-jai h-16 w-16 shrink-0 object-contain"
        />
        <p className="min-w-0 flex-1 text-sm leading-snug">
          {solved
            ? tt("allFound")
            : revealed
              ? tt("restNote")
              : hintCell !== null
                ? tt("hintNote")
                : found.size > 0
              ? tt("left", { n: placed.length - found.size })
              : tt("swipe")}
        </p>
        <p className="shrink-0 rounded-full px-3 py-1 font-display text-lg font-bold text-white" style={{ background: S.tinta }}>
          {found.size}/{placed.length}
        </p>
      </div>
      <div className="mx-auto w-full max-w-[min(30rem,60vh)] rounded-2xl bg-white p-2 shadow-[0_10px_30px_-12px_rgba(19,41,75,.35)] ring-1 ring-[#C9DCF0] lg:max-w-xl">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {placed.map((p, i) =>
              found.has(i) || revealed ? <span key={i} className="sp-mark absolute rounded-full" style={{ ...marca(p.cells), background: found.has(i) ? MARCADORES[i % MARCADORES.length] : "#D5DCE6", transformOrigin: Math.floor(p.cells[0]! / size) === Math.floor(p.cells[p.cells.length - 1]! / size) ? "left center" : "center top" }} /> : null,
            )}
            {drag && trail.size > 0 && <span className="absolute rounded-full" style={{ ...marca([...trail].sort((x, y) => x - y)), background: "rgba(255,224,102,.75)" }} />}
          </div>
          <div
            className="sopa-grid relative grid w-full touch-none select-none"
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => setDrag(null)}
            onPointerLeave={up}
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {grid.map((t, i) => (
              <button
                key={i}
                type="button"
                data-cell={i}
                data-trail={trail.has(i)}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); down(e, i); }}
                className="sp-cell flex aspect-square items-center justify-center rounded-full font-display text-base font-bold sm:text-xl"
                style={{
                  color: foundCells.has(i) ? S.tinta : miss.includes(i) ? S.margen : "#2A3E62",
                  background: start === i ? "#FFE066" : "transparent",
                  boxShadow: start === i ? `0 0 0 2px ${S.tinta}` : hintCell === i && !done ? `0 0 0 3px ${S.margen}` : "none",
                }}
              >
                {displayLetter(t)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2">
        {placed.map((p, i) => {
          const ok = found.has(i) || revealed;
          return (
            <li
              key={i}
              className={`flex min-h-12 min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl px-3 py-2 text-sm transition sm:text-base ${ok ? "" : "ring-1 ring-[#C9DCF0]"}`}
              style={{ background: found.has(i) ? MARCADORES[i % MARCADORES.length] : ok ? "#E6EBF2" : "#FFFFFF" }}
            >
              {found.has(i) && <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden />}
              <span className={ok ? "text-xs font-medium opacity-70" : "font-semibold"}>{p.word.es}</span>
              {ok && (
                <span className="flex items-center gap-1">
                  <span className="font-display text-base font-bold">{p.word.gn}</span>
                  {p.word.hasAudio && <SpeakerButton gn={p.word.gn} />}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {!done && (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={giveHint} className="min-h-11 touch-manipulation rounded-2xl tap-3d-dark bg-white px-5 text-sm font-bold ring-1 ring-[#C9DCF0]" style={{ color: S.tinta }}>
            {tt("hint")}
          </button>
          <button
            type="button"
            onClick={() => (sure ? setRevealed(true) : setSure(true))}
            onBlur={() => setSure(false)}
            className="min-h-11 touch-manipulation rounded-2xl px-5 text-sm font-semibold ring-1 ring-[#C9DCF0]"
            style={{ color: sure ? "#fff" : S.tinta, background: sure ? S.margen : "transparent" }}
          >
            {sure ? tt("confirmShowRest") : tt("showRest")}
          </button>
        </div>
      )}

      {revealed && !solved && (
        <div className="space-y-3 rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-[#C9DCF0]">
          <img src={jaiPiensa} alt="" className="mx-auto h-24 w-auto object-contain" />
          <p className="font-display text-2xl font-bold">{tt("restTitle")}</p>
          <p className="text-sm leading-snug opacity-80">{tt("restNote")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={onNext} className="h-12 rounded-2xl tap-3d-dark px-6 font-bold text-white" style={{ background: S.tinta }}>{tt("anotherSoup")}</button>
          </div>
        </div>
      )}

      {solved && (
        <div className="space-y-3 rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-[#C9DCF0]">
          <img src={jaiFesteja} alt={tt("jaiCheers")} className="mx-auto h-32 w-auto object-contain" />
          <p className="font-display text-3xl font-bold">{tt("foundTitle")}</p>
          {segundos > 0 && <p className="text-sm opacity-75">{tt("inSeconds", { n: segundos })}</p>}
          <p className="text-3xl tracking-widest text-[#F2B544]" aria-label={tt("stars3")}>★★★</p>
          <p className="font-bold text-[#2F7A4A]">+{XP} XP</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={onNext} className="h-12 rounded-2xl tap-3d-dark px-6 font-bold text-white" style={{ background: S.tinta }}>{tt("anotherSoup")}</button>
          </div>
          {segundos > 0 && <RetoFinal partida={partida} puntaje={segundos} extra={extra} />}
        </div>
      )}
    </div>
  );
}
