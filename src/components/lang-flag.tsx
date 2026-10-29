import type { UiLang } from "@/lib/i18n";

/**
 * Banderas vectoriales (SVG) a color: se ven iguales en cualquier equipo,
 * a diferencia de los emojis, que en Windows aparecen como letras.
 * Árabe → Liga Árabe (no favorece a un solo país). Quechua → Wiphala.
 */
const W = 30;
const H = 20;

function Stripes({ colors, vertical = false }: { colors: string[]; vertical?: boolean }) {
  const n = colors.length;
  return (
    <>
      {colors.map((c, i) =>
        vertical ? (
          <rect key={i} x={(W / n) * i} y={0} width={W / n + 0.1} height={H} fill={c} />
        ) : (
          <rect key={i} x={0} y={(H / n) * i} width={W} height={H / n + 0.1} fill={c} />
        ),
      )}
    </>
  );
}

function Wiphala() {
  const pal = ["#D52B1E", "#F7941D", "#FFD100", "#FFFFFF", "#009A44", "#0072CE", "#6A2C91"];
  const cw = W / 7;
  const ch = H / 7;
  const cells = [];
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++)
      cells.push(
        <rect key={`${r}-${c}`} x={c * cw} y={r * ch} width={cw + 0.05} height={ch + 0.05} fill={pal[(r + c + 4) % 7]} />,
      );
  return <>{cells}</>;
}

function Body({ lang }: { lang: UiLang }) {
  switch (lang) {
    case "es": // Paraguay
      return (
        <>
          <Stripes colors={["#D52B1E", "#FFFFFF", "#0038A8"]} />
          <circle cx={15} cy={10} r={2.6} fill="none" stroke="#1E3A5F" strokeWidth={0.6} />
          <circle cx={15} cy={10} r={0.9} fill="#FFD100" />
        </>
      );
    case "pt": // Brasil
      return (
        <>
          <rect width={W} height={H} fill="#009C3B" />
          <polygon points="15,2 28,10 15,18 2,10" fill="#FFDF00" />
          <circle cx={15} cy={10} r={4.2} fill="#002776" />
          <path d="M11 9.3 Q15 8 19 10.6" stroke="#FFFFFF" strokeWidth={0.7} fill="none" />
        </>
      );
    case "en": // EE. UU.
      return (
        <>
          <Stripes colors={Array.from({ length: 13 }, (_, i) => (i % 2 ? "#FFFFFF" : "#B22234"))} />
          <rect width={12} height={10.8} fill="#3C3B6E" />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={1.6 + (i % 4) * 2.9} cy={1.8 + Math.floor(i / 4) * 3.4} r={0.55} fill="#FFFFFF" />
          ))}
        </>
      );
    case "de":
      return <Stripes colors={["#000000", "#DD0000", "#FFCE00"]} />;
    case "fr":
      return <Stripes vertical colors={["#0055A4", "#FFFFFF", "#EF4135"]} />;
    case "it":
      return <Stripes vertical colors={["#009246", "#FFFFFF", "#CE2B37"]} />;
    case "ru":
      return <Stripes colors={["#FFFFFF", "#0039A6", "#D52B1E"]} />;
    case "zh": // Taiwán
      return (
        <>
          <rect width={W} height={H} fill="#FE0000" />
          <rect width={15} height={10} fill="#000095" />
          <circle cx={7.5} cy={5} r={2.6} fill="#FFFFFF" />
          <circle cx={7.5} cy={5} r={1.6} fill="#000095" />
          <circle cx={7.5} cy={5} r={1.3} fill="#FFFFFF" />
        </>
      );
    case "ja":
      return (
        <>
          <rect width={W} height={H} fill="#FFFFFF" />
          <circle cx={15} cy={10} r={6} fill="#BC002D" />
        </>
      );
    case "ko":
      return (
        <>
          <rect width={W} height={H} fill="#FFFFFF" />
          <circle cx={15} cy={10} r={5} fill="#0047A0" />
          <path d="M10 10 A5 5 0 0 1 20 10 A2.5 2.5 0 0 1 15 10 A2.5 2.5 0 0 0 10 10 Z" fill="#CD2E3A" />
          {[[5, 4.5, 35], [25, 4.5, -35], [5, 15.5, -35], [25, 15.5, 35]].map(([x, y, a], i) => (
            <g key={i} transform={`rotate(${a} ${x} ${y})`}>
              {[-1.4, 0, 1.4].map((d) => (
                <rect key={d} x={x - 2.2} y={y + d - 0.4} width={4.4} height={0.8} fill="#000000" />
              ))}
            </g>
          ))}
        </>
      );
    case "hi": // India
      return (
        <>
          <Stripes colors={["#FF9933", "#FFFFFF", "#138808"]} />
          <circle cx={15} cy={10} r={2.6} fill="none" stroke="#000080" strokeWidth={0.6} />
          <circle cx={15} cy={10} r={0.6} fill="#000080" />
        </>
      );
    case "ar": // Liga Árabe
      return (
        <>
          <rect width={W} height={H} fill="#007A3D" />
          <circle cx={15} cy={10} r={5} fill="none" stroke="#FFFFFF" strokeWidth={0.6} />
          <circle cx={15} cy={10} r={3.6} fill="#FFFFFF" />
          <circle cx={16.2} cy={9.2} r={3} fill="#007A3D" />
          <path d="M9 15.5 Q15 18.5 21 15.5" stroke="#FFFFFF" strokeWidth={0.7} fill="none" />
        </>
      );
    case "he": // Israel
      return (
        <>
          <rect width={W} height={H} fill="#FFFFFF" />
          <rect x={0} y={2} width={W} height={2.6} fill="#0038B8" />
          <rect x={0} y={15.4} width={W} height={2.6} fill="#0038B8" />
          <path d="M15 6.4 L18.1 11.8 L11.9 11.8 Z" fill="none" stroke="#0038B8" strokeWidth={0.7} />
          <path d="M15 13.6 L11.9 8.2 L18.1 8.2 Z" fill="none" stroke="#0038B8" strokeWidth={0.7} />
        </>
      );
    case "tr": // Turquía
      return (
        <>
          <rect width={W} height={H} fill="#E30A17" />
          <circle cx={11} cy={10} r={5} fill="#FFFFFF" />
          <circle cx={12.3} cy={10} r={4} fill="#E30A17" />
          <path d="M17.2 10 L20.9 8.8 L18.6 11.9 L18.6 8.1 L20.9 11.2 Z" fill="#FFFFFF" />
        </>
      );
    case "sw": // Kenia (suajili, lengua de África Oriental)
      return (
        <>
          <Stripes colors={["#000000", "#FFFFFF", "#BB0000", "#FFFFFF", "#006600"]} />
          <rect x={0} y={5.6} width={W} height={8.8} fill="#BB0000" />
          <rect x={0} y={4} width={W} height={1.6} fill="#FFFFFF" />
          <rect x={0} y={14.4} width={W} height={1.6} fill="#FFFFFF" />
          <ellipse cx={15} cy={10} rx={2.6} ry={6} fill="#000000" />
          <ellipse cx={15} cy={10} rx={1.2} ry={4.4} fill="#BB0000" />
        </>
      );
    case "qu":
      return <Wiphala />;
    default:
      return <rect width={W} height={H} fill="#CCCCCC" />;
  }
}

export function LangFlag({ lang, className = "" }: { lang: UiLang; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden
      className={`inline-block h-[14px] w-[21px] shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-border ${className}`}
      preserveAspectRatio="none"
    >
      <Body lang={lang} />
    </svg>
  );
}
