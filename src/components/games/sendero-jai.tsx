import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { TRIVIA, TRIVIA_ORDER, type TriviaCategoryId } from "@/lib/trivia";
import { TRIVIA_ART } from "@/lib/trivia-art";
import { nextStop, readSendero } from "@/lib/trivia-sendero";
import jaiTurismo from "@/assets/jai/jai-turismo.webp";
import jaiFesteja from "@/assets/jai/jai-trofeo.webp";

const CSS = `
.sendero-next { animation: sendero-glow 2.2s ease-in-out infinite; }
@keyframes sendero-glow { 50% { box-shadow: 0 0 0 6px color-mix(in oklab, var(--accent) 22%, transparent), 0 18px 40px -20px rgba(0,0,0,.45); } }
.sendero-jai { animation: sendero-bob 2.6s ease-in-out infinite; }
@keyframes sendero-bob { 50% { transform: translateY(-5px); } }
@media (prefers-reduced-motion: reduce) { .sendero-next, .sendero-jai { animation: none; } }
`;

/**
 * Sendero de Jai: reemplaza a la ruleta. Las categorías son paradas de un camino
 * que zigzaguea; Jai espera en la parada que te toca. Todas se pueden abrir, pero
 * el camino sugiere un orden y premia completar cada una. Sin azar.
 */
export function SenderoJai() {
  const [done, setDone] = useState<TriviaCategoryId[]>([]);
  useEffect(() => setDone(readSendero()), []);
  const next = nextStop(done);
  const total = TRIVIA_ORDER.length;

  return (
    <section aria-labelledby="sendero-title">
      <style>{CSS}</style>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="sendero-title" className="font-display text-2xl font-bold text-foreground">Sendero de Jai</h2>
          <p className="text-sm text-muted-foreground">Recorré el Paraguay parada por parada.</p>
        </div>
        <p className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
          {done.length} de {total}
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done.length / total) * 100}%` }} />
      </div>

      {!next && (
        <div className="mt-5 flex items-center gap-4 rounded-3xl border border-accent/40 bg-accent/5 p-4">
          <img src={jaiFesteja} alt="Jai festeja" className="h-24 w-auto shrink-0 object-contain" />
          <div>
            <p className="font-display text-lg font-bold text-foreground">¡Recorriste todo el sendero!</p>
            <p className="text-sm text-muted-foreground">Podés volver a cualquier parada para mejorar tu puntaje.</p>
          </div>
        </div>
      )}

      <ol className="mt-6">
        {TRIVIA_ORDER.map((id, i) => {
          const cat = TRIVIA[id];
          const isDone = done.includes(id);
          const isNext = id === next;
          const right = i % 2 === 1;
          const last = i === TRIVIA_ORDER.length - 1;
          return (
            <li key={id} className="relative">
              <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
                <Link
                  to="/trivia/$category"
                  params={{ category: id }}
                  className={`relative flex w-[86%] items-center gap-3 rounded-3xl border bg-card p-3 pr-4 transition active:scale-[0.98] sm:w-[70%] sm:p-4 ${
                    isNext
                      ? "sendero-next border-accent shadow-lift"
                      : isDone
                        ? "border-accent/30 shadow-sm"
                        : "border-border/60 shadow-sm hover:border-primary/40"
                  }`}
                >
                  <span className="relative shrink-0">
                    <img src={TRIVIA_ART[id]} alt="" className="h-16 w-16 object-contain sm:h-20 sm:w-20" loading="lazy" />
                    {isDone && (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-accent text-accent-foreground">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-muted-foreground">Parada {i + 1}</span>
                    <span className="block font-display text-base font-bold leading-tight text-foreground sm:text-lg">{cat.title}</span>
                    <span className={`mt-0.5 block text-xs font-semibold ${isNext ? "text-accent" : isDone ? "text-primary" : "text-muted-foreground"}`}>
                      {isNext ? "Te toca" : isDone ? "Hecha · podés repetirla" : cat.subtitle}
                    </span>
                  </span>
                  {isNext && (
                    <img
                      src={jaiTurismo}
                      alt="Jai te espera en esta parada"
                      className={`sendero-jai pointer-events-none absolute -top-12 h-16 w-auto object-contain drop-shadow-lg sm:-top-14 sm:h-20 ${right ? "-left-3" : "-right-3"}`}
                    />
                  )}
                </Link>
              </div>
              {!last && (
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
                  <path
                    d={right ? "M 70 0 C 70 22, 30 18, 30 40" : "M 30 0 C 30 22, 70 18, 70 40"}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray="1 7"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className={isDone ? "text-accent" : "text-border"}
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
