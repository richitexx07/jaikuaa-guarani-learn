import { useEffect, useState } from "react";
import splashLogo from "@/assets/jaikuaa-splash.png.asset.json";

const DURATION_MS = 2000;
const FADE_MS = 450;

export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("jaikuaa:splash-shown") === "1") {
      setMounted(false);
      return;
    }
    sessionStorage.setItem("jaikuaa:splash-shown", "1");
    const t1 = window.setTimeout(() => setFading(true), DURATION_MS);
    const t2 = window.setTimeout(() => setMounted(false), DURATION_MS + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #ffffff 0%, #f4f6fa 100%)",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: fading ? "none" : "auto",
        // Por si la app tarda en arrancar (por ejemplo sin señal): la pantalla de inicio se va sola.
        animation: "jaikuaa-splash-out 450ms ease-out 3s forwards",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.35rem",
          animation: "jaikuaa-splash-in 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <img
          src={splashLogo.url}
          alt=""
          width={320}
          height={183}
          loading="eager"
          style={{
            width: "min(60vw, 320px)",
            height: "auto",
            objectFit: "contain",
            imageRendering: "auto",
          }}
          draggable={false}
        />
        <div
          style={{
            fontFamily: '"Space Grotesk", "Inter", sans-serif',
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#1E3A5F",
            fontSize: "clamp(2rem, 6vw, 2.75rem)",
            lineHeight: 1,
          }}
        >
          Jaikuaa
        </div>
      </div>
      <style>{`
        @keyframes jaikuaa-splash-out {
          to { opacity: 0; visibility: hidden; pointer-events: none; }
        }
        @keyframes jaikuaa-splash-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
