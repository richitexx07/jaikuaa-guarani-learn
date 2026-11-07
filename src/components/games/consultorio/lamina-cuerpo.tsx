import { REGIONES, type RegionId } from "@/lib/consultorio";

/**
 * La lámina médica del Consultorio: el cuerpo humano de frente, como en las láminas de los consultorios.
 * Silueta neutra en celeste, como las láminas de anatomía (sin rasgos íntimos, apta para chicos y colegios), con todas las
 * partes que se pueden señalar. Cuando el paciente dice dónde le duele, se toca la parte en la lámina;
 * al responder, la parte correcta se ilumina con su nombre.
 */

type Zona = { r: RegionId; x: number; y: number; rx: number; ry: number };

// Medidas en el dibujo (viewBox 0 0 200 300). Las zonas chicas van al final para que ganen el toque.
const ZONAS: Zona[] = [
  { r: "panza", x: 100, y: 150, rx: 24, ry: 19 },
  { r: "corazon", x: 113, y: 110, rx: 14, ry: 13 },
  { r: "mano", x: 40, y: 195, rx: 11, ry: 14 },
  { r: "mano", x: 160, y: 195, rx: 11, ry: 14 },
  { r: "pie", x: 85, y: 282, rx: 15, ry: 9 },
  { r: "pie", x: 115, y: 282, rx: 15, ry: 9 },
  { r: "cabeza", x: 100, y: 27, rx: 23, ry: 12 },
  { r: "oreja", x: 74, y: 45, rx: 6, ry: 10 },
  { r: "oreja", x: 126, y: 45, rx: 6, ry: 10 },
  { r: "ojo", x: 90, y: 41, rx: 7, ry: 5 },
  { r: "ojo", x: 110, y: 41, rx: 7, ry: 5 },
  { r: "nariz", x: 100, y: 50, rx: 4.5, ry: 5 },
  { r: "boca", x: 100, y: 59.5, rx: 8, ry: 4 },
];

const C = { cuerpo1: "#EEF7FB", cuerpo2: "#C4E2EF", linea: "#4F93B0", detalle: "#8FC2D6", zona: "#0F4C55", bien: "#1E9E78", mal: "#D52B1E" };

const CSS = `
.lc-in { animation: lc-in .45s ease-out both; }
@keyframes lc-in { from { opacity: 0; transform: scale(.97) } }
.lc-zona { cursor: pointer; transition: fill .15s, stroke .15s; }
.lc-zona:hover, .lc-zona:focus-visible { fill: rgba(15,76,85,.16); stroke: rgba(15,76,85,.6); outline: none; }
.lc-aro { animation: lc-aro 1s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes lc-aro { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .6; transform: scale(1.1) } }
.lc-pista { animation: lc-pista 2.6s ease-in-out infinite; }
@keyframes lc-pista { 0%,100% { opacity: 0 } 50% { opacity: .45 } }
@media (prefers-reduced-motion: reduce) { .lc-in, .lc-aro, .lc-pista { animation: none !important; } }
`;

/**
 * La silueta del cuerpo: la mitad izquierda (punto por punto, de la nuca a la entrepierna) y su espejo,
 * unidas con curvas suaves (Catmull-Rom). Así queda un solo contorno, sin costuras.
 */
const MITAD: [number, number][] = [
  [100, 74], [92, 76], [84, 79], [74, 82], [64, 87], [57, 96], [53, 112], [49, 132], [45, 152], [41, 170], [37, 184],
  [46, 188], [50, 168], [54, 148], [58, 128], [62, 112], [65, 108], [68, 128], [70, 150], [71, 168], [69, 188],
  [71, 214], [75, 238], [77, 256], [80, 272], [94, 274], [96, 256], [97, 236], [98, 214], [100, 200],
];
function contorno(): string {
  const der = MITAD.slice(1, -1).map(([x, y]) => [200 - x, y] as [number, number]).reverse();
  const pts = [...MITAD, ...der];
  const n = pts.length;
  const q = (i: number) => pts[(i + n) % n]!;
  const r = (v: number) => Math.round(v * 100) / 100;
  let d = `M${q(0)[0]} ${q(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [q(i - 1), q(i), q(i + 1), q(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r(c1[0]!)} ${r(c1[1]!)} ${r(c2[0]!)} ${r(c2[1]!)} ${p2[0]} ${p2[1]}`;
  }
  return d + " Z";
}
const CUERPO = contorno();

/** El cuerpo dibujado (solo la figura, sin zonas): estilo lámina médica, en celeste. */
function Figura() {
  return (
    <g stroke={C.linea} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id="lc-piel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.cuerpo1} />
          <stop offset="1" stopColor={C.cuerpo2} />
        </linearGradient>
      </defs>
      {/* Manos y pies */}
      <ellipse cx={40} cy={195} rx={8} ry={11} fill="url(#lc-piel)" />
      <ellipse cx={160} cy={195} rx={8} ry={11} fill="url(#lc-piel)" />
      <ellipse cx={86} cy={280} rx={11} ry={5.5} fill="url(#lc-piel)" />
      <ellipse cx={114} cy={280} rx={11} ry={5.5} fill="url(#lc-piel)" />
      {/* Cuerpo */}
      <path d={CUERPO} fill="url(#lc-piel)" />
      {/* Cuello, orejas y cabeza */}
      <path d="M92 60 L92 76 Q100 80 108 76 L108 60 Z" fill="url(#lc-piel)" />
      <ellipse cx={74.5} cy={45} rx={4.5} ry={8} fill="url(#lc-piel)" />
      <ellipse cx={125.5} cy={45} rx={4.5} ry={8} fill="url(#lc-piel)" />
      <ellipse cx={100} cy={42} rx={24} ry={26} fill="url(#lc-piel)" />
      {/* Cara */}
      <g strokeWidth={1}>
        <ellipse cx={90} cy={41} rx={3.6} ry={2.3} fill="#FFFFFF" />
        <ellipse cx={110} cy={41} rx={3.6} ry={2.3} fill="#FFFFFF" />
        <circle cx={90} cy={41} r={1.3} fill={C.linea} stroke="none" />
        <circle cx={110} cy={41} r={1.3} fill={C.linea} stroke="none" />
        <path d="M100 44 L97.5 52 Q100 54 102.5 52.5" fill="none" />
        <path d="M93 59 Q100 63 107 59" fill="none" />
        <path d="M85 36 Q90 34 95 36 M105 36 Q110 34 115 36" fill="none" stroke={C.detalle} />
      </g>
      {/* Líneas de lámina: clavículas, eje del cuerpo, ombligo, rodillas, dedos */}
      <g fill="none" stroke={C.detalle} strokeWidth={0.9}>
        <path d="M80 89 Q90 93 100 91 Q110 93 120 89" />
        <path d="M100 95 L100 192" strokeDasharray="2 2.5" />
        <circle cx={100} cy={152} r={1.4} />
        <path d="M79 236 Q85 240 92 236 M108 236 Q115 240 121 236" />
        <path d="M35 199 L33 206 M39 202 L38 209 M43 202 L43 209 M165 199 L167 206 M161 202 L162 209 M157 202 L157 209" />
      </g>
    </g>
  );
}

export function LaminaCuerpo({
  correcta,
  elegida,
  bloqueado,
  idioma,
  onElegir,
}: {
  correcta: RegionId;
  elegida: RegionId | null;
  bloqueado: boolean;
  idioma: "es" | "pt";
  onElegir: (r: RegionId) => void;
}) {
  const etiqueta = (id: RegionId) => {
    const r = REGIONES.find((x) => x.id === id)!;
    return idioma === "pt" ? r.pt : r.es[0]!.charAt(0).toUpperCase() + r.es[0]!.slice(1);
  };
  const bien = bloqueado && elegida === correcta;
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <style>{CSS}</style>
      <div
        className="lc-in relative overflow-hidden rounded-3xl ring-1 ring-[#0F4C55]/15"
        style={{
          background:
            "linear-gradient(#FFFFFF, #F6FBFA), repeating-linear-gradient(0deg, transparent 0 23px, rgba(15,76,85,.06) 23px 24px)",
          backgroundBlendMode: "multiply",
        }}
      >
        <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#0F4C55]/60">
          <span>{idioma === "es" ? "Lámina · Cuerpo humano" : "Lâmina · Corpo humano"}</span>
          <span aria-hidden>+</span>
        </div>
        <svg viewBox="22 8 156 288" className="block h-auto w-full" role="group" aria-label={idioma === "es" ? "Lámina del cuerpo humano" : "Lâmina do corpo humano"}>
          <ellipse cx={100} cy={291} rx={44} ry={4} fill="rgba(10,52,57,.12)" />
          <Figura />
          {!bloqueado && (
            <g pointerEvents="none" fill="none" stroke={C.zona} strokeWidth={0.8} strokeDasharray="2 1.6">
              <ellipse className="lc-pista" cx={100} cy={150} rx={16} ry={12} />
            </g>
          )}
          {ZONAS.map((z, k) => {
            const esCorrecta = bloqueado && z.r === correcta;
            const esMal = bloqueado && elegida === z.r && z.r !== correcta;
            return (
              <g key={k}>
                <ellipse
                  cx={z.x}
                  cy={z.y}
                  rx={z.rx}
                  ry={z.ry}
                  className={bloqueado ? undefined : "lc-zona"}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth={0.9}
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
                    rx={z.rx + 1.5}
                    ry={z.ry + 1.5}
                    className={esCorrecta ? "lc-aro" : undefined}
                    fill={esCorrecta ? "rgba(61,224,176,.25)" : "rgba(213,43,30,.18)"}
                    stroke={esCorrecta ? C.bien : C.mal}
                    strokeWidth={1.6}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>
        {bloqueado && (
          <p className="pb-3 text-center text-sm font-bold" style={{ color: bien ? C.bien : C.mal }}>
            {bien ? "✓ " : `${idioma === "es" ? "Era" : "Era"}: `}
            {etiqueta(correcta)}
          </p>
        )}
      </div>
      {!bloqueado && <p className="mt-1 text-center text-xs opacity-60">{idioma === "es" ? "Tocá la parte del cuerpo en la lámina" : "Toque a parte do corpo na lâmina"}</p>}
    </div>
  );
}
