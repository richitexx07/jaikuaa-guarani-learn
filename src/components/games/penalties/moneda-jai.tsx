import { useEffect, useRef, useState } from "react";
import cara from "@/assets/penales/moneda/cara.webp";
import cruz from "@/assets/penales/moneda/cruz.webp";

export type Lado = "cara" | "cruz";
type Role = "host" | "guest";

/** Tiempo para elegir antes de que el árbitro elija solo. */
export const ELEGIR_S = 5;
const VUELO_MS = 2800;
const CARTEL_MS = 2200;

/** Qué lado cae: si el que eligió (host) ganó el sorteo, cae lo que eligió; si no, el otro. */
export function ladoQueCae(elegido: Lado, primero: Role | undefined): Lado {
  return (primero ?? "host") === "host" ? elegido : elegido === "cara" ? "cruz" : "cara";
}

/** Sonido metálico corto (no es voz). */
function cling(muted: boolean, veces: number) {
  if (muted || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    for (let i = 0; i < veces; i++) {
      const t = ctx.currentTime + i * 0.16;
      for (const f of [2600, 3900]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f - i * 40;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 / (i + 1), t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.4);
      }
    }
    window.setTimeout(() => void ctx.close(), 2500);
  } catch { /* sin sonido */ }
}

export function MonedaJai({ role, primero, lado, rivalName, muted, onElegir, onFin }: {
  role: Role; primero: Role | undefined; lado: Lado | null; rivalName: string; muted: boolean;
  onElegir: (l: Lado) => void; onFin: () => void;
}) {
  const elijo = role === "host";
  const [quedan, setQuedan] = useState(ELEGIR_S);
  const [fase, setFase] = useState<"elige" | "vuela" | "cartel">("elige");
  const fin = useRef(onFin); fin.current = onFin;
  const elegir = useRef(onElegir); elegir.current = onElegir;

  // Cuenta regresiva: si nadie elige, el árbitro elige solo (y el invitado no queda trabado si no llega el aviso).
  useEffect(() => {
    if (lado) return;
    const id = window.setInterval(() => setQuedan((q) => q - 1), 1000);
    return () => window.clearInterval(id);
  }, [lado]);
  useEffect(() => {
    if (lado) return;
    if (elijo && quedan <= 0) elegir.current(Math.random() < 0.5 ? "cara" : "cruz");
    if (!elijo && quedan <= -3) elegir.current("cara");
  }, [quedan, lado, elijo]);

  useEffect(() => {
    if (!lado) return;
    setFase("vuela");
    cling(muted, 1);
    const a = window.setTimeout(() => { cling(muted, 3); setFase("cartel"); }, VUELO_MS);
    const b = window.setTimeout(() => fin.current(), VUELO_MS + CARTEL_MS);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [lado]); // eslint-disable-line react-hooks/exhaustive-deps

  const cae = lado ? ladoQueCae(lado, primero) : "cara";
  const gane = primero === role;
  const vueltas = 6 * 360 + (cae === "cruz" ? 180 : 0);
  const quienElige = elijo ? "Elegiste" : `${rivalName} eligió`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Sorteo con la moneda de Jai" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/90 p-6 text-center text-white">
      <style>{`
        @keyframes jk-vuelo{0%{transform:translateY(0) scale(1)}45%{transform:translateY(-38vh) scale(.82)}80%{transform:translateY(0) scale(1)}88%{transform:translateY(-4vh) scale(1)}100%{transform:translateY(0) scale(1)}}
        @keyframes jk-giro{0%{transform:rotateX(0)}100%{transform:rotateX(${vueltas}deg)}}
        @keyframes jk-aparece{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}
        @keyframes jk-brilla{0%,100%{filter:drop-shadow(0 0 10px rgba(255,200,60,.4))}50%{filter:drop-shadow(0 0 26px rgba(255,200,60,.9))}}
        @media (prefers-reduced-motion: reduce){.jk-mov{animation-duration:.01s!important}}
      `}</style>
      <p className="font-display text-lg font-bold uppercase tracking-wide opacity-85">Sorteo con la moneda de Jai</p>

      {fase === "elige" && (
        elijo ? (
          <>
            <p className="font-display text-2xl font-black">¿Cara o cruz?</p>
            <div className="flex gap-5">
              {([["cara", cara, "Cara: Jai"], ["cruz", cruz, "Cruz: la pelota"]] as const).map(([l, img, txt]) => (
                <button key={l} type="button" onClick={() => onElegir(l)} className="flex flex-col items-center gap-2 rounded-2xl p-2 focus-visible:outline-2 focus-visible:outline-white" style={{ animation: "jk-brilla 1.6s ease-in-out infinite" }}>
                  <img src={img} alt="" width={120} height={120} className="h-28 w-28 rounded-full object-cover" />
                  <span className="font-display text-xl font-black uppercase">{l}</span>
                  <span className="sr-only">{txt}</span>
                </button>
              ))}
            </div>
            <p className="text-sm opacity-75" aria-live="polite">Tenés {Math.max(0, quedan)} s. Si no elegís, elige el árbitro.</p>
          </>
        ) : (
          <>
            <div className="h-32 w-32 rounded-full" style={{ animation: "jk-brilla 1.6s ease-in-out infinite" }}>
              <img src={cara} alt="" width={128} height={128} className="h-32 w-32 rounded-full object-cover" />
            </div>
            <p className="font-display text-xl font-bold" aria-live="polite">{rivalName} está eligiendo cara o cruz…</p>
          </>
        )
      )}

      {fase !== "elige" && lado && (
        <>
          <p className="font-display text-xl font-bold">{quienElige} <span className="uppercase" style={{ color: "#F5C842" }}>{lado}</span></p>
          <div className="jk-mov" style={{ perspective: "700px", animation: `jk-vuelo ${VUELO_MS}ms cubic-bezier(.3,.6,.4,1) forwards` }}>
            <div className="jk-mov relative h-32 w-32" style={{ transformStyle: "preserve-3d", animation: `jk-giro ${VUELO_MS * 0.8}ms cubic-bezier(.15,.6,.35,1) forwards` }}>
              <img src={cara} alt="" className="absolute inset-0 h-32 w-32 rounded-full object-cover" style={{ backfaceVisibility: "hidden" }} />
              <img src={cruz} alt="" className="absolute inset-0 h-32 w-32 rounded-full object-cover" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }} />
            </div>
          </div>
          {fase === "cartel" && (
            <div role="status" style={{ animation: "jk-aparece .4s ease-out forwards" }}>
              <p className="font-display text-lg font-bold uppercase">Salió {cae}</p>
              <p className="font-display text-2xl font-black">{gane ? "¡Ganaste el sorteo!" : `Ganó ${rivalName}`}</p>
              <p className="mt-2 text-base opacity-85">{gane ? "Arrancás pateando y después te toca el arco." : "Arrancás en el arco: ¡a ponerse los guantes!"}</p>
              <p className="mt-1 text-sm opacity-70">Se turnan: uno patea y el otro ataja.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
