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
import { renderArpa, sesionDeAudio } from "@/lib/karaoke-arpa";
import { Mic, Square, Play } from "lucide-react";

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

/* Paleta del escenario: noche violeta, reflectores magenta y oro, arpa de madera. */
const K = { noche: "#1A0B33", violeta: "#2A1250", magenta: "#E0457B", oro: "#F6C445", madera: "#E2A04A", cuerda: "#F7E6C4" };

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
      css={CSS}
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

/** El arpa paraguaya: cada pulso hace vibrar una cuerda. */
function Arpa_({ beat, idle, className = "" }: { beat: number; idle?: boolean; className?: string }) {
  const n = 12;
  return (
    <svg viewBox="0 0 140 170" className={`${idle ? "kk-idle" : ""} ${className}`} aria-hidden>
      <path d="M16 160 L26 10 Q78 -4 108 52 Q118 72 132 82 L16 160Z" fill="none" stroke={K.madera} strokeWidth="9" strokeLinejoin="round" />
      <path d="M26 10 Q78 -4 108 52 Q118 72 132 82" fill="none" stroke="#9A5E22" strokeWidth="3" />
      {Array.from({ length: n }, (_, i) => {
        const x = 32 + i * 8.2;
        const top = 12 + i * 4.6 + (i > 8 ? (i - 8) * 4 : 0);
        const bottom = 152 - i * 5.6;
        const on = !idle && beat >= 0 && beat % n === i;
        return (
          <line
            key={`${i}-${on ? beat : "x"}`}
            className={`kk-string ${on ? "on" : ""}`}
            x1={x} y1={top} x2={x} y2={bottom}
            stroke={K.cuerda} strokeWidth="1.6"
            style={idle ? { animationDelay: `${i * 0.18}s` } : undefined}
          />
        );
      })}
      <circle cx="16" cy="160" r="6" fill={K.madera} />
    </svg>
  );
}

function Reflectores({ beat }: { beat: number }) {
  return (
    <div key={beat} className={`pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden ${beat >= 0 ? "kk-beat" : ""}`} aria-hidden>
      <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="kk-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.magenta} stopOpacity=".9" /><stop offset="1" stopColor={K.magenta} stopOpacity="0" /></linearGradient>
          <linearGradient id="kk-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={K.oro} stopOpacity=".9" /><stop offset="1" stopColor={K.oro} stopOpacity="0" /></linearGradient>
        </defs>
        <path className="kk-cone" d="M70 0 L100 0 L190 300 L-40 300Z" fill="url(#kk-g1)" opacity=".22" />
        <path className="kk-cone" d="M300 0 L330 0 L440 300 L210 300Z" fill="url(#kk-g2)" opacity=".22" />
      </svg>
    </div>
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
          <Arpa_ beat={-1} idle className="h-32 w-auto sm:h-44" />
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

function Stage({ song, partida, onAgain, onBack }: { song: Song; partida: Partida; onAgain: () => void; onBack: () => void }) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const beatSec = 60 / song.bpm;
  const lead = 4; // cuenta regresiva
  const timeline = useMemo(() => {
    const t: { line: number; word: number }[] = [];
    song.lines.forEach((l, li) => { l.words.forEach((_, wi) => t.push({ line: li, word: wi })); t.push({ line: li, word: -1 }); });
    return t;
  }, [song]);
  const options = useMemo(() => song.lines.map((l) => shuffle([l.words[l.gap], ...l.wrong])), [song]);
  const [beat, setBeat] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<number, "perfect" | "good" | "miss">>({});
  const [combo, setCombo] = useState(0);
  const [pop, setPop] = useState<{ text: string; n: number } | null>(null);
  const arpa = useRef(new Arpa());
  const total = lead + timeline.length;
  const done = beat >= total;

  // La pista del arpa se arma apenas se abre la canción, para tenerla lista al tocar «Cantemos».
  const [pista, setPista] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    let url: string | null = null;
    void renderArpa(song.chords, total, beatSec).then((b) => {
      if (!vivo || !b) return;
      url = URL.createObjectURL(b);
      setPista(url);
    });
    return () => { vivo = false; if (url) URL.revokeObjectURL(url); };
  }, [song, total, beatSec]);
  // «audio»: el juego sigue el reloj de la pista. «vivo»: arpa en vivo con un temporizador.
  const [reloj, setReloj] = useState<"audio" | "vivo">("vivo");
  const audio = useRef<HTMLAudioElement | null>(null);
  const procesado = useRef(-1);

  useEffect(() => () => { arpa.current.stop(); audio.current?.pause(); audio.current = null; }, []);
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
  useEffect(() => {
    if (!playing || beat < 0) return;
    // Con la pista, el reloj puede saltar un pulso: se revisan todos los que pasaron.
    const hasta = Math.min(beat, total - 1);
    const fallos: number[] = [];
    for (let b = procesado.current + 1; b <= hasta; b++) {
      // Si el hueco pasó sin respuesta, cuenta como fallo.
      const pos = timeline[b - lead];
      if (pos && pos.word === -1 && answers[pos.line] === undefined) fallos.push(pos.line);
    }
    procesado.current = Math.max(procesado.current, hasta);
    if (reloj === "vivo" && beat < total) arpa.current.beat(song.chords[Math.floor(beat / 2) % song.chords.length], beatSec);
    if (fallos.length) {
      setAnswers((a) => { const n = { ...a }; for (const l of fallos) if (n[l] === undefined) n[l] = "miss"; return n; });
      setCombo(0); feedback("error");
    }
    if (beat >= total) setPlaying(false);
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  function empezar() {
    sesionDeAudio("playback");
    procesado.current = -1;
    if (pista) {
      const a = new Audio(pista);
      audio.current = a;
      setReloj("audio");
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
  const answerOpen = !!cur && answers[cur.line] === undefined;

  function answer(w: string) {
    if (!cur || !answerOpen) return;
    const l = song.lines[cur.line];
    if (w !== l.words[l.gap]) { setAnswers((a) => ({ ...a, [cur.line]: "miss" })); setCombo(0); feedback("error"); setPop({ text: "¡Uy!", n: Date.now() }); return; }
    const onTime = cur.word === l.gap || cur.word === l.gap - 1 || cur.word === l.gap + 1;
    const grade = onTime ? "perfect" : "good";
    setAnswers((a) => ({ ...a, [cur.line]: grade })); setCombo((c) => c + 1); feedback("success");
    setPop({ text: grade === "perfect" ? "¡Iporãite! ✨" : "¡Porã!", n: Date.now() });
  }

  const points = Object.values(answers).reduce((s, g) => s + (g === "perfect" ? 5 : g === "good" ? 3 : 0), 0);
  const xp = Math.min(20, points);
  const recorded = useRef(false);
  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true; feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "karaoke", xp });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (done) {
    const perfect = Object.values(answers).filter((g) => g === "perfect").length;
    const stars = perfect >= song.lines.length ? 3 : perfect >= song.lines.length / 2 ? 2 : Object.values(answers).some((g) => g !== "miss") ? 1 : 0;
    return (
      <section className="space-y-5 pt-2 text-center">
        <div className="relative overflow-hidden rounded-3xl px-6 py-8 ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.45))" }}>
          <Reflectores beat={0} />
          <p className="relative text-5xl"><span className="kk-clap" aria-hidden>👏</span></p>
          <h2 className="relative mt-3 font-display text-3xl font-bold leading-tight">{tt("kkSang", { n: song.title })}</h2>
          <p className="relative mt-3 text-4xl tracking-widest" style={{ color: K.oro }} aria-label={tt("stars", { n: stars })}>
            {"★".repeat(stars)}<span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <p className="relative mt-2 text-white/80">{tt("kkLines", { p: perfect, n: song.lines.length, s: points })}</p>
          <p className="relative mt-1 font-bold" style={{ color: K.oro }}>+{xp} XP</p>
        </div>
        <Recorder song={song} />
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAgain} className="h-12 rounded-2xl px-6 font-bold" style={{ background: K.oro, color: K.noche }}>{tt("kkAgain")}</button>
          <button type="button" onClick={onBack} className="h-12 rounded-2xl px-6 font-bold ring-1 ring-white/30">{tt("kkOther")}</button>
        </div>
        <RetoFinal partida={partida} puntaje={points} total={song.lines.length * 5} extra={song.id} coincide={!partida.reto || partida.reto.x === song.id} />
      </section>
    );
  }

  const hecho = Object.keys(answers).length;
  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{song.title}</p>
          <p className="text-sm text-white/60">{song.style}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: combo > 1 ? K.magenta : "rgba(255,255,255,.1)" }}>×{combo}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm"><b>{points}</b> {tt("kkPts")}</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.2), rgba(0,0,0,.55))" }}>
        <Reflectores beat={playing ? beat : -1} />
        <div className="relative grid grid-cols-[auto_1fr] items-center gap-2 p-4 sm:gap-6 sm:p-6">
          <Arpa_ beat={playing ? beat : -1} idle={!playing} className="h-28 w-auto sm:h-48" />
          <div className="min-w-0 text-center">
            <div className="mb-3 flex justify-center gap-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-3 w-3 rounded-full transition-transform" style={{ background: playing && beat % 4 === i ? K.oro : "rgba(255,255,255,.2)", transform: playing && beat % 4 === i ? "scale(1.5)" : "none" }} />
              ))}
            </div>
            {!playing && beat < 0 ? (
              <p className="py-6 font-display text-2xl font-bold">{tt("kkReady")}</p>
            ) : beat < lead ? (
              <p key={beat} className="kk-count py-2 font-display text-7xl font-bold" style={{ color: K.oro }}>{lead - beat}</p>
            ) : (
              <>
                <p className="flex min-h-24 flex-wrap items-end justify-center gap-x-2 gap-y-3 pt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                  {line.words.map((w, wi) => {
                    const isGap = wi === line.gap;
                    const res = answers[lineIdx];
                    const active = cur?.line === lineIdx && cur.word === wi;
                    const sung = cur?.line === lineIdx && (cur.word === -1 || cur.word > wi);
                    const hueco = isGap && res === undefined;
                    return (
                      <span
                        key={wi}
                        className="relative rounded-lg px-1 transition-colors duration-150"
                        style={{
                          color: isGap && res === "miss" ? "#FF8A8A" : active || sung ? K.oro : "rgba(255,255,255,.85)",
                          background: hueco ? "rgba(224,69,123,.25)" : undefined,
                          outline: hueco ? `2px dashed ${K.magenta}` : undefined,
                        }}
                      >
                        {active && <span className="kk-ball absolute -top-4 left-1/2 h-3 w-3 rounded-full" style={{ background: K.magenta }} aria-hidden />}
                        {hueco ? " ? " : w}
                      </span>
                    );
                  })}
                </p>
                <p className="mt-3 text-sm italic text-white/70">{line.es}</p>
              </>
            )}
          </div>
        </div>
        {pop && (
          <span key={pop.n} className="kk-pop pointer-events-none absolute left-1/2 top-6 whitespace-nowrap font-display text-3xl font-bold" style={{ color: pop.text === "¡Uy!" ? "#FF8A8A" : K.oro, textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>
            {pop.text}
          </span>
        )}
        <div className="relative h-2 bg-white/10">
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
      {!playing && beat < 0 && (
        <button
          type="button"
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl font-display text-xl font-bold shadow-lg transition active:scale-[.98]"
          style={{ background: K.oro, color: K.noche }}
          onClick={empezar}
        >
          <Play className="h-6 w-6" fill="currentColor" /> ¡Ñapurahéi! {tt("kkSing")}
        </button>
      )}
      {playing && (
        <QuitGameButton
          className="text-white"
          label="Terminar la canción y ver el resultado"
          onQuit={() => { arpa.current.stop(); audio.current?.pause(); setPlaying(false); setBeat(total); }}
        />
      )}
      <p className="text-center text-sm text-white/60">{tt("kkTip")}</p>
    </section>
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
