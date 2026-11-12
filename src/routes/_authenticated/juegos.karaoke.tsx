import { useJU } from "@/lib/i18n-juegos-ui";
import { callarVoz } from "@/lib/voz-unica";
import { QuitGameButton } from "@/components/games/quit-game-button";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameStage } from "@/components/games/game-stage";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { SONGS, type Song } from "@/lib/juegos-contenido";
import { applyKaraoke } from "@/lib/juego-textos";
import { useJuegoTextos } from "@/lib/use-juego-textos";
import { louderBlob } from "@/lib/audio-louder";
import { getHumanAudioUrl, playGuarani } from "@/lib/audio";
import { sesionDeAudio } from "@/lib/karaoke-arpa";
import { aplausosWav, renderMusica, ritmoDe, SR_MUSICA } from "@/lib/karaoke-musica";
import {
  armarShow, dificultad, estrellas, guardarRecord, HITOS_RACHA, juzgar, leerRecord, multiplicador, opcionesVisibles,
  pulsoDelHueco, puntajeMaximo, puntosDe, RACHA_FIESTA, rango, TELON, CUENTA, type Nota, type Record_, type Show, type Vuelta,
} from "@/lib/karaoke-juego";
import { Aplausometro, Arpa as ArpaDibujo, CSS_ESCENARIO, Escenario, JAI_KARAOKE, K, Reflectores, type PoseJai } from "@/components/games/karaoke/escenario";
import { abrirMicrofono, canto, fondoDe, miCancion, type Micro } from "@/components/games/karaoke/microfono";
import { CompartirCancion } from "@/components/games/karaoke/compartir-cancion";
import { HelpCircle, Mic, MicOff, Square, Play, Volume2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/juegos/karaoke")({
  head: () => ({
    meta: [
      { title: "Purahéi Karaoke | Jaikuaa" },
      { name: "description", content: "Cantá en guaraní al ritmo del arpa: tres vueltas, rachas que multiplican y el verso dorado." },
      { property: "og:title", content: "Purahéi Karaoke | Jaikuaa" },
      { property: "og:description", content: "Karaoke en guaraní con arpa paraguaya: completá el verso a tiempo, encadená rachas y grabate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Karaoke,
});

/** Arpa en vivo: los sonidos de acierto y, si el celular no pudo armar la pista, también la música. */
class Arpa {
  ctx: AudioContext | null = null;
  out: AudioNode | null = null;
  /** Se llama al tocar «A cantar» (los celulares solo dejan sonar después de un toque). */
  unlock() {
    try {
      if (!this.ctx) {
        const a = new AudioContext();
        // Más volumen, con un compresor para que no se rompa el sonido.
        const master = a.createGain(); master.gain.value = 3.5;
        const comp = a.createDynamicsCompressor();
        master.connect(comp).connect(a.destination);
        this.ctx = a; this.out = master;
      }
      void this.ctx.resume();
    } catch { /* audio opcional */ }
  }
  pluck(freq: number, when = 0, vol = 0.07, tipo: OscillatorType = "triangle", dur = 1.1) {
    try {
      if (!this.ctx) return;
      const a = this.ctx;
      const t = a.currentTime + when;
      const o = a.createOscillator(), g = a.createGain();
      o.type = tipo; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.out ?? a.destination); o.start(t); o.stop(t + dur + 0.1);
    } catch { /* audio opcional */ }
  }
  beat(chord: number[], beatSec: number) {
    chord.forEach((f, i) => this.pluck(f, i * beatSec * 0.16));
    this.pluck(chord[0] / 2, 0, 0.09);
    this.pluck(chord[2] * 2, beatSec * 0.5, 0.035);
  }
  /** Acierto: las notas del acorde que está sonando, una octava arriba (el que acierta «toca» el arpa). */
  acierto(chord: number[], nota: Nota) {
    const n = nota === "perfecto" ? 3 : nota === "bien" ? 2 : 1;
    chord.slice(0, n).forEach((f, i) => this.pluck(f * 2, i * 0.06, 0.06));
    if (nota === "perfecto") this.pluck(chord[0] * 4, 0.2, 0.03);
  }
  /** Fallo: una cuerda grave y apagada. */
  fallo() { this.pluck(98, 0, 0.08, "sine", 0.35); this.pluck(92, 0.05, 0.05, "sine", 0.3); }
  /** Glissando: la mano que recorre todas las cuerdas (racha y cambio de vuelta). */
  gliss(chord: number[], subir = true) {
    const notas = [1, 2, 4].flatMap((oct) => chord.map((f) => f * oct)).sort((a, b) => a - b);
    (subir ? notas : notas.reverse()).forEach((f, i) => this.pluck(f, i * 0.035, 0.035, "triangle", 0.8));
  }
  stop() { void this.ctx?.close(); this.ctx = null; this.out = null; }
}

const CSS = `
.kk-ball { animation: kk-hop .45s cubic-bezier(.3,0,.7,1) infinite alternate; }
@keyframes kk-hop { from { transform: translate(-50%, 0) } to { transform: translate(-50%, -10px) } }
.kk-pop { animation: kk-pop 1s cubic-bezier(.2,.8,.2,1) 1 forwards; }
@keyframes kk-pop { 0% { transform: translate(-50%, 10px) scale(.6); opacity: 0 } 20% { transform: translate(-50%, 0) scale(1.15); opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(-50%, -28px) scale(1); opacity: 0 } }
.kk-disc { animation: kk-spin 4s linear infinite; animation-play-state: paused; }
.kk-song:hover .kk-disc, .kk-song:focus-visible .kk-disc { animation-play-state: running; }
@keyframes kk-spin { to { transform: rotate(360deg) } }
.kk-count { animation: kk-count .5s cubic-bezier(.2,.8,.2,1) 1; }
@keyframes kk-count { from { transform: scale(1.8); opacity: 0 } }
.kk-telon-in { animation: kk-telon-in .6s cubic-bezier(.2,.8,.2,1) 1; }
@keyframes kk-telon-in { from { transform: translateY(16px) scale(.92); opacity: 0 } }
.kk-shake { animation: kk-shake .35s ease-in-out 1; }
@keyframes kk-shake { 20%,60% { transform: translateX(-6px) } 40%,80% { transform: translateX(6px) } }
.kk-acierto { animation: kk-acierto .45s cubic-bezier(.2,.8,.2,1) 1; }
@keyframes kk-acierto { 0% { transform: scale(1.35) } 100% { transform: none } }
.kk-fiesta .kk-letra { animation: kk-fiesta .5s ease-in-out infinite alternate; }
@keyframes kk-fiesta { from { box-shadow: 0 0 0 2px ${K.magenta}, 0 0 28px -6px ${K.magenta} } to { box-shadow: 0 0 0 2px ${K.oro}, 0 0 42px -4px ${K.oro} } }
.kk-llama { display: inline-block; animation: kk-llama .5s ease-in-out infinite alternate; transform-origin: 50% 100%; }
@keyframes kk-llama { to { transform: scale(1.2) rotate(-6deg) } }
.kk-demo-anillo { animation: kk-demo-anillo 1.6s cubic-bezier(.4,0,.6,1) infinite; }
@keyframes kk-demo-anillo { 0% { transform: scale(2.6); opacity: .2 } 70% { transform: scale(1); opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
.kk-modal { animation: kk-telon-in .35s cubic-bezier(.2,.8,.2,1) 1; }
@media (prefers-reduced-motion: reduce) { .kk-ball, .kk-pop, .kk-disc, .kk-count, .kk-telon-in, .kk-shake, .kk-acierto, .kk-llama, .kk-demo-anillo, .kk-modal, .kk-fiesta .kk-letra { animation: none !important; } }
`;

const TUTO = "jk.karaoke.tuto";
function tutoVisto(): boolean {
  try { return localStorage.getItem(TUTO) === "1"; } catch { return true; }
}

function Karaoke() {
  const partida = useRetoPartida("karaoke", { total: 20 });
  const { reto, seed, otra } = partida;
  const [songId, setSongId] = useState<string | null>(() => reto?.x ?? null);
  // Si el reto llega después (se carga de internet), abre su canción.
  useEffect(() => { if (reto?.x) setSongId(reto.x); }, [reto?.id, reto?.x]);
  const { idx, loading } = useJuegoTextos();
  const tt = useJU();
  const songs = useMemo(() => applyKaraoke(SONGS, idx), [idx]);
  const song = songs.find((s) => s.id === songId) ?? null;
  const show = useMemo(() => (song ? armarShow(song, seed) : null), [song, seed]);
  const maximo = useMemo(() => (show ? puntajeMaximo(show.versos) : 0), [show]);
  const [como, setComo] = useState(false);
  function elegir(s: Song) {
    setSongId(s.id);
    if (!tutoVisto()) setComo(true);
  }
  return (
    <GameStage
      title="Purahéi Karaoke"
      sponsorSlot="karaoke"
      css={CSS + CSS_ESCENARIO}
      background={`radial-gradient(90% 55% at 50% 0%, #4A1F7A 0%, ${K.violeta} 45%, ${K.noche} 100%)`}
    >
      <ValidationNotice />
      {loading ? (
        <p className="py-16 text-center text-sm text-white/70">{tt("kkLoading")}</p>
      ) : !song || !show ? (
        <Setlist songs={songs} onPick={elegir} onComo={() => setComo(true)} />
      ) : (
        <>
          <RetoBanner partida={partida} extra={song.id} total={maximo} coincide={!reto || reto.x === song.id} className="mb-3" />
          <Stage key={`${song.id}-${seed}`} song={song} show={show} maximo={maximo} partida={partida} onAgain={otra} onBack={() => { otra(); setSongId(null); }} onComo={() => setComo(true)} />
        </>
      )}
      {como && <ComoSeJuega onClose={() => { try { localStorage.setItem(TUTO, "1"); } catch { /* sin guardado */ } setComo(false); }} />}
    </GameStage>
  );
}

/* ------------------------------------ Cómo se juega ------------------------------------ */

function ComoSeJuega({ onClose }: { onClose: () => void }) {
  const tt = useJU();
  const vuelta = (n: Vuelta) => tt(n === 1 ? "kkV1" : n === 2 ? "kkV2" : "kkV3");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="kk-como">
      <div className="kk-modal relative w-full max-w-md rounded-3xl p-6 text-white ring-1 ring-white/15" style={{ background: `linear-gradient(180deg, #3A1868, ${K.noche})` }}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        <h2 id="kk-como" className="font-display text-2xl font-bold">{tt("kkHowTitle")}</h2>
        <ol className="mt-5 space-y-5">
          <li className="grid grid-cols-[4.5rem_1fr] items-center gap-4">
            <div className="relative flex h-14 items-end justify-center gap-1 rounded-xl bg-white/10 pb-3" aria-hidden>
              <span className="kk-ball absolute left-[30%] top-1.5 h-3 w-3 rounded-full" style={{ background: K.magenta }} />
              <i className="h-2.5 w-4 rounded" style={{ background: K.oro }} /><i className="h-2.5 w-5 rounded bg-white/40" /><i className="h-2.5 w-3 rounded bg-white/40" />
            </div>
            <p className="text-white/90">{tt("kkHow1")}</p>
          </li>
          <li className="grid grid-cols-[4.5rem_1fr] items-center gap-4">
            <div className="relative grid h-14 place-items-center rounded-xl bg-white/10" aria-hidden>
              <span className="relative grid h-8 w-10 place-items-center rounded-lg font-display font-bold" style={{ outline: `2px dashed ${K.magenta}`, background: "rgba(224,69,123,.25)" }}>
                ?
                <span className="kk-demo-anillo absolute -inset-1.5 rounded-xl" style={{ border: `3px solid ${K.oro}` }} />
              </span>
            </div>
            <p className="text-white/90">{tt("kkHow2")}</p>
          </li>
          <li className="grid grid-cols-[4.5rem_1fr] items-center gap-4">
            <div className="grid h-14 place-items-center rounded-xl bg-white/10 font-display text-lg font-bold" style={{ color: K.oro }} aria-hidden>×2 ×3</div>
            <div>
              <p className="text-white/90">{tt("kkHow3")}</p>
              <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {([1, 2, 3] as Vuelta[]).map((n) => <span key={n} className="rounded-full bg-white/10 px-2.5 py-1">{n}. {vuelta(n)}</span>)}
              </p>
            </div>
          </li>
        </ol>
        <button type="button" onClick={onClose} className="mt-6 h-14 w-full rounded-2xl font-display text-lg font-bold" style={{ background: K.oro, color: K.noche }}>{tt("kkHowOk")}</button>
      </div>
    </div>
  );
}

/* ------------------------------------ Lista de canciones ------------------------------------ */

function Setlist({ songs, onPick, onComo }: { songs: Song[]; onPick: (s: Song) => void; onComo: () => void }) {
  const tt = useJU();
  const [records, setRecords] = useState<Record<string, Record_ | null>>({});
  useEffect(() => { setRecords(Object.fromEntries(songs.map((s) => [s.id, leerRecord(s.id)]))); }, [songs]);
  return (
    <section className="pt-2">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45))" }}>
        <Reflectores beat={-1} />
        <div className="relative grid grid-cols-[1fr_auto] items-end gap-2 p-6 sm:p-8">
          <div>
            <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-6xl">Purahéi Karaoke</h1>
            <p className="mt-3 max-w-sm text-white/80">{tt("kkHow2")}</p>
            <button type="button" onClick={onComo} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/20">
              <HelpCircle className="h-4 w-4" /> {tt("kkHowBtn")}
            </button>
          </div>
          <div className="relative flex items-end">
            <ArpaDibujo beat={-1} idle className="h-24 w-auto sm:h-36" />
            <img src={JAI_KARAOKE.canta} alt="Jai canta" className="kk-jai-wait -ml-6 h-36 w-auto object-contain drop-shadow-2xl sm:h-52" />
          </div>
        </div>
        <div className="h-3" style={{ background: `repeating-linear-gradient(90deg, ${K.oro} 0 14px, ${K.magenta} 14px 28px)` }} />
      </div>
      <h2 className="mt-8 font-display text-xl font-bold">{tt("kkChoose")}</h2>
      <div className="mt-3 space-y-3">
        {songs.map((s) => {
          const d = dificultad(s.bpm);
          const r = records[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s)}
              className="kk-song flex w-full items-center gap-4 rounded-2xl bg-white/[.07] p-3 text-left ring-1 ring-white/10 transition hover:bg-white/[.12] active:scale-[.99]"
            >
              <svg viewBox="0 0 60 60" className="kk-disc h-14 w-14 shrink-0" aria-hidden>
                <circle cx="30" cy="30" r="29" fill="#0B0614" />
                {[24, 19, 14].map((rr) => <circle key={rr} cx="30" cy="30" r={rr} fill="none" stroke="#2C2240" strokeWidth="1" />)}
                <circle cx="30" cy="30" r="10" fill={s.bpm > 100 ? K.oro : K.magenta} />
                <circle cx="30" cy="30" r="2" fill="#0B0614" />
                <path d="M12 18 A22 22 0 0 1 22 9" stroke="#fff" strokeOpacity=".25" strokeWidth="2" fill="none" />
              </svg>
              <span className="min-w-0 flex-1">
                <b className="block truncate font-display text-lg">{s.title}</b>
                <span className="flex flex-wrap items-center gap-x-2 text-sm text-white/65">
                  <span>{s.style}</span>
                  <span className="inline-flex items-center gap-0.5" aria-label={tt(d === 1 ? "kkDiff1" : d === 2 ? "kkDiff2" : "kkDiff3")}>
                    {[1, 2, 3].map((i) => <i key={i} className="block h-2 w-2 rounded-full" style={{ background: i <= d ? K.oro : "rgba(255,255,255,.2)" }} />)}
                    <span className="ml-1">{tt(d === 1 ? "kkDiff1" : d === 2 ? "kkDiff2" : "kkDiff3")}</span>
                  </span>
                </span>
                {r && (
                  <span className="mt-0.5 block text-xs" style={{ color: K.oro }}>
                    {"★".repeat(r.e)}<span className="opacity-30">{"★".repeat(3 - r.e)}</span> · {tt("kkBest", { p: r.p })}
                  </span>
                )}
              </span>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: K.oro, color: K.noche }}>
                <Play className="h-5 w-5" fill="currentColor" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------ El show ------------------------------------ */

/** El círculo dorado que se cierra justo cuando la pelotita llega al hueco. Se mueve solo, sin redibujar la pantalla. */
function Anillo({ tGap, beatSec, tiempo }: { tGap: number; beatSec: number; tiempo: () => number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let id = 0;
    const paso = () => {
      const el = ref.current;
      if (el) {
        const d = (tGap - tiempo()) / (2 * beatSec);
        if (d > 1 || d < -0.3) el.style.opacity = "0";
        else {
          el.style.opacity = String(d >= 0 ? 0.35 + 0.65 * (1 - d) : 1 + d * 3.3);
          el.style.transform = `scale(${1 + Math.max(0, d) * 1.8})`;
          el.style.borderColor = d < 0.12 ? K.oro : "#FFFFFF";
        }
      }
      id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [tGap, beatSec, tiempo]);
  return <span ref={ref} aria-hidden className="pointer-events-none absolute -inset-2 rounded-2xl" style={{ border: "4px solid #fff", opacity: 0, boxShadow: `0 0 18px ${K.oro}` }} />;
}

type Pop = { text: string; sub?: string; color: string; n: number };

function Stage({ song, show, maximo, partida, onAgain, onBack, onComo }: {
  song: Song; show: Show; maximo: number; partida: Partida; onAgain: () => void; onBack: () => void; onComo: () => void;
}) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const beatSec = 60 / song.bpm;
  const { versos, pasos } = show;
  const total = pasos.length;
  const [beat, setBeat] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [notas, setNotas] = useState<Record<number, Nota>>({});
  const notasRef = useRef(notas);
  notasRef.current = notas;
  const [ayudas, setAyudas] = useState<Record<number, boolean>>({});
  const [voces, setVoces] = useState<Record<number, boolean>>({});
  const [racha, setRacha] = useState(0);
  const [mejorRacha, setMejorRacha] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [pop, setPop] = useState<Pop | null>(null);
  const [popVoz, setPopVoz] = useState(0);
  const [sacudir, setSacudir] = useState(0);
  const [animo, setAnimo] = useState(0.2);
  const [festejo, setFestejo] = useState(0);
  const [pose, setPose] = useState<PoseJai>("espera");
  const arpa = useRef(new Arpa());
  const done = beat >= total;
  const beatRef = useRef(-1);
  beatRef.current = beat;
  const fiesta = racha >= RACHA_FIESTA;

  // La música (arpa, guitarra y bajo) se arma apenas se abre la canción, para tenerla lista al tocar «A cantar».
  const [pista, setPista] = useState<string | null>(null);
  const muestras = useRef<Float32Array | null>(null);
  useEffect(() => {
    let vivo = true;
    let url: string | null = null;
    void renderMusica(song.chords, total, beatSec, ritmoDe(song.style)).then((r) => {
      if (!vivo || !r) return;
      muestras.current = r.muestras;
      url = URL.createObjectURL(r.wav);
      setPista(url);
    });
    return () => { vivo = false; if (url) URL.revokeObjectURL(url); };
  }, [song, total, beatSec]);

  // El reloj del show: el de la pista si suena, si no el del celular.
  const audio = useRef<HTMLAudioElement | null>(null);
  const relojAudio = useRef(false);
  const t0 = useRef(0);
  const tiempo = useCallback(() => {
    const a = audio.current;
    if (relojAudio.current && a) return a.currentTime;
    return (performance.now() - t0.current) / 1000;
  }, []);
  const procesado = useRef(-1);
  // Al arrancar, la pantalla se acomoda para ver el marcador, la letra y los botones juntos.
  const raiz = useRef<HTMLElement>(null);

  // ---------- Micrófono (opcional) ----------
  const micro = useRef<Micro | null>(null);
  const [micEstado, setMicEstado] = useState<"apagado" | "pidiendo" | "listo" | "sin-permiso">("apagado");
  const [nivel, setNivel] = useState(0);
  const niveles = useRef<{ fondo: number[]; verso: Record<number, number[]> }>({ fondo: [], verso: {} });
  const inicioGrabacion = useRef(0);
  const [cancion, setCancion] = useState<Blob | null>(null);
  const [mezclando, setMezclando] = useState(false);

  async function alternarMicrofono() {
    if (micEstado === "listo") { micro.current?.cerrar(); micro.current = null; setMicEstado("apagado"); return; }
    setMicEstado("pidiendo");
    const m = await abrirMicrofono();
    if (!m) { setMicEstado("sin-permiso"); return; }
    micro.current = m;
    setMicEstado("listo");
  }

  useEffect(() => () => { arpa.current.stop(); audio.current?.pause(); audio.current = null; micro.current?.cerrar(); micro.current = null; }, []);

  // El pulso sale del reloj (no se acumula atraso).
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const b = Math.floor(tiempo() / beatSec);
      setBeat((prev) => (b > prev ? b : prev));
    }, 30);
    return () => clearInterval(id);
  }, [playing, beatSec, tiempo]);

  // Medir la voz mientras suena la canción.
  useEffect(() => {
    if (!playing || !micro.current) return;
    const id = setInterval(() => {
      const m = micro.current;
      if (!m) return;
      const v = m.nivel();
      setNivel(Math.min(1, v * 7));
      const p = pasos[beatRef.current];
      if (p?.tipo === "intro") niveles.current.fondo.push(v);
      if (p?.tipo === "verso" && p.word >= 0) (niveles.current.verso[p.v] ??= []).push(v);
    }, 60);
    return () => clearInterval(id);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  const acorde = (b: number) => song.chords[Math.floor(Math.max(0, b) / 2) % song.chords.length]!;

  useEffect(() => {
    if (!playing || beat < 0) return;
    // El reloj puede saltar un pulso: se revisan todos los que pasaron.
    const hasta = Math.min(beat, total - 1);
    const fallos: number[] = [];
    const cantados: number[] = [];
    for (let b = procesado.current + 1; b <= hasta; b++) {
      const p = pasos[b];
      if (!relojAudio.current) arpa.current.beat(acorde(b), beatSec);
      if (p?.tipo === "telon" && p.i === 0) arpa.current.gliss(acorde(b));
      if (p?.tipo !== "verso" || p.word !== -1) continue;
      // Si el hueco pasó sin respuesta, cuenta como fallo.
      if (notasRef.current[p.v] === undefined) fallos.push(p.v);
      // ¿Cantó este verso con el micrófono?
      if (micro.current && canto(niveles.current.verso[p.v] ?? [], fondoDe(niveles.current.fondo))) cantados.push(p.v);
    }
    procesado.current = Math.max(procesado.current, hasta);
    if (fallos.length) {
      setNotas((a) => { const n = { ...a }; for (const v of fallos) if (n[v] === undefined) n[v] = "fallo"; return n; });
      setAyudas((a) => { const n = { ...a }; for (const v of fallos) n[v + 1] = true; return n; });
      setRacha(0); feedback("error"); arpa.current.fallo();
      setAnimo((x) => Math.max(0, x - 0.25));
    }
    if (cantados.length) {
      setVoces((v) => { const n = { ...v }; for (const l of cantados) n[l] = true; return n; });
      setPopVoz(Date.now());
      setAnimo((x) => Math.min(1, x + 0.1));
    }
    if (pasos[beat]?.tipo === "verso" && pose === "espera") setPose("canta");
    if (beat >= total) setPlaying(false);
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  function empezar() {
    callarVoz(); // si estaba sonando una palabra, se calla antes de la canción
    sesionDeAudio(micro.current ? "play-and-record" : "playback");
    arpa.current.unlock(); // para los sonidos de acierto
    procesado.current = -1;
    niveles.current = { fondo: [], verso: {} };
    if (micro.current) { micro.current.empezarGrabacion(); inicioGrabacion.current = performance.now(); micro.current.desfase = 0; }
    t0.current = performance.now();
    relojAudio.current = false;
    if (pista) {
      const a = new Audio(pista);
      audio.current = a;
      relojAudio.current = true;
      // La voz se alinea con el arpa: lo que tardó en arrancar la música después de empezar a grabar.
      a.addEventListener("playing", () => {
        if (micro.current) micro.current.desfase = a.currentTime - (performance.now() - inicioGrabacion.current) / 1000;
      }, { once: true });
      // Si el celular no deja reproducir, sigue con el arpa en vivo sin cortar el juego.
      a.play().catch(() => { audio.current = null; relojAudio.current = false; t0.current = performance.now(); });
    }
    setBeat(0);
    setPlaying(true);
    requestAnimationFrame(() => raiz.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const paso = beat >= 0 ? pasos[Math.min(beat, total - 1)] : undefined;
  const vActual = paso?.tipo === "verso" ? paso.v : null;
  const verso = vActual !== null ? versos[vActual]! : null;
  const answerOpen = verso !== null && notas[verso.n] === undefined;
  const vueltaActual: Vuelta = paso?.tipo === "telon" ? paso.vuelta : verso?.vuelta ?? 1;

  const poseTimer = useRef<number | null>(null);
  function festejar() {
    setFestejo(Date.now());
    setPose("festeja");
    if (poseTimer.current) window.clearTimeout(poseTimer.current);
    poseTimer.current = window.setTimeout(() => setPose("canta"), 1100);
  }
  useEffect(() => () => { if (poseTimer.current) window.clearTimeout(poseTimer.current); }, []);

  function answer(w: string) {
    if (!verso || !answerOpen) return;
    if (w !== verso.correcta) {
      setNotas((a) => ({ ...a, [verso.n]: "fallo" }));
      setAyudas((a) => ({ ...a, [verso.n + 1]: true }));
      setRacha(0); feedback("error"); arpa.current.fallo();
      setPop({ text: "¡Uy!", color: "#FF8A8A", n: Date.now() });
      setSacudir(Date.now());
      setAnimo((x) => Math.max(0, x - 0.25));
      return;
    }
    const dt = tiempo() - pulsoDelHueco(show, verso.n) * beatSec;
    const nota = juzgar(dt, beatSec);
    const nueva = racha + 1;
    const pts = puntosDe(nota, nueva, verso.dorado);
    setNotas((a) => ({ ...a, [verso.n]: nota }));
    setRacha(nueva);
    setMejorRacha((m) => Math.max(m, nueva));
    setPuntos((p) => p + pts);
    feedback("success");
    arpa.current.acierto(acorde(beatRef.current), nota);
    const hito = HITOS_RACHA.includes(nueva);
    if (hito) arpa.current.gliss(acorde(beatRef.current));
    const text = hito ? tt("kkStreak", { m: multiplicador(nueva) })
      : nota === "perfecto" ? "¡Iporãite! ✨" : nota === "bien" ? "¡Porã!" : dt < 0 ? tt("kkEarly") : tt("kkLate");
    setPop({ text, sub: `+${pts}`, color: K.oro, n: Date.now() });
    setAnimo((x) => Math.min(1, x + (nota === "perfecto" ? 0.25 : 0.12)));
    if (nota === "perfecto" || hito || nueva >= RACHA_FIESTA) festejar();
  }

  const nVoces = Object.values(voces).filter(Boolean).length;
  // Los puntos de la letra son los mismos para todos (con o sin micrófono): así el reto es parejo.
  const puntosLetra = puntos;
  const points = puntosLetra + nVoces * 2;
  const ratio = maximo ? puntosLetra / maximo : 0;
  const xp = puntosLetra > 0 ? Math.max(1, Math.round(20 * Math.min(1, ratio))) : 0;
  const recorded = useRef(false);
  const [esRecord, setEsRecord] = useState(false);
  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true; feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "karaoke", xp });
    setEsRecord(guardarRecord(song.id, puntosLetra, estrellas(ratio)));
    // Aplausos del público al terminar (la música ya paró, así no se pisan).
    try { const u = URL.createObjectURL(aplausosWav()); const a = new Audio(u); a.volume = 0.8; void a.play().catch(() => {}); a.onended = () => URL.revokeObjectURL(u); } catch { /* sin sonido */ }
    // Si cantó con micrófono: juntar la voz con el arpa.
    const m = micro.current;
    if (m) {
      setMezclando(true);
      void m.terminarGrabacion().then(async (rec) => {
        const desfase = m.desfase;
        const mus = muestras.current;
        const res = rec && mus ? await miCancion(rec, mus, SR_MUSICA, desfase, m.ctx) : null;
        m.cerrar(); micro.current = null;
        setCancion(res);
        setMezclando(false);
      });
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const nombreVuelta = (n: Vuelta) => tt(n === 1 ? "kkV1" : n === 2 ? "kkV2" : "kkV3");
  const infoVuelta = (n: Vuelta) => tt(n === 1 ? "kkV1i" : n === 2 ? "kkV2i" : "kkV3i");

  if (done) {
    const cuenta = (n: Nota) => Object.values(notas).filter((g) => g === n).length;
    const perfect = cuenta("perfecto");
    const stars = estrellas(ratio);
    const rk = rango(ratio);
    const detalle = tt("kkLines", { p: perfect, n: versos.length, s: points });
    return (
      <section className="space-y-5 pt-2 text-center">
        <div className="relative overflow-hidden rounded-3xl px-6 pb-8 pt-4 ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.45))" }}>
          <Reflectores beat={0} />
          <img src={JAI_KARAOKE.festeja} alt="Jai aplaude" className="kk-jai-wait relative mx-auto h-40 w-auto object-contain drop-shadow-2xl" />
          <p className="relative text-sm font-semibold text-white/70">{tt("kkSang", { n: song.title })}</p>
          <h2 className="kk-telon-in relative mt-1 font-display text-4xl font-bold leading-tight" style={{ color: K.oro }}>
            {tt(`kkRank${rk}` as "kkRank0")}
          </h2>
          <p className="relative mt-3 text-4xl tracking-widest" style={{ color: K.oro }} aria-label={tt("stars", { n: stars })}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <p className="relative mt-2 font-display text-3xl font-bold">{points} <span className="text-base font-semibold text-white/70">{tt("kkPts")}</span></p>
          {esRecord && <p className="kk-acierto relative mx-auto mt-2 inline-block rounded-full px-4 py-1 font-display font-bold" style={{ background: K.magenta }}>{tt("kkRecord")}</p>}
          <p className="relative mt-3 text-sm text-white/80">{tt("kkStats", { p: perfect, g: cuenta("bien") + cuenta("justo"), m: cuenta("fallo") })}</p>
          <p className="relative mt-1 text-sm text-white/80">{tt("kkBestStreak", { c: mejorRacha })}</p>
          {nVoces > 0 && <p className="relative mt-1 text-sm text-white/75">🎤 {nVoces}/{versos.length}</p>}
          <p className="relative mt-1 font-bold" style={{ color: K.oro }}>+{xp} XP</p>
          {stars > 0 && <ConfetiFinal />}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className="h-12 rounded-2xl tap-3d-dark px-6 font-bold" style={{ background: K.oro, color: K.noche }}>{tt("kkAgain")}</button>
          <button type="button" onClick={onBack} className="h-12 rounded-2xl px-6 font-bold ring-1 ring-white/30">{tt("kkOther")}</button>
        </div>
        <Repaso song={song} />
        <CompartirCancion cancion={song.title} estrellas={stars} detalle={detalle} audio={cancion} mezclando={mezclando} />
        {!cancion && !mezclando && <Recorder song={song} />}
        <RetoFinal partida={partida} puntaje={puntosLetra} total={maximo} extra={song.id} coincide={!partida.reto || partida.reto.x === song.id} />
      </section>
    );
  }

  const sinEmpezar = !playing && beat < 0;
  const siguiente = verso ? versos[verso.n + 1] : undefined;
  const opciones = verso ? opcionesVisibles(verso, !!ayudas[verso.n]) : [];
  const mult = multiplicador(racha);
  return (
    <section ref={raiz} className={`scroll-mt-2 space-y-3 pt-2 ${fiesta ? "kk-fiesta" : ""}`} style={{ ["--kk-beat" as string]: `${beatSec}s` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{song.title}</p>
          <p className="text-sm text-white/60">{playing ? `${tt("kkVuelta", { i: vueltaActual })} · ${nombreVuelta(vueltaActual)}` : song.style}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full px-3 py-1 text-sm font-bold transition-colors" style={{ background: mult > 1 ? (fiesta ? K.oro : K.magenta) : "rgba(255,255,255,.1)", color: fiesta ? K.noche : "#fff" }} aria-label={tt("kkStreak", { m: mult })}>
            {mult > 1 && <span className="kk-llama" aria-hidden>🔥</span>} ×{mult}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm"><b>{puntos}</b> {tt("kkPts")}</span>
        </div>
      </div>

      <div className="relative">
        <Escenario beat={beat} playing={playing} pose={pose} animo={fiesta ? 1 : animo} festejo={festejo} nivelVoz={micEstado === "listo" ? (playing ? nivel : 0) : null} />
        {fiesta && <span className="kk-telon-in absolute left-3 top-3 rounded-full px-3 py-1 font-display text-sm font-bold" style={{ background: K.oro, color: K.noche }}>{tt("kkFiesta")}</span>}
        {pop && (
          <span key={pop.n} className="kk-pop pointer-events-none absolute left-1/2 top-6 flex flex-col items-center whitespace-nowrap font-display font-bold" style={{ color: pop.color, textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>
            <span className="text-3xl">{pop.text}</span>
            {pop.sub && <span className="text-xl text-white">{pop.sub}</span>}
          </span>
        )}
        {popVoz > 0 && (
          <span key={popVoz} className="kk-pop pointer-events-none absolute left-[78%] top-4 whitespace-nowrap rounded-full px-3 py-1 font-display text-sm font-bold" style={{ background: K.magenta, color: "#fff" }}>
            {tt("kkTeEscuche")}
          </span>
        )}
      </div>

      <Aplausometro animo={fiesta ? 1 : animo} label={tt("kkAplausos")} />

      {/* La letra */}
      <div
        key={sacudir}
        className={`kk-letra relative overflow-hidden rounded-3xl px-4 pb-4 pt-3 text-center ring-1 ${sacudir ? "kk-shake" : ""}`}
        style={{
          background: verso?.dorado ? "linear-gradient(180deg, rgba(246,196,69,.18), rgba(0,0,0,.55))" : "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55))",
          ["--tw-ring-color" as string]: verso?.dorado ? K.oro : "rgba(255,255,255,.1)",
        }}
      >
        <div className="mb-2 flex items-center justify-center gap-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full transition-transform" style={{ background: playing && beat % 4 === i ? K.oro : "rgba(255,255,255,.2)", transform: playing && beat % 4 === i ? "scale(1.5)" : "none" }} />
          ))}
        </div>
        {verso?.dorado && <p className="mb-1 font-display text-sm font-bold" style={{ color: K.oro }}>★ {tt("kkGolden")} ★</p>}
        {sinEmpezar ? (
          <div className="py-3">
            <p className="font-display text-2xl font-bold">{tt("kkReady")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
              {([1, 2, 3] as Vuelta[]).map((n) => <span key={n} className="rounded-full bg-white/10 px-2.5 py-1">{n}. {nombreVuelta(n)}</span>)}
            </div>
          </div>
        ) : paso?.tipo === "intro" ? (
          <div className="kk-telon-in py-2">
            <p className="text-sm font-semibold text-white/70">{tt("kkVuelta", { i: 1 })}</p>
            <p className="font-display text-3xl font-bold" style={{ color: K.oro }}>{nombreVuelta(1)}</p>
            <p className="mt-1 text-white/85">{infoVuelta(1)}</p>
          </div>
        ) : paso?.tipo === "cuenta" ? (
          <p key={beat} className="kk-count py-1 font-display text-7xl font-bold" style={{ color: K.oro }}>{CUENTA - paso.i}</p>
        ) : paso?.tipo === "telon" ? (
          <div key={`t${paso.vuelta}`} className="kk-telon-in py-2">
            <p className="text-sm font-semibold text-white/70">{tt("kkVuelta", { i: paso.vuelta })}</p>
            <p className="font-display text-3xl font-bold" style={{ color: K.oro }}>{nombreVuelta(paso.vuelta)}</p>
            <p className="mt-1 text-white/85">{infoVuelta(paso.vuelta)}</p>
            {paso.i >= 1 && <p key={beat} className="kk-count mt-1 font-display text-4xl font-bold" style={{ color: K.oro }}>{TELON - paso.i}</p>}
          </div>
        ) : verso && paso?.tipo === "verso" ? (
          <>
            <p className="flex min-h-20 flex-wrap items-end justify-center gap-x-2 gap-y-3 pt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
              {verso.words.map((w, wi) => {
                const isGap = wi === verso.gap;
                const res = notas[verso.n];
                const active = paso.word === wi;
                const sung = paso.word === -1 || paso.word > wi;
                const hueco = isGap && res === undefined;
                const oculto = verso.memoria && !isGap && !sung && !active;
                const texto = hueco ? " ? " : w;
                return (
                  <span
                    key={`${verso.n}-${wi}`}
                    className={`relative rounded-lg px-1 ${isGap && res && res !== "fallo" ? "kk-acierto" : ""}`}
                    style={{
                      color: isGap && res === "fallo" ? "#FF8A8A" : "rgba(255,255,255,.85)",
                      background: hueco ? "rgba(224,69,123,.25)" : undefined,
                      outline: hueco ? `2px dashed ${K.magenta}` : undefined,
                      filter: oculto ? "blur(7px)" : undefined,
                      opacity: oculto ? 0.45 : 1,
                      transition: "filter .2s, opacity .2s",
                    }}
                  >
                    {active && <span className="kk-ball absolute -top-4 left-1/2 h-3 w-3 rounded-full" style={{ background: K.magenta }} aria-hidden />}
                    {hueco && <Anillo tGap={pulsoDelHueco(show, verso.n) * beatSec} beatSec={beatSec} tiempo={tiempo} />}
                    {texto}
                    {!(isGap && res === "fallo") && !oculto && (
                      <span aria-hidden className={`kk-sweep absolute inset-0 px-1 ${active ? "on" : sung ? "done" : ""}`} style={{ color: K.oro, textShadow: `0 0 18px ${K.oro}88` }}>
                        {texto}
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
            <p className="mt-2 text-sm italic text-white/70">{verso.es}</p>
            {siguiente && siguiente.vuelta === verso.vuelta && (
              <p className="mt-2 truncate text-sm text-white/40">
                {tt("kkSigue")} <span className="font-display font-semibold">{siguiente.memoria ? siguiente.es : siguiente.words.map((w, i) => (i === siguiente.gap ? "…" : w)).join(" ")}</span>
              </p>
            )}
          </>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
          <div className="h-full transition-all" style={{ width: `${Math.max(0, (beat / total) * 100)}%`, background: `linear-gradient(90deg, ${K.magenta}, ${K.oro})` }} />
        </div>
      </div>

      {/* Cómo va cada verso, por vuelta */}
      <div className="flex justify-center gap-3" aria-hidden>
        {([1, 2, 3] as Vuelta[]).map((n) => (
          <div key={n} className="flex gap-1">
            {versos.filter((v) => v.vuelta === n).map((v) => {
              const g = notas[v.n];
              const actual = verso?.n === v.n;
              return <span key={v.n} className="h-2 w-5 rounded-full sm:w-7" style={{ background: g === "perfecto" ? K.oro : g === "bien" || g === "justo" ? "#F7E6C4" : g === "fallo" ? "#7A3355" : actual ? K.magenta : "rgba(255,255,255,.15)", outline: v.dorado ? `1px solid ${K.oro}` : undefined }} />;
            })}
          </div>
        ))}
      </div>

      {verso && (
        <>
          {ayudas[verso.n] && opciones.length === 2 && notas[verso.n] === undefined && (
            <p className="text-center text-xs font-semibold" style={{ color: K.cuerda }}>{tt("kkHelp")}</p>
          )}
          <div className={`grid gap-2 ${opciones.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {opciones.map((w) => {
              const elegida = notas[verso.n] !== undefined && w === verso.correcta;
              return (
                <button
                  key={`${verso.n}-${w}`}
                  type="button"
                  disabled={!answerOpen}
                  onClick={() => answer(w)}
                  className="min-h-16 rounded-2xl px-2 font-display text-lg font-bold transition active:scale-95 disabled:opacity-35 sm:text-xl"
                  style={{
                    background: elegida ? (notas[verso.n] === "fallo" ? "rgba(255,138,138,.25)" : `${K.oro}33`) : "rgba(255,255,255,.1)",
                    boxShadow: answerOpen ? `0 0 0 2px ${K.magenta}, 0 0 24px -4px ${K.magenta}` : "none",
                  }}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </>
      )}
      {sinEmpezar && (
        <>
          <button
            type="button"
            onClick={() => void alternarMicrofono()}
            aria-pressed={micEstado === "listo"}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition"
            style={{ background: micEstado === "listo" ? "rgba(224,69,123,.22)" : "rgba(255,255,255,.07)", borderColor: K.magenta, boxShadow: micEstado === "listo" ? `0 0 0 2px ${K.magenta}` : undefined }}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: micEstado === "listo" ? K.magenta : "rgba(255,255,255,.12)" }}>
              {micEstado === "listo" ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white/80" />}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block font-display">{micEstado === "listo" ? `${tt("kkMicListo")} ✓` : tt("kkMicOn")}</b>
              <span className="block text-xs text-white/70">{micEstado === "sin-permiso" ? tt("kkMic") : tt("kkMicInfo")}</span>
            </span>
            <span className="h-7 w-12 shrink-0 rounded-full p-1 transition" style={{ background: micEstado === "listo" ? K.magenta : "rgba(255,255,255,.2)" }} aria-hidden>
              <span className="block h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: micEstado === "listo" ? "translateX(20px)" : "none" }} />
            </span>
          </button>
          <button
            type="button"
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl font-display text-xl font-bold shadow-lg transition active:scale-[.98] disabled:opacity-60"
            style={{ background: K.oro, color: K.noche }}
            onClick={empezar}
            disabled={micEstado === "pidiendo"}
          >
            <Play className="h-6 w-6" fill="currentColor" /> {tt("kkPlay")}
          </button>
          <button type="button" onClick={onComo} className="mx-auto flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white/80">
            <HelpCircle className="h-4 w-4" /> {tt("kkHowBtn")}
          </button>
        </>
      )}
      {playing && (
        <QuitGameButton
          className="text-white"
          kind="song"
          onQuit={() => { arpa.current.stop(); audio.current?.pause(); setPlaying(false); setBeat(total); }}
        />
      )}
    </section>
  );
}

/** Al final: la letra completa, y cada palabra que tiene grabación se puede escuchar con voz humana real. */
function Repaso({ song }: { song: Song }) {
  const tt = useJU();
  const [conAudio, setConAudio] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let vivo = true;
    const unicas = [...new Set(song.lines.flatMap((l) => l.words))];
    void Promise.all(unicas.map(async (w) => [w, !!(await getHumanAudioUrl(w).catch(() => null))] as const)).then((r) => {
      if (vivo) setConAudio(Object.fromEntries(r));
    });
    return () => { vivo = false; };
  }, [song]);
  const hay = Object.values(conAudio).some(Boolean);
  return (
    <div className="rounded-3xl bg-white/[.07] p-5 text-left ring-1 ring-white/10">
      <p className="font-display text-lg font-bold">{tt("kkReview")}</p>
      {hay && <p className="mb-3 text-sm text-white/65">{tt("kkReviewInfo")}</p>}
      <div className="space-y-3">
        {song.lines.map((l, i) => (
          <div key={i}>
            <p className="flex flex-wrap gap-1.5 font-display text-xl font-bold">
              {l.words.map((w, wi) => conAudio[w] ? (
                <button key={wi} type="button" onClick={() => void playGuarani(w)} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 ring-1 ring-white/15 active:scale-95" aria-label={`${tt("nrListen")}: ${w}`}>
                  {w} <Volume2 className="h-4 w-4" style={{ color: K.oro }} aria-hidden />
                </button>
              ) : (
                <span key={wi} className="px-1 py-0.5">{w}</span>
              ))}
            </p>
            <p className="text-sm italic text-white/60">{l.es}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfetiFinal() {
  const colores = ["#D52B1E", "#FFFFFF", "#2F62C9", K.oro, K.magenta];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <span key={i} className="kk-confeti" style={{ left: `${(i * 29) % 100}%`, background: colores[i % colores.length], animationDelay: `${(i % 9) * 0.12}s`, animationIterationCount: 2 }} />
      ))}
    </div>
  );
}

function Recorder({ song }: { song: Song }) {
  const tt = useJU();
  const [state, setState] = useState<"idle" | "rec" | "ready" | "denied">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  async function start() {
    try {
      sesionDeAudio("play-and-record");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream); const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        // Al terminar de grabar, el sonido vuelve al parlante (en el iPhone quedaba bajito, por el auricular).
        sesionDeAudio("playback");
        // La grabación se sube de volumen para escucharla bien.
        void louderBlob(new Blob(chunks, { type: r.mimeType })).then((b) => { setUrl(URL.createObjectURL(b)); setState("ready"); });
      };
      r.start(); rec.current = r; setState("rec");
    } catch { sesionDeAudio("playback"); setState("denied"); }
  }
  return (
    <div className="rounded-3xl bg-white/[.07] p-5 text-left ring-1 ring-white/10">
      <p className="flex items-center gap-2 font-display text-lg font-bold"><Mic className="h-5 w-5" style={{ color: K.magenta }} /> {tt("kkRecTitle")}</p>
      <p className="mb-3 text-sm text-white/65">{tt("kkRecInfo")}</p>
      <div className="mb-4 space-y-1 font-display text-lg">{song.lines.map((l, i) => <p key={i}>{l.words.join(" ")}</p>)}</div>
      {state === "rec" ? (
        <button type="button" onClick={() => rec.current?.stop()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D52B1E] px-4 font-semibold"><Square className="h-4 w-4" /> {tt("kkStop")}</button>
      ) : (
        <button type="button" onClick={start} className="inline-flex h-11 items-center gap-2 rounded-xl px-4 font-semibold ring-1 ring-white/30"><Mic className="h-4 w-4" /> {state === "ready" ? tt("kkRecAgain") : tt("kkRec")}</button>
      )}
      {state === "denied" && <p className="mt-2 text-sm text-[#FF8A8A]">{tt("kkMic")}</p>}
      {url && state === "ready" && <audio className="mt-3 w-full" controls src={url} />}
    </div>
  );
}
