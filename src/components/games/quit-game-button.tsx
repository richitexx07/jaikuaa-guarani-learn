import { useEffect, useState } from "react";

/**
 * «Terminar la partida»: salida airosa para juegos de varias rondas.
 * Pide un segundo toque para que nadie corte sin querer; al confirmar se muestra
 * el resultado con lo jugado hasta ahí (lo no jugado no suma).
 */
export function QuitGameButton({ onQuit, className = "", label = "Terminar la partida y ver el resultado" }: { onQuit: () => void; className?: string; label?: string }) {
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const t = window.setTimeout(() => setSure(false), 4000);
    return () => window.clearTimeout(t);
  }, [sure]);
  return (
    <button
      type="button"
      onClick={() => (sure ? onQuit() : setSure(true))}
      className={`h-11 w-full touch-manipulation rounded-2xl px-4 text-sm font-bold ring-1 ring-current/30 hover:bg-white/10 ${className}`}
    >
      {sure ? "¿Seguro? Tocá otra vez para terminar" : label}
    </button>
  );
}
