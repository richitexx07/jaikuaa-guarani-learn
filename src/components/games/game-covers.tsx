import type { ReactElement } from "react";

/**
 * Portadas ilustradas de cada juego para la vitrina (/juegos).
 * Solo dibujos: no llevan texto en guaraní.
 */
export type CoverId =
  | "consultorio"
  | "taanga"
  | "tekojoja"
  | "nee-rape"
  | "karaoke"
  | "tembiu"
  | "duelo"
  | "trivia-duelo"
  | "ahorcado"
  | "sopa-de-letras"
  | "memoria"
  | "penales"
  | "palabra-del-dia";

/** Color de fondo y de texto de cada portada (el título va debajo, sobre este color). */
export const COVER_TONE: Record<CoverId, { bg: string; ink: string }> = {
  consultorio: { bg: "#0F4C55", ink: "#FFFFFF" },
  taanga: { bg: "#1A191F", ink: "#FFFFFF" },
  tekojoja: { bg: "#4A1F2B", ink: "#FFFFFF" },
  "nee-rape": { bg: "#1F5E43", ink: "#FFFFFF" },
  karaoke: { bg: "#2A1250", ink: "#FFFFFF" },
  tembiu: { bg: "#A8462A", ink: "#FFFFFF" },
  duelo: { bg: "#7A1B22", ink: "#FFFFFF" },
  "trivia-duelo": { bg: "#0E2A5C", ink: "#FFFFFF" },
  ahorcado: { bg: "#E9A23B", ink: "#3A1F0E" },
  "sopa-de-letras": { bg: "#DCE9F7", ink: "#13294B" },
  memoria: { bg: "#13294B", ink: "#FFFFFF" },
  penales: { bg: "#0B3D2A", ink: "#FFFFFF" },
  "palabra-del-dia": { bg: "#F28C28", ink: "#3A1A05" },
};

export function GameCover({ id, className = "" }: { id: CoverId; className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={className} role="presentation" aria-hidden preserveAspectRatio="xMidYMid slice">
      {ART[id]}
    </svg>
  );
}

const chipa = (x: number, y: number, r: number, k: string) => (
  <g key={k} transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#E7B46A" />
    <circle r={r} fill="none" stroke="#A8692C" strokeWidth={r * 0.12} opacity=".55" />
    <circle r={r * 0.38} fill="#7A4317" opacity=".9" />
    <circle cx={-r * 0.45} cy={-r * 0.5} r={r * 0.09} fill="#A8692C" />
    <circle cx={r * 0.55} cy={-r * 0.3} r={r * 0.08} fill="#A8692C" />
    <circle cx={r * 0.2} cy={r * 0.62} r={r * 0.08} fill="#A8692C" />
  </g>
);

const SOPA = ["Ñ", "A", "G", "Ẽ", "T", "R", "Ũ", "K", "Ỹ", "J", "P", "M", "Ĩ", "H", "S", "Õ", "B", "Ã", "V", "Y"];

const ART: Record<CoverId, ReactElement> = {
  consultorio: (
    <>
      <rect width="200" height="150" fill="#0F4C55" />
      <rect x="22" y="26" width="156" height="86" rx="10" fill="#062A2E" stroke="#1C6A73" strokeWidth="3" />
      <path d="M30 72 H70 L78 64 L86 72 H96 L104 38 L114 100 L122 72 H140 L150 62 L160 72 H172" fill="none" stroke="#3DE0B0" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M152 32 c-6-8-18-2-12 8 l12 12 l12-12 c6-10-6-16-12-8z" fill="#D52B1E" />
      <path d="M40 112 v14 q0 14 18 14 q18 0 18-14 v-14" fill="none" stroke="#E6F2EF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="96" cy="128" r="9" fill="#E6F2EF" />
      <circle cx="96" cy="128" r="4" fill="#0F4C55" />
      <path d="M76 126 q10 2 11 2" stroke="#E6F2EF" strokeWidth="4" fill="none" />
    </>
  ),
  taanga: (
    <>
      <rect width="200" height="150" fill="#1A191F" />
      <path d="M150 0 L200 0 L200 150 L60 150 Z" fill="#F4C04E" opacity=".14" />
      <g transform="translate(36 52)">
        <rect y="22" width="128" height="70" rx="6" fill="#F6F1E6" />
        <rect y="22" width="128" height="18" fill="#26252B" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${i * 24 + 4} 40 L${i * 24 + 16} 22 H${i * 24 + 26} L${i * 24 + 14} 40 Z`} fill="#F6F1E6" />
        ))}
        <g transform="rotate(-16)">
          <rect x="-2" y="0" width="130" height="18" rx="3" fill="#26252B" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${i * 24 + 2} 18 L${i * 24 + 14} 0 H${i * 24 + 24} L${i * 24 + 12} 18 Z`} fill="#F6F1E6" />
          ))}
        </g>
        <rect x="10" y="50" width="48" height="5" rx="2" fill="#26252B" opacity=".5" />
        <rect x="10" y="62" width="76" height="5" rx="2" fill="#26252B" opacity=".5" />
        <rect x="10" y="74" width="36" height="5" rx="2" fill="#26252B" opacity=".5" />
      </g>
      <circle cx="168" cy="26" r="7" fill="#E5322D" />
    </>
  ),
  tekojoja: (
    <>
      <rect width="200" height="150" fill="#4A1F2B" />
      <rect x="0" y="122" width="200" height="28" fill="#3A1621" />
      <g stroke="#E8C26A" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M100 30 V122" />
        <path d="M54 46 H146" />
        <path d="M80 122 H120" />
        <path d="M54 46 L36 86 M54 46 L72 86" />
        <path d="M146 46 L128 86 M146 46 L164 86" />
      </g>
      <path d="M30 86 Q54 104 78 86 Z" fill="#E8C26A" />
      <path d="M122 86 Q146 104 170 86 Z" fill="#E8C26A" />
      <circle cx="100" cy="28" r="7" fill="#E8C26A" />
    </>
  ),
  "nee-rape": (
    <>
      <rect width="200" height="150" fill="#1F5E43" />
      <path d="M0 110 Q50 92 100 112 T200 104 V150 H0Z" fill="#174A34" />
      <path d="M40 120 C70 60 120 140 160 50" fill="none" stroke="#F3E3B5" strokeWidth="5" strokeDasharray="2 10" strokeLinecap="round" />
      {[[26, 84], [146, 22]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect width="28" height="48" rx="6" fill="#0E2A1F" stroke="#F3E3B5" strokeWidth="3" />
          <rect x="5" y="7" width="18" height="28" rx="2" fill={i ? "#F6C445" : "#7FD3A8"} />
        </g>
      ))}
      <g fill="none" stroke="#F3E3B5" strokeWidth="3" strokeLinecap="round" transform="translate(98 70)">
        <path d="M-14 0 a20 20 0 0 1 28 0" />
        <path d="M-8 6 a11 11 0 0 1 16 0" />
        <circle cx="0" cy="12" r="2.5" fill="#F3E3B5" />
      </g>
    </>
  ),
  karaoke: (
    <>
      <rect width="200" height="150" fill="#2A1250" />
      <path d="M40 0 L70 0 L120 150 L-10 150Z" fill="#E0457B" opacity=".25" />
      <path d="M130 0 L160 0 L210 150 L90 150Z" fill="#F6C445" opacity=".18" />
      <g transform="translate(26 22)">
        <path d="M10 108 L18 6 Q60 -6 92 40 Q104 60 118 70 L10 108Z" fill="none" stroke="#E2A04A" strokeWidth="7" strokeLinejoin="round" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${22 + i * 10} ${10 + i * 5} L${22 + i * 10} ${103 - i * 3.6}`} stroke="#F7E6C4" strokeWidth="1.6" />
        ))}
      </g>
      <g transform="translate(146 54)">
        <rect x="-10" y="0" width="20" height="34" rx="10" fill="#C9CCD6" />
        <path d="M-15 24 q15 22 30 0" fill="none" stroke="#C9CCD6" strokeWidth="3" />
        <path d="M0 46 V70 M-12 70 H12" stroke="#C9CCD6" strokeWidth="3" />
      </g>
      <circle cx="176" cy="30" r="4" fill="#F6C445" />
      <circle cx="160" cy="18" r="2.5" fill="#E0457B" />
    </>
  ),
  tembiu: (
    <>
      <rect width="200" height="150" fill="#A8462A" />
      <g opacity=".22" stroke="#F4D7B4" strokeWidth="2">
        {[0, 1, 2, 3, 4].map((r) => (
          <path key={r} d={`M0 ${r * 30 + 15} H200`} />
        ))}
      </g>
      <g fill="none" stroke="#FFF4E0" strokeWidth="3" strokeLinecap="round" opacity=".85">
        <path d="M78 34 q-8 -10 0 -20 q8 -10 0 -20" />
        <path d="M100 38 q-8 -10 0 -20 q8 -10 0 -20" />
        <path d="M122 34 q-8 -10 0 -20 q8 -10 0 -20" />
      </g>
      <ellipse cx="100" cy="64" rx="66" ry="14" fill="#5B2414" />
      <path d="M34 64 Q36 128 100 130 Q164 128 166 64 Z" fill="#7A3018" />
      <path d="M44 84 Q100 98 156 84" stroke="#C26A3E" strokeWidth="3" fill="none" />
      <ellipse cx="100" cy="64" rx="56" ry="9" fill="#F2C14E" />
      {chipa(150, 120, 16, "c1")}
    </>
  ),
  duelo: (
    <>
      <rect width="200" height="150" fill="#D52B1E" />
      <path d="M120 0 H200 V150 H80 Z" fill="#0038A8" />
      <path d="M112 18 L82 78 H104 L88 132 L132 62 H108 L124 18Z" fill="#FFFFFF" />
      <text x="16" y="96" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="34" fill="#FFFFFF">VS</text>
    </>
  ),
  "trivia-duelo": (
    <>
      <rect width="200" height="150" fill="#0E2A5C" />
      <g transform="translate(100 82)">
        {["#D52B1E", "#F6C445", "#1F8A5B", "#FFFFFF", "#0038A8", "#E9A23B", "#7FD3A8", "#E0457B"].map((c, i) => (
          <path key={i} d={`M0 0 L${54 * Math.cos((i * Math.PI) / 4)} ${54 * Math.sin((i * Math.PI) / 4)} A54 54 0 0 1 ${54 * Math.cos(((i + 1) * Math.PI) / 4)} ${54 * Math.sin(((i + 1) * Math.PI) / 4)} Z`} fill={c} />
        ))}
        <circle r="56" fill="none" stroke="#F3E3B5" strokeWidth="4" />
        <circle r="12" fill="#0E2A5C" stroke="#F3E3B5" strokeWidth="3" />
        <path d="M-9 -66 H9 L0 -50Z" fill="#F3E3B5" />
      </g>
    </>
  ),
  ahorcado: (
    <>
      <rect width="200" height="150" fill="#E9A23B" />
      <path d="M34 92 Q100 22 166 92" fill="none" stroke="#7A4317" strokeWidth="6" strokeLinecap="round" />
      {chipa(70, 82, 17, "a")}
      {chipa(130, 82, 17, "c")}
      {chipa(100, 70, 18, "b")}
      {chipa(86, 96, 15, "d")}
      {chipa(116, 96, 15, "e")}
      <path d="M36 102 H164 L152 142 H48Z" fill="#8A5221" />
      {[0, 1, 2].map((r) => (
        <path key={r} d={`M${39 + r * 3.5} ${112 + r * 11} H${161 - r * 3.5}`} stroke="#5E3413" strokeWidth="3" />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${50 + i * 13} 104 L${54 + i * 11.5} 140`} stroke="#B07035" strokeWidth="2" opacity=".7" />
      ))}
    </>
  ),
  "sopa-de-letras": (
    <>
      <rect width="200" height="150" fill="#DCE9F7" />
      {SOPA.map((ch, i) => (
        <text key={i} x={30 + (i % 5) * 35} y={34 + Math.floor(i / 5) * 30} fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="18" fill="#13294B" textAnchor="middle" opacity=".85">
          {ch}
        </text>
      ))}
      <rect x="14" y="44" width="174" height="26" rx="13" fill="none" stroke="#D52B1E" strokeWidth="3.5" />
      <rect x="83" y="12" width="26" height="114" rx="13" fill="none" stroke="#1F8A5B" strokeWidth="3.5" />
    </>
  ),
  memoria: (
    <>
      <rect width="200" height="150" fill="#13294B" />
      <g transform="translate(64 78) rotate(-12)">
        <rect x="-32" y="-44" width="64" height="88" rx="8" fill="#1E3D6B" stroke="#F3E3B5" strokeWidth="2.5" />
        <g fill="none" stroke="#F3E3B5" strokeWidth="1.4">
          <circle r="22" />
          <circle r="12" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M0 -6 L0 -22" transform={`rotate(${i * 30})`} />
          ))}
        </g>
      </g>
      <g transform="translate(130 76) rotate(10)">
        <rect x="-32" y="-44" width="64" height="88" rx="8" fill="#FFFFFF" />
        <rect x="-18" y="-6" width="36" height="5" rx="2.5" fill="#13294B" />
        <rect x="-12" y="4" width="24" height="4" rx="2" fill="#13294B" opacity=".4" />
        <path d="M-8 -26 l8 8 l8 -8" stroke="#1F8A5B" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    </>
  ),
  penales: (
    <>
      <rect width="200" height="150" fill="#0A1E3A" />
      <rect y="92" width="200" height="58" fill="#0F5A36" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 50} y="92" width="25" height="58" fill="#0B4C2D" />
      ))}
      {[[20, 12], [180, 12]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 14} y={y} width="28" height="12" rx="2" fill="#FFF7D6" />
          <path d={`M${x - 14} ${y + 12} L${i ? x - 70 : x - 10} 150 L${i ? x + 10 : x + 70} 150 L${x + 14} ${y + 12}Z`} fill="#FFF7D6" opacity=".08" />
        </g>
      ))}
      <g stroke="#FFFFFF" fill="none">
        <path d="M44 96 V44 H156 V96" strokeWidth="5" />
        <g strokeWidth="1" opacity=".45">
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M${54 + i * 10} 46 V96`} />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M46 ${54 + i * 9} H154`} />
          ))}
        </g>
      </g>
      <g transform="translate(100 124)">
        <circle r="12" fill="#FFFFFF" />
        <path d="M0 -5 l5 3.5 -2 6 h-6 l-2 -6z" fill="#13294B" />
      </g>
    </>
  ),
  "palabra-del-dia": (
    <>
      <rect width="200" height="150" fill="#F28C28" />
      <circle cx="100" cy="150" r="86" fill="#F6C445" />
      <circle cx="100" cy="150" r="56" fill="#FBE08A" />
      <g transform="translate(66 22)">
        <rect width="68" height="74" rx="8" fill="#FFFFFF" />
        <rect width="68" height="20" rx="8" fill="#D52B1E" />
        <rect y="12" width="68" height="8" fill="#D52B1E" />
        <rect x="14" y="-6" width="6" height="14" rx="3" fill="#3A1A05" />
        <rect x="48" y="-6" width="6" height="14" rx="3" fill="#3A1A05" />
        <rect x="18" y="34" width="32" height="8" rx="4" fill="#3A1A05" />
        <rect x="24" y="50" width="20" height="6" rx="3" fill="#3A1A05" opacity=".35" />
      </g>
    </>
  ),
};
