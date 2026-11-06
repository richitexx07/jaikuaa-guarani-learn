import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Olla3D, ResultadoOlla } from "./olla-3d-scene";

/**
 * La olla en 3D. Se carga aparte (three.js) solo en Tembi'u y se reutiliza entre partidas.
 * Mientras carga, o si el celular no puede dibujar en 3D, se ve la olla plana de siempre.
 */
let cache: { canvas: HTMLCanvasElement; olla: Olla3D } | null = null;
let soporta: boolean | null = null;

export function Olla3DView({ picked, resultado, plano }: { picked: string[]; resultado: ResultadoOlla; plano: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const [olla, setOlla] = useState<Olla3D | null>(null);
  const [sin3d, setSin3d] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const mod = await import("./olla-3d-scene");
        if (soporta === null) soporta = mod.hayWebGL();
        if (!soporta) throw new Error("sin webgl");
        if (!cache) {
          const canvas = document.createElement("canvas");
          canvas.className = "block h-full w-full";
          canvas.setAttribute("aria-hidden", "true");
          let reducir = false;
          try { reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* nada */ }
          cache = { canvas, olla: mod.crearOlla(canvas, reducir) };
        }
        if (!vivo || !caja.current) return;
        caja.current.appendChild(cache.canvas);
        setOlla(cache.olla);
      } catch {
        if (vivo) setSin3d(true);
      }
    })();
    return () => {
      vivo = false;
      if (cache?.canvas.parentElement) cache.canvas.parentElement.removeChild(cache.canvas);
    };
  }, []);

  const clave = picked.join("|");
  useEffect(() => {
    olla?.setIngredientes(picked);
  }, [olla, clave]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    olla?.setResultado(resultado);
  }, [olla, resultado]);

  if (sin3d) return <>{plano}</>;
  return (
    <div ref={caja} className="relative mx-auto aspect-[4/3] w-full max-w-sm">
      {!olla && <div className="absolute inset-0 grid place-items-center">{plano}</div>}
    </div>
  );
}
