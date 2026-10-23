import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import jaiImg from "@/assets/jai-anfitrion.webp";

type Trick = "idle" | "flip" | "spin" | "wave";

/** Jai vivo: sigue el dedo/mouse en 3D, hace piruetas solo cada tanto y una voltereta al tocarlo. */
export function JaiLauncher({ launcherRef, onOpen }: { launcherRef: RefObject<HTMLButtonElement | null>; onOpen: () => void }) {
  const [trick, setTrick] = useState<Trick>("idle");
  const [sparks, setSparks] = useState(0);
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
        el.style.setProperty("--ry", `${Math.max(-1, Math.min(1, dx * 2)) * 28}deg`);
        el.style.setProperty("--rx", `${Math.max(-1, Math.min(1, -dy * 2)) * 16}deg`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [launcherRef]);

  const play = useCallback((t: Trick, ms: number, then?: () => void) => {
    if (busy.current) return;
    busy.current = true;
    setTrick(t);
    if (t === "flip") setSparks((s) => s + 1);
    window.setTimeout(() => {
      busy.current = false;
      setTrick("idle");
      then?.();
    }, ms);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tricks: [Trick, number][] = [["spin", 1100], ["wave", 1200], ["flip", 750]];
    let i = 0;
    const id = window.setInterval(() => {
      const [t, ms] = tricks[i++ % tricks.length];
      play(t, ms);
    }, 9000);
    return () => window.clearInterval(id);
  }, [play]);

  return (
    <button
      ref={launcherRef}
      type="button"
      onClick={() => {
        busy.current = false;
        play("flip", 750, onOpen);
      }}
      aria-label="Abrir a Jai, tu compañero de Jaikuaa"
      className="jai-enter group relative ml-auto block h-20 w-20 rounded-full [perspective:600px] focus:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:h-24 sm:w-24"
    >
      <span className="jai-halo absolute inset-x-2 bottom-1 top-6 rounded-full" aria-hidden />
      <span className="absolute inset-x-1 bottom-0 h-14 rounded-full bg-primary shadow-lift ring-4 ring-background transition group-hover:scale-105 sm:h-16" aria-hidden />
      {sparks > 0 && (
        <span key={sparks} className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 8 }).map((_, k) => (
            <span key={k} className="jai-spark absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-accent" style={{ ["--a" as string]: `${k * 45}deg` }} />
          ))}
        </span>
      )}
      <span ref={tiltRef} className="jai-tilt absolute inset-0 block">
        <img
          src={jaiImg}
          alt=""
          width={96}
          height={96}
          decoding="async"
          className={`absolute inset-x-0 bottom-1 mx-auto h-20 w-20 object-contain drop-shadow-xl sm:h-24 sm:w-24 ${trick === "idle" ? "jai-idle group-hover:[animation:jai-hop_.6s_cubic-bezier(.3,1.6,.5,1)]" : "jai-" + trick}`}
        />
      </span>
    </button>
  );
}
