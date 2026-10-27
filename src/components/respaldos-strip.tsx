import { Link } from "@tanstack/react-router";
import { Landmark } from "lucide-react";

// Solo respaldos públicos vigentes (Senado, Diputados, SPL). El Ateneo y el ISL se suman cuando estén firmados.
const RESPALDOS = [
  { who: "Cámara de Senadores", what: "Declaración N.° 547/2026" },
  { who: "Cámara de Diputados", what: "Declaración N.° 2001" },
  { who: "Secretaría de Políticas Lingüísticas", what: "Resolución N.° 116/2026" },
];

/**
 * Los tres respaldos juntos, uno al lado del otro, con el enlace a la página de respaldos.
 * Va al final de la portada y de la pantalla de ingreso para que se vean bien.
 */
export function RespaldosStrip({ className = "" }: { className?: string }) {
  return (
    <section aria-labelledby="respaldos-title" className={`mx-auto w-full max-w-4xl ${className}`}>
      <h2 id="respaldos-title" className="text-center font-display text-lg font-bold text-foreground sm:text-xl">
        Declarada de interés nacional, educativo y lingüístico
      </h2>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        {RESPALDOS.map((r) => (
          <li
            key={r.who}
            className="flex flex-col items-center rounded-2xl border border-primary/20 bg-primary/5 px-2 py-3 text-center sm:px-4 sm:py-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground sm:h-11 sm:w-11" aria-hidden>
              <Landmark className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="mt-2 font-display text-[12px] font-bold leading-tight text-foreground sm:text-base">{r.who}</span>
            <span className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-sm">{r.what}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <Link
          to="/respaldos"
          className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-primary px-6 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          Ver respaldos
        </Link>
      </div>
    </section>
  );
}
