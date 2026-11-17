import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { playGuarani, prefetchAudio } from "@/lib/audio";
import arpa from "@/assets/video/arpa-atlas-paraguay.mp3.asset.json";
import captura from "@/assets/video/leccion-captura.webp.asset.json";
import logo from "@/assets/jaikuaa-logo.webp";
import jai from "@/assets/ejecutivos/jai-ejecutivo-docente.webp";
import jaiSaluda from "@/assets/ejecutivos/jai-ejecutivo-saluda.webp";

// Página oculta para grabar con el celular el video vertical «Por qué hago Jaikuaa».
// Solo voces humanas publicadas (05/11/2026). Sin enlaces desde menús ni sitemap.
export const Route = createFileRoute("/video/por-que-jaikuaa")({
  head: () => ({
    meta: [
      { title: "Por qué hago Jaikuaa · video" },
      { name: "description", content: "Pantalla para grabar el video vertical de Jaikuaa." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Por qué hago Jaikuaa" },
      { property: "og:description", content: "Guaraní desde el celular, con voces reales de paraguayos." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VideoPorQue,
});

type Escena = { t: number; g: number; voz?: string; ok?: boolean };
const ESCENAS: Escena[] = [
  { t: 0, g: 0 }, { t: 4, g: 1 },
  { t: 7, g: 2 }, { t: 9.5, g: 2, voz: "Ógape", ok: true },
  { t: 14, g: 3 }, { t: 16.5, g: 3, voz: "Ñemuháme", ok: true },
  { t: 21, g: 4 }, { t: 23.5, g: 4, voz: "Ñe'ẽyvoty", ok: true },
  { t: 28, g: 5 }, { t: 32, g: 6 }, { t: 35.5, g: 7 },
];
const FIN = 43;
const VOL = 0.35;
const VOL_BAJO = 0.08;

function acierto() {
  try {
    const c = new AudioContext(); const t = c.currentTime;
    [659, 988].forEach((f, i) => {
      const o = c.createOscillator(); const v = c.createGain();
      o.frequency.value = f; o.type = "triangle";
      v.gain.setValueAtTime(0.0001, t + i * 0.12); v.gain.exponentialRampToValueAtTime(0.25, t + i * 0.12 + 0.02);
      v.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.35);
      o.connect(v).connect(c.destination); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.4);
    });
  } catch { /* sin sonido */ }
}

const OPC = ["Ógape", "Ñemuháme", "Ñe'ẽyvoty"];
function Pregunta({ n, es, gn, ok, sonando }: { n: number; es: string; gn: string; ok: boolean; sonando: boolean }) {
  return (
    <div className="w-[330px] rounded-[2.4rem] border-[10px] border-black bg-white p-5 text-left shadow-2xl" style={{ color: "#0d2342" }}>
      <div className="flex items-center gap-2">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${((n - (ok ? 0 : 1)) / 3) * 100}%`, background: "#22a35a" }} />
        </div>
        <span className="text-sm font-bold">{n}/3</span>
      </div>
      <div className="mt-4 text-sm font-semibold opacity-60">¿Cómo se dice…?</div>
      <div className="text-3xl font-black">«{es}»</div>
      <div className="mt-4 flex flex-col gap-2.5">
        {OPC.map((o) => {
          const es_ = o === gn && ok;
          return (
            <div key={o} className="relative rounded-2xl border-2 px-4 py-3 text-2xl font-bold transition-all duration-300"
              style={{ borderColor: es_ ? "#22a35a" : "#d7dde6", background: es_ ? "#e3f7ea" : "#fff", transform: es_ ? "scale(1.04)" : "none" }}>
              {o}
              {o === gn && !ok && <span className="vp-dedo absolute right-6 top-1/2 -mt-5 h-10 w-10 rounded-full border-4" style={{ borderColor: GOLD, background: "rgba(242,193,78,.35)" }} aria-hidden />}
            </div>
          );
        })}
      </div>
      {ok && (
        <div className="vp-escena mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#22a35a", color: "#fff" }}>
          <div className="whitespace-nowrap"><div className="text-xl font-black">¡Muy bien!</div><div className="text-sm">Escuchá la voz real</div></div>
          <Onda activa={sonando} />
          <div className="vp-xp whitespace-nowrap text-2xl font-black">+10 XP</div>
        </div>
      )}
    </div>
  );
}

const GOLD = "#f2c14e";

function Onda({ activa }: { activa: boolean }) {
  return (
    <div className="mt-4 flex h-10 items-end justify-center gap-1.5" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="w-2 rounded-full" style={{
          background: GOLD, height: activa ? undefined : 6,
          animation: activa ? `vp-onda 0.7s ${i * 0.08}s ease-in-out infinite alternate` : "none",
        }} />
      ))}
    </div>
  );
}

function VideoPorQue() {
  const [idx, setIdx] = useState(-1);
  const [sonando, setSonando] = useState(false);
  const musica = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // Sin el aviso «¿No se escucha?» encima del video.
    try { localStorage.setItem("jaikuaa:aviso-volumen", "1"); } catch { /* sin almacenamiento */ }
    ["Ógape", "Ñemuháme", "Ñe'ẽyvoty"].forEach((g) => void prefetchAudio(g));
    return () => { timers.current.forEach(clearTimeout); musica.current?.pause(); };
  }, []);

  const fundir = (a: HTMLAudioElement, hasta: number, ms: number) => {
    const desde = a.volume; const t0 = performance.now();
    const paso = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = desde + (hasta - desde) * k;
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };

  const empezar = () => {
    const m = new Audio(arpa.url);
    m.volume = VOL; m.loop = false; musica.current = m;
    void m.play().catch(() => {});
    setIdx(0);
    ESCENAS.forEach((e, i) => {
      timers.current.push(window.setTimeout(async () => {
        setIdx(i);
        if (e.voz) {
          fundir(m, VOL_BAJO, 300);
          if (e.ok) acierto();
          await new Promise((r) => setTimeout(r, 600));
          setSonando(true);
          await playGuarani(e.voz);
          setTimeout(() => { setSonando(false); fundir(m, VOL, 600); }, 1400);
        }
        if (i === ESCENAS.length - 1) fundir(m, 0, (FIN - e.t) * 1000);
      }, e.t * 1000));
    });
    timers.current.push(window.setTimeout(() => m.pause(), FIN * 1000));
  };

  return (
    <div className="fixed inset-0 z-[100000] overflow-hidden text-white" style={{
      background: "radial-gradient(ellipse at center, #1a3a66 0%, #0d2342 70%)", fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes vp-gira { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes vp-entra { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        @keyframes vp-onda { from { height: 6px; } to { height: 40px; } }
        .vp-escena { animation: vp-entra .5s ease-out both; }
        @keyframes vp-toca { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes vp-sube { from { opacity: 0; transform: translateY(16px) scale(.6); } to { opacity: 1; transform: none; } }
        .vp-dedo { animation: vp-toca .6s ease-in-out infinite; }
        .vp-xp { animation: vp-sube .5s .2s ease-out both; }
        .vp-tarde { animation: vp-entra .5s 1.6s ease-out both; }
      `}</style>
      <Franjas arriba />
      <Nanduti />
      <div className="relative mx-auto flex h-full max-w-[480px] flex-col items-center justify-center px-7 text-center">
        {idx === -1 && (
          <button onClick={empezar} className="rounded-full px-14 py-6 text-3xl font-black shadow-2xl" style={{ background: GOLD, color: "#0d2342" }}>
            Empezar
          </button>
        )}
        {idx >= 0 && <div key={ESCENAS[idx].g} className="vp-escena flex flex-col items-center">{escena(idx, sonando)}</div>}
      </div>
      <Franjas />
    </div>
  );
}

const T = "text-[2.6rem] leading-tight font-black";

function escena(i: number, sonando: boolean) {
  const ok = !!ESCENAS[i].ok;
  switch (ESCENAS[i].g) {
    case 0: return (<><img src={jaiSaluda} alt="Jai ejecutivo saludando" className="w-60" />
      <div className="text-5xl font-black" style={{ color: GOLD }}>Mba'éichapa</div>
      <div className="mt-2 text-3xl font-semibold">Soy Jai. Te enseño guaraní.</div></>);
    case 1: return (<><img src={jai} alt="Jai ejecutivo docente" className="w-52" />
      <div className={T}>Mirá cómo se aprende en Jaikuaa</div>
      <div className="vp-tarde mt-3 text-2xl font-semibold" style={{ color: GOLD }}>Tocás, escuchás y sumás puntos</div></>);
    case 2: return <Pregunta n={1} es="En la casa" gn="Ógape" ok={ok} sonando={sonando} />;
    case 3: return <Pregunta n={2} es="En el mercado" gn="Ñemuháme" ok={ok} sonando={sonando} />;
    case 4: return <Pregunta n={3} es="Poesía" gn="Ñe'ẽyvoty" ok={ok} sonando={sonando} />;
    case 5: return (<><div className="mb-6 text-3xl font-black">Lecciones con voces reales de paraguayos</div>
      <div className="rounded-[2.6rem] border-[10px] border-black bg-black shadow-2xl" style={{ width: 230 }}>
        <img src={captura.url} alt="Lección de Jaikuaa en el celular" className="block w-full rounded-[1.8rem]" />
      </div></>);
    case 6: return (<><img src={jai} alt="Jai ejecutivo docente" className="w-44" /><div className={T}>Revisado por docentes especialistas.</div></>);
    default: return (<>
      <img src={jaiSaluda} alt="Jai ejecutivo saludando" className="w-44" />
      <div className="mt-2 text-5xl font-black" style={{ color: GOLD }}>Ñañe'ẽ guaraníme</div>
      <div className="mt-1 text-2xl font-semibold">Hablemos en guaraní</div>
      <div className="mt-6 text-2xl">Estudiá hoy, sin crear cuenta</div>
      <div className="mt-4 rounded-full bg-white px-8 py-3 text-3xl font-black" style={{ color: "#0d2342" }}>www.jaikuaa.com</div>
      <div className="mt-8 text-lg opacity-80">Richard Ávalos Arriola — Fundador de Jaikuaa</div>
    </>);
  }
}

function Franjas({ arriba }: { arriba?: boolean }) {
  return (
    <div className={`absolute inset-x-0 ${arriba ? "top-0" : "bottom-0"} flex flex-col`} aria-hidden>
      <div style={{ height: 6, background: "#C8102E" }} /><div style={{ height: 6, background: "#fff" }} /><div style={{ height: 6, background: "#1E3A5F" }} />
    </div>
  );
}

function Nanduti() {
  return (
    <svg viewBox="-100 -100 200 200" aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 opacity-[0.07]"
      style={{ width: "160vmax", height: "160vmax", animation: "vp-gira 120s linear infinite", transform: "translate(-50%,-50%)" }}>
      {[20, 40, 60, 80, 98].map((r) => <circle key={r} r={r} fill="none" stroke="#fff" strokeWidth="0.6" />)}
      {Array.from({ length: 24 }).map((_, k) => {
        const a = (k * Math.PI) / 12;
        return <line key={k} x1="0" y1="0" x2={98 * Math.cos(a)} y2={98 * Math.sin(a)} stroke="#fff" strokeWidth="0.5" />;
      })}
    </svg>
  );
}
