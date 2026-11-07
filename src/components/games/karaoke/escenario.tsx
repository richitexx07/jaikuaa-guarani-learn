/**
 * El escenario del karaoke: telón, reflectores, el Jai cantando, el arpa y el público que se anima.
 * Si existen las ilustraciones en src/assets/karaoke/ (jai-canta, jai-festeja, jai-espera, escenario)
 * se usan; si no, se usan los Jai que ya tiene la app y el escenario se dibuja con colores.
 */
import { useMemo } from "react";
import jaiSaluda from "@/assets/jai/jai-saluda.webp";
import jaiAnimo from "@/assets/jai/jai-animo.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import { Mic } from "lucide-react";

const ARCHIVOS = import.meta.glob<string>("/src/assets/karaoke/*.webp", { eager: true, import: "default" });
const url = (n: string): string | null => ARCHIVOS[`/src/assets/karaoke/${n}.webp`] ?? null;

export type PoseJai = "espera" | "canta" | "festeja";
export const JAI_KARAOKE: Record<PoseJai, string> = {
  espera: url("jai-espera") ?? jaiSaluda,
  canta: url("jai-canta") ?? jaiAnimo,
  festeja: url("jai-festeja") ?? jaiAplaude,
};
const FONDO = url("escenario");

export const K = { noche: "#1A0B33", violeta: "#2A1250", magenta: "#E0457B", oro: "#F6C445", madera: "#E2A04A", cuerda: "#F7E6C4" };

export const CSS_ESCENARIO = `
.kk-jai { transform-origin: 50% 100%; animation: kk-jai-beat .42s ease-out 1; }
@keyframes kk-jai-beat { 0% { transform: translateY(2px) scale(1.03, .97) } 100% { transform: none } }
.kk-jai-wait { animation: kk-jai-wait 3s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes kk-jai-wait { 50% { transform: translateY(-5px) } }
.kk-head { transform-box: fill-box; transform-origin: 50% 100%; }
.kk-crowd-on .kk-head { animation: kk-crowd .42s ease-out 1; }
@keyframes kk-crowd { 0% { transform: translateY(-5px) } 100% { transform: none } }
.kk-hand { transform-box: fill-box; transform-origin: 50% 100%; animation: kk-wave .8s ease-in-out infinite alternate; }
@keyframes kk-wave { from { transform: rotate(-12deg) } to { transform: rotate(12deg) } }
.kk-confeti { position: absolute; top: -12px; width: 8px; height: 13px; border-radius: 2px; animation: kk-fall 1.6s cubic-bezier(.2,.6,.4,1) forwards; }
@keyframes kk-fall { 0% { transform: translateY(0) rotate(0) } 100% { transform: translateY(260px) rotate(540deg); opacity: 0 } }
.kk-sweep { clip-path: inset(0 100% 0 0); }
.kk-sweep.on { animation: kk-sweep var(--kk-beat, .6s) linear forwards; }
.kk-sweep.done { clip-path: inset(0 0 0 0); }
@keyframes kk-sweep { to { clip-path: inset(0 0 0 0) } }
.kk-telon { background: repeating-linear-gradient(90deg, #7A1238 0 14px, #A11C4A 14px 24px, #6A0F30 24px 34px); }
.kk-mic-ring { transition: transform .08s linear, box-shadow .08s linear; }
@media (prefers-reduced-motion: reduce) { .kk-jai, .kk-jai-wait, .kk-head, .kk-hand, .kk-confeti, .kk-sweep.on { animation: none !important; } .kk-sweep.on { clip-path: inset(0 0 0 0); } }
`;

/** El arpa paraguaya: cada pulso hace vibrar una cuerda. */
export function Arpa({ beat, idle, className = "" }: { beat: number; idle?: boolean; className?: string }) {
  const n = 12;
  return (
    <svg viewBox="0 0 140 170" className={`${idle ? "kk-idle" : ""} ${className}`} aria-hidden>
      <path d="M16 160 L26 10 Q78 -4 108 52 Q118 72 132 82 L16 160Z" fill="none" stroke={K.madera} strokeWidth="9" strokeLinejoin="round" />
      <path d="M26 10 Q78 -4 108 52 Q118 72 132 82" fill="none" stroke="#9A5E22" strokeWidth="3" />
      {Array.from({ length: n }, (_, i) => {
        const x = 32 + i * 8.2;
        const top = 12 + i * 4.6 + (i > 8 ? (i - 8) * 4 : 0);
        const bottom = 152 - i * 5.6;
        const on = !idle && beat >= 0 && beat % n === i;
        return (
          <line
            key={`${i}-${on ? beat : "x"}`}
            className={`kk-string ${on ? "on" : ""}`}
            x1={x} y1={top} x2={x} y2={bottom}
            stroke={K.cuerda} strokeWidth="1.6"
            style={idle ? { animationDelay: `${i * 0.18}s` } : undefined}
          />
        );
      })}
      <circle cx="16" cy="160" r="6" fill={K.madera} />
    </svg>
  );
}

export function Reflectores({ beat }: { beat: number }) {
  return (
    <div key={beat} className={`pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden ${beat >= 0 ? "kk-beat" : ""}`} aria-hidden>
      <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="kk-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.magenta} stopOpacity=".9" /><stop offset="1" stopColor={K.magenta} stopOpacity="0" /></linearGradient>
          <linearGradient id="kk-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.oro} stopOpacity=".9" /><stop offset="1" stopColor={K.oro} stopOpacity="0" /></linearGradient>
        </defs>
        <path className="kk-cone" d="M70 0 L100 0 L190 300 L-40 300Z" fill="url(#kk-g1)" opacity=".22" />
        <path className="kk-cone" d="M300 0 L330 0 L440 300 L210 300Z" fill="url(#kk-g2)" opacity=".22" />
      </svg>
    </div>
  );
}

/** El público: cabezas que saltan con el pulso y manos que se levantan cuanto más se anima. */
function Publico({ beat, animo }: { beat: number; animo: number }) {
  const n = 15;
  const manos = Math.round(animo * n);
  const orden = useMemo(() => Array.from({ length: n }, (_, i) => (i * 7) % n), []);
  return (
    <svg key={beat} viewBox="0 0 400 70" preserveAspectRatio="none" className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full ${beat >= 0 ? "kk-crowd-on" : ""}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const x = 14 + i * 26.5 + (i % 2 ? 4 : -3);
        const y = 30 + (i % 3) * 6;
        const arriba = orden[i]! < manos;
        return (
          <g key={i} fill={i % 2 ? "#0E0620" : "#160A2C"}>
            {arriba && (
              <g className="kk-hand" style={{ animationDelay: `${(i % 4) * 0.12}s` }}>
                <rect x={x + 9} y={y - 26} width="5" height="24" rx="2.5" />
                <circle cx={x + 11.5} cy={y - 27} r="4" />
              </g>
            )}
            <g className="kk-head" style={{ animationDelay: `${(i % 3) * 0.05}s` }}>
              <circle cx={x} cy={y} r="11" />
              <path d={`M${x - 20} 72 Q${x - 18} ${y + 10} ${x} ${y + 10} Q${x + 18} ${y + 10} ${x + 20} 72Z`} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function Confeti({ n }: { n: number }) {
  const colores = ["#D52B1E", "#FFFFFF", "#2F62C9", K.oro, K.magenta];
  return (
    <div key={n} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 30 }, (_, i) => (
        <span
          key={i}
          className="kk-confeti"
          style={{ left: `${(i * 37 + (n % 13) * 7) % 100}%`, background: colores[i % colores.length], animationDelay: `${(i % 6) * 0.06}s` }}
        />
      ))}
    </div>
  );
}

export function Escenario({
  beat,
  playing,
  pose,
  animo,
  festejo,
  nivelVoz,
}: {
  beat: number;
  playing: boolean;
  pose: PoseJai;
  animo: number;
  festejo: number;
  /** Nivel del micrófono de 0 a 1, o null si no se canta con micrófono. */
  nivelVoz: number | null;
}) {
  return (
    <div className="relative h-56 overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-80">
      {FONDO ? (
        <img src={FONDO} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: `radial-gradient(70% 80% at 50% 30%, #4A1F7A 0%, ${K.violeta} 55%, ${K.noche} 100%)` }} />
          <div className="kk-telon absolute inset-y-0 left-0 w-[13%] opacity-90" style={{ borderRadius: "0 0 40% 0", boxShadow: "6px 0 18px rgba(0,0,0,.5)" }} />
          <div className="kk-telon absolute inset-y-0 right-0 w-[13%] opacity-90" style={{ borderRadius: "0 0 0 40%", boxShadow: "-6px 0 18px rgba(0,0,0,.5)" }} />
          <div className="kk-telon absolute inset-x-0 top-0 h-5 opacity-95" style={{ boxShadow: "0 4px 12px rgba(0,0,0,.5)" }} />
        </>
      )}
      <Reflectores beat={playing ? beat : -1} />
      {/* Tablado con luz */}
      <div className="absolute inset-x-[8%] bottom-6 h-10 rounded-[50%]" style={{ background: `radial-gradient(closest-side, ${K.oro}66, transparent)` }} aria-hidden />
      <Arpa beat={playing ? beat : -1} idle={!playing} className="absolute bottom-10 left-[13%] h-[52%] w-auto drop-shadow-xl" />
      <img
        key={playing ? `j${beat}` : "j"}
        src={JAI_KARAOKE[pose]}
        alt="Jai canta en el escenario"
        className={`${playing ? "kk-jai" : "kk-jai-wait"} absolute bottom-7 left-1/2 h-[82%] w-auto -translate-x-1/2 object-contain drop-shadow-2xl`}
        style={{ marginLeft: "4%" }}
      />
      {nivelVoz !== null && (
        <div className="absolute right-[15%] top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5" aria-hidden>
          <div className="relative h-24 w-3 overflow-hidden rounded-full bg-white/15 sm:h-36">
            <div className="absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-75" style={{ height: `${Math.round(Math.min(1, nivelVoz) * 100)}%`, background: `linear-gradient(0deg, ${K.magenta}, ${K.oro})` }} />
          </div>
          <span className="kk-mic-ring grid h-8 w-8 place-items-center rounded-full" style={{ background: K.magenta, transform: `scale(${1 + Math.min(1, nivelVoz) * 0.35})`, boxShadow: `0 0 ${Math.round(nivelVoz * 24)}px ${K.magenta}` }}>
            <Mic className="h-4 w-4 text-white" />
          </span>
        </div>
      )}
      <Publico beat={playing ? beat : -1} animo={animo} />
      {festejo > 0 && <Confeti n={festejo} />}
    </div>
  );
}

/** El aplausómetro: diez rayitas que se encienden cuanto mejor se canta. */
export function Aplausometro({ animo, label }: { animo: number; label: string }) {
  const n = 10;
  const on = Math.round(animo * n);
  return (
    <div className="flex items-center gap-2" aria-label={`${label}: ${on}/${n}`}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <span className="flex flex-1 gap-1" aria-hidden>
        {Array.from({ length: n }, (_, i) => (
          <i
            key={i}
            className="block h-2.5 flex-1 rounded-full transition-colors duration-200"
            style={{ background: i < on ? (i >= 7 ? K.magenta : K.oro) : "rgba(255,255,255,.14)", boxShadow: i < on && i >= 7 ? `0 0 10px ${K.magenta}` : "none" }}
          />
        ))}
      </span>
    </div>
  );
}
