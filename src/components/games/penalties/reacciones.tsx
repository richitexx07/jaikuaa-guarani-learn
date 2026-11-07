/**
 * Reacciones con emojis para Penales a distancia: en vez de un chat (hay menores), una fila fija de emojis.
 * Lo que mandás lo ve el otro celular flotando sobre la pantalla, con tu nombre.
 * Solo se pueden mandar estos emojis: nada de texto libre.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export const EMOJIS = ["👏", "🔥", "😮", "😂", "💪", "🤝"] as const;
export type Emoji = (typeof EMOJIS)[number];
export function esEmoji(v: unknown): v is Emoji {
  return typeof v === "string" && (EMOJIS as readonly string[]).includes(v);
}
/** Un emoji cada tanto, para que nadie llene la pantalla del otro. */
export const ESPERA_MS = 900;

type Flota = { id: number; e: Emoji; quien: string; mio: boolean; x: number };

/** Lleva la cuenta de los emojis que flotan en pantalla (los míos y los del otro). */
export function useReacciones() {
  const [flotan, setFlotan] = useState<Flota[]>([]);
  const n = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const mostrar = useCallback((e: Emoji, quien: string, mio: boolean) => {
    const id = ++n.current;
    const x = 18 + ((id * 37) % 64);
    setFlotan((f) => [...f.slice(-7), { id, e, quien, mio, x }]);
    timers.current.push(window.setTimeout(() => setFlotan((f) => f.filter((y) => y.id !== id)), 2600));
  }, []);
  return { flotan, mostrar };
}

/** Los emojis flotando: suben y se desvanecen. No tapan los botones (no reciben toques). */
export function EmojisFlotando({ flotan }: { flotan: Flota[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 h-0" aria-live="polite">
      <style>{`@keyframes rx-sube{0%{transform:translate(-50%,0) scale(.6);opacity:0}12%{transform:translate(-50%,-30px) scale(1.15);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-260px) scale(1);opacity:0}}
@media (prefers-reduced-motion: reduce){.rx-flota{animation-duration:.01s!important}}`}</style>
      {flotan.map((f) => (
        <div key={f.id} className="rx-flota absolute flex flex-col items-center" style={{ left: `${f.x}%`, bottom: 0, animation: "rx-sube 2.6s ease-out forwards" }}>
          <span className="text-5xl drop-shadow-[0_4px_8px_rgba(0,0,0,.5)]">{f.e}</span>
          <span className="mt-0.5 max-w-[8rem] truncate rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: f.mio ? "#2F6FDE" : "#D9452B", color: "#fff" }}>{f.quien}</span>
        </div>
      ))}
    </div>
  );
}

/** La fila de emojis para mandar. */
export function BarraEmojis({ onMandar, className = "" }: { onMandar: (e: Emoji) => void; className?: string }) {
  const [espera, setEspera] = useState(false);
  const t = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <div className={`flex items-center justify-center gap-1.5 rounded-2xl bg-white/[.07] p-1.5 ring-1 ring-white/15 ${className}`} role="group" aria-label="Mandale un emoji a tu rival">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          disabled={espera}
          onClick={() => {
            onMandar(e);
            setEspera(true);
            t.current = window.setTimeout(() => setEspera(false), ESPERA_MS);
            try { navigator.vibrate?.(10); } catch { /* sin vibración */ }
          }}
          className="grid h-11 w-11 place-items-center rounded-xl text-2xl transition active:scale-90 disabled:opacity-50"
          aria-label={`Mandar ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
