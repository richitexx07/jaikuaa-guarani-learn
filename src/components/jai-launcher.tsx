import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import jaiImg from "@/assets/jai-anfitrion.webp";
import { useTX } from "@/lib/i18n-pages";

type Trick = "idle" | "flip" | "spin" | "wave" | "dash" | "dance";

const DUR: Record<Exclude<Trick, "idle">, number> = { flip: 1400, spin: 1300, wave: 1300, dash: 1600, dance: 1500 };

/** Jai vivo, estilo dibujito: anticipación, saltos altos con estela, aterrizaje con polvo y piruetas variadas. */
export function JaiLauncher({ launcherRef, onOpen }: { launcherRef: RefObject<HTMLButtonElement | null>; onOpen: () => void }) {
  const tx = useTX();
  const [trick, setTrick] = useState<Trick>("idle");
  const [fx, setFx] = useState(0);
  const tiltRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = tiltRef.current;
        const btn = launcherRef.current;
        if (!el || !btn) return;
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        el.style.setProperty("--ry", `${Math.max(-1, Math.min(1, dx * 2)) * 30}deg`);
        el.style.setProperty("--rx", `${Math.max(-1, Math.min(1, -dy * 2)) * 18}deg`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [launcherRef]);

  const play = useCallback((t: Exclude<Trick, "idle">, then?: () => void) => {
    if (busy.current) return;
    busy.current = true;
    setTrick(t);
    setFx((s) => s + 1);
    window.setTimeout(() => {
      busy.current = false;
      setTrick("idle");
      then?.();
    }, DUR[t]);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const order: Exclude<Trick, "idle">[] = ["dance", "flip", "dash", "wave", "spin"];
    let i = 0;
    const id = window.setInterval(() => play(order[i++ % order.length]), 7000);
    const first = window.setTimeout(() => play("wave"), 1600);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [play]);

  const airborne = trick === "flip" || trick === "spin";
  const imgClass = `absolute inset-x-0 bottom-1 mx-auto h-20 w-20 object-contain drop-shadow-xl sm:h-24 sm:w-24 ${
    trick === "idle" ? "jai-idle group-hover:[animation:jai-hop_.6s_cubic-bezier(.3,1.6,.5,1)]" : "jai-" + trick
  }`;

  return (
    <button
      ref={launcherRef}
      type="button"
      onClick={() => {
        busy.current = false;
        play("flip", onOpen);
      }}
      aria-label={tx("jaiOpen")}
      className="jai-enter group relative ml-auto block h-16 w-16 rounded-full [perspective:600px] focus:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:h-24 sm:w-24"
    >
      <span className="jai-halo absolute inset-x-2 bottom-1 top-6 rounded-full" aria-hidden />
      <span className="absolute inset-x-1 bottom-0 h-11 rounded-full bg-[#1E3A6B] shadow-lift ring-4 ring-background transition group-hover:scale-105 sm:h-16" aria-hidden />
      <span className={`jai-ground absolute inset-x-3 -bottom-1 h-2 rounded-full bg-foreground/25 blur-[2px] ${trick !== "idle" ? "jai-ground-" + trick : ""}`} aria-hidden />
      {fx > 0 && trick !== "idle" && (
        <span key={fx} className="pointer-events-none absolute inset-0" aria-hidden>
          {(trick === "flip" || trick === "dance") &&
            Array.from({ length: 12 }).map((_, k) => (
              <span
                key={k}
                className={`jai-spark absolute left-1/2 top-1/2 rounded-full ${k % 3 === 0 ? "h-3 w-3 bg-secondary" : "h-2 w-2 bg-accent"}`}
                style={{ ["--a" as string]: `${k * 30}deg`, animationDelay: trick === "flip" ? "520ms" : `${(k % 4) * 120}ms` }}
              />
            ))}
          {(airborne || trick === "dash") &&
            [0, 1, 2].map((k) => (
              <span
                key={`d${k}`}
                className="jai-dust absolute bottom-0 h-4 w-4 rounded-full bg-muted-foreground/40"
                style={{ left: `${20 + k * 25}%`, ["--dx" as string]: `${(k - 1) * 22}px`, animationDelay: trick === "dash" ? `${k * 200}ms` : "1000ms" }}
              />
            ))}
          {trick === "flip" && <span className="jai-speed absolute inset-x-2 -top-16 h-16 rounded-full" />}
        </span>
      )}
      <span ref={tiltRef} className="jai-tilt absolute inset-0 block">
        {airborne && (
          <>
            <img src={jaiImg} alt="" className={`${imgClass} jai-ghost`} style={{ animationDelay: "60ms", opacity: 0.35 }} aria-hidden />
            <img src={jaiImg} alt="" className={`${imgClass} jai-ghost`} style={{ animationDelay: "120ms", opacity: 0.18 }} aria-hidden />
          </>
        )}
        <img src={jaiImg} alt="" width={96} height={96} decoding="async" className={imgClass} />
      </span>
    </button>
  );
}
