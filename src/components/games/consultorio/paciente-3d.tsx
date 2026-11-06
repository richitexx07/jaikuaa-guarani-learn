import { useEffect, useRef, useState, type ReactNode } from "react";
import { REGIONES, type RegionId } from "@/lib/consultorio";
import type { Escena, Paciente3D } from "./paciente-3d-scene";

/**
 * El paciente en 3D. Se carga aparte (three.js) solo en el Consultorio.
 * Un solo dibujo 3D para todo el turno: cuando llega otro paciente se reutiliza, porque
 * crear uno nuevo en cada ronda traba los celulares más modestos.
 * Si el celular no puede dibujar en 3D, o mientras carga, se ve el cuerpo plano de siempre.
 */
let cache: { canvas: HTMLCanvasElement; escena: Escena } | null = null;
let soporta: boolean | null = null;

function reduceMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function Paciente3DView({
  paciente,
  correcta,
  elegida,
  bloqueado,
  idioma,
  onElegir,
  plano,
}: {
  paciente: Paciente3D;
  correcta: RegionId;
  elegida: RegionId | null;
  bloqueado: boolean;
  idioma: "es" | "pt";
  onElegir: (r: RegionId) => void;
  /** El cuerpo plano: se muestra mientras carga o si no hay 3D. */
  plano: ReactNode;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [escena, setEscena] = useState<Escena | null>(cache?.escena ?? null);
  const [sin3d, setSin3d] = useState(false);
  const elegirRef = useRef(onElegir);
  elegirRef.current = onElegir;

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const mod = await import("./paciente-3d-scene");
        if (soporta === null) soporta = mod.hayWebGL();
        if (!soporta) throw new Error("sin webgl");
        if (!cache) {
          const canvas = document.createElement("canvas");
          canvas.className = "block h-full w-full";
          canvas.setAttribute("aria-hidden", "true");
          cache = { canvas, escena: mod.crearEscena(canvas, reduceMotion()) };
        }
        if (!vivo || !caja.current) return;
        caja.current.appendChild(cache.canvas);
        cache.escena.setOnElegir((r) => elegirRef.current(r));
        setEscena(cache.escena);
      } catch {
        if (vivo) setSin3d(true);
      }
    })();
    return () => {
      vivo = false;
      if (cache?.canvas.parentElement) cache.canvas.parentElement.removeChild(cache.canvas);
    };
  }, []);

  // Paciente nuevo: cambia piel, pelo y llega caminando
  useEffect(() => {
    escena?.setPaciente(paciente);
  }, [escena, paciente.femenino, paciente.edad, paciente.piel, paciente.pelo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    escena?.setMarca({ correcta, elegida, bloqueado });
  }, [escena, correcta, elegida, bloqueado]);

  if (sin3d) return <>{plano}</>;

  const etiqueta = (id: RegionId) => {
    const r = REGIONES.find((x) => x.id === id)!;
    return idioma === "pt" ? r.pt : r.es[0]!.charAt(0).toUpperCase() + r.es[0]!.slice(1);
  };

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div
        ref={caja}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl"
        style={{ background: "radial-gradient(70% 55% at 50% 38%, #FFFFFF 0%, #E3F2EE 60%, #CFE6E0 100%)" }}
      >
        {!escena && <div className="absolute inset-0 grid place-items-center p-4">{plano}</div>}
      </div>
      {escena && (
        <p className="mt-1 text-center text-xs opacity-60">
          {idioma === "es" ? "Tocá la parte del cuerpo · deslizá para girar" : "Toque a parte do corpo · deslize para girar"}
        </p>
      )}
      {/* Para teclado y lectores de pantalla: las mismas partes como botones */}
      <div className="sr-only">
        {REGIONES.map((r) => (
          <button key={r.id} type="button" disabled={bloqueado} onClick={() => onElegir(r.id)}>
            {etiqueta(r.id)}
          </button>
        ))}
      </div>
    </div>
  );
}
