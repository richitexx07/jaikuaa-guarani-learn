/**
 * Reacciones con emojis para Penales a distancia: en vez de un chat (hay menores), una fila fija de emojis.
 * Lo que mandás lo ve el otro celular flotando sobre la pantalla, con tu nombre.
 * Solo se pueden mandar estos emojis: nada de texto libre.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lo que se puede mandar. Primero lo nuestro: tirarle una chipa, pasarle un tereré, el jaguareté y la bandera.
 * La chipa es un dibujo propio (no hay emoji de chipa); el tereré usa el emoji de la guampa.
 */
export const EMOJIS = ["chipa", "🧉", "🐆", "🇵🇾", "🔥", "👏", "😂", "🤝"] as const;
export type Emoji = (typeof EMOJIS)[number];
const NOMBRE: Record<Emoji, string> = { chipa: "Tirarle una chipa", "🧉": "Pasarle un tereré", "🐆": "Mandar un jaguareté", "🇵🇾": "Mandar la bandera", "🔥": "Mandar fuego", "👏": "Mandar aplausos", "😂": "Mandar risa", "🤝": "Mandar un apretón de manos" };
/** Los que se «tiran»: vuelan girando en vez de subir derechito. */
const SE_TIRA = new Set<Emoji>(["chipa", "🧉"]);

/** Una chipa dibujada: rosca dorada con su agujerito y manchas de horno. */
export function Chipa({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <radialGradient id="chipa-masa" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFE7A3" />
          <stop offset=".55" stopColor="#E9B55A" />
          <stop offset="1" stopColor="#B87624" />
        </radialGradient>
      </defs>
      <path fillRule="evenodd" fill="url(#chipa-masa)" stroke="#8A5517" strokeWidth="1.5" d="M24 5a19 18 0 1 1 0 36a19 18 0 1 1 0-36Zm0 13.5a4.5 4 0 1 0 0 8a4.5 4 0 1 0 0-8Z" />
      <g fill="#A8641C" opacity=".75">
        <ellipse cx="13" cy="20" rx="2.4" ry="1.5" />
        <ellipse cx="33" cy="12" rx="2" ry="1.3" />
        <ellipse cx="36" cy="30" rx="2.6" ry="1.6" />
        <ellipse cx="18" cy="35" rx="2.2" ry="1.4" />
        <ellipse cx="25" cy="10" rx="1.5" ry="1" />
      </g>
      <path d="M12 14q6-6 14-6" fill="none" stroke="#FFF6D8" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

function Icono({ e, grande = false }: { e: Emoji; grande?: boolean }) {
  if (e === "chipa") return <Chipa className={grande ? "h-14 w-14" : "h-8 w-8"} />;
  return <span className={grande ? "text-5xl" : "text-2xl"}>{e}</span>;
}
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
@keyframes rx-tira{0%{transform:translate(-50%,0) scale(.5);opacity:0}10%{opacity:1}45%{transform:translate(calc(-50% + var(--rx-dx)),-230px) scale(1.2)}80%{opacity:1}100%{transform:translate(calc(-50% + var(--rx-dx) * 1.5),-120px) scale(1);opacity:0}}
@keyframes rx-gira{to{transform:rotate(720deg)}}
@media (prefers-reduced-motion: reduce){.rx-flota{animation-duration:.01s!important}}`}</style>
      {flotan.map((f) => (
        <div
          key={f.id}
          className="rx-flota absolute flex flex-col items-center"
          style={{ left: `${f.x}%`, bottom: 0, animation: `${SE_TIRA.has(f.e) ? "rx-tira" : "rx-sube"} 2.6s ease-out forwards`, ["--rx-dx" as string]: `${f.x > 50 ? -70 : 70}px` }}
        >
          <span className="rx-flota inline-block drop-shadow-[0_4px_8px_rgba(0,0,0,.5)]" style={SE_TIRA.has(f.e) ? { animation: "rx-gira 1.3s linear infinite" } : undefined}>
            <Icono e={f.e} grande />
          </span>
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
    <div className={`grid grid-cols-8 gap-1 rounded-2xl bg-white/[.07] p-1.5 ring-1 ring-white/15 ${className}`} role="group" aria-label="Mandale algo a tu rival">
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
          className="grid h-11 min-w-0 place-items-center rounded-xl transition active:scale-90 disabled:opacity-50"
          aria-label={NOMBRE[e]}
          title={NOMBRE[e]}
        >
          <Icono e={e} />
        </button>
      ))}
    </div>
  );
}
