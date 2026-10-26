/**
 * Disco de encaje ñandutí dibujado en SVG: va detrás de Jai en las cabeceras.
 * Usa los colores del tema (sirve en modo claro y oscuro) y gira muy lento si
 * la persona no pidió reducir el movimiento.
 */
export function NandutiDisc({ className = "", spin = true }: { className?: string; spin?: boolean }) {
  const spokes = Array.from({ length: 48 }, (_, i) => (i * 360) / 48);
  const outer = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
  const mid = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  const inner = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
      <style>{`.nanduti-spin{animation:nanduti-turn 120s linear infinite;transform-box:view-box;transform-origin:0 0}@keyframes nanduti-turn{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.nanduti-spin{animation:none}}`}</style>
      <defs>
        <radialGradient id="nanduti-glow">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.10" />
          <stop offset="0.75" stopColor="currentColor" stopOpacity="0.05" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="98" fill="url(#nanduti-glow)" />
      <g className={spin ? "nanduti-spin" : ""}>
        <g fill="none" stroke="currentColor" strokeWidth="0.45" opacity="0.32">
          {[24, 42, 60, 78, 94].map((r) => (
            <circle key={r} r={r} />
          ))}
          {spokes.map((a) => (
            <line key={a} x1="0" y1="-24" x2="0" y2="-94" transform={`rotate(${a})`} />
          ))}
          {spokes.map((a) => (
            <path key={`w${a}`} d="M0,-78 Q4,-86 0,-94" transform={`rotate(${a + 3.75})`} />
          ))}
        </g>
        <g className="text-accent" fill="currentColor" opacity="0.28">
          {outer.map((a) => (
            <path key={a} d="M0,-62 C5,-68 5,-74 0,-80 C-5,-74 -5,-68 0,-62 Z" transform={`rotate(${a})`} />
          ))}
        </g>
        <g fill="currentColor" opacity="0.26">
          {mid.map((a) => (
            <path key={a} d="M0,-28 C5,-33 5,-38 0,-44 C-5,-38 -5,-33 0,-28 Z" transform={`rotate(${a + 11.25})`} />
          ))}
          {outer.map((a) => (
            <circle key={`d${a}`} cx="0" cy="-94" r="1.6" transform={`rotate(${a + 7.5})`} />
          ))}
        </g>
        <g className="text-accent" fill="currentColor" opacity="0.35">
          {inner.map((a) => (
            <ellipse key={a} cx="0" cy="-12" rx="3.6" ry="8.5" transform={`rotate(${a})`} />
          ))}
        </g>
      </g>
    </svg>
  );
}
