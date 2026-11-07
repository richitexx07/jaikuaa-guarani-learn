import { useEffect, useState } from "react";
import logoUrl from "@/assets/jaikuaa-logo.webp";

const DURATION_MS = 2600;
const FADE_MS = 500;
const WORD = "Jaikuaa".split("");

// Pantalla de apertura: usa el logo oficial (Jai con ñandutí) y una entrada con impacto.
// Colores en línea a propósito: se pinta antes de que carguen los estilos de la app.
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
      className="jk-splash"
      style={{
        opacity: fading ? 0 : 1,
        transform: fading ? "scale(1.06)" : "scale(1)",
        transition: `opacity ${FADE_MS}ms ease-out, transform ${FADE_MS}ms ease-out`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className="jk-glow" />
      <div className="jk-rings">
        <span style={{ animationDelay: "0.15s" }} />
        <span style={{ animationDelay: "0.45s" }} />
        <span style={{ animationDelay: "0.75s" }} />
      </div>
      <div className="jk-center">
        <div className="jk-logo-wrap">
          <img src={logoUrl} alt="" width={200} height={200} loading="eager" draggable={false} className="jk-logo" />
          <div className="jk-shine" />
        </div>
        <div className="jk-word">
          {WORD.map((ch, i) => (
            <span key={i} style={{ animationDelay: `${0.85 + i * 0.06}s` }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="jk-stripe">
          <i style={{ background: "#C8102E" }} />
          <i style={{ background: "#ffffff" }} />
          <i style={{ background: "#3B6FB6" }} />
        </div>
        <div className="jk-tag">Aprendé guaraní con voces reales</div>
      </div>
      <style>{`
        .jk-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;overflow:hidden;
          background:radial-gradient(120% 90% at 50% 40%,#2B5285 0%,#1E3A5F 55%,#0F2138 100%);
          animation:jk-out 500ms ease-out 4s forwards}
        .jk-glow{position:absolute;width:70vmin;height:70vmin;border-radius:50%;
          background:radial-gradient(circle,rgba(255,214,120,.35) 0%,rgba(255,214,120,0) 65%);
          animation:jk-glow 2.4s ease-in-out both}
        .jk-rings{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .jk-rings span{position:absolute;width:30vmin;height:30vmin;border-radius:50%;
          border:2px dashed rgba(255,255,255,.45);animation:jk-ring 1.8s cubic-bezier(.2,.8,.2,1) both}
        .jk-center{position:relative;display:flex;flex-direction:column;align-items:center;gap:.6rem}
        .jk-logo-wrap{position:relative;width:min(44vw,200px);aspect-ratio:1;border-radius:24%;overflow:hidden;
          box-shadow:0 20px 60px rgba(0,0,0,.45),0 0 0 4px rgba(255,255,255,.12);
          animation:jk-pop 900ms cubic-bezier(.34,1.56,.64,1) .1s both}
        .jk-logo{width:100%;height:100%;object-fit:cover;display:block}
        .jk-shine{position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.7) 50%,transparent 65%);
          transform:translateX(-120%);animation:jk-shine 900ms ease-out 1s both}
        .jk-word{display:flex;font-family:"Space Grotesk","Inter",sans-serif;font-weight:700;letter-spacing:-.02em;
          color:#fff;font-size:clamp(2.2rem,8vw,3.2rem);line-height:1;margin-top:.4rem}
        .jk-word span{display:inline-block;animation:jk-letter 520ms cubic-bezier(.34,1.56,.64,1) both}
        .jk-stripe{display:flex;gap:4px;height:5px;width:min(50vw,190px);animation:jk-stripe 600ms ease-out 1.35s both;transform-origin:center}
        .jk-stripe i{flex:1;border-radius:3px}
        .jk-tag{font-family:"Inter",sans-serif;color:rgba(255,255,255,.85);font-size:.95rem;animation:jk-fade 500ms ease-out 1.6s both}
        @keyframes jk-pop{0%{opacity:0;transform:scale(.2) rotate(-25deg)}70%{opacity:1;transform:scale(1.08) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
        @keyframes jk-ring{0%{opacity:0;transform:scale(.3) rotate(0)}30%{opacity:1}100%{opacity:0;transform:scale(3.4) rotate(90deg)}}
        @keyframes jk-glow{0%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.1)}100%{opacity:.7;transform:scale(1)}}
        @keyframes jk-shine{to{transform:translateX(120%)}}
        @keyframes jk-letter{0%{opacity:0;transform:translateY(24px) scale(.6)}100%{opacity:1;transform:none}}
        @keyframes jk-stripe{0%{opacity:0;transform:scaleX(0)}100%{opacity:1;transform:scaleX(1)}}
        @keyframes jk-fade{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:none}}
        @keyframes jk-out{to{opacity:0;visibility:hidden;pointer-events:none}}
        @media (prefers-reduced-motion:reduce){.jk-splash *{animation-duration:1ms!important;animation-delay:0s!important}}
      `}</style>
    </div>
  );
}
