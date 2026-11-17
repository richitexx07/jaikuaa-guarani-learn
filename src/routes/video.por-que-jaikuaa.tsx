import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { playGuarani, prefetchAudio } from "@/lib/audio";
import arpa from "@/assets/video/arpa-atlas-paraguay.mp3.asset.json";
import captura from "@/assets/video/leccion-captura.webp.asset.json";
import logo from "@/assets/jaikuaa-logo.webp";
import jai from "@/assets/jai/jai-saluda.webp";

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

type Escena = { t: number; voz?: string };
const ESCENAS: Escena[] = [
  { t: 0 }, { t: 4 }, { t: 7.5, voz: "Ógape" }, { t: 11.5, voz: "Ñemuháme" }, { t: 15.5 },
  { t: 20 }, { t: 23.5 }, { t: 27.5, voz: "Ñe'ẽyvoty" }, { t: 31 }, { t: 34 }, { t: 37.5 },
];
const FIN = 43;
const VOL = 0.35;
const VOL_BAJO = 0.08;

const GOLD = "#f2c14e";

function Tarjeta({ gn, es, sonando }: { gn: string; es: string; sonando: boolean }) {
  return (
    <div className="mt-8 rounded-3xl px-8 py-6 text-center shadow-2xl" style={{ background: "#fff", color: "#0d2342" }}>
      <div className="text-5xl font-black" style={{ color: "#0d2342" }}>{gn}</div>
      <div className="mt-2 text-2xl font-semibold opacity-70">{es}</div>
      <Onda activa={sonando} />
    </div>
  );
}

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
        {idx >= 0 && <div key={idx} className="vp-escena flex flex-col items-center">{escena(idx, sonando)}</div>}
      </div>
      <Franjas />
    </div>
  );
}

const T = "text-[2.6rem] leading-tight font-black";

function escena(i: number, sonando: boolean) {
  switch (i) {
    case 0: return (<><div className="text-6xl font-black" style={{ color: GOLD }}>Mba'éichapa</div><div className="mt-4 text-3xl font-semibold">Hola, ¿qué tal?</div></>);
    case 1: return <div className={T}>El guaraní es nuestro.</div>;
    case 2: return (<><div className={T}>Lo escuchamos en la casa…</div><Tarjeta gn="Ógape" es="En la casa" sonando={sonando} /></>);
    case 3: return (<><div className={T}>…y en el mercado.</div><Tarjeta gn="Ñemuháme" es="En el mercado" sonando={sonando} /></>);
    case 4: return (<><div className={T}>Pero muchos lo entendemos…</div><div className={`${T} vp-tarde mt-4`} style={{ color: GOLD }}>y no nos animamos a hablarlo.</div></>);
    case 5: return (<><img src={logo} alt="Jaikuaa" className="mb-8 w-56 rounded-3xl bg-white p-4" /><div className={T}>Por eso creamos Jaikuaa.</div></>);
    case 6: return (<><div className="mb-6 text-3xl font-black">Con voces reales de paraguayos</div>
      <div className="rounded-[2.6rem] border-[10px] border-black bg-black shadow-2xl" style={{ width: 230 }}>
        <img src={captura.url} alt="Lección de Jaikuaa en el celular" className="block w-full rounded-[1.8rem]" />
      </div></>);
    case 7: return (<><div className={T}>Hasta la poesía tiene su palabra</div><Tarjeta gn="Ñe'ẽyvoty" es="Poesía" sonando={sonando} /></>);
    case 8: return <div className={T}>Revisado por docentes especialistas.</div>;
    case 9: return <div className={T}>Para que el guaraní siga vivo en cada celular.</div>;
    default: return (<>
      <img src={jai} alt="Jai saludando" className="w-48" />
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
