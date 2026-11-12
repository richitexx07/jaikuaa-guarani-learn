import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import type { Escenario3D, PoseJai3D } from "./escenario-3d-scene";
import { Escenario, JAI_KARAOKE, K, type PoseJai } from "./escenario";

/**
 * El escenario de Purahéi en 3D. Se carga aparte (three.js) solo en el karaoke y se reutiliza entre canciones.
 * Mientras carga, o si el celular no puede dibujar en 3D, se ve el escenario plano de siempre.
 */
let cache: { canvas: HTMLCanvasElement; esc: Escenario3D } | null = null;
let soporta: boolean | null = null;
const ESPERA_MAX_MS = 8000;

/** Baja el escenario 3D antes de entrar a la canción, así aparece al instante. */
export function precargarEscenario3D(): void {
  void import("./escenario-3d-scene").catch(() => undefined);
}

type Props = {
  beat: number;
  playing: boolean;
  pose: PoseJai;
  animo: number;
  festejo: number;
  fiesta: boolean;
  /** Nivel del micrófono de 0 a 1, o null si no se canta con micrófono. */
  nivelVoz: number | null;
};

export function Escenario3DView(props: Props) {
  const { beat, playing, pose, animo, festejo, fiesta, nivelVoz } = props;
  const caja = useRef<HTMLDivElement>(null);
  const [esc, setEsc] = useState<Escenario3D | null>(null);
  const [sin3d, setSin3d] = useState(false);

  useEffect(() => {
    let vivo = true;
    const tope = window.setTimeout(() => { if (vivo && !cache) setSin3d(true); }, ESPERA_MAX_MS);
    (async () => {
      try {
        const mod = await import("./escenario-3d-scene");
        if (soporta === null) soporta = mod.hayWebGL();
        if (!soporta) throw new Error("sin webgl");
        if (!cache) {
          const canvas = document.createElement("canvas");
          canvas.className = "absolute inset-0 block h-full w-full";
          canvas.setAttribute("aria-hidden", "true");
          let reducir = false;
          try { reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* nada */ }
          cache = { canvas, esc: mod.crearEscenario(canvas, JAI_KARAOKE as Record<PoseJai3D, string>, reducir) };
        }
        if (!vivo || !caja.current) return;
        caja.current.prepend(cache.canvas);
        setEsc(cache.esc);
      } catch {
        if (vivo) setSin3d(true);
      }
    })();
    return () => {
      vivo = false;
      window.clearTimeout(tope);
      if (cache?.canvas.parentElement) cache.canvas.parentElement.removeChild(cache.canvas);
    };
  }, []);

  useEffect(() => {
    esc?.setEstado({ beat, playing, animo, fiesta, pose });
  }, [esc, beat, playing, animo, fiesta, pose]);
  useEffect(() => {
    if (festejo > 0) esc?.festejo();
  }, [esc, festejo]);

  if (sin3d) return <Escenario beat={beat} playing={playing} pose={pose} animo={animo} festejo={festejo} nivelVoz={nivelVoz} />;
  return (
    <div ref={caja} className="relative h-60 overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-80" style={{ background: K.noche }}>
      {!esc && (
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <img src={JAI_KARAOKE.espera} alt="" className="kk-jai-wait h-3/4 w-auto object-contain opacity-80" />
        </div>
      )}
      {nivelVoz !== null && (
        <div className="absolute right-[6%] top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5" aria-hidden>
          <div className="relative h-24 w-3 overflow-hidden rounded-full bg-white/15 sm:h-36">
            <div className="absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-75" style={{ height: `${Math.round(Math.min(1, nivelVoz) * 100)}%`, background: `linear-gradient(0deg, ${K.magenta}, ${K.oro})` }} />
          </div>
          <span className="kk-mic-ring grid h-8 w-8 place-items-center rounded-full" style={{ background: K.magenta, transform: `scale(${1 + Math.min(1, nivelVoz) * 0.35})`, boxShadow: `0 0 ${Math.round(nivelVoz * 24)}px ${K.magenta}` }}>
            <Mic className="h-4 w-4 text-white" />
          </span>
        </div>
      )}
      <span className="sr-only">Jai canta en el escenario</span>
    </div>
  );
}
