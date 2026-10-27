import { useJU, type JUKey } from "@/lib/i18n-juegos-ui";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, Users, Volume2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XpNote, shuffle, useGameWords } from "@/components/games/game-shell";
import { GameStage } from "@/components/games/game-stage";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { useSala } from "@/lib/use-sala";
import { Compartir } from "@/components/games/reto";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import { ROULETTE, TRIVIA } from "@/lib/trivia";
import type { GameWord } from "@/lib/games.functions";

export const Route = createFileRoute("/_authenticated/juegos/nee-rape")({
  validateSearch: (s: Record<string, unknown>) => ({
    sala: typeof s.sala === "string" ? s.sala.toUpperCase().slice(0, 6) : undefined,
    sendero: s.sendero === "nemongeta" || s.sendero === "arandupy" || s.sendero === "achegety" ? (s.sendero as "achegety" | "nemongeta" | "arandupy") : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ñe'ẽ Rape — Desafío a distancia | Jaikuaa" },
      { name: "description", content: "Desafiá a un compañero por WhatsApp: cada uno desde su celular, mismas preguntas, mismo reloj." },
      { property: "og:title", content: "Ñe'ẽ Rape — Desafío a distancia | Jaikuaa" },
      { property: "og:description", content: "Duelo remoto de guaraní en cuatro senderos: ortografía, vocabulario, cultura y dichos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NeeRape,
});

const ROUNDS = 5;
const ANSWER_MS = 9000;
const REVEAL_MS = 2200;
const SLOT_MS = ANSWER_MS + REVEAL_MS;
const COUNTDOWN_MS = 3500;
const REACTIONS = ["👏", "🔥", "😮", "😅", "🧉"];

type SenderoId = "achegety" | "nemongeta" | "arandupy" | "neenga";
const SENDEROS: { id: SenderoId; emoji: string; gn: string; es: string; desc: string; tip: string; ready: boolean }[] = [
  { id: "achegety", emoji: "📜", gn: "Achegety ha Hai", es: "Ortografía", desc: "Elegí cómo se escribe la palabra, contra reloj.", tip: "Recordá: un sonido, una letra; y las vocales nasales llevan tilde nasal (~).", ready: true },
  { id: "nemongeta", emoji: "💬", gn: "Ñemongeta", es: "Vocabulario cotidiano", desc: "Escuchá o leé la palabra y elegí su significado.", tip: "Escuchá bien la nasalidad: cambia el significado de la palabra.", ready: true },
  { id: "arandupy", emoji: "🏺", gn: "Arandupy", es: "Cultura y mitos", desc: "Mitos, comidas, historia y naturaleza del Paraguay.", tip: "La cultura paraguaya vive en su lengua: cada respuesta suma identidad.", ready: true },
  { id: "neenga", emoji: "🪕", gn: "Ñe'ẽnga", es: "Dichos y poesía", desc: "En preparación con docentes especialistas.", tip: "", ready: false },
];

type Round = { prompt: string; options: string[]; answer: number; audio?: string; tip?: string };

function buildRounds(sendero: SenderoId, words: GameWord[]): Round[] {
  const tip = SENDEROS.find((s) => s.id === sendero)!.tip;
  if (sendero === "arandupy") {
    return shuffle(ROULETTE.flatMap((id) => TRIVIA[id].questions.map((q) => ({ ...q, emoji: TRIVIA[id].emoji }))))
      .slice(0, ROUNDS)
      .map((q) => ({ prompt: `${q.emoji} ${q.q}`, options: q.options, answer: q.answer, tip: q.explanation }));
  }
  const uniq = Array.from(new Map(words.map((w) => [w.gn, w])).values());
  const targets = shuffle(uniq).slice(0, ROUNDS);
  return targets.map((w) => {
    if (sendero === "achegety") {
      // Distractores: otras palabras reales del corpus, parecidas en largo e inicial.
      const others = uniq
        .filter((o) => o.gn !== w.gn && o.es !== w.es)
        .sort((a, b) => score(a) - score(b))
        .slice(0, 6);
      function score(o: GameWord) {
        return Math.abs(o.gn.length - w.gn.length) + (o.gn[0] === w.gn[0] ? 0 : 2) + Math.random();
      }
      const opts = shuffle([w.gn, ...shuffle(others).slice(0, 2).map((o) => o.gn)]);
      return { prompt: `¿Cómo se escribe «${w.es}»?`, options: opts, answer: opts.indexOf(w.gn), audio: w.hasAudio ? w.gn : undefined, tip };
    }
    const others = shuffle(uniq.filter((o) => o.es !== w.es)).slice(0, 3).map((o) => o.es);
    const opts = shuffle([w.es, ...others]);
    return { prompt: w.gn, options: opts, answer: opts.indexOf(w.es), audio: w.hasAudio ? w.gn : undefined, tip };
  });
}

function newCode() {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
}

function pointsFor(ms: number) {
  return 100 + Math.round(Math.max(0, (ANSWER_MS - ms) / ANSWER_MS) * 50);
}

type Answer = { pick: number; ms: number; correct: boolean };
type Match = { sendero: SenderoId; rounds: Round[]; startAt: number };

function NeeRape() {
  const { sala, sendero: preset } = Route.useSearch();
  const [sendero, setSendero] = useState<SenderoId>(preset ?? "achegety");
  const [mode, setMode] = useState<"menu" | "solo" | "remote">(sala ? "remote" : "menu");
  const [code, setCode] = useState<string | null>(sala ?? null);
  const [isHost, setIsHost] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const words = useGameWords(null);
  const tt = useJU();
  const pool = words.data?.words ?? [];
  const current = SENDEROS.find((s) => s.id === sendero)!;
  const enough = sendero === "arandupy" || new Set(pool.map((w) => w.gn)).size >= 8;

  return (
    <GameStage
      title="Ñe'ẽ Rape"
      sponsorSlot="nee-rape"
      css={CSS}
      ink="#F7F1DE"
      background="radial-gradient(80% 40% at 50% 0%, #2A7A55 0%, transparent 70%), linear-gradient(180deg, #1F5E43 0%, #123B2A 100%)"
    >
      <div className="nr">
      {mode === "menu" && (
        <div className="space-y-6">
          <Sendero />
          <div className="grid gap-3 sm:grid-cols-2">
            {SENDEROS.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={!s.ready}
                onClick={() => setSendero(s.id)}
                className={`rounded-2xl border-2 p-4 text-left transition ${sendero === s.id ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card"} ${s.ready ? "hover:border-primary/60" : "opacity-60"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>{s.emoji}</span>
                  <div>
                    <p className="font-display font-bold text-foreground">{s.gn}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tt(`nrEs_${s.id}` as JUKey)}</p>
                  </div>
                  {!s.ready && <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{tt("nrSoon")}</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tt(`nrDesc_${s.id}` as JUKey)}</p>
              </button>
            ))}
          </div>
          {sendero === "arandupy" && (
            <p className="rounded-lg bg-secondary/10 p-3 text-center text-xs text-muted-foreground">{tt("nrCultureVal")}</p>
          )}
          {words.isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !enough ? (
            <p className="text-center text-sm text-muted-foreground">{tt("nrNotEnough")}</p>
          ) : (
            <div className="grid gap-3">
              <Button size="lg" className="h-14 text-base" onClick={() => { setCode(newCode()); setIsHost(true); setMode("remote"); }}>
                <Wifi className="mr-2 h-5 w-5" /> {tt("nrChallenge")}
              </Button>
              <Button size="lg" variant="outline" onClick={() => setMode("solo")}>{tt("nrSolo")} · {tt(`nrEs_${current.id}` as JUKey)}</Button>
            </div>
          )}
          <div className="rounded-2xl border border-dashed border-border p-4">
            <p className="text-sm font-semibold text-foreground">{tt("nrInvited")}</p>
            <div className="mt-2 flex gap-2">
              <Input value={joinCode} maxLength={4} placeholder={tt("nrEg")} className="uppercase tracking-[0.3em]" onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
              <Button disabled={joinCode.length !== 4} onClick={() => { setCode(joinCode); setIsHost(false); setMode("remote"); }}>{tt("nrJoin")}</Button>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">{tt("nrBased")}</p>
        </div>
      )}
      {mode === "solo" && <Solo sendero={sendero} pool={pool} onExit={() => setMode("menu")} />}
      {mode === "remote" && code && (
        <Remote code={code} isHost={isHost} sendero={sendero} pool={pool} onExit={() => { setMode("menu"); setCode(null); }} />
      )}
      </div>
    </GameStage>
  );
}

/*
 * Paleta del sendero: monte verde, camino de tierra clara y paso dorado.
 * Se redefinen los colores de la app dentro de .nr para que todo el juego tome el tono del monte.
 */
const CSS = `
.nr {
  --background: #123B2A; --foreground: #F7F1DE; --card: #1B4D37; --card-foreground: #F7F1DE;
  --muted: #174632; --muted-foreground: #BFD3C4; --border: #2F6B50; --input: #3A7A5C;
  --primary: #F2C14E; --primary-foreground: #1A2E22; --secondary: #FF8A5B; --secondary-foreground: #1A2E22;
  --accent: #2F6B50; --accent-foreground: #F7F1DE; --destructive: #FF6B5E; --ring: #F2C14E;
  color: var(--foreground);
}
.nr-paso { animation: nr-paso 2.4s ease-in-out infinite; }
.nr-paso:nth-child(2n) { animation-delay: .3s; }
@keyframes nr-paso { 50% { opacity: .35 } }
.nr-viaje { offset-path: path("M46 100 C90 40 170 150 240 70 S330 40 352 30"); animation: nr-viaje 5s ease-in-out infinite; }
@keyframes nr-viaje { from { offset-distance: 0% } to { offset-distance: 100% } }
@media (prefers-reduced-motion: reduce) { .nr-paso, .nr-viaje { animation: none !important } }
`;

/** El camino de la palabra: dos celulares unidos por un sendero de puntos y una palabra que viaja. */
function Sendero() {
  const tt = useJU();
  return (
    <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.3))" }}>
      <svg viewBox="0 0 400 150" className="mx-auto block max-h-44 w-full" aria-hidden>
        <path d="M0 125 Q100 100 200 120 T400 110 V150 H0Z" fill="#174A34" />
        <path d="M46 100 C90 40 170 150 240 70 S330 40 352 30" fill="none" stroke="#F3E3B5" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" className="nr-paso" />
        {[[14, 74], [352, 6]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect width="32" height="54" rx="7" fill="#0E2A1F" stroke="#F3E3B5" strokeWidth="3" />
            <rect x="6" y="8" width="20" height="32" rx="2" fill={i ? "#F2C14E" : "#7FD3A8"} />
          </g>
        ))}
        <circle r="9" fill="#F2C14E" className="nr-viaje" />
      </svg>
      <div className="px-5 pb-5">
        <h1 className="font-display text-4xl font-bold leading-none tracking-tight">Ñe'ẽ Rape</h1>
        <p className="mt-2 text-sm opacity-80">{tt("nrIntro")}</p>
      </div>
    </div>
  );
}

function Solo({ sendero, pool, onExit }: { sendero: SenderoId; pool: GameWord[]; onExit: () => void }) {
  const tt = useJU();
  const [match, setMatch] = useState<Match>(() => ({ sendero, rounds: buildRounds(sendero, pool), startAt: Date.now() + COUNTDOWN_MS }));
  return (
    <Arena
      key={match.startAt}
      match={match}
      names={[tt("nrYou"), ""]}
      rival={{}}
      onAnswer={() => {}}
      onRematch={() => setMatch({ sendero, rounds: buildRounds(sendero, pool), startAt: Date.now() + COUNTDOWN_MS })}
      onExit={onExit}
    />
  );
}

type RemoteMatch = Match & { hostUid: string; guestUid: string };
/** Cuánto se espera a un rival que salió de la app o perdió la señal (el reloj del duelo sigue). */
const GRACE_MS = 10000;

function Remote({ code, isHost, sendero, pool, onExit }: { code: string; isHost: boolean; sendero: SenderoId; pool: GameWord[]; onExit: () => void }) {
  const tt = useJU();
  const [match, setMatch] = useState<RemoteMatch | null>(null);
  const [rival, setRival] = useState<Record<number, Answer>>({});
  const [reaction, setReaction] = useState<{ e: string; k: number } | null>(null);
  const [end, setEnd] = useState<null | "abandono" | "tarde">(null);
  const [awaySince, setAwaySince] = useState<number | null>(null);
  const [llena, setLlena] = useState(false);
  const matchRef = useRef<RemoteMatch | null>(null);
  const endRef = useRef<typeof end>(null);
  endRef.current = end;
  const salaRef = useRef<ReturnType<typeof useSala> | null>(null);

  const startMatch = useCallback(() => {
    const s = salaRef.current;
    if (!s?.me || !s.rival.uid || !s.isHost) return;
    const rounds = buildRounds(sendero, pool);
    const m: RemoteMatch = { sendero, rounds, startAt: Date.now() + COUNTDOWN_MS, hostUid: s.me.uid, guestUid: s.rival.uid };
    s.send("start", { sendero, rounds, delay: COUNTDOWN_MS, hostUid: m.hostUid, guestUid: m.guestUid });
    setRival({});
    setEnd(null);
    matchRef.current = m;
    setMatch(m);
  }, [sendero, pool]);

  const meUid = salaRef.current?.me?.uid ?? null;
  const rivalUid = match && meUid ? (match.hostUid === meUid ? match.guestUid : match.hostUid) : null;

  const sala = useSala({
    ns: "nee-rape",
    code,
    host: isHost,
    events: ["start", "answer", "react", "rematch", "ended", "hello", "llena"],
    rivalUid,
    onEvent: (e, p, from) => {
      if (e === "start" && Array.isArray(p.rounds)) {
        const m: RemoteMatch = { sendero: p.sendero as SenderoId, rounds: p.rounds as Round[], startAt: Date.now() + Number(p.delay ?? COUNTDOWN_MS), hostUid: String(p.hostUid ?? ""), guestUid: String(p.guestUid ?? "") };
        setRival({});
        setEnd(null);
        matchRef.current = m;
        setMatch(m);
      } else if (e === "answer") setRival((r) => ({ ...r, [Number(p.round)]: p.answer as Answer }));
      else if (e === "react") setReaction({ e: String(p.e), k: Date.now() });
      else if (e === "rematch" && salaRef.current?.isHost) startMatch();
      else if (e === "ended" && matchRef.current && !endRef.current) setEnd("tarde");
      // El otro volvió a la app: si el duelo ya terminó por abandono, se lo avisamos.
      else if (e === "hello" && endRef.current === "abandono") salaRef.current?.send("ended");
      // Entró una tercera persona mientras dos juegan: se le avisa que la sala está llena.
      else if (e === "hello" && matchRef.current && salaRef.current?.isHost) {
        const m = matchRef.current;
        if (from && from !== m.hostUid && from !== m.guestUid) salaRef.current.send("llena", { hostUid: m.hostUid, guestUid: m.guestUid });
      } else if (e === "llena" && !matchRef.current) {
        const me = salaRef.current?.me?.uid;
        if (me && p.hostUid !== me && p.guestUid !== me) setLlena(true);
      }
    },
  });
  salaRef.current = sala;

  const myUid = sala.me?.uid ?? null;
  const fuera = llena || (!!match && !!myUid && match.hostUid !== myUid && match.guestUid !== myUid);

  // Si entré y ya hay gente pero no arranca nada, pregunto (puede que la sala ya esté jugando).
  useEffect(() => {
    if (match || !sala.rival.present || sala.isHost) return;
    const t = window.setTimeout(() => salaRef.current?.send("hello"), 2500);
    return () => window.clearTimeout(t);
  }, [match, sala.rival.present, sala.isHost]);
  const enCurso = () => !!matchRef.current && !endRef.current && Date.now() < matchRef.current.startAt + ROUNDS * SLOT_MS;
  const playing = !!match && !end && !fuera && Date.now() < match.startAt + ROUNDS * SLOT_MS;
  const rivalGone = playing && (!sala.rival.present || sala.rival.away);

  // El anfitrión arranca apenas llega el rival.
  useEffect(() => {
    if (sala.rival.present && sala.isHost && !match && sala.conn === "online") {
      const t = window.setTimeout(startMatch, 900);
      return () => window.clearTimeout(t);
    }
  }, [sala.rival.present, sala.isHost, match, sala.conn, startMatch]);

  // Si el rival tocó Salir o cerró el juego: se termina por abandono.
  useEffect(() => {
    if (playing && sala.rival.bye && enCurso()) {
      setEnd("abandono");
      sala.send("ended");
    }
  }, [playing, sala.rival.bye]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si salió de la app o perdió la señal: se lo espera unos segundos.
  useEffect(() => {
    if (rivalGone) setAwaySince((t) => t ?? Date.now());
    else setAwaySince(null);
  }, [rivalGone]);
  useEffect(() => {
    if (awaySince === null) return;
    const t = window.setTimeout(() => {
      if (!enCurso()) return;
      setEnd("abandono");
      sala.send("ended");
    }, Math.max(0, awaySince + GRACE_MS - Date.now()));
    return () => window.clearTimeout(t);
  }, [awaySince]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al volver a la app, pregunto si el duelo sigue.
  useEffect(() => {
    const on = () => { if (document.visibilityState === "visible" && matchRef.current) salaRef.current?.send("hello"); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  function salir() {
    sala.leave();
    onExit();
  }

  const link = typeof window !== "undefined" ? `${window.location.origin}/juegos/nee-rape?sala=${code}` : "";
  const invite = tt("nrInvite", { c: code, l: link });
  const myName = sala.me?.name ?? tt("nrYou");
  const lastRivalName = useRef<string | null>(null);
  if (sala.rival.name) lastRivalName.current = sala.rival.name;
  const rivalName = sala.rival.name ?? lastRivalName.current;

  if (fuera) {
    return (
      <div className="space-y-4 rounded-3xl bg-card p-6 text-center shadow-xl">
        <Users className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="font-display text-2xl font-bold">{tt("nrFull")}</p>
        <p className="text-sm text-muted-foreground">{tt("nrFullInfo")}</p>
        <Button onClick={salir}>{tt("nrBack")}</Button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="space-y-5 text-center">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/40 blur-2xl motion-safe:animate-pulse" />
          <div className="relative flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground font-display text-2xl font-bold text-primary ring-4 ring-primary-foreground/30">
                {myName.charAt(0).toUpperCase()}
              </div>
              <p className="mt-1 text-sm font-semibold">{myName}</p>
            </div>
            <p className="font-display text-3xl font-black text-secondary motion-safe:animate-bounce">VS</p>
            <div className="flex flex-col items-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed font-display text-2xl font-bold ${sala.rival.present ? "border-secondary bg-secondary text-secondary-foreground" : "border-primary-foreground/50 motion-safe:animate-pulse"}`}>
                {sala.rival.present && rivalName ? rivalName.charAt(0).toUpperCase() : "?"}
              </div>
              <p className="mt-1 text-sm font-semibold">{sala.rival.present ? rivalName : tt("nrFriend")}</p>
            </div>
          </div>
          <div className="relative mt-5 flex items-center justify-center gap-2 text-sm">
            {sala.conn === "offline" ? <>{tt("nrOffline")}</> : sala.rival.present ? <><Users className="h-4 w-4" /> {tt("nrEntered", { n: rivalName ?? "" })}</> : <><Loader2 className="h-4 w-4 animate-spin" /> {tt("nrWaiting")}</>}
          </div>
          <p className="relative mt-3 text-xs uppercase tracking-widest opacity-80">{tt("nrRoom")} <span className="font-display text-base font-bold tracking-[0.3em]">{code}</span></p>
        </div>
        {!sala.rival.present && (
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-foreground">{tt("nrSteps")}</p>
            <div className="rounded-2xl bg-white p-3 text-left text-[#13233F]">
              <Compartir url={link} texto={invite} titulo="Ñe'ẽ Rape" />
            </div>
          </div>
        )}
        <Button variant="ghost" onClick={salir}>{tt("nrCancel")}</Button>
      </div>
    );
  }

  const awayLeft = awaySince === null ? 0 : Math.max(0, Math.ceil((awaySince + GRACE_MS - Date.now()) / 1000));
  return (
    <div className="relative">
      {reaction && (
        <div key={reaction.k} className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center text-7xl animate-in zoom-in fade-in duration-300">
          {reaction.e}
        </div>
      )}
      {rivalGone && !end && (
        <div className="mb-3 rounded-2xl border-2 border-secondary bg-secondary/10 p-3 text-center text-sm font-semibold text-foreground" role="status" aria-live="polite">
          {sala.rival.away ? tt("nrLeftApp", { n: rivalName ?? tt("nrRival") }) : tt("nrLostConn", { n: rivalName ?? tt("nrRival") })} {tt("nrGrace", { s: awayLeft })}
        </div>
      )}
      <Arena
        key={match.startAt}
        match={match}
        names={[myName, rivalName ?? "Rival"]}
        rival={rival}
        onAnswer={(round, answer) => sala.send("answer", { round, answer })}
        onReact={(e) => sala.send("react", { e })}
        onRematch={() => { if (sala.isHost) startMatch(); else sala.send("rematch"); }}
        onExit={salir}
        rivalLeft={!sala.rival.present || sala.rival.bye}
        abandono={end}
      />
    </div>
  );
}

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

function Arena({ match, names, rival, onAnswer, onReact, onRematch, onExit, rivalLeft, abandono = null }: {
  match: Match;
  names: [string, string];
  rival: Record<number, Answer>;
  onAnswer: (round: number, a: Answer) => void;
  onReact?: (e: string) => void;
  onRematch: () => void;
  onExit: () => void;
  rivalLeft?: boolean;
  /** El duelo terminó antes porque el rival se fue («abandono») o porque me fui yo («tarde»). */
  abandono?: null | "abandono" | "tarde";
}) {
  const feedback = useGameFeedback();
  const tt = useJU();
  const remote = Boolean(names[1]);
  const [mine, setMine] = useState<Record<number, Answer>>({});
  const elapsed = Date.now() - match.startAt;
  const finished = !!abandono || elapsed >= ROUNDS * SLOT_MS;
  const now = useNow(!finished);
  const t = now - match.startAt;
  const idx = Math.min(ROUNDS - 1, Math.floor(Math.max(0, t) / SLOT_MS));
  const inRound = t - idx * SLOT_MS;
  const revealing = inRound >= ANSWER_MS;
  const round = match.rounds[idx]!;
  const sendero = SENDEROS.find((s) => s.id === match.sendero)!;
  const played = useRef(-1);
  const recorded = useRef(false);

  const total = useCallback((a: Record<number, Answer>) => Object.values(a).reduce((s, x) => s + (x.correct ? pointsFor(x.ms) : 0), 0), []);
  const myScore = total(mine);
  const rivalScore = total(rival);
  const done = !!abandono || t >= ROUNDS * SLOT_MS;
  const myCorrect = Object.values(mine).filter((a) => a.correct).length;
  const won = !remote || abandono === "abandono" || (!abandono && myScore > rivalScore);
  // Si el duelo terminó por abandono, se cuentan los aciertos sin el premio de ganar.
  const xp = Math.min(20, myCorrect * 3 + (remote && !abandono && myScore > rivalScore ? 5 : 0));

  useEffect(() => {
    if (t >= 0 && !done && played.current !== idx) {
      played.current = idx;
      if (round.audio) void playGuarani(round.audio);
    }
  }, [t, idx, done, round.audio]);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    feedback("victory");
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "nee-rape", xp });
  }, [done, xp, feedback]);

  function pick(i: number) {
    if (t < 0 || revealing || mine[idx] || done) return;
    const a: Answer = { pick: i, ms: inRound, correct: i === round.answer };
    setMine((m) => ({ ...m, [idx]: a }));
    feedback(a.correct ? "success" : "error");
    navigator.vibrate?.(a.correct ? 30 : [40, 40, 40]);
    onAnswer(idx, a);
  }

  if (t < 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{sendero.emoji} {sendero.gn}</p>
        {remote && <p className="font-display text-xl font-bold">{names[0]} vs {names[1]}</p>}
        <p key={Math.ceil(-t / 1000)} className="font-display text-8xl font-bold text-primary animate-in zoom-in duration-300">
          {Math.max(1, Math.ceil(-t / 1000))}
        </p>
      </div>
    );
  }

  if (done) {
    const tie = remote && !abandono && myScore === rivalScore;
    return (
      <div className="space-y-5 text-center">
        <p className="text-6xl" aria-hidden>{tie ? "🤝" : won ? "🏆" : "🥈"}</p>
        <h2 className="font-display text-3xl font-bold">{!remote ? tt("nrDone") : abandono === "abandono" ? tt("nrWonForfeit") : abandono === "tarde" ? tt("nrEnded") : tie ? tt("nrTie") : won ? tt("nrWon") : tt("nrWonBy", { n: names[1] })}</h2>
        {abandono === "abandono" && <p className="text-sm text-muted-foreground">{tt("nrLeftNoBack", { n: names[1] })}</p>}
        {abandono === "tarde" && <p className="text-sm text-muted-foreground">{tt("nrLate", { n: names[1] })}</p>}
        <div className={`grid gap-3 ${remote ? "grid-cols-2" : "grid-cols-1"}`}>
          <ScoreCard name={names[0]} score={myScore} correct={myCorrect} highlight={won && !tie} />
          {remote && <ScoreCard name={names[1]} score={rivalScore} correct={Object.values(rival).filter((a) => a.correct).length} highlight={!won && !tie} />}
        </div>
        <XpNote xp={xp} />
        <div className="rounded-2xl bg-muted/50 p-4 text-left text-sm">
          <p className="font-semibold">{tt("nrReview")}</p>
          <ul className="mt-2 space-y-1">
            {match.rounds.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span>{mine[i]?.correct ? "✅" : "❌"}</span>
                <span className="text-muted-foreground"><b className="text-foreground">{r.options[r.answer]}</b> — {r.prompt.replace(/^¿Cómo se escribe «(.*)»\?$/, "$1")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-3">
          {!abandono && <Button size="lg" onClick={onRematch} disabled={rivalLeft}><RotateCcw className="mr-2 h-4 w-4" /> {tt("nrRematch")}</Button>}
          <ShareResult text={remote ? tt("nrShareDuel", { w: won ? tt("nrIWon") : tt("nrIPlayed"), s: tt(`nrEs_${sendero.id}` as JUKey), a: myScore, b: rivalScore }) : tt("nrShareSolo", { c: myCorrect, n: ROUNDS, s: tt(`nrEs_${sendero.id}` as JUKey) })} />
          <Button variant="ghost" onClick={onExit}>{tt("nrOther")}</Button>
        </div>
      </div>
    );
  }

  const my = mine[idx];
  const showPrompt = (p: string) => { const m = /^¿Cómo se escribe «(.*)»\?$/.exec(p); return m ? tt("nrHowWrite", { w: m[1]! }) : p; };
  const showTip = (x: string) => { const s = SENDEROS.find((z) => z.tip === x && (z.id === "achegety" || z.id === "nemongeta")); return s ? tt(`nrTip_${s.id}` as JUKey) : x; };
  const theirs = rival[idx];
  const pct = Math.max(0, 1 - inRound / ANSWER_MS) * 100;
  const secsLeft = Math.max(0, Math.ceil((ANSWER_MS - inRound) / 1000));
  const urgent = !revealing && !my && secsLeft <= 3;
  let streak = 0;
  for (let i = my ? idx : idx - 1; i >= 0 && mine[i]?.correct; i--) streak++;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="rounded-xl bg-primary/10 px-3 py-1.5 font-bold text-primary">{names[0]} · {myScore}</div>
        <div className="flex flex-col items-center">
          <span className={`font-display text-2xl font-bold tabular-nums ${urgent ? "text-secondary animate-pulse" : "text-foreground"}`}>{revealing ? "·" : secsLeft}</span>
          <span className="text-[10px] font-semibold text-muted-foreground">{idx + 1}/{ROUNDS}</span>
        </div>
        {remote ? (
          <div className={`rounded-xl px-3 py-1.5 font-bold ${theirs ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
            {names[1]} · {rivalScore} {theirs && !revealing ? "✓" : ""}
          </div>
        ) : <span />}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-[width] duration-100 ${pct < 30 ? "bg-secondary" : "bg-primary"}`} style={{ width: `${revealing ? 0 : pct}%` }} />
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden>
        {match.rounds.map((_, i) => (
          <span key={i} className={`h-2 w-8 rounded-full transition ${i < idx || (i === idx && revealing) ? (mine[i]?.correct ? "bg-primary" : "bg-destructive/60") : i === idx ? "bg-foreground/40" : "bg-muted"}`} />
        ))}
      </div>
      <div key={idx} className={`relative rounded-3xl border-2 bg-card p-6 text-center shadow-sm animate-in fade-in slide-in-from-right-4 duration-300 ${urgent ? "border-secondary/60" : "border-border"}`}>
        {my?.correct && (
          <span className="pointer-events-none absolute right-4 top-3 font-display text-lg font-bold text-primary animate-in slide-in-from-bottom-3 fade-in duration-500">+{pointsFor(my.ms)}</span>
        )}
        {streak >= 2 && <span className="absolute left-4 top-3 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-bold text-secondary">🔥 x{streak}</span>}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{sendero.emoji} {sendero.gn}</p>
        <p className={`mt-3 font-display font-bold text-foreground ${round.prompt.length > 40 ? "text-xl" : "text-3xl"}`}>{showPrompt(round.prompt)}</p>
        {round.audio && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => void playGuarani(round.audio!)}><Volume2 className="mr-1 h-4 w-4" /> {tt("nrListen")}</Button>
        )}
      </div>
      <div className="grid gap-3">
        {round.options.map((o, i) => {
          const isRight = i === round.answer;
          const chosen = my?.pick === i;
          const rivalChose = revealing && theirs?.pick === i;
          const cls = revealing
            ? isRight ? "border-primary bg-primary/15 text-foreground" : chosen ? "border-destructive bg-destructive/10" : "opacity-50"
            : chosen ? "border-primary bg-primary/10" : "hover:border-primary/50";
          return (
            <button key={i} type="button" onClick={() => pick(i)} disabled={Boolean(my) || revealing}
              className={`relative min-h-14 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-semibold transition active:scale-[0.98] ${cls}`}>
              {o}
              {rivalChose && <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">{names[1]}</span>}
            </button>
          );
        })}
      </div>
      {revealing && round.tip && (
        <p className="rounded-xl bg-accent/40 p-3 text-center text-sm text-foreground animate-in fade-in">💡 {showTip(round.tip)}</p>
      )}
      {!revealing && my && <p className="text-center text-sm text-muted-foreground">{remote && !theirs ? tt("nrWaitFor", { n: names[1] }) : my.correct ? tt("nrGood") : tt("nrOops")}</p>}
      {remote && onReact && (
        <div className="flex justify-center gap-2 pt-1">
          {REACTIONS.map((e) => (
            <button key={e} type="button" aria-label={tt("nrReact", { e })} onClick={() => onReact(e)} className="h-10 w-10 rounded-full bg-muted text-xl transition active:scale-90">{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ name, score, correct, highlight }: { name: string; score: number; correct: number; highlight: boolean }) {
  const tt = useJU();
  return (
    <div className={`rounded-2xl border-2 p-4 ${highlight ? "border-primary bg-primary/10" : "border-border"}`}>
      <p className="font-semibold">{name}</p>
      <p className="font-display text-3xl font-bold text-primary">{score}</p>
      <p className="text-xs text-muted-foreground">{tt("nrHits", { c: correct, n: ROUNDS })}</p>
    </div>
  );
}
