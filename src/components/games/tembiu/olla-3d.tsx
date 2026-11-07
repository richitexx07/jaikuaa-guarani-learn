import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Olla3D, ResultadoOlla } from "./olla-3d-scene";

/**
 * La olla en 3D. Se carga aparte (three.js) solo en Tembi'u y se reutiliza entre partidas.
 * Mientras carga, o si el celular no puede dibujar en 3D, se ve la olla plana de siempre.
 */
let cache: { canvas: HTMLCanvasElement; olla: Olla3D } | null = null;
let soporta: boolean | null = null;
/** Si el 3D tarda más que esto (celular lento o mala señal), se muestra la olla plana. */
const ESPERA_MAX_MS = 8000;

/** Baja la olla 3D antes de entrar a Tembi'u (desde la página de Juegos), así aparece al instante. */
export function precargarOlla(): void {
  void import("./olla-3d-scene").catch(() => undefined);
}

/** Mientras se prende la olla 3D: brasas y vapor, sin mostrar la olla vieja. */
function Prendiendo() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <style>{`@keyframes tb-brasa{0%,100%{opacity:.55;transform:scale(.96)}50%{opacity:1;transform:scale(1.04)}}
@keyframes tb-punto{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-6px);opacity:1}}
@media (prefers-reduced-motion: reduce){.tb-anim{animation:none!important}}`}</style>
      <div className="flex flex-col items-center gap-3">
        <div className="tb-anim h-24 w-40 rounded-[50%]" style={{ background: "radial-gradient(closest-side,#FFB23E,#E2572B 55%,rgba(120,30,10,0) 100%)", filter: "blur(2px)", animation: "tb-brasa 1.4s ease-in-out infinite" }} />
        <div className="flex gap-2" aria-hidden>
          {["#D52B1E", "#FFFFFF", "#0038A8"].map((c, i) => (
            <span key={c} className="tb-anim h-2.5 w-2.5 rounded-full" style={{ background: c, animation: `tb-punto 1s ${i * 0.15}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Olla3DView({ picked, resultado, plano }: { picked: string[]; resultado: ResultadoOlla; plano: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const [olla, setOlla] = useState<Olla3D | null>(null);
  const [sin3d, setSin3d] = useState(false);

  useEffect(() => {
    let vivo = true;
    const tope = window.setTimeout(() => { if (vivo && !cache) setSin3d(true); }, ESPERA_MAX_MS);
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
      window.clearTimeout(tope);
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
      {!olla && <Prendiendo />}
    </div>
  );
}
