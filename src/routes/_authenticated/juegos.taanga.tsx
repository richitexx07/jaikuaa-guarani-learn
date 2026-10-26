import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/juegos/taanga")({
  head: () => ({
    meta: [
      { title: "Ta'anga · Claqueta de Jai | Jaikuaa" },
      { name: "description", content: "Sé guionista por un día: completá los diálogos de cada escena en guaraní." },
      { property: "og:title", content: "Ta'anga · Claqueta de Jai | Jaikuaa" },
      { property: "og:description", content: "Juego de cine en guaraní: Jai dirige, vos escribís el diálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Taanga,
});

// Frases básicas PENDIENTES de validación docente (se muestra ValidationNotice).
type Scene = { place: string; who: string; es: string; before: string; after: string; ok: string; wrong: string[] };
const SCENES: Scene[] = [
  { place: "Mercado 4 · Día", who: "Doña Rosa", es: "Saluda a su clienta de siempre.", before: "¡", after: ", che amiga!", ok: "Mba'éichapa", wrong: ["Jajotopata", "Ndaipóri", "Aguyje"] },
  { place: "Parada de colectivo · Noche", who: "Juan", es: "Agradece al chofer que lo esperó.", before: "¡", after: " ndéve, che ra'a!", ok: "Aguyje", wrong: ["Mba'éichapa", "Jaha", "Ajepa"] },
  { place: "Chacra · Amanecer", who: "Abuelo", es: "Llama a su nieto para tomar tereré.", before: "Ejúna, ", after: ", ja'u tereré.", ok: "che memby", wrong: ["kesu", "y", "pira"] },
  { place: "Cancha del barrio · Tarde", who: "Hinchada", es: "Invita al equipo a irse juntos.", before: "¡", after: ", ñande róga gotyo!", ok: "Jaha", wrong: ["Aguyje", "Mba'e", "Kesu"] },
  { place: "Cocina · Mediodía", who: "Mamá", es: "Pregunta si quieren chipa.", before: "¿Pereipota ", after: "?", ok: "chipa", wrong: ["y", "kuarahy", "jagua"] },
  { place: "Despedida · Puerto", who: "Ana", es: "Se despide hasta el próximo encuentro.", before: "¡", after: " ambuéve!", ok: "Jajotopata", wrong: ["Mba'éichapa", "Aguyje", "Jaha"] },
  { place: "Escuela · Mañana", who: "Profe", es: "Responde que está bien.", before: "Iporã, ", after: ".", ok: "aguyje", wrong: ["kesu", "pira", "jaha"] },
];
const ROUNDS = 5;

/* Paleta del set: carbón, luz de tungsteno, rojo de grabación y papel de guion. */
const F = { carbon: "#141318", panel: "#1F1E25", tungsteno: "#F4C04E", rec: "#E5322D", papel: "#F6F1E6", tinta: "#26252B" };

/** Cielo de la escena según el momento del día que dice el lugar. */
function cielo(place: string): [string, string] {
  const p = place.toLowerCase();
  if (p.includes("noche")) return ["#0B1A3A", "#2B3D6E"];
  if (p.includes("amanecer")) return ["#F08A5D", "#F6C445"];
  if (p.includes("tarde")) return ["#B5532E", "#E9A23B"];
  if (p.includes("mediodía")) return ["#F2B544", "#F6D776"];
  if (p.includes("mañana")) return ["#7FB5D9", "#F3E9D2"];
  return ["#6FA8D6", "#F6E3B4"];
}

const CSS = `
.tg-arm { transform-box: view-box; transform-origin: 0px 40px; transform: rotate(-10deg); transition: transform .18s cubic-bezier(.6,0,.4,1); }
.tg-clap .tg-arm { transform: rotate(0deg); }
.tg-rec { animation: tg-rec 1s steps(2) infinite; }
@keyframes tg-rec { 50% { opacity: .2 } }
.tg-flicker { animation: tg-flicker .7s steps(4) 1 forwards; }
@keyframes tg-flicker { 0% { opacity: 1 } 25% { opacity: .2 } 50% { opacity: .8 } 75% { opacity: .1 } 100% { opacity: .35 } }
.tg-corte { animation: tg-corte .5s cubic-bezier(.2,1.4,.4,1) 1 both; }
@keyframes tg-corte { from { transform: scale(1.6); opacity: 0 } }
.tg-frame { background-image: radial-gradient(circle, ${F.carbon} 3px, transparent 3.5px), radial-gradient(circle, ${F.carbon} 3px, transparent 3.5px); background-size: 16px 12px, 16px 12px; background-position: 4px 0, 4px 100%; background-repeat: repeat-x; }
@media (prefers-reduced-motion: reduce) { .tg-arm { transition: none } .tg-rec, .tg-flicker, .tg-corte { animation: none !important; } }
`;

function Taanga() {
  const [game, setGame] = useState(0);
  return (
    <GameStage
      title="Ta'anga · Claqueta"
      sponsorSlot="taanga"
      css={CSS}
      background={`radial-gradient(70% 45% at 85% 0%, rgba(244,192,78,.22) 0%, transparent 70%), ${F.carbon}`}
    >
      <ValidationNotice />
      <Set key={game} onAgain={() => setGame((g) => g + 1)} />
    </GameStage>
  );
}

/** La claqueta: el brazo se cierra cuando la toma sale bien. */
function Claqueta({ escena, toma, lugar, cerrada }: { escena: number; toma: number; lugar: string; cerrada: boolean }) {
  return (
    <div className={`relative mx-auto w-full sm:max-w-md ${cerrada ? "tg-clap" : ""}`}>
      <svg viewBox="0 -40 320 100" className="block w-full" aria-hidden>
        <g className="tg-arm">
          <rect x="0" y="18" width="320" height="22" rx="3" fill={F.tinta} />
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M${i * 34 + 8} 40 L${i * 34 + 24} 18 H${i * 34 + 38} L${i * 34 + 22} 40 Z`} fill={F.papel} />
          ))}
        </g>
        <rect x="0" y="40" width="320" height="20" fill={F.tinta} />
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M${i * 34 + 22} 60 L${i * 34 + 8} 40 H${i * 34 + 22} L${i * 34 + 36} 60 Z`} fill={F.papel} />
        ))}
      </svg>
      <div className="grid grid-cols-3 border-x-4 border-b-4 text-center font-mono text-[11px] sm:text-xs" style={{ borderColor: F.tinta, background: F.tinta, color: F.papel }}>
        <div className="border-r border-white/20 p-2"><span className="block opacity-60">Escena</span><b className="text-xl sm:text-2xl">{escena}</b></div>
        <div className="border-r border-white/20 p-2"><span className="block opacity-60">Toma</span><b className="text-xl sm:text-2xl">{toma}</b></div>
        <div className="p-2"><span className="block opacity-60">Dirige</span><b className="text-xl sm:text-2xl">Jai</b></div>
        <div className="col-span-3 border-t border-white/20 px-2 py-1.5 text-left text-xs sm:text-sm">{lugar}</div>
      </div>
    </div>
  );
}

function Set({ onAgain }: { onAgain: () => void }) {
  const feedback = useGameFeedback();
  const scenes = useMemo(() => shuffle(SCENES).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [tomas, setTomas] = useState<boolean[]>([]);
  const [tc, setTc] = useState(0);
  const scene = scenes[i];
  const options = useMemo(() => (scene ? shuffle([scene.ok, ...scene.wrong]) : []), [scene]);
  const done = i >= ROUNDS;
  const xp = Math.min(20, score * 4);
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "taanga", xp });
  }, [done, xp]);

  // Código de tiempo de la cámara mientras se rueda.
  useEffect(() => {
    if (pick || done) return;
    const id = setInterval(() => setTc((t) => t + 1), 1000 / 24);
    return () => clearInterval(id);
  }, [pick, done]);

  if (done) {
    const stars = score >= 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
    return (
      <section className="space-y-5 pt-2 text-center">
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ background: "#000" }}>
          <div className="tg-frame h-4" style={{ background: F.panel }} />
          <div className="px-6 py-10">
            <p className="font-display text-6xl font-bold tracking-tight" style={{ color: F.tungsteno }}>Fin</p>
            <p className="mt-3 font-display text-2xl font-bold">Rodaste {score} de {ROUNDS} escenas perfectas</p>
            <p className="mt-2 text-4xl tracking-widest" style={{ color: F.tungsteno }} aria-label={`${stars} de 3 estrellas`}>
              {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
            </p>
            <div className="mx-auto mt-5 flex max-w-xs justify-center gap-1.5">
              {tomas.map((ok, k) => (
                <span key={k} className="grid h-10 flex-1 place-items-center rounded-sm text-sm font-bold" style={{ background: ok ? F.tungsteno : "#3A3942", color: ok ? F.carbon : "#9A99A3" }}>{k + 1}</span>
              ))}
            </div>
            <p className="mt-5 text-sm text-white/60">Guion y dirección: Jai · Diálogos: vos</p>
            <p className="mt-1 font-bold" style={{ color: F.tungsteno }}>+{xp} XP</p>
          </div>
          <div className="tg-frame h-4" style={{ background: F.panel }} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className="h-12 rounded-2xl px-6 font-bold" style={{ background: F.tungsteno, color: F.carbon }}>Nuevo rodaje</button>
          <div className="[&_a]:h-12 [&_a]:rounded-2xl [&_a]:border-white/30 [&_a]:bg-transparent [&_a]:text-white">
            <ShareResult text={`¡Fui guionista en Ta'anga de Jaikuaa y rodé ${score} de ${ROUNDS} escenas en guaraní! 🇵🇾`} />
          </div>
        </div>
      </section>
    );
  }

  const right = pick === scene.ok;
  function choose(o: string) {
    if (pick) return;
    setPick(o);
    const ok = o === scene.ok;
    setTomas((t) => [...t, ok]);
    if (ok) { setScore((s) => s + 1); feedback("success"); } else feedback("error");
  }
  const [arriba, abajo] = cielo(scene.place);
  const s = Math.floor(tc / 24), f = tc % 24;
  const codigo = `00:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;

  return (
    <section className="space-y-4 pt-1">
      <Claqueta key={i} escena={i + 1} toma={1} lugar={scene.place} cerrada={!!pick && right} />

      {/* El monitor de cámara: arriba el lugar, abajo el subtítulo con el diálogo. */}
      <div className="relative overflow-hidden rounded-xl ring-4" style={{ background: "#000", ["--tw-ring-color" as string]: F.panel }}>
        <div className={`relative aspect-video ${pick && !right ? "tg-flicker" : ""}`} style={{ background: `linear-gradient(180deg, ${arriba} 0%, ${abajo} 100%)` }}>
          <svg viewBox="0 0 320 180" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M0 130 Q60 112 120 126 T240 118 T320 124 V180 H0Z" fill="#000" opacity=".35" />
            <path d="M0 150 Q80 138 160 148 T320 144 V180 H0Z" fill="#000" opacity=".5" />
          </svg>
          <div className="absolute inset-x-0 top-0 h-[9%] bg-black" />
          <div className="absolute inset-x-0 bottom-0 h-[9%] bg-black" />
          <div className="absolute left-3 top-[11%] flex items-center gap-1.5 rounded bg-black/50 px-2 py-0.5 font-mono text-[11px] text-white">
            <span className="tg-rec h-2 w-2 rounded-full" style={{ background: F.rec }} /> REC {codigo}
          </div>
          <p className="absolute right-3 top-[11%] rounded bg-black/50 px-2 py-0.5 text-xs font-bold uppercase text-white">{scene.who}</p>
          <p className="absolute inset-x-3 bottom-[13%] text-center font-display text-2xl font-bold leading-tight text-white sm:text-4xl" style={{ textShadow: "0 2px 0 #000, 0 0 8px #000, 0 0 2px #000" }}>
            {scene.before}
            <span className="mx-1 inline-block min-w-16 rounded px-1" style={{ background: pick ? (right ? "rgba(79,180,110,.85)" : "rgba(229,50,45,.85)") : "rgba(244,192,78,.9)", color: pick ? "#fff" : F.carbon, textShadow: "none" }}>
              {pick ?? "…"}
            </span>
            {scene.after}
          </p>
          {pick && right && (
            <p className="tg-corte absolute inset-x-0 top-1/3 text-center font-display text-3xl font-bold sm:text-5xl" style={{ color: F.tungsteno, textShadow: "0 3px 12px rgba(0,0,0,.8)" }}>¡Corte! ¡Quedó perfecta!</p>
          )}
        </div>
      </div>

      {/* Acotación del guion */}
      <p className="rounded-lg px-4 py-3 font-mono text-sm" style={{ background: F.papel, color: F.tinta }}>
        <b className="uppercase">{scene.who}</b> <span className="italic">({scene.es})</span>
      </p>

      {pick && !right && (
        <p className="rounded-xl bg-white/10 px-4 py-3 text-center" aria-live="polite">
          💡 ¡Se nos fue la luz! Era <b style={{ color: F.tungsteno }}>«{scene.ok}»</b>. Seguimos con la próxima escena.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const estado = pick ? (o === scene.ok ? "ok" : o === pick ? "mal" : "off") : "on";
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              disabled={!!pick}
              className="tg-frame min-h-20 rounded-md px-3 py-5 font-display text-lg font-bold transition active:scale-95 sm:text-xl"
              style={{
                backgroundColor: estado === "ok" ? "#2F7A4A" : estado === "mal" ? "#8E2320" : F.panel,
                color: "#fff",
                opacity: estado === "off" ? 0.4 : 1,
                boxShadow: estado === "on" ? `inset 0 0 0 2px rgba(244,192,78,.35)` : "none",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      {pick && (
        <button type="button" className="h-14 w-full rounded-2xl font-display text-lg font-bold" style={{ background: F.tungsteno, color: F.carbon }} onClick={() => { setI((n) => n + 1); setPick(null); }}>
          {i + 1 === ROUNDS ? "Ver los créditos" : "Siguiente escena"}
        </button>
      )}
    </section>
  );
}
