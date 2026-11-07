/**
 * El arte de la Librería Jaikuaa, compartido entre su página y el anuncio del panel:
 * los colores de la casa y el encaje de ñandutí dibujado.
 */

/** Colores de la casa: azul noche, dorado, rojo y papel. */
export const LIB_COLORES = {
  noche: "#0D1B33",
  azul: "#1E3A5F",
  dorado: "#F6C445",
  rojo: "#D52B1E",
  papel: "#FFF8EA",
  tinta: "#1B2433",
};

/** Redondeo a 2 decimales: el servidor y el celular calculan el último decimal distinto y React avisaba. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Encaje de ñandutí de fondo (dibujado, sin imagen). */
export function Nanduti({ className = "" }: { className?: string }) {
  const anillos = [14, 28, 42, 56, 70, 84];
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
      {anillos.map((r) => <circle key={r} r={r} fill="none" stroke="currentColor" strokeWidth={r % 28 ? 0.5 : 1} />)}
      {Array.from({ length: 36 }, (_, k) => {
        const a = (k / 36) * Math.PI * 2;
        return <line key={k} x1={0} y1={0} x2={r2(Math.cos(a) * 92)} y2={r2(Math.sin(a) * 92)} stroke="currentColor" strokeWidth={0.35} />;
      })}
      {anillos.map((r, i) => Array.from({ length: 10 + i * 4 }, (_, k) => {
        const a = (k / (10 + i * 4)) * Math.PI * 2;
        return <circle key={`${r}-${k}`} cx={r2(Math.cos(a) * (r + 7))} cy={r2(Math.sin(a) * (r + 7))} r={1.6} fill="none" stroke="currentColor" strokeWidth={0.45} />;
      }))}
    </svg>
  );
}
