/**
 * El arquero elige en secreto dónde tirarse con la misma mecánica del que patea:
 * desliza el dedo sobre el arco (flecha), suelta, y la barra de fuerza decide
 * qué tan lejos se estira: poca fuerza se queda cerca del centro, mucha llega hasta el palo.
 */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import jaiArqueroImg from "@/assets/penales/jai-arquero-listo.webp";
import mimbiArqueraImg from "@/assets/penales/mimbi-arquera-listo.webp";
import { useMiKit } from "./camisetas";
import type { Dive } from "./physics";

type P = { x: number; y: number };
const DIVES: Dive[][] = [["left-high", "center-high", "right-high"], ["left", "center", "right"]];
const NOMBRE = [["arriba a la izquierda", "arriba al centro", "arriba a la derecha"], ["abajo a la izquierda", "abajo al centro", "abajo a la derecha"]];

/** Manotazo: deslizar al menos 25 % del arco en menos de 260 ms. */
export function esManotazo(a: P, b: P, ms: number): boolean { return ms > 0 && ms < 260 && Math.hypot(b.x - a.x, b.y - a.y) >= 25; }

export function ElegirEstirada({ onElegir }: { onElegir: (d: Dive) => void }) {
  const [miKit] = useMiKit();
  const jaiArquero = miKit.figura === "chica" ? mimbiArqueraImg : jaiArqueroImg;
  const [fase, setFase] = useState<"aim" | "power" | "done">("aim");
  const [aim, setAim] = useState<P>({ x: 50, y: 40 });
  const [fuerza, setFuerza] = useState(0);
  const [final, setFinal] = useState<{ x: number; y: number; l: string } | null>(null);
  const caja = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const inicio = useRef(0);
  const valor = useRef(0);

  useEffect(() => {
    if (fase !== "power") return;
    let f = 0;
    const tick = (t: number) => {
      const v = (Math.sin(((t - inicio.current) / 550) * Math.PI - Math.PI / 2) + 1) / 2;
      valor.current = v; setFuerza(v); f = requestAnimationFrame(tick);
    };
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
  }, [fase]);

  const pt = (e: PointerEvent<HTMLDivElement>): P => {
    const r = caja.current!.getBoundingClientRect();
    return { x: Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(5, Math.min(95, ((e.clientY - r.top) / r.height) * 100)) };
  };

  const toque = useRef({ x: 50, y: 40, t: 0 });
  const aimRef = useRef<P | null>(null);
  const confirmar = () => {
    const p = valor.current, a = aimRef.current ?? aim; aimRef.current = null;
    const x = 50 + (a.x - 50) * p;
    const col = x < 36 ? 0 : x > 64 ? 2 : 1;
    const fila = a.y < 50 ? 0 : 1;
    setFinal({ x, y: fila === 0 ? 30 : 70, l: NOMBRE[fila][col] });
    setFase("done");
    try { navigator.vibrate?.([15, 30, 25]); } catch { /* sin vibración */ }
    window.setTimeout(() => onElegir(DIVES[fila][col]), 700);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (fase === "aim") { drag.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* */ } const p = pt(e); toque.current = { ...p, t: performance.now() }; setAim(p); }
    else if (fase === "power") confirmar();
  };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (fase === "aim" && drag.current) setAim(pt(e)); };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || fase !== "aim") return;
    drag.current = false; const p = pt(e); setAim(p);
    // Reflejos: un manotazo rápido (deslizar fuerte y soltar) es estirada a fondo, sin barra.
    const ini = toque.current, dt = performance.now() - ini.t;
    if (esManotazo(ini, p, dt)) { valor.current = 1; aimRef.current = p; confirmar(); return; }
    try { navigator.vibrate?.(15); } catch { /* */ }
    inicio.current = performance.now(); setFase("power");
  };

  const jx = final ? final.x : 50;
  const dx = jx - 50;
  const rot = final ? Math.sign(dx) * Math.min(80, Math.abs(dx) * 2.2) : 0;
  const jy = final ? (final.y < 50 ? -35 : 6) : 0;
  const verde = fuerza > 0.8;

  return (
    <div className="mt-3">
      <div
        ref={caja}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => { drag.current = false; }}
        role="application"
        aria-label="Arco: deslizá el dedo para apuntar hacia dónde tirarte, soltá y tocá otra vez para elegir qué tan lejos"
        className="relative mx-auto aspect-[2/1] w-full max-w-md select-none overflow-hidden rounded-t-lg"
        style={{
          touchAction: fase === "done" ? "pan-y" : "none",
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 14px), repeating-linear-gradient(90deg, rgba(255,255,255,.14) 0 1px, transparent 1px 14px), linear-gradient(180deg, #0b2440, #1E3A5F 70%, #2f7d3a 70%)",
          boxShadow: "inset 0 0 0 6px #f5f5f5",
        }}
      >
        {fase === "aim" && (
          <div className="absolute inset-[6px] z-40 grid grid-cols-3 grid-rows-2 gap-1" role="group" aria-label="Tocá adonde te tirás">
            {DIVES.map((fila, f) => fila.map((d, c) => (
              <button
                key={d}
                type="button"
                aria-label={`Tirarme ${NOMBRE[f][c]}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => { valor.current = 1; aimRef.current = { x: [12, 50, 88][c]!, y: f === 0 ? 25 : 75 }; confirmar(); }}
                className="grid place-items-center rounded-lg border-2 border-dashed border-white/60 bg-white/5 transition active:scale-90 active:bg-white/40"
              >
                <span className="h-6 w-6 rounded-full bg-white/85 ring-4 ring-amber-400/70" />
              </button>
            )))}
          </div>
        )}
        {fase !== "done" && (
          <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden>
            <line x1="50" y1="48" x2={aim.x} y2={aim.y / 2} stroke="#FFD23F" strokeWidth="1.2" strokeDasharray="2 1.5" />
            <circle cx={aim.x} cy={aim.y / 2} r="2.4" fill="none" stroke="#FFD23F" strokeWidth="0.9" />
          </svg>
        )}
        <img
          src={jaiArquero}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute bottom-0 z-20 h-[78%] w-auto select-none drop-shadow-[0_6px_10px_rgba(0,0,0,.5)]"
          style={{ left: `${jx}%`, transform: `translate(-50%, ${jy}%) rotate(${rot}deg)`, transition: "left .5s cubic-bezier(.2,1.4,.4,1), transform .5s cubic-bezier(.2,1.4,.4,1)" }}
        />
      </div>
      {fase === "power" && (
        <button type="button" onClick={confirmar} className="mx-auto mt-2 block h-5 w-full max-w-md overflow-hidden rounded-full bg-muted" aria-label="Tocá para elegir qué tan lejos te tirás">
          <span className="block h-full rounded-full" style={{ width: `${fuerza * 100}%`, background: verde ? "#2f9e44" : "#FFD23F" }} />
        </button>
      )}
      <p className="mt-2 text-center text-sm font-semibold">
        {fase === "aim" && "¡Tocá adonde te tirás!"}
        {fase === "power" && "¡Tocá! Más fuerza = más cerca del palo"}
        {fase === "done" && final && `¡Te tirás ${final.l}!`}
      </p>
    </div>
  );
}
