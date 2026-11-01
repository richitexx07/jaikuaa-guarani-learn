import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DoorOpen, Flag, Handshake, Pause, Play } from "lucide-react";
import { useSDT } from "@/lib/i18n-sopa-duelo";

/**
 * Árbitro de mesa para los duelos en un mismo celular.
 * Un toque sin querer solo abre este menú: nada se pierde sin confirmar.
 * Opciones: seguir, tablas de común acuerdo, rendición de un jugador o salir a los juegos.
 */
export type DuelEnd = { kind: "draw" } | { kind: "forfeit"; loser: 0 | 1 };

/** Resultado de cada partida de la serie (para el marcador de revanchas). */
export type DuelResult = 0 | 1 | "draw";
export type DuelSeries = { wins: [number, number]; draws: number; match: number };
export const NEW_SERIES: DuelSeries = { wins: [0, 0], draws: 0, match: 1 };

export function addResult(s: DuelSeries, r: DuelResult): DuelSeries {
  if (r === "draw") return { ...s, draws: s.draws + 1 };
  const wins: [number, number] = [...s.wins] as [number, number];
  wins[r] += 1;
  return { ...s, wins };
}

export function PauseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  const tt = useSDT();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tt("pause")}
      className={`inline-flex h-11 shrink-0 touch-manipulation items-center gap-1.5 rounded-full px-3.5 text-sm font-bold ring-2 ring-current/40 ${className}`}
    >
      <Pause className="h-4 w-4" aria-hidden />
      {tt("pauseShort")}
    </button>
  );
}

type Action = "draw" | "forfeit0" | "forfeit1" | "exit";

export function RefereeMenu({
  open,
  onClose,
  onEnd,
  colors,
  ink = "#101426",
}: {
  open: boolean;
  onClose: () => void;
  onEnd: (end: DuelEnd) => void;
  colors: readonly [string, string];
  ink?: string;
}) {
  const tt = useSDT();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Action | null>(null);
  if (!open) return null;

  const close = () => { setConfirm(null); onClose(); };
  const run = (a: Action) => {
    setConfirm(null);
    if (a === "exit") { void navigate({ to: "/juegos" }); return; }
    onClose();
    onEnd(a === "draw" ? { kind: "draw" } : { kind: "forfeit", loser: a === "forfeit0" ? 0 : 1 });
  };

  const question: Record<Action, string> = {
    draw: tt("confirmDraw"),
    forfeit0: tt("confirmForfeit", { n: 1 }),
    forfeit1: tt("confirmForfeit", { n: 2 }),
    exit: tt("confirmExit"),
  };

  const opt = "flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-2xl px-4 py-2 text-left font-bold";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tt("refereeTitle")}
      className="fixed inset-0 z-[60] grid place-items-center overscroll-none bg-black/60 p-4 select-none"
      onClick={close}
    >
      <div className="w-full max-w-sm space-y-2 rounded-3xl bg-white p-5 shadow-2xl" style={{ color: ink }} onClick={(e) => e.stopPropagation()}>
        <p className="text-center font-display text-2xl font-bold">{tt("refereeTitle")}</p>
        <p className="pb-1 text-center text-sm opacity-70">{tt("refereeHint")}</p>

        {confirm ? (
          <div className="space-y-3 pt-1">
            <p className="text-center font-display text-lg font-bold">{question[confirm]}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="h-12 touch-manipulation rounded-2xl font-bold ring-1 ring-black/20" onClick={() => setConfirm(null)}>{tt("no")}</button>
              <button type="button" className="h-12 touch-manipulation rounded-2xl font-bold text-white" style={{ background: ink }} onClick={() => run(confirm)}>{tt("yes")}</button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" className={`${opt} text-white`} style={{ background: ink }} onClick={close}>
              <Play className="h-5 w-5 shrink-0" aria-hidden /> {tt("keepPlaying")}
            </button>
            <button type="button" className={`${opt} ring-1 ring-black/15`} onClick={() => setConfirm("draw")}>
              <Handshake className="h-5 w-5 shrink-0" aria-hidden /> {tt("draw")}
            </button>
            {([0, 1] as const).map((p) => (
              <button key={p} type="button" className={`${opt} text-white`} style={{ background: colors[p] }} onClick={() => setConfirm(p === 0 ? "forfeit0" : "forfeit1")}>
                <Flag className="h-5 w-5 shrink-0" aria-hidden /> {tt("forfeit", { n: p + 1 })}
              </button>
            ))}
            <button type="button" className={`${opt} ring-1 ring-black/15`} onClick={() => setConfirm("exit")}>
              <DoorOpen className="h-5 w-5 shrink-0" aria-hidden /> {tt("exitToGames")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Título del final según cómo terminó la partida. */
export function useEndTitle() {
  const tt = useSDT();
  return (end: DuelEnd | null, winner: 0 | 1, wonText: string) => {
    if (end?.kind === "draw") return tt("drawTitle");
    if (end?.kind === "forfeit") return tt("forfeitTitle", { w: winner + 1, l: end.loser + 1 });
    return wonText;
  };
}

/** Marcador de la serie de revanchas: «Partida 3 · J1 2 — J2 1». */
export function SeriesLine({ series, className = "" }: { series: DuelSeries; className?: string }) {
  const tt = useSDT();
  if (series.match < 2 && series.wins[0] + series.wins[1] + series.draws === 0) return null;
  return (
    <p className={`text-sm font-semibold ${className}`}>
      {tt("series", { m: series.match, a: series.wins[0], b: series.wins[1] })}
      {series.draws > 0 ? ` · ${tt("seriesDraws", { d: series.draws })}` : ""}
    </p>
  );
}
