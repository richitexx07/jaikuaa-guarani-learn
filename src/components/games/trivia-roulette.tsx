import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TRIVIA_ART } from "@/lib/trivia-art";
import { ROULETTE, TRIVIA } from "@/lib/trivia";

const SLICE = 360 / ROULETTE.length;

export function TriviaRoulette() {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  const spin = () => {
    if (spinning) return;
    const idx = Math.floor(Math.random() * ROULETTE.length);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Pointer is at top; rotate so slice idx center lands at 0deg.
    const target = 360 - (idx * SLICE + SLICE / 2);
    const base = rotation - (rotation % 360);
    setRotation(base + 360 * (reduce ? 1 : 5) + target);
    setSpinning(true);
    setPicked(null);
    window.setTimeout(
      () => {
        setSpinning(false);
        setPicked(idx);
        navigator.vibrate?.(40);
      },
      reduce ? 300 : 3200,
    );
  };

  const cat = picked !== null ? TRIVIA[ROULETTE[picked]] : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-72 w-72 sm:h-80 sm:w-80">
        <div
          aria-hidden
          className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-accent drop-shadow"
        />
        <div
          className="h-full w-full rounded-full border-4 border-primary shadow-lift"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 3.1s cubic-bezier(0.17,0.67,0.2,1)" : "none",
            background: `conic-gradient(${ROULETTE.map(
              (_, i) =>
                `var(--${i % 2 ? "primary" : "accent"}) ${i * SLICE}deg ${(i + 1) * SLICE}deg`,
            ).join(",")})`,
          }}
        >
          {ROULETTE.map((id, i) => (
            <div
              key={id}
              className="absolute left-1/2 top-1/2 origin-[0_0]"
              style={{ transform: `rotate(${i * SLICE + SLICE / 2 - 90}deg)` }}
            >
              <img
                src={TRIVIA_ART[id]}
                alt=""
                className="block h-11 w-11 translate-x-[62px] -translate-y-1/2 rotate-90 object-contain drop-shadow sm:h-14 sm:w-14 sm:translate-x-[74px]"
              />
            </div>
          ))}
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-primary bg-card" />
        </div>
      </div>

      <div className="mt-6 min-h-24 text-center" aria-live="polite">
        {cat ? (
          <>
            <div className="flex items-center justify-center gap-2 font-display text-2xl font-bold text-foreground">
              <img src={TRIVIA_ART[cat.id]} alt="" className="h-12 w-12 object-contain" /> {cat.title}
            </div>
            <Button
              size="lg"
              className="mt-3 h-12 w-64"
              onClick={() =>
                navigate({ to: "/trivia/$category", params: { category: cat.id } })
              }
            >
              ¡Jugar ahora!
            </Button>
            <button
              type="button"
              onClick={spin}
              className="mt-2 block w-full text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Girar de nuevo
            </button>
          </>
        ) : (
          <Button size="lg" className="h-12 w-64" onClick={spin} disabled={spinning}>
            {spinning ? "Girando…" : "🎡 Girar la ruleta"}
          </Button>
        )}
      </div>
    </div>
  );
}
