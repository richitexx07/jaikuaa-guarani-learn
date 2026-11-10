/**
 * El arquero elige en secreto dónde tirarse tocando directamente el arco:
 * Jai se mueve hacia la zona tocada (lado y altura) antes de confirmar.
 */
import { useState } from "react";
import jaiArquero from "@/assets/penales/jai-arquero-listo.webp";
import type { Dive } from "./physics";

const ZONAS: { d: Dive; col: number; fila: number; l: string }[] = [
  { d: "left-high", col: 0, fila: 0, l: "Arriba a la izquierda" },
  { d: "center-high", col: 1, fila: 0, l: "Arriba al centro" },
  { d: "right-high", col: 2, fila: 0, l: "Arriba a la derecha" },
  { d: "left", col: 0, fila: 1, l: "Abajo a la izquierda" },
  { d: "center", col: 1, fila: 1, l: "Abajo al centro" },
  { d: "right", col: 2, fila: 1, l: "Abajo a la derecha" },
];

/** Hacia dónde se estira Jai según la zona (desplazamiento y giro). */
function pose(z?: (typeof ZONAS)[number]) {
  if (!z) return "translate(-50%, 0) rotate(0deg) scale(1)";
  const x = (z.col - 1) * 95;
  const y = z.fila === 0 ? -38 : 8;
  const r = (z.col - 1) * (z.fila === 0 ? 55 : 75);
  return `translate(calc(-50% + ${x}%), ${y}%) rotate(${r}deg) scale(1.05)`;
}

export function ElegirEstirada({ onElegir }: { onElegir: (d: Dive) => void }) {
  const [sel, setSel] = useState<Dive | null>(null);
  const zona = ZONAS.find((z) => z.d === sel);

  const tocar = (d: Dive) => {
    if (sel) return;
    setSel(d);
    try { navigator.vibrate?.([15, 30, 25]); } catch { /* sin vibración */ }
    window.setTimeout(() => onElegir(d), 650);
  };

  return (
    <div className="mt-3">
      <div
        className="relative mx-auto aspect-[2/1] w-full max-w-md overflow-hidden rounded-t-lg"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 14px), repeating-linear-gradient(90deg, rgba(255,255,255,.14) 0 1px, transparent 1px 14px), linear-gradient(180deg, #0b2440, #1E3A5F 70%, #2f7d3a 70%)",
          boxShadow: "inset 0 0 0 6px #f5f5f5",
        }}
      >
        <div className="absolute inset-[6px] grid grid-cols-3 grid-rows-2">
          {ZONAS.map((z) => {
            const activa = sel === z.d;
            return (
              <button
                key={z.d}
                type="button"
                aria-label={`Tirarme ${z.l.toLowerCase()}`}
                disabled={!!sel}
                onClick={() => tocar(z.d)}
                className="group relative z-10 border border-dashed border-white/15 transition active:scale-95"
                style={activa ? { background: "rgba(200,16,46,.45)", boxShadow: "inset 0 0 24px rgba(255,255,255,.6)" } : undefined}
              >
                <span
                  className={`absolute inset-2 rounded-xl transition ${sel ? "" : "animate-pulse group-hover:bg-white/15"}`}
                  style={{ boxShadow: activa ? "none" : "inset 0 0 0 2px rgba(255,255,255,.25)" }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
        <img
          src={jaiArquero}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-[78%] w-auto select-none drop-shadow-[0_6px_10px_rgba(0,0,0,.5)]"
          style={{ transform: pose(zona), transition: "transform .5s cubic-bezier(.2,1.4,.4,1)" }}
        />
      </div>
      <p className="mt-2 text-center text-sm font-semibold">
        {zona ? `¡Te tirás ${zona.l.toLowerCase()}!` : "Tocá el arco donde querés tirarte"}
      </p>
    </div>
  );
}
