import { createFileRoute } from "@tanstack/react-router";
import { useJU } from "@/lib/i18n-juegos-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameStage } from "@/components/games/game-stage";
import { useGameFeedback } from "@/components/games/game-kit";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { usePrefetchAudios } from "@/lib/audio";
import { armarVisitas, VISITAS_POR_DIA, type VisitaChacra } from "@/lib/chacra";
import { getTexto } from "@/lib/juego-textos";
import { useJuegoTextos } from "@/lib/use-juego-textos";
import jaiAgro from "@/assets/jai-agro.webp";

export const Route = createFileRoute("/_authenticated/juegos/chacra")({
  head: () => ({
    meta: [
      { title: "Jai en la chacra | Jaikuaa" },
      { name: "description", content: "Guaraní para el trabajo en el campo: sos técnico, visitás productores y entendés lo que necesitan." },
      { property: "og:title", content: "Jai en la chacra | Jaikuaa" },
      { property: "og:description", content: "Guaraní para técnicos de campo y escuelas agrícolas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Chacra,
});

/* Campo al amanecer: cielo celeste, sol, tierra colorada y verde de chacra. */
const C = { cielo: "#7EC8E3", sol: "#FFC94A", tierra: "#B4532A", verde: "#3E7C3A", oscuro: "#1F3B1D", papel: "#FFF8E8", tinta: "#2A2416", rojo: "#C8331F" };

const CSS = `
.ch-in { animation: ch-in .45s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ch-in { from { opacity: 0; transform: translateY(14px) } }
.ch-sol { animation: ch-sol 6s ease-in-out infinite; transform-origin: center; }
@keyframes ch-sol { 50% { transform: scale(1.06) } }
@media (prefers-reduced-motion: reduce) { .ch-in, .ch-sol { animation: none !important } }
`;

function Chacra() {
  const { idx, loading } = useJuegoTextos();
  const tt = useJU();
  const partida = useRetoPartida("chacra", { total: VISITAS_POR_DIA });
  const { seed, otra } = partida;
  return (
    <GameStage
      title={tt("chTitle")}
      sponsorSlot="chacra"
      css={CSS}
      ink={C.tinta}
      background={`radial-gradient(60% 30% at 85% 4%, rgba(255,201,74,.55) 0%, transparent 70%), linear-gradient(180deg, ${C.cielo} 0%, #BFE6F2 38%, #9BCB6A 38.2%, ${C.verde} 70%, ${C.oscuro} 100%)`}
    >
      <ValidationNotice />
      {loading ? (
        <p className="py-16 text-center text-sm opacity-70">{tt("chLoading")}</p>
      ) : (
        <>
          <RetoBanner partida={partida} className="mb-3" />
          <Recorrida key={seed} seed={seed} partida={partida} textos={idx} onAgain={otra} />
        </>
      )}
    </GameStage>
  );
}

function Camino({ i, oks }: { i: number; oks: boolean[] }) {
  const tt = useJU();
  return (
    <div className="flex items-center gap-1" aria-label={tt("chVisit", { i: Math.min(i + 1, VISITAS_POR_DIA), n: VISITAS_POR_DIA })}>
      {Array.from({ length: VISITAS_POR_DIA }, (_, k) => (
        <div key={k} className="flex flex-1 items-center gap-1">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-base"
            style={{
              background: k < oks.length ? (oks[k] ? C.verde : "#E7D8C2") : k === i ? C.sol : "rgba(255,255,255,.7)",
              borderColor: k === i ? C.tinta : "transparent",
              color: k < oks.length && oks[k] ? "#fff" : C.tinta,
            }}
            aria-hidden
          >
            {k < oks.length ? (oks[k] ? "✓" : "·") : "🏡"}
          </span>
          {k < VISITAS_POR_DIA - 1 && <span className="h-1 flex-1 rounded-full" style={{ background: k < oks.length ? C.tierra : "rgba(255,255,255,.6)" }} />}
        </div>
      ))}
    </div>
  );
}

function Recorrida({ seed, partida, textos, onAgain }: { seed: number; partida: Partida; textos: ReturnType<typeof useJuegoTextos>["idx"]; onAgain: () => void }) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const visitas = useMemo<VisitaChacra[]>(() => armarVisitas(seed), [seed]);
  usePrefetchAudios(visitas.map((v) => v.caso.palabra), 10);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [oks, setOks] = useState<boolean[]>([]);
  const done = i >= visitas.length;
  const score = oks.filter(Boolean).length;
  const xp = Math.min(20, score * 4);
  const recorded = useRef(false);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "chacra", xp });
  }, [done, xp, feedback]);

  if (done) {
    const stars = score >= 5 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
    return (
      <section className="space-y-5 pt-1 text-center">
        <div className="ch-in rounded-3xl p-6 shadow-2xl" style={{ background: C.papel, color: C.tinta }}>
          <img src={jaiAgro} alt={tt("chJaiAlt")} className="mx-auto h-32 w-auto object-contain" />
          <p className="mt-2 text-sm font-semibold opacity-70">{tt("chDone")}</p>
          <h2 className="font-display text-3xl font-bold leading-tight">{tt("chHelped", { s: score, n: VISITAS_POR_DIA })}</h2>
          <p className="mt-2 text-4xl tracking-widest" style={{ color: "#E0A100" }} aria-label={tt("stars", { n: stars })}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <ul className="mt-4 space-y-1 text-left text-sm">
            {visitas.map((v, k) => (
              <li key={k} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                <span aria-hidden>{v.caso.emoji}</span>
                <b lang="gn">{v.caso.palabra}</b>
                <span className="opacity-70">— {v.es}</span>
                <span className="ml-auto">{oks[k] ? "✅" : "❌"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-bold" style={{ color: C.verde }}>+{xp} XP</p>
        </div>
        <RetoFinal partida={partida} puntaje={score} />
        <button type="button" onClick={onAgain} className="h-12 rounded-2xl px-6 font-bold text-white shadow-lg" style={{ background: C.tierra }}>{tt("chAgain")}</button>
      </section>
    );
  }

  const v = visitas[i]!;
  const gn = getTexto(textos, "chacra", String(v.n), "productor");
  const right = pick === v.caso.palabra;

  function choose(o: string) {
    if (pick) return;
    setPick(o);
    const ok = o === v.caso.palabra;
    setOks((x) => [...x, ok]);
    feedback(ok ? "success" : "error");
  }

  return (
    <section className="space-y-4 pt-1">
      <Camino i={i} oks={oks} />

      <div key={i} className="ch-in overflow-hidden rounded-3xl shadow-2xl" style={{ background: C.papel, color: C.tinta }}>
        <div className="flex items-center gap-3 px-4 pt-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl" style={{ background: "#F3E3C3" }} aria-hidden>{v.caso.emoji}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold opacity-60">{tt("chVisit", { i: i + 1, n: VISITAS_POR_DIA })}</p>
            <p className="font-display text-xl font-bold">{v.caso.productor}</p>
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="relative rounded-2xl bg-white p-4 shadow-inner">
            {gn && <p lang="gn" className="mb-2 font-display text-lg font-bold leading-snug">«{gn}»</p>}
            <p className={gn ? "text-sm leading-relaxed opacity-75" : "text-lg leading-relaxed"}>{gn ? v.caso.historia : `«${v.caso.historia}»`}</p>
          </div>
          <p className="mt-4 font-display text-lg font-bold">{v.caso.pregunta}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {v.opciones.map((o) => {
          const ok = o === v.caso.palabra;
          const estilo = pick
            ? ok ? { background: C.verde, color: "#fff" } : o === pick ? { background: C.rojo, color: "#fff" } : { background: "rgba(255,255,255,.55)", color: "rgba(42,36,22,.5)" }
            : { background: "rgba(255,255,255,.92)", color: C.tinta };
          return (
            <button key={o} type="button" lang="gn" onClick={() => choose(o)} disabled={!!pick} className="min-h-16 rounded-2xl px-3 py-3 font-display text-xl font-bold shadow-md transition active:scale-[.97]" style={estilo}>
              {o}
            </button>
          );
        })}
      </div>

      {pick && (
        <div className="ch-in space-y-3">
          <div className="rounded-2xl p-4 text-sm shadow-lg" style={{ background: C.papel, color: C.tinta }}>
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {right ? tt("chRight") : tt("notThisTime")} <span lang="gn" className="font-display text-base font-bold">{v.caso.palabra}</span> = {v.es}
              <SpeakerButton gn={v.caso.palabra} />
            </p>
            <p className="mt-2"><b>{tt("chTip")}</b> {v.caso.consejo}</p>
          </div>
          <button type="button" className="h-14 w-full rounded-2xl font-display text-lg font-bold text-white shadow-lg" style={{ background: C.tierra }} onClick={() => { setI((n) => n + 1); setPick(null); }}>
            {i + 1 === VISITAS_POR_DIA ? tt("chFinish") : tt("chNext")}
          </button>
        </div>
      )}
    </section>
  );
}
