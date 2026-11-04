import { useEffect, useState } from "react";
import { useGT } from "@/lib/i18n-games";
import { forgetPlace } from "@/lib/last-place";

/**
 * «Terminar la partida»: salida airosa para juegos de varias rondas.
 * Pide un segundo toque para que nadie corte sin querer; al confirmar se muestra
 * el resultado con lo jugado hasta ahí (lo no jugado no suma).
 */
export function QuitGameButton({ onQuit, className = "", kind = "game" }: { onQuit: () => void; className?: string; kind?: "game" | "shift" | "song" }) {
  const { g } = useGT();
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const t = window.setTimeout(() => setSure(false), 4000);
    return () => window.clearTimeout(t);
  }, [sure]);
  return (
    <button
      type="button"
      onClick={() => { if (sure) { forgetPlace(); onQuit(); } else setSure(true); }}
      className={`h-11 w-full touch-manipulation rounded-2xl px-4 text-sm font-bold ring-1 ring-white/30 hover:bg-white/10 ${className}`}
    >
      {sure ? g("quitSure") : g(kind === "shift" ? "quitShift" : kind === "song" ? "quitSong" : "quitGame")}
    </button>
  );
}
