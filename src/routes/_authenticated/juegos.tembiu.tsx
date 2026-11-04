import { useGT } from "@/lib/i18n-games";
import { createFileRoute, Link } from "@tanstack/react-router";
import { QuitGameButton } from "@/components/games/quit-game-button";
import { forgetPlace } from "@/lib/last-place";
import { useJU } from "@/lib/i18n-juegos-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameStage } from "@/components/games/game-stage";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { shufflerFor } from "@/lib/reto";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { DISHES, ING, type Dish } from "@/lib/juegos-contenido";
import { applyTembiu } from "@/lib/juego-textos";
import { useJuegoTextos } from "@/lib/use-juego-textos";
import imgSopa from "@/assets/tembiu/sopa.jpg";
import imgChipaGuasu from "@/assets/tembiu/chipa-guasu.jpg";
import imgMbeju from "@/assets/tembiu/mbeju.jpg";
import imgVori from "@/assets/tembiu/vori-vori.jpg";
import imgChipa from "@/assets/tembiu/chipa.jpg";
import imgPastel from "@/assets/tembiu/pastel-mandio.jpg";
import imgKiveve from "@/assets/tembiu/kiveve.jpg";

const DISH_IMG: Record<string, string> = { "Sopa paraguaya": imgSopa, "Chipa guasu": imgChipaGuasu, Mbeju: imgMbeju, "Vori vori": imgVori, Chipa: imgChipa, "Pastel mandi'o": imgPastel, Kiveve: imgKiveve };
function DishPic({ dish, className }: { dish: Dish; className: string }) {
  const src = DISH_IMG[dish.name];
  return src ? <img src={src} alt="" width={816} height={816} loading="lazy" className={`${className} object-cover`} /> : <span className={className} aria-hidden>{dish.emoji}</span>;
}

export const Route = createFileRoute("/_authenticated/juegos/tembiu")({
  head: () => ({
    meta: [
      { title: "Tembi'u Paraguái | Jaikuaa" },
      { name: "description", content: "Armá los platos típicos del Paraguay eligiendo sus ingredientes." },
      { property: "og:title", content: "Tembi'u Paraguái | Jaikuaa" },
      { property: "og:description", content: "Juego de cocina tradicional paraguaya: chipa guasu, mbeju, vori vori y más." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tembiu,
});

const ROUNDS = 5;

/* Paleta de la cocina: barro, adobe, papel de comanda, ocre del maíz y brasa de tatakua. */
const T = { barro: "#7A3018", adobe: "#A8462A", oscuro: "#3E170B", papel: "#FFF4E0", ocre: "#E9B44C", brasa: "#FF7A2F", verde: "#4F7A3A", tinta: "#3A1F14", rojo: "#C8331F" };

const CSS = `
.tb-drop { animation: tb-drop .5s cubic-bezier(.3,1.4,.5,1) 1 both; }
@keyframes tb-drop { from { transform: translateY(-70px) rotate(-30deg); opacity: 0 } to { transform: none; opacity: 1 } }
.tb-steam path { animation: tb-steam 2.4s ease-in-out infinite; transform-box: fill-box; }
.tb-steam path:nth-child(2) { animation-delay: .6s } .tb-steam path:nth-child(3) { animation-delay: 1.2s }
@keyframes tb-steam { 0% { transform: translateY(8px); opacity: 0 } 40% { opacity: .9 } 100% { transform: translateY(-14px); opacity: 0 } }
.tb-fire { animation: tb-fire .9s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: bottom center; }
@keyframes tb-fire { to { transform: scaleY(1.18) scaleX(.94) } }
.tb-card { animation: tb-swing .6s cubic-bezier(.2,.8,.2,1) 1; transform-origin: top center; }
@keyframes tb-swing { 0% { transform: rotate(-6deg) translateY(-12px); opacity: 0 } 60% { transform: rotate(2deg) } 100% { transform: rotate(-1deg) } }
.tb-pick { transition: transform .15s, box-shadow .15s; }
.tb-pick[aria-pressed="true"] { transform: translateY(-3px); }
@media (prefers-reduced-motion: reduce) { .tb-drop, .tb-steam path, .tb-fire, .tb-card { animation: none !important; } }
`;

function Tembiu() {
  const partida = useRetoPartida("tembiu", { total: ROUNDS });
  const { seed, otra } = partida;
  const { idx, loading } = useJuegoTextos();
  const tt = useJU();
  const ing = useMemo(() => applyTembiu(ING, idx), [idx]);
  return (
    <GameStage
      title="Tembi'u Paraguái"
      sponsorSlot="tembiu"
      css={CSS}
      background={`radial-gradient(80% 40% at 50% 100%, #C2552B 0%, transparent 70%), repeating-linear-gradient(0deg, transparent 0 34px, rgba(0,0,0,.08) 34px 36px), linear-gradient(180deg, ${T.adobe} 0%, ${T.barro} 55%, ${T.oscuro} 100%)`}
    >
      <ValidationNotice />
      {loading ? <p className="py-16 text-center text-sm opacity-70">{tt("tbLoading")}</p> : <><RetoBanner partida={partida} className="mb-3" /><Kitchen key={seed} seed={seed} partida={partida} ing={ing} onAgain={otra} /></>}
    </GameStage>
  );
}

/** La olla de barro sobre la brasa. Los ingredientes elegidos caen adentro. */
function Olla({ picked, hot, ing }: { picked: string[]; hot: boolean; ing: typeof ING }) {
  return (
    <div className="relative mx-auto w-64 sm:w-80">
      <svg viewBox="0 0 260 200" className="w-full" aria-hidden>
        {hot && (
          <g className="tb-steam" fill="none" stroke={T.papel} strokeWidth="5" strokeLinecap="round" opacity=".8">
            <path d="M95 40 q-10 -12 0 -24 q10 -12 0 -24" />
            <path d="M130 44 q-10 -12 0 -24 q10 -12 0 -24" />
            <path d="M165 40 q-10 -12 0 -24 q10 -12 0 -24" />
          </g>
        )}
        <ellipse cx="130" cy="190" rx="100" ry="10" fill="#000" opacity=".3" />
        <g>
          <path className="tb-fire" d="M70 196 q10 -30 22 -8 q8 -26 22 -4 q10 -30 24 -2 q10 -26 22 0 q10 -24 22 6 Z" fill={T.brasa} opacity=".95" />
          <path className="tb-fire" d="M90 196 q8 -18 16 -4 q8 -18 18 0 q8 -20 18 -2 q8 -16 16 4 Z" fill={T.ocre} />
        </g>
        <path d="M24 74 Q26 182 130 184 Q234 182 236 74 Z" fill={T.barro} />
        <path d="M24 74 Q26 182 130 184 Q234 182 236 74 Z" fill="url(#tb-sh)" />
        <path d="M44 110 Q130 128 216 110" stroke="#C26A3E" strokeWidth="4" fill="none" opacity=".7" />
        <path d="M54 136 Q130 150 206 136" stroke="#C26A3E" strokeWidth="3" fill="none" opacity=".45" />
        <path d="M18 82 q-16 4 -12 -14 q4 -10 18 -6" fill="none" stroke={T.barro} strokeWidth="8" />
        <path d="M242 82 q16 4 12 -14 q-4 -10 -18 -6" fill="none" stroke={T.barro} strokeWidth="8" />
        <ellipse cx="130" cy="74" rx="110" ry="22" fill="#5B2414" />
        <ellipse cx="130" cy="76" rx="96" ry="16" fill={picked.length ? T.ocre : "#2A0F06"} opacity={picked.length ? 0.9 : 1} />
        <defs>
          <linearGradient id="tb-sh" x1="0" x2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".25" />
            <stop offset=".45" stopColor="#fff" stopOpacity=".08" />
            <stop offset="1" stopColor="#000" stopOpacity=".3" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-x-12 top-[22%] flex h-12 items-end justify-center gap-1 text-3xl sm:text-4xl">
        {picked.map((k) => (
          <span key={k} className="tb-drop drop-shadow">{ing[k]?.emoji}</span>
        ))}
      </div>
    </div>
  );
}

function Kitchen({ onAgain, ing, seed, partida }: { onAgain: () => void; ing: typeof ING; seed: number; partida: Partida }) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const dishes = useMemo(() => shufflerFor(seed)(DISHES).slice(0, ROUNDS), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [platos, setPlatos] = useState<{ dish: Dish; ok: boolean }[]>([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [sure, setSure] = useState(false);
  const { g } = useGT();
  const dish = dishes[i];
  const options = useMemo(() => {
    if (!dish) return [];
    const mezclar = shufflerFor(seed, i + 1);
    const wrong = mezclar(Object.keys(ing).filter((x) => !dish.ok.includes(x))).slice(0, 4);
    return mezclar([...dish.ok, ...wrong]);
  }, [dish, ing, seed, i]);
  const done = i >= ROUNDS;
  const xp = Math.min(20, score * 4);
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    forgetPlace();
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "tembiu", xp });
  }, [done, xp]);

  if (done) {
    const stars = score >= 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
    return (
      <section className="space-y-5 pt-2 text-center">
        <div className="tb-card rounded-2xl p-6 shadow-2xl" style={{ background: T.papel, color: T.tinta }}>
          <p className="text-sm font-semibold opacity-70">{tt("tbServed")}</p>
          <h2 className="mt-1 font-display text-3xl font-bold leading-tight">{tt("tbPerfect", { s: score, n: ROUNDS })}</h2>
          <p className="mt-2 text-4xl tracking-widest" style={{ color: T.ocre }} aria-label={tt("stars", { n: stars })}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <ul className="mt-4 grid grid-cols-5 gap-2">
            {platos.map((p, k) => (
              <li key={k} className="flex flex-col items-center gap-1 text-xs">
                <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border-4" style={{ borderColor: p.ok ? T.verde : "#D8C6AA", background: "#fff", opacity: p.ok ? 1 : 0.55 }}><DishPic dish={p.dish} className="h-full w-full text-3xl" /></span>
                <span className="leading-tight">{p.dish.name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-bold" style={{ color: T.verde }}>+{xp} XP</p>
        </div>
        <RetoFinal partida={partida} puntaje={score} />
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className="h-12 rounded-2xl px-6 font-bold" style={{ background: T.ocre, color: T.tinta }}>{tt("tbAgain")}</button>
          <Link to="/dashboard" className="flex h-12 items-center rounded-2xl px-6 font-bold ring-1 ring-white/40" style={{ color: T.papel }}>Listo · Volver al panel</Link>
        </div>
      </section>
    );
  }

  function toggle(x: string) {
    if (checked) return;
    setPicked((p) => (p.includes(x) ? p.filter((y) => y !== x) : p.length < 5 ? [...p, x] : p));
  }
  function check() {
    const good = picked.every((x) => dish.ok.includes(x));
    setChecked(true);
    setPlatos((p) => [...p, { dish, ok: good }]);
    if (good) { setScore((s) => s + 1); feedback("success"); } else feedback("error");
  }
  function giveUp() {
    if (!sure) { setSure(true); return; }
    setSure(false);
    setPicked([...dish.ok].slice(0, 5));
    setChecked(true);
    setGaveUp(true);
    setPlatos((p) => [...p, { dish, ok: false }]);
  }
  function next() { setI((n) => n + 1); setPicked([]); setChecked(false); setGaveUp(false); setSure(false); }
  const good = checked && !gaveUp && picked.every((x) => dish.ok.includes(x));

  return (
    <section className="space-y-4 pt-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-1.5" aria-label={tt("tbDish", { i: i + 1, n: ROUNDS })}>
          {Array.from({ length: ROUNDS }, (_, k) => (
            <span key={k} className="h-2.5 w-7 rounded-full" style={{ background: k < platos.length ? (platos[k]!.ok ? T.ocre : "rgba(255,255,255,.3)") : k === i ? T.papel : "rgba(0,0,0,.25)" }} />
          ))}
        </div>
        <span className="text-white/80">{tt("tbPerfectCount")} <b className="text-white">{score}</b></span>
      </div>

      <div className="grid items-center gap-2 sm:grid-cols-[1fr_1.1fr]">
        <div key={i} className="tb-card relative mx-auto w-full max-w-sm rounded-xl p-5 pt-6 shadow-2xl" style={{ background: T.papel, color: T.tinta }}>
          <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow" style={{ background: T.rojo }} aria-hidden />
          <p className="text-xs font-semibold opacity-60">{tt("tbOrder", { i: i + 1, n: ROUNDS })}</p>
          <div className="mt-1 flex items-center gap-3">
            <DishPic dish={dish} className="h-20 w-20 shrink-0 rounded-2xl text-5xl shadow-md ring-2 ring-white" />
            <h2 className="font-display text-3xl font-bold leading-none">{dish.name}</h2>
          </div>
          <p className="mt-2 text-sm opacity-80">{dish.info}</p>
          <div className="mt-3 border-t border-dashed pt-2 text-sm" style={{ borderColor: "#D8C6AA" }}>
            {tt("tbChoose")} <b>{tt("tbFive")}</b>
          </div>
        </div>
        <div>
          <Olla picked={picked} ing={ing} hot={picked.length > 0} />
          <div className="mt-1 flex items-center justify-center gap-2">
            {Array.from({ length: 5 }, (_, k) => (
              <span key={k} className="h-3 w-3 rounded-full ring-2 ring-white/50" style={{ background: k < picked.length ? T.ocre : "transparent" }} />
            ))}
            <span className="ml-1 text-xs font-medium text-white/80">Mba'e oĩ ollápe: {picked.length}/5</span>
          </div>
        </div>
      </div>

      {checked && (
        <p className="rounded-2xl px-4 py-3 text-center font-display text-lg font-bold" style={{ background: good ? T.verde : "rgba(0,0,0,.35)" }} aria-live="polite">
          {gaveUp ? g("recipeShown") : good ? tt("tbGood") : tt("tbBad")}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {options.map((x) => {
          const on = picked.includes(x);
          const right = dish.ok.includes(x);
          const ring = checked ? (right ? T.verde : on ? T.rojo : "transparent") : on ? T.ocre : "transparent";
          return (
            <button
              key={x}
              type="button"
              onClick={() => toggle(x)}
              aria-pressed={on}
              className="tb-pick tap-3d-dark relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center"
              style={{ background: T.papel, color: T.tinta, boxShadow: `0 0 0 4px ${ring}, 0 5px 0 0 #C9A97C, 0 10px 18px -8px rgba(0,0,0,.6)`, opacity: checked && !right && !on ? 0.45 : 1 }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full text-3xl" style={{ background: "#F3DFC0" }} aria-hidden>{ing[x]?.emoji}</span>
              <b className="text-sm leading-tight sm:text-base">{ing[x]?.gn}</b>
              <span className="text-[11px] leading-tight opacity-70">{ing[x]?.es}</span>
              {on && !checked && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-xs font-bold" style={{ background: T.ocre }}>✓</span>}
            </button>
          );
        })}
      </div>
      {checked ? (
        <button type="button" className="btn-3d [--btn-base:#E0A030] h-14 w-full rounded-2xl font-display text-lg font-bold" style={{ background: T.ocre, color: T.tinta }} onClick={next}>
          {i + 1 === ROUNDS ? tt("tbSeeTable") : tt("tbNext")}
        </button>
      ) : (
        <button type="button" className="btn-3d [--btn-base:#E0A030] h-14 w-full rounded-2xl font-display text-lg font-bold disabled:opacity-40" style={{ background: T.ocre, color: T.tinta }} disabled={picked.length !== 5} onClick={check}>
          {tt("tbCook")}
        </button>
      )}
      {!checked && (
        <button type="button" onClick={giveUp} className="h-11 w-full rounded-2xl text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/10">
          {sure ? g("giveUpRecipeSure") : g("giveUpRecipe")}
        </button>
      )}
      <QuitGameButton className="text-white" onQuit={() => { setPicked([]); setChecked(false); setI(ROUNDS); }} />
    </section>
  );
}
