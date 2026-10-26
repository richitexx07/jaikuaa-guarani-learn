/**
 * Disco de encaje ñandutí dibujado en SVG: va detrás de Jai en las cabeceras.
 * Usa los colores del tema (sirve en modo claro y oscuro) y gira muy lento si
 * la persona no pidió reducir el movimiento.
 */
export function NandutiDisc({ className = "", spin = true }: { className?: string; spin?: boolean }) {
  const spokes = Array.from({ length: 48 }, (_, i) => (i * 360) / 48);
  const petals = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  const inner = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <svg viewBox="-100 -100 200 200" className={`${spin ? "nanduti-spin" : ""} ${className}`} aria-hidden>
      <style>{`.nanduti-spin{animation:nanduti-turn 90s linear infinite}@keyframes nanduti-turn{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.nanduti-spin{animation:none}}`}</style>
      <g fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55">
        {[22, 38, 56, 74, 92].map((r) => (
          <circle key={r} r={r} />
        ))}
        {spokes.map((a) => (
          <line key={a} x1="0" y1="-22" x2="0" y2="-92" transform={`rotate(${a})`} />
        ))}
        {spokes.map((a) => (
          <path key={`w${a}`} d="M0,-74 Q3.6,-83 0,-92" transform={`rotate(${a + 3.75})`} />
        ))}
      </g>
      <g className="text-accent" fill="currentColor" opacity="0.5">
        {petals.map((a) => (
          <ellipse key={a} cx="0" cy="-56" rx="4.2" ry="9" transform={`rotate(${a})`} />
        ))}
      </g>
      <g className="text-primary" fill="currentColor" opacity="0.45">
        {petals.map((a) => (
          <circle key={a} cx="0" cy="-92" r="2.6" transform={`rotate(${a + 11.25})`} />
        ))}
        {inner.map((a) => (
          <ellipse key={a} cx="0" cy="-12" rx="4" ry="9" transform={`rotate(${a})`} />
        ))}
      </g>
    </svg>
  );
}
