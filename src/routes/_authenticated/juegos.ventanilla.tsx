import { useJU } from "@/lib/i18n-juegos-ui";
import { QuitGameButton } from "@/components/games/quit-game-button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Volume2 } from "lucide-react";
import { GameStage } from "@/components/games/game-stage";
import { useGameFeedback } from "@/components/games/game-kit";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { useMostrador } from "@/lib/use-mostrador";
import { playFrase, prefetchFrases } from "@/lib/mostrador-audio";
import { armarTurnoVentanilla, CLIENTES, CLIENTES_POR_TURNO, frasesUsables, gnDe, hayParaJugar, MIN_DECIR, MIN_ESCUCHAR, type RondaVentanilla } from "@/lib/ventanilla";
import type { Frase } from "@/lib/mostrador";
import jaiAtencion from "@/assets/jai-atencion-pro.webp";

export const Route = createFileRoute("/_authenticated/juegos/ventanilla")({
  head: () => ({
    meta: [
      { title: "Ventanilla de Jai | Jaikuaa" },
      { name: "description", content: "Guaraní para atender al público: bancos, municipalidades y oficinas. Atendé la fila en guaraní." },
      { property: "og:title", content: "Ventanilla de Jai | Jaikuaa" },
      { property: "og:description", content: "Atendé la fila de la ventanilla en guaraní." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ventanilla,
});

/* Oficina pública: azul institucional, mostrador de madera clara, pantalla de turnos ámbar. */
const V = { azul: "#123A63", azul2: "#1E5A8E", mostrador: "#E8D3AE", madera: "#B7895A", turno: "#FFB23E", papel: "#F7FAFD", tinta: "#10233B", verde: "#1E8A5A", rojo: "#C8331F" };
const SEGUNDOS = 20;

const CSS = `
.vt-in { animation: vt-in .4s cubic-bezier(.2,.8,.2,1) both; }
@keyframes vt-in { from { opacity: 0; transform: translateX(24px) } }
.vt-led { font-variant-numeric: tabular-nums; text-shadow: 0 0 10px currentColor; }
@media (prefers-reduced-motion: reduce) { .vt-in { animation: none !important } }
`;

function Ventanilla() {
  const { listar, audios } = useMostrador();
  const partida = useRetoPartida("ventanilla", { total: CLIENTES_POR_TURNO });
  const { seed, otra } = partida;
  const [vistaPrevia, setVistaPrevia] = useState(false);

  const q = useQuery({ queryKey: ["mostrador", "atencion", vistaPrevia], queryFn: () => listar("atencion", vistaPrevia), retry: false });
  const frases = useMemo(() => q.data?.frases ?? [], [q.data]);
  const ids = useMemo(() => frases.filter((f) => f.hasAudio).map((f) => f.id), [frases]);
  const audioQ = useQuery({
    queryKey: ["mostrador-audio", "atencion", ids.join(",")],
    enabled: ids.length > 0,
    staleTime: 30 * 60_000,
    queryFn: () => audios(ids.slice(0, 80)),
  });
  const urls = audioQ.data?.urls ?? {};
  useEffect(() => { if (audioQ.data?.urls) prefetchFrases(audioQ.data.urls); }, [audioQ.data?.urls]);

  const tt = useJU();
  const listo = hayParaJugar(frases, vistaPrevia);
  const u = frasesUsables(frases, false);

  return (
    <GameStage
      title={tt("vtTitle")} helpKey="Ventanilla de Jai"
      sponsorSlot="ventanilla"
      css={CSS}
      background={`repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 2px, transparent 2px 120px), linear-gradient(180deg, ${V.azul2} 0%, ${V.azul} 60%, #0B2440 100%)`}
    >
      <ValidationNotice />
      {q.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !listo ? (
        <Pronto decir={u.decir.length} escuchar={u.escuchar.length} total={frases.length} isStaff={!!q.data?.isStaff} onVistaPrevia={() => setVistaPrevia(true)} />
      ) : (
        <>
          {vistaPrevia && <p className="mb-3 rounded-xl bg-[#FFB23E] p-2 text-center text-sm font-bold text-[#10233B]">{tt("vtPreview")}</p>}
          {!vistaPrevia && <RetoBanner partida={partida} className="mb-3" />}
          <Turno key={`${seed}-${vistaPrevia}`} seed={seed} frases={frases} vistaPrevia={vistaPrevia} urls={urls} partida={partida} onAgain={otra} />
        </>
      )}
    </GameStage>
  );
}

/** Cuando todavía no hay suficientes frases escritas por los docentes. */
function Pronto({ decir, escuchar, total, isStaff, onVistaPrevia }: { decir: number; escuchar: number; total: number; isStaff: boolean; onVistaPrevia: () => void }) {
  const tt = useJU();
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <img src={jaiAtencion} alt={tt("vtJaiAlt")} className="mx-auto h-48 w-auto object-contain drop-shadow-2xl" />
      <div className="rounded-3xl p-5 shadow-2xl" style={{ background: V.papel, color: V.tinta }}>
        <p className="font-display text-2xl font-bold">{tt("vtSoon")}</p>
        <p className="mt-2 text-sm leading-relaxed opacity-80">
          {tt("vtSoonInfo")}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-[#EAF1F8] p-3"><p className="font-display text-2xl font-bold">{decir}<span className="text-base opacity-60">/{MIN_DECIR}</span></p><p className="opacity-70">{tt("vtToSay")}</p></div>
          <div className="rounded-xl bg-[#EAF1F8] p-3"><p className="font-display text-2xl font-bold">{escuchar}<span className="text-base opacity-60">/{MIN_ESCUCHAR}</span></p><p className="opacity-70">{tt("vtToUnderstand")}</p></div>
        </div>
        {isStaff && (
          <div className="mt-4 grid gap-2">
            <Link to="/mostrador/editar" search={{ rubro: "atencion" }} className="flex h-12 items-center justify-center rounded-2xl font-bold text-white" style={{ background: V.azul }}>{tt("vtWrite", { n: total })}</Link>
            <button type="button" onClick={onVistaPrevia} className="h-12 rounded-2xl font-bold ring-1 ring-black/15">{tt("vtTry")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Turno({ seed, frases, vistaPrevia, urls, partida, onAgain }: { seed: number; frases: Frase[]; vistaPrevia: boolean; urls: Record<string, string>; partida: Partida; onAgain: () => void }) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const rondas = useMemo<RondaVentanilla[]>(() => armarTurnoVentanilla(frases, seed, vistaPrevia), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [oks, setOks] = useState<boolean[]>([]);
  const [left, setLeft] = useState(SEGUNDOS);
  const done = i >= rondas.length;
  const score = oks.filter(Boolean).length;
  const xp = Math.min(20, score * 3);
  const recorded = useRef(false);
  const r = rondas[i];
  const cliente = CLIENTES[i % CLIENTES.length]!;

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0 && !vistaPrevia) recordCompletion({ source: "game", sourceRef: "ventanilla", xp });
  }, [done, xp, feedback, vistaPrevia]);

  // Al llegar cada cliente: si te habla, suena su frase; arranca su paciencia.
  useEffect(() => {
    if (!r) return;
    setLeft(SEGUNDOS);
    if (r.tipo === "escuchar" && r.frase.hasAudio) void playFrase(r.frase.id, urls[r.frase.id]);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!r || pick) return;
    if (left <= 0) {
      setPick("__tiempo__");
      setOks((x) => [...x, false]);
      feedback("error");
      return;
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, pick, r, feedback]);

  if (done) {
    const stars = score >= 7 ? 3 : score >= 5 ? 2 : score >= 2 ? 1 : 0;
    return (
      <section className="space-y-5 pt-1 text-center">
        <div className="vt-in rounded-3xl p-6 shadow-2xl" style={{ background: V.papel, color: V.tinta }}>
          <img src={jaiAtencion} alt="" className="mx-auto h-28 w-auto object-contain" />
          <p className="mt-2 text-sm font-semibold opacity-70">{tt("vtClosed")}</p>
          <h2 className="font-display text-3xl font-bold leading-tight">{tt("vtServed", { s: score, n: rondas.length })}</h2>
          <p className="mt-2 text-4xl tracking-widest" style={{ color: "#E0A100" }} aria-label={tt("stars", { n: stars })}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          {!vistaPrevia && <p className="mt-3 font-bold" style={{ color: V.verde }}>+{xp} XP</p>}
        </div>
        {!vistaPrevia && <RetoFinal partida={partida} puntaje={score} />}
        <button type="button" onClick={onAgain} className="h-12 rounded-2xl px-6 font-bold shadow-lg" style={{ background: V.turno, color: V.tinta }}>{tt("vtAgain")}</button>
      </section>
    );
  }

  if (!r) return null;
  const correcta = r.tipo === "decir" ? r.frase.id : r.frase.es;

  function choose(o: string) {
    if (pick || !r) return;
    setPick(o);
    const ok = o === correcta;
    setOks((x) => [...x, ok]);
    feedback(ok ? "success" : "error");
    if (r.tipo === "decir" && r.frase.hasAudio) void playFrase(r.frase.id, urls[r.frase.id]);
  }

  const pct = Math.max(0, (left / SEGUNDOS) * 100);
  return (
    <section className="space-y-4 pt-1">
      {/* Pantalla de turnos y fila */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/40 px-4 py-2 ring-1 ring-white/10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{tt("vtTurn")}</p>
          <p className="vt-led whitespace-nowrap font-display text-3xl font-bold" style={{ color: V.turno }}>A-{String(i + 1).padStart(2, "0")}</p>
        </div>
        <div className="flex -space-x-2" aria-label={tt("vtWaiting", { n: rondas.length - i - 1 })}>
          {CLIENTES.slice(0, Math.max(0, Math.min(5, rondas.length - i - 1))).map((c, k) => (
            <span key={k} className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg ring-2 ring-[#123A63]" aria-hidden>{c.emoji}</span>
          ))}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{tt("vtWellServed")}</p>
          <p className="vt-led font-display text-3xl font-bold text-white">{score}</p>
        </div>
      </div>

      <div key={i} className="vt-in overflow-hidden rounded-3xl shadow-2xl" style={{ background: V.papel, color: V.tinta }}>
        <div className="flex items-center gap-3 px-4 pt-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#EAF1F8] text-4xl" aria-hidden>{cliente.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold">{cliente.nombre}</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#DCE6F1]" aria-label={tt("vtPatience", { n: left })}>
              <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%`, background: left <= 5 ? V.rojo : V.verde }} />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          {r.tipo === "escuchar" ? (
            <>
              <p className="text-xs font-semibold opacity-60">{tt("vtSays")}</p>
              <div className="mt-1 flex items-center gap-2 rounded-2xl bg-white p-4 shadow-inner">
                <p lang="gn" className="min-w-0 flex-1 font-display text-2xl font-bold leading-snug">«{gnDe(r.frase)}»</p>
                {r.frase.hasAudio && (
                  <button type="button" aria-label={tt("listen")} onClick={() => void playFrase(r.frase.id, urls[r.frase.id])} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-bold" style={{ background: V.azul, color: "#fff" }}>
                    <Volume2 className="h-4 w-4" aria-hidden />Escuchar
                  </button>
                )}
              </div>
              <p className="mt-4 font-display text-lg font-bold">{tt("vtWhat")}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold opacity-60">{tt("vtWant")}</p>
              <p className="mt-1 rounded-2xl bg-white p-4 font-display text-2xl font-bold leading-snug shadow-inner">«{r.frase.es}»</p>
              <p className="mt-4 font-display text-lg font-bold">{tt("vtHow")}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        {(r.tipo === "decir" ? r.opciones.map((f) => ({ key: f.id, label: gnDe(f), gn: true })) : r.opciones.map((o) => ({ key: o, label: o, gn: false }))).map((o) => {
          const ok = o.key === correcta;
          const estilo = pick
            ? ok ? { background: V.verde, color: "#fff" } : o.key === pick ? { background: V.rojo, color: "#fff" } : { background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.5)" }
            : { background: "rgba(255,255,255,.95)", color: V.tinta };
          return (
            <button key={o.key} type="button" lang={o.gn ? "gn" : "es"} onClick={() => choose(o.key)} disabled={!!pick} className="min-h-14 rounded-2xl px-4 py-3 text-left text-lg font-bold shadow-md transition active:scale-[.98]" style={estilo}>
              {o.label}
            </button>
          );
        })}
      </div>

      {pick && (
        <div className="vt-in space-y-3">
          <p className="rounded-2xl bg-white/10 p-3 text-center text-sm text-white">
            {pick === "__tiempo__" ? tt("vtTimeout", { n: cliente.nombre }) : pick === correcta ? tt("vtOk", { n: cliente.nombre }) : tt("vtAlmost")}
            {r.tipo === "escuchar" && <> {tt("vtMeans")} <b>«{r.frase.es}»</b>.</>}
          </p>
          <button type="button" className="h-14 w-full rounded-2xl font-display text-lg font-bold shadow-lg" style={{ background: V.turno, color: V.tinta }} onClick={() => { setI((n) => n + 1); setPick(null); }}>
            {i + 1 === rondas.length ? tt("vtClose") : tt("vtNext")}
          </button>
        </div>
      )}
      <QuitGameButton className="text-white" onQuit={() => { setPick(null); setI(rondas.length); }} />
    </section>
  );
}
