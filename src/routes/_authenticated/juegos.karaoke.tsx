import { useJU } from "@/lib/i18n-juegos-ui";
import { QuitGameButton } from "@/components/games/quit-game-button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { RetoBanner, RetoFinal, useRetoPartida, type Partida } from "@/components/games/reto";
import { useGameFeedback } from "@/components/games/game-kit";
import { ValidationNotice } from "@/components/validation-notice";
import { recordCompletion } from "@/lib/gamification";
import { SONGS, type Song } from "@/lib/juegos-contenido";
import { applyKaraoke } from "@/lib/juego-textos";
import { useJuegoTextos } from "@/lib/use-juego-textos";
import { louderBlob } from "@/lib/audio-louder";
import { sesionDeAudio } from "@/lib/karaoke-arpa";
import { aplausosWav, renderMusica, ritmoDe, SR_MUSICA } from "@/lib/karaoke-musica";
import { Aplausometro, Arpa as ArpaDibujo, CSS_ESCENARIO, Escenario, JAI_KARAOKE, K, Reflectores, type PoseJai } from "@/components/games/karaoke/escenario";
import { abrirMicrofono, canto, fondoDe, miCancion, type Micro } from "@/components/games/karaoke/microfono";
import { CompartirCancion } from "@/components/games/karaoke/compartir-cancion";
import { Mic, MicOff, Square, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/juegos/karaoke")({
  head: () => ({
    meta: [
      { title: "Purahéi Karaoke | Jaikuaa" },
      { name: "description", content: "Cantá en guaraní al ritmo del arpa: seguí la letra, completá el verso y grabate." },
      { property: "og:title", content: "Purahéi Karaoke | Jaikuaa" },
      { property: "og:description", content: "Karaoke en guaraní con arpa paraguaya, versos para completar y grabación propia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Karaoke,
});

/** Arpa en vivo: solo se usa si el celular no pudo armar la pista de audio. */
class Arpa {
  ctx: AudioContext | null = null;
  out: AudioNode | null = null;
  /** Se llama al tocar «Cantemos» (los celulares solo dejan sonar después de un toque). */
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
  pluck(freq: number, when = 0, vol = 0.07) {
    try {
      this.unlock();
      const a = this.ctx!;
      const t = a.currentTime + when;
      const o = a.createOscillator(), g = a.createGain();
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(g).connect(this.out ?? a.destination); o.start(t); o.stop(t + 1.2);
    } catch { /* audio opcional */ }
  }
  beat(chord: number[], beatSec: number) {
    chord.forEach((f, i) => this.pluck(f, i * beatSec * 0.16));
    this.pluck(chord[0] / 2, 0, 0.09);
    this.pluck(chord[2] * 2, beatSec * 0.5, 0.035);
  }
  stop() { void this.ctx?.close(); this.ctx = null; this.out = null; }
}

const CSS = `
.kk-cone { transform-origin: top center; transition: opacity .12s; }
.kk-beat .kk-cone { animation: kk-flash .35s ease-out 1; }
@keyframes kk-flash { 0% { opacity: .55 } 100% { opacity: .22 } }
.kk-string { transform-box: fill-box; transform-origin: center; }
.kk-string.on { animation: kk-vibe .45s ease-out 1; stroke: ${K.oro}; }
@keyframes kk-vibe { 0%,100% { transform: scaleX(1) } 20% { transform: scaleX(3) } 40% { transform: scaleX(.6) } 60% { transform: scaleX(2) } }
.kk-idle .kk-string { animation: kk-shimmer 3.2s ease-in-out infinite; }
@keyframes kk-shimmer { 50% { stroke: ${K.oro}; } }
.kk-ball { animation: kk-hop .45s cubic-bezier(.3,0,.7,1) infinite alternate; }
@keyframes kk-hop { from { transform: translate(-50%, 0) } to { transform: translate(-50%, -10px) } }
.kk-pop { animation: kk-pop .9s cubic-bezier(.2,.8,.2,1) 1 forwards; }
@keyframes kk-pop { 0% { transform: translate(-50%, 10px) scale(.6); opacity: 0 } 25% { transform: translate(-50%, 0) scale(1.15); opacity: 1 } 100% { transform: translate(-50%, -24px) scale(1); opacity: 0 } }
.kk-disc { animation: kk-spin 4s linear infinite; animation-play-state: paused; }
.kk-song:hover .kk-disc, .kk-song:focus-visible .kk-disc { animation-play-state: running; }
@keyframes kk-spin { to { transform: rotate(360deg) } }
.kk-count { animation: kk-count .5s cubic-bezier(.2,.8,.2,1) 1; }
@keyframes kk-count { from { transform: scale(1.8); opacity: 0 } }
.kk-clap { animation: kk-clap .5s ease-in-out 4 alternate; display: inline-block; }
@keyframes kk-clap { to { transform: scale(1.25) rotate(-8deg) } }
@media (prefers-reduced-motion: reduce) { .kk-cone, .kk-string, .kk-ball, .kk-pop, .kk-disc, .kk-count, .kk-clap { animation: none !important; } }
`;

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
      ) : !song ? (
        <Setlist songs={songs} onPick={(s) => setSongId(s.id)} />
      ) : (
        <>
          <RetoBanner partida={partida} extra={song.id} total={song.lines.length * 5} coincide={!reto || reto.x === song.id} className="mb-3" />
          <Stage key={`${song.id}-${seed}`} song={song} partida={partida} onAgain={otra} onBack={() => { otra(); setSongId(null); }} />
        </>
      )}
    </GameStage>
  );
}

function Setlist({ songs, onPick }: { songs: Song[]; onPick: (s: Song) => void }) {
  const tt = useJU();
  return (
    <section className="pt-2">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45))" }}>
        <Reflectores beat={-1} />
        <div className="relative grid grid-cols-[1fr_auto] items-end gap-2 p-6 sm:p-8">
          <div>
            <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-6xl">Purahéi Karaoke</h1>
            <p className="mt-3 max-w-sm text-white/80">{tt("kkIntro")}</p>
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
        {songs.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s)}
            className="kk-song flex w-full items-center gap-4 rounded-2xl bg-white/[.07] p-3 text-left ring-1 ring-white/10 transition hover:bg-white/[.12] active:scale-[.99]"
          >
            <svg viewBox="0 0 60 60" className="kk-disc h-14 w-14 shrink-0" aria-hidden>
              <circle cx="30" cy="30" r="29" fill="#0B0614" />
              {[24, 19, 14].map((r) => <circle key={r} cx="30" cy="30" r={r} fill="none" stroke="#2C2240" strokeWidth="1" />)}
              <circle cx="30" cy="30" r="10" fill={s.bpm > 100 ? K.oro : K.magenta} />
              <circle cx="30" cy="30" r="2" fill="#0B0614" />
              <path d="M12 18 A22 22 0 0 1 22 9" stroke="#fff" strokeOpacity=".25" strokeWidth="2" fill="none" />
            </svg>
            <span className="min-w-0 flex-1">
              <b className="block truncate font-display text-lg">{s.title}</b>
              <span className="text-sm text-white/65">{s.style} · {s.bpm} {tt("kkBpm")}</span>
            </span>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: K.oro, color: K.noche }}>
              <Play className="h-5 w-5" fill="currentColor" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Pulsos de arpa sola antes de la cuenta regresiva, y la cuenta regresiva. */
const INTRO = 4;
const CUENTA = 4;

function Stage({ song, partida, onAgain, onBack }: { song: Song; partida: Partida; onAgain: () => void; onBack: () => void }) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const beatSec = 60 / song.bpm;
  const lead = INTRO + CUENTA;
  const timeline = useMemo(() => {
    const t: { line: number; word: number }[] = [];
    song.lines.forEach((l, li) => { l.words.forEach((_, wi) => t.push({ line: li, word: wi })); t.push({ line: li, word: -1 }); });
    return t;
  }, [song]);
  const options = useMemo(() => song.lines.map((l) => shuffle([l.words[l.gap], ...l.wrong])), [song]);
  const [beat, setBeat] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<number, "perfect" | "good" | "miss">>({});
  const [voces, setVoces] = useState<Record<number, boolean>>({});
  const [combo, setCombo] = useState(0);
  const [pop, setPop] = useState<{ text: string; n: number } | null>(null);
  const [popVoz, setPopVoz] = useState(0);
  const [animo, setAnimo] = useState(0.2);
  const [festejo, setFestejo] = useState(0);
  const [pose, setPose] = useState<PoseJai>("espera");
  const arpa = useRef(new Arpa());
  const total = lead + timeline.length;
  const done = beat >= total;
  const beatRef = useRef(-1);
  beatRef.current = beat;

  // La música (arpa, guitarra y bajo) se arma apenas se abre la canción, para tenerla lista al tocar «Cantemos».
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
  // «audio»: el juego sigue el reloj de la pista. «vivo»: arpa en vivo con un temporizador.
  const [reloj, setReloj] = useState<"audio" | "vivo">("vivo");
  const audio = useRef<HTMLAudioElement | null>(null);
  const procesado = useRef(-1);

  // ---------- Micrófono (opcional) ----------
  const micro = useRef<Micro | null>(null);
  const [micEstado, setMicEstado] = useState<"apagado" | "pidiendo" | "listo" | "sin-permiso">("apagado");
  const [nivel, setNivel] = useState(0);
  const niveles = useRef<{ fondo: number[]; linea: Record<number, number[]> }>({ fondo: [], linea: {} });
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
  useEffect(() => {
    if (!playing) return;
    const a = audio.current;
    if (reloj === "audio" && a) {
      const id = setInterval(() => {
        const b = Math.floor(a.currentTime / beatSec);
        setBeat((prev) => (b > prev ? b : prev));
      }, 40);
      return () => clearInterval(id);
    }
    const id = setInterval(() => setBeat((b) => b + 1), beatSec * 1000);
    return () => clearInterval(id);
  }, [playing, beatSec, reloj]);

  // Medir la voz mientras suena la canción.
  useEffect(() => {
    if (!playing || !micro.current) return;
    const id = setInterval(() => {
      const m = micro.current;
      if (!m) return;
      const v = m.nivel();
      setNivel(Math.min(1, v * 7));
      const b = beatRef.current;
      if (b >= 0 && b < INTRO) niveles.current.fondo.push(v);
      const pos = b >= lead ? timeline[b - lead] : undefined;
      if (pos && pos.word !== -1) (niveles.current.linea[pos.line] ??= []).push(v);
    }, 60);
    return () => clearInterval(id);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing || beat < 0) return;
    // Con la pista, el reloj puede saltar un pulso: se revisan todos los que pasaron.
    const hasta = Math.min(beat, total - 1);
    const fallos: number[] = [];
    const cantados: number[] = [];
    for (let b = procesado.current + 1; b <= hasta; b++) {
      const pos = timeline[b - lead];
      if (!pos || pos.word !== -1) continue;
      // Si el hueco pasó sin respuesta, cuenta como fallo.
      if (answers[pos.line] === undefined) fallos.push(pos.line);
      // ¿Cantó este verso con el micrófono?
      if (micro.current && canto(niveles.current.linea[pos.line] ?? [], fondoDe(niveles.current.fondo))) cantados.push(pos.line);
    }
    procesado.current = Math.max(procesado.current, hasta);
    if (reloj === "vivo" && beat < total) arpa.current.beat(song.chords[Math.floor(beat / 2) % song.chords.length], beatSec);
    if (fallos.length) {
      setAnswers((a) => { const n = { ...a }; for (const l of fallos) if (n[l] === undefined) n[l] = "miss"; return n; });
      setCombo(0); feedback("error");
      setAnimo((x) => Math.max(0, x - 0.3));
    }
    if (cantados.length) {
      setVoces((v) => { const n = { ...v }; for (const l of cantados) n[l] = true; return n; });
      setPopVoz(Date.now());
      setAnimo((x) => Math.min(1, x + 0.12));
    }
    if (beat >= INTRO && pose === "espera") setPose("canta");
    if (beat >= total) setPlaying(false);
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  function empezar() {
    sesionDeAudio(micro.current ? "play-and-record" : "playback");
    procesado.current = -1;
    niveles.current = { fondo: [], linea: {} };
    if (micro.current) { micro.current.empezarGrabacion(); inicioGrabacion.current = performance.now(); micro.current.desfase = 0; }
    if (pista) {
      const a = new Audio(pista);
      audio.current = a;
      setReloj("audio");
      // La voz se alinea con el arpa: lo que tardó en arrancar la música después de empezar a grabar.
      a.addEventListener("playing", () => {
        if (micro.current) micro.current.desfase = a.currentTime - (performance.now() - inicioGrabacion.current) / 1000;
      }, { once: true });
      // Si el celular no deja reproducir, sigue con el arpa en vivo sin cortar el juego.
      a.play().catch(() => { audio.current = null; arpa.current.unlock(); setReloj("vivo"); });
    } else {
      arpa.current.unlock();
      setReloj("vivo");
    }
    setBeat(0);
    setPlaying(true);
  }

  const cur = beat >= lead ? timeline[beat - lead] : undefined;
  const lineIdx = cur?.line ?? (beat < lead ? 0 : song.lines.length - 1);
  const line = song.lines[Math.min(lineIdx, song.lines.length - 1)];
  const next = song.lines[lineIdx + 1];
  const answerOpen = !!cur && answers[cur.line] === undefined;

  const poseTimer = useRef<number | null>(null);
  function festejar() {
    setFestejo(Date.now());
    setPose("festeja");
    if (poseTimer.current) window.clearTimeout(poseTimer.current);
    poseTimer.current = window.setTimeout(() => setPose("canta"), 1100);
  }
  useEffect(() => () => { if (poseTimer.current) window.clearTimeout(poseTimer.current); }, []);

  function answer(w: string) {
    if (!cur || !answerOpen) return;
    const l = song.lines[cur.line];
    if (w !== l.words[l.gap]) {
      setAnswers((a) => ({ ...a, [cur.line]: "miss" })); setCombo(0); feedback("error"); setPop({ text: "¡Uy!", n: Date.now() });
      setAnimo((x) => Math.max(0, x - 0.3));
      return;
    }
    const onTime = cur.word === l.gap || cur.word === l.gap - 1 || cur.word === l.gap + 1;
    const grade = onTime ? "perfect" : "good";
    setAnswers((a) => ({ ...a, [cur.line]: grade })); setCombo((c) => c + 1); feedback("success");
    setPop({ text: grade === "perfect" ? "¡Iporãite! ✨" : "¡Porã!", n: Date.now() });
    setAnimo((x) => Math.min(1, x + (grade === "perfect" ? 0.3 : 0.15)));
    if (grade === "perfect") festejar();
  }

  const nVoces = Object.values(voces).filter(Boolean).length;
  // Los puntos de la letra (los mismos para todos, con o sin micrófono: así el reto es parejo) y el extra por cantar.
  const puntosLetra = Object.values(answers).reduce((s, g) => s + (g === "perfect" ? 5 : g === "good" ? 3 : 0), 0);
  const points = puntosLetra + nVoces * 2;
  const xp = Math.min(20, points);
  const recorded = useRef(false);
  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true; feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "karaoke", xp });
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

  if (done) {
    const perfect = Object.values(answers).filter((g) => g === "perfect").length;
    const stars = perfect >= song.lines.length ? 3 : perfect >= song.lines.length / 2 ? 2 : Object.values(answers).some((g) => g !== "miss") ? 1 : 0;
    const detalle = tt("kkLines", { p: perfect, n: song.lines.length, s: points });
    return (
      <section className="space-y-5 pt-2 text-center">
        <div className="relative overflow-hidden rounded-3xl px-6 pb-8 pt-4 ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.45))" }}>
          <Reflectores beat={0} />
          <img src={JAI_KARAOKE.festeja} alt="Jai aplaude" className="kk-jai-wait relative mx-auto h-40 w-auto object-contain drop-shadow-2xl" />
          <h2 className="relative mt-1 font-display text-3xl font-bold leading-tight">{tt("kkSang", { n: song.title })}</h2>
          <p className="relative mt-3 text-4xl tracking-widest" style={{ color: K.oro }} aria-label={tt("stars", { n: stars })}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <p className="relative mt-2 text-white/80">{detalle}</p>
          {nVoces > 0 && <p className="relative mt-1 text-sm text-white/75">🎤 {nVoces}/{song.lines.length}</p>}
          <p className="relative mt-1 font-bold" style={{ color: K.oro }}>+{xp} XP</p>
          {stars > 0 && <ConfetiFinal />}
        </div>
        <CompartirCancion cancion={song.title} estrellas={stars} detalle={detalle} audio={cancion} mezclando={mezclando} />
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className="h-12 rounded-2xl tap-3d-dark px-6 font-bold" style={{ background: K.oro, color: K.noche }}>{tt("kkAgain")}</button>
          <button type="button" onClick={onBack} className="h-12 rounded-2xl px-6 font-bold ring-1 ring-white/30">{tt("kkOther")}</button>
        </div>
        {!cancion && !mezclando && <Recorder song={song} />}
        <RetoFinal partida={partida} puntaje={puntosLetra} total={song.lines.length * 5} extra={song.id} coincide={!partida.reto || partida.reto.x === song.id} />
      </section>
    );
  }

  const hecho = Object.keys(answers).length;
  const sinEmpezar = !playing && beat < 0;
  return (
    <section className="space-y-3 pt-2" style={{ ["--kk-beat" as string]: `${beatSec}s` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{song.title}</p>
          <p className="text-sm text-white/60">{song.style}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full px-3 py-1 text-sm font-bold transition-colors" style={{ background: combo > 1 ? K.magenta : "rgba(255,255,255,.1)" }}>×{combo}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm"><b>{points}</b> {tt("kkPts")}</span>
        </div>
      </div>

      <div className="relative">
        <Escenario beat={beat} playing={playing} pose={pose} animo={animo} festejo={festejo} nivelVoz={micEstado === "listo" ? (playing ? nivel : 0) : null} />
        {pop && (
          <span key={pop.n} className="kk-pop pointer-events-none absolute left-1/2 top-6 whitespace-nowrap font-display text-3xl font-bold" style={{ color: pop.text === "¡Uy!" ? "#FF8A8A" : K.oro, textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>
            {pop.text}
          </span>
        )}
        {popVoz > 0 && (
          <span key={popVoz} className="kk-pop pointer-events-none absolute left-[78%] top-4 whitespace-nowrap rounded-full px-3 py-1 font-display text-sm font-bold" style={{ background: K.magenta, color: "#fff" }}>
            {tt("kkTeEscuche")}
          </span>
        )}
      </div>

      <Aplausometro animo={animo} label={tt("kkAplausos")} />

      {/* La letra */}
      <div className="relative overflow-hidden rounded-3xl px-4 pb-4 pt-3 text-center ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55))" }}>
        <div className="mb-2 flex justify-center gap-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full transition-transform" style={{ background: playing && beat % 4 === i ? K.oro : "rgba(255,255,255,.2)", transform: playing && beat % 4 === i ? "scale(1.5)" : "none" }} />
          ))}
        </div>
        {sinEmpezar ? (
          <p className="py-4 font-display text-2xl font-bold">{tt("kkReady")}</p>
        ) : beat < INTRO ? (
          <div className="py-2">
            <p className="font-display text-xl font-bold" style={{ color: K.oro }}>{tt("kkIntroArpa")}</p>
            <p className="mt-2 font-display text-2xl font-bold text-white/45">{song.lines[0]!.words.map((w, i) => (i === song.lines[0]!.gap ? "…" : w)).join(" ")}</p>
          </div>
        ) : beat < lead ? (
          <p key={beat} className="kk-count py-1 font-display text-7xl font-bold" style={{ color: K.oro }}>{lead - beat}</p>
        ) : (
          <>
            <p className="flex min-h-20 flex-wrap items-end justify-center gap-x-2 gap-y-3 pt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">
              {line.words.map((w, wi) => {
                const isGap = wi === line.gap;
                const res = answers[lineIdx];
                const active = cur?.line === lineIdx && cur.word === wi;
                const sung = cur?.line === lineIdx && (cur.word === -1 || cur.word > wi);
                const hueco = isGap && res === undefined;
                const texto = hueco ? " ? " : w;
                return (
                  <span
                    key={`${lineIdx}-${wi}`}
                    className="relative rounded-lg px-1"
                    style={{
                      color: isGap && res === "miss" ? "#FF8A8A" : "rgba(255,255,255,.85)",
                      background: hueco ? "rgba(224,69,123,.25)" : undefined,
                      outline: hueco ? `2px dashed ${K.magenta}` : undefined,
                    }}
                  >
                    {active && <span className="kk-ball absolute -top-4 left-1/2 h-3 w-3 rounded-full" style={{ background: K.magenta }} aria-hidden />}
                    {texto}
                    {!(isGap && res === "miss") && (
                      <span aria-hidden className={`kk-sweep absolute inset-0 px-1 ${active ? "on" : sung ? "done" : ""}`} style={{ color: K.oro, textShadow: `0 0 18px ${K.oro}88` }}>
                        {texto}
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
            <p className="mt-2 text-sm italic text-white/70">{line.es}</p>
            {next && (
              <p className="mt-2 truncate text-sm text-white/40">
                {tt("kkSigue")} <span className="font-display font-semibold">{next.words.map((w, i) => (i === next.gap ? "…" : w)).join(" ")}</span>
              </p>
            )}
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
          <div className="h-full transition-all" style={{ width: `${Math.max(0, (beat / total) * 100)}%`, background: `linear-gradient(90deg, ${K.magenta}, ${K.oro})` }} />
        </div>
      </div>

      <div className="flex justify-center gap-1.5" aria-label={tt("kkVerses", { h: hecho, n: song.lines.length })}>
        {song.lines.map((_, i) => {
          const g = answers[i];
          return <span key={i} className="h-2 w-8 rounded-full" style={{ background: g === "perfect" ? K.oro : g === "good" ? "#F7E6C4" : g === "miss" ? "#7A3355" : "rgba(255,255,255,.15)" }} />;
        })}
      </div>

      {beat >= lead && (
        <div className="grid grid-cols-3 gap-2">
          {options[lineIdx].map((w) => (
            <button
              key={w}
              type="button"
              disabled={!answerOpen}
              onClick={() => answer(w)}
              className="min-h-16 rounded-2xl px-2 font-display text-lg font-bold transition active:scale-95 disabled:opacity-35 sm:text-xl"
              style={{ background: "rgba(255,255,255,.1)", boxShadow: answerOpen ? `0 0 0 2px ${K.magenta}, 0 0 24px -4px ${K.magenta}` : "none" }}
            >
              {w}
            </button>
          ))}
        </div>
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
            <Play className="h-6 w-6" fill="currentColor" /> ¡Ñapurahéi! {tt("kkSing")}
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
      <p className="text-center text-sm text-white/60">{tt("kkTip")}</p>
    </section>
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
