import { useEffect, useState } from "react";
import { REGIONES, type Paciente, type RegionId } from "@/lib/consultorio";
import { figuraPara, type Figura } from "./figuras";

/**
 * El paciente ilustrado, en el mismo estilo que el Jai.
 * Encima de la imagen van las zonas que se tocan (ojos, boca, manos…), medidas a mano en cada figura.
 * Respira, llega a la consulta, festeja si acertaste y se queja si no.
 */
const CSS = `
.pi-in { animation: pi-in .55s cubic-bezier(.2,.9,.25,1.15) both; }
@keyframes pi-in { from { transform: translateX(38%) scale(.94); opacity: 0 } to { transform: none; opacity: 1 } }
.pi-resp { animation: pi-resp 3.6s ease-in-out infinite; transform-origin: 50% 96%; }
@keyframes pi-resp { 0%,100% { transform: scale(1, 1) } 50% { transform: scale(1.006, 1.012) } }
.pi-bien { animation: pi-bien .9s cubic-bezier(.3,1.6,.5,1) 1; transform-origin: 50% 96%; }
@keyframes pi-bien { 0%,100% { transform: none } 30% { transform: translateY(-5%) scale(1.02) } 55% { transform: translateY(0) scale(1.01, .98) } }
.pi-mal { animation: pi-mal .7s ease-in-out 1; transform-origin: 50% 96%; }
@keyframes pi-mal { 0%,100% { transform: none } 20% { transform: rotate(-1.6deg) } 40% { transform: rotate(1.4deg) } 60% { transform: rotate(-1deg) } 80% { transform: rotate(.6deg) } }
.pi-zona { cursor: pointer; transition: fill .15s, stroke .15s; }
.pi-zona:hover, .pi-zona:focus-visible { fill: rgba(15,76,85,.18); stroke: rgba(15,76,85,.55); outline: none; }
.pi-aro { animation: pi-aro 1s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes pi-aro { 0%,100% { opacity: .95; transform: scale(1) } 50% { opacity: .55; transform: scale(1.08) } }
.pi-pista { animation: pi-pista 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes pi-pista { 0%,100% { opacity: 0 } 50% { opacity: .5 } }
@media (prefers-reduced-motion: reduce) { .pi-in, .pi-resp, .pi-bien, .pi-mal, .pi-aro, .pi-pista { animation: none !important; } }
`;

export function PacienteIlustrado({
  paciente,
  correcta,
  elegida,
  bloqueado,
  idioma,
  onElegir,
}: {
  paciente: Paciente;
  correcta: RegionId;
  elegida: RegionId | null;
  bloqueado: boolean;
  idioma: "es" | "pt";
  onElegir: (r: RegionId) => void;
}) {
  const fig: Figura = figuraPara(paciente);
  const [cargada, setCargada] = useState(false);
  useEffect(() => setCargada(false), [fig.id]);
  const bien = bloqueado && elegida === correcta;
  const etiqueta = (id: RegionId) => {
    const r = REGIONES.find((x) => x.id === id)!;
    return idioma === "pt" ? r.pt : r.es[0]!.charAt(0).toUpperCase() + r.es[0]!.slice(1);
  };
  // Las zonas chicas (ojos, nariz, boca, orejas) van encima de la cabeza para que ganen el toque.
  const orden: RegionId[] = ["cabeza", "panza", "corazon", "mano", "pie", "oreja", "ojo", "boca", "nariz"];
  const zonas = [...fig.zonas].sort((a, b) => orden.indexOf(a.r) - orden.indexOf(b.r));

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <style>{CSS}</style>
      <div
        className="relative aspect-[2/3] w-full overflow-hidden rounded-3xl"
        style={{ background: "radial-gradient(70% 50% at 50% 42%, #FFFFFF 0%, #E6F4F0 55%, #CDE5DF 100%)" }}
      >
        <div aria-hidden className="absolute inset-x-[18%] bottom-[2%] h-[4%] rounded-[50%] bg-[#0A3439]/20 blur-md" />
        <div key={fig.id} className="pi-in absolute inset-0">
          <div className={`absolute inset-0 ${bloqueado ? (bien ? "pi-bien" : "pi-mal") : "pi-resp"}`}>
            <img
              src={fig.src}
              alt=""
              width={768}
              height={1152}
              draggable={false}
              onLoad={() => setCargada(true)}
              className={`absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-300 ${cargada ? "opacity-100" : "opacity-0"}`}
            />
            <svg viewBox="0 0 100 150" className="absolute inset-0 h-full w-full" role="group" aria-label={idioma === "es" ? "Cuerpo del paciente" : "Corpo do paciente"}>
              {zonas.map((z, k) => {
                const esCorrecta = bloqueado && z.r === correcta;
                const esMal = bloqueado && elegida === z.r && z.r !== correcta;
                return (
                  <g key={k}>
                    <ellipse
                      cx={z.x}
                      cy={z.y}
                      rx={z.rx}
                      ry={z.ry}
                      className={bloqueado ? undefined : "pi-zona"}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth={0.8}
                      role="button"
                      tabIndex={bloqueado ? -1 : 0}
                      aria-label={etiqueta(z.r)}
                      aria-disabled={bloqueado}
                      onClick={() => !bloqueado && onElegir(z.r)}
                      onKeyDown={(e) => {
                        if (!bloqueado && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onElegir(z.r);
                        }
                      }}
                    />
                    {(esCorrecta || esMal) && (
                      <ellipse
                        cx={z.x}
                        cy={z.y}
                        rx={z.rx + 1.2}
                        ry={z.ry + 1.2}
                        className={esCorrecta ? "pi-aro" : undefined}
                        fill={esCorrecta ? "rgba(61,224,176,.22)" : "rgba(213,43,30,.18)"}
                        stroke={esCorrecta ? "#1E9E78" : "#D52B1E"}
                        strokeWidth={1.4}
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}
              {!bloqueado && (
                // Pista suave en la panza y el pecho: zonas que no tienen un borde marcado en el dibujo
                <g pointerEvents="none" fill="none" stroke="#0F4C55" strokeWidth={0.6} strokeDasharray="1.6 1.4">
                  {fig.zonas.filter((z) => z.r === "panza").map((z, k) => (
                    <ellipse key={k} className="pi-pista" cx={z.x} cy={z.y} rx={z.rx * 0.6} ry={z.ry * 0.6} />
                  ))}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
      <p className="mt-1 text-center text-xs opacity-60">{idioma === "es" ? "Tocá la parte del cuerpo" : "Toque a parte do corpo"}</p>
    </div>
  );
}

/** La cara del paciente para la ficha (la misma figura, recortada). */
export function CaraPaciente({ paciente, className = "" }: { paciente: Paciente; className?: string }) {
  const fig = figuraPara(paciente);
  return (
    <div className={`overflow-hidden rounded-full bg-[#DCEFEA] ${className}`}>
      <img
        src={fig.src}
        alt=""
        width={768}
        height={1152}
        className="h-full w-full object-cover"
        style={{ objectPosition: "50% 0%", transform: "scale(2.6)", transformOrigin: `50% ${((fig.caraY / 768) * 100).toFixed(1)}%` }}
      />
    </div>
  );
}

