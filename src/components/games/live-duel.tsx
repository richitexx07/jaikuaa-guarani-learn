import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, MessageCircle, RotateCcw, Users, Volume2, Wifi, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useGameFeedback } from "@/components/games/game-kit";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import { nuevoCodigoSala, useSala } from "@/lib/use-sala";

/**
 * Duelo en vivo a distancia: cada uno en su celular, la misma pregunta aparece en los dos y gana
 * el punto el que responde bien primero. El anfitrión arma las preguntas y decide cada punto según
 * el tiempo de reacción medido en cada celular (así no gana el que tiene mejor señal).
 */

export type LiveRound = { prompt: string; pre?: string; sub?: string; options: string[]; answer: number; audio?: string };

export type LiveTheme = { mine: string; rival: string; ink: string; accent: string };

const EVENTS = ["start", "claim", "wrong", "point", "rematch"] as const;
const LOCK_MS = 1000;
const NEXT_MS = 1500;
const ROUND_MS = 15000;
const DECIDE_MS = 350;
const COUNTDOWN_MS = 3000;

type Role = "host" | "guest";
type Winner = Role | "none";

/** Botón para arrancar un duelo a distancia: crea la sala o entra con un código. */
export function LiveDuelStart({ theme, onStart }: { theme: LiveTheme; onStart: (code: string, host: boolean) => void }) {
  const [join, setJoin] = useState("");
  return (
    <div className="mt-3 rounded-2xl p-3 ring-1 ring-black/10" style={{ background: "rgba(0,0,0,.03)" }}>
      <button
        type="button"
        onClick={() => onStart(nuevoCodigoSala(), true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
        style={{ background: theme.mine }}
      >
        <Wifi className="h-5 w-5" aria-hidden /> Jugar a distancia
      </button>
      <p className="mt-1.5 text-center text-xs opacity-70">Cada uno en su celular. Le mandás la invitación por WhatsApp.</p>
      <div className="mt-2 flex gap-2">
        <Input
          value={join}
          onChange={(e) => setJoin(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
          placeholder="¿Tenés un código?"
          aria-label="Código de sala"
          className={`h-11 text-center ${join ? "font-display text-lg tracking-[0.3em]" : "text-sm"}`}
        />
        <button
          type="button"
          disabled={join.length !== 4}
          onClick={() => onStart(join, false)}
          className="h-11 shrink-0 rounded-xl px-4 text-sm font-bold ring-1 ring-black/20 disabled:opacity-40"
        >
          Unirme
        </button>
      </div>
    </div>
  );
}

export function LiveDuel({
  ns,
  code,
  host,
  path,
  title,
  target,
  theme,
  xpRef,
  buildRounds,
  onExit,
  oneChance = false,
}: {
  ns: string;
  code: string;
  host: boolean;
  path: string;
  title: string;
  target: number;
  theme: LiveTheme;
  xpRef: string;
  buildRounds: () => LiveRound[];
  onExit: () => void;
  /** Una sola chance por pregunta (si fallás, quedás afuera de esa ronda). */
  oneChance?: boolean;
}) {
  const feedback = useGameFeedback();
  const [rounds, setRounds] = useState<LiveRound[] | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState({ me: 0, rival: 0 });
  const [winner, setWinner] = useState<"me" | "rival" | "none" | null>(null);
  const [locked, setLocked] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [rivalFailed, setRivalFailed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const recorded = useRef(false);

  const idxRef = useRef(0);
  const scoreRef = useRef({ me: 0, rival: 0 });
  const roundsRef = useRef<LiveRound[] | null>(null);
  const shownAt = useRef(0);
  const claims = useRef(new Map<number, Partial<Record<Role, number>>>());
  const resolved = useRef(new Set<number>());
  const decideTimer = useRef<number | null>(null);
  const roundTimer = useRef<number | null>(null);
  const nextTimer = useRef<number | null>(null);
  const roleRef = useRef<Role>(host ? "host" : "guest");
  const fails = useRef(new Map<number, Set<Role>>());

  // eslint-disable-next-line prefer-const
  let sala: ReturnType<typeof useSala>;

  const finished = score.me >= target || score.rival >= target || (rounds !== null && idx >= rounds.length);
  const finishedRef = useRef(false);
  finishedRef.current = finished;

  const resetMatch = useCallback((rs: LiveRound[], at: number) => {
    for (const t of [decideTimer, roundTimer, nextTimer]) {
      if (t.current) window.clearTimeout(t.current);
      t.current = null;
    }
    claims.current = new Map();
    resolved.current = new Set();
    fails.current = new Map();
    roundsRef.current = rs;
    idxRef.current = 0;
    scoreRef.current = { me: 0, rival: 0 };
    recorded.current = false;
    setRounds(rs);
    setStartAt(at);
    setIdx(0);
    setScore({ me: 0, rival: 0 });
    setWinner(null);
    setLocked(false);
    setWrong(null);
    setRivalFailed(false);
  }, []);

  const applyPoint = useCallback((i: number, w: Winner) => {
    if (i !== idxRef.current) return;
    const mine = w === roleRef.current;
    const theirs = w !== "none" && !mine;
    const next = { me: scoreRef.current.me + (mine ? 1 : 0), rival: scoreRef.current.rival + (theirs ? 1 : 0) };
    scoreRef.current = next;
    setScore(next);
    setWinner(mine ? "me" : theirs ? "rival" : "none");
    if (mine) feedback("success");
    else if (theirs) feedback("error");
    if (roundTimer.current) window.clearTimeout(roundTimer.current);
    if (next.me >= target || next.rival >= target) return;
    nextTimer.current = window.setTimeout(() => {
      idxRef.current = i + 1;
      setIdx(i + 1);
      setWinner(null);
      setLocked(false);
      setWrong(null);
      setRivalFailed(false);
    }, NEXT_MS);
  }, [feedback, target]);

  // Solo el anfitrión decide: gana el tiempo de reacción más corto.
  const decide = useCallback((i: number) => {
    if (resolved.current.has(i)) return;
    resolved.current.add(i);
    if (decideTimer.current) window.clearTimeout(decideTimer.current);
    decideTimer.current = null;
    const c = claims.current.get(i) ?? {};
    const w: Winner =
      c.host === undefined && c.guest === undefined ? "none" : c.guest === undefined ? "host" : c.host === undefined ? "guest" : c.host <= c.guest ? "host" : "guest";
    sala.send("point", { i, w });
    applyPoint(i, w);
  }, [applyPoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const claim = useCallback((role: Role, i: number, rt: number) => {
    if (resolved.current.has(i) || i !== idxRef.current) return;
    const c = claims.current.get(i) ?? {};
    if (c[role] !== undefined) return;
    c[role] = rt;
    claims.current.set(i, c);
    if (c.host !== undefined && c.guest !== undefined) decide(i);
    else if (!decideTimer.current) decideTimer.current = window.setTimeout(() => { decideTimer.current = null; decide(i); }, DECIDE_MS);
  }, [decide]);

  // Con una sola chance: si los dos fallaron, nadie gana la ronda.
  const fail = useCallback((role: Role, i: number) => {
    if (!oneChance) return;
    const f = fails.current.get(i) ?? new Set<Role>();
    f.add(role);
    fails.current.set(i, f);
    if (f.size === 2) decide(i);
  }, [oneChance, decide]);

  const startMatch = useCallback(() => {
    const rs = buildRounds();
    const delay = COUNTDOWN_MS;
    sala.send("start", { rounds: rs, delay });
    resetMatch(rs, Date.now() + delay);
  }, [buildRounds, resetMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  sala = useSala({
    ns,
    code,
    host,
    events: EVENTS,
    onEvent: (e, p) => {
      if (e === "start" && Array.isArray(p.rounds)) resetMatch(p.rounds as LiveRound[], Date.now() + Number(p.delay ?? COUNTDOWN_MS));
      else if (e === "claim" && sala.hostRef.current) claim("guest", Number(p.i), Number(p.rt));
      else if (e === "point" && !sala.hostRef.current) applyPoint(Number(p.i), p.w as Winner);
      else if (e === "wrong" && Number(p.i) === idxRef.current) {
        setRivalFailed(true);
        if (sala.hostRef.current) fail("guest", Number(p.i));
      }
      else if (e === "rematch" && sala.hostRef.current) startMatch();
    },
  });
  roleRef.current = sala.isHost ? "host" : "guest";

  // El anfitrión arranca apenas entra el rival.
  useEffect(() => {
    if (sala.rivalName && sala.isHost && !rounds) {
      const t = window.setTimeout(startMatch, 700);
      return () => window.clearTimeout(t);
    }
  }, [sala.rivalName, sala.isHost, rounds, startMatch]);

  // Cuenta regresiva y reloj de cada ronda.
  const counting = rounds !== null && now < startAt;
  useEffect(() => {
    if (!rounds || finished) return;
    const t = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(t);
  }, [rounds, finished]);

  const round = rounds?.[idx];
  const visible = !!round && !counting && !finished;

  // Cuando aparece una ronda: marca el tiempo, suena el audio y (anfitrión) pone el límite.
  useEffect(() => {
    if (!visible || !round) return;
    shownAt.current = performance.now();
    if (round.audio) void playGuarani(round.audio);
    if (sala.hostRef.current) {
      if (roundTimer.current) window.clearTimeout(roundTimer.current);
      const i = idx;
      roundTimer.current = window.setTimeout(() => decide(i), ROUND_MS);
    }
  }, [visible, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    for (const t of [decideTimer, roundTimer, nextTimer]) if (t.current) window.clearTimeout(t.current);
  }, []);

  // XP al terminar.
  useEffect(() => {
    if (!finished || !rounds || recorded.current) return;
    recorded.current = true;
    const won = score.me > score.rival;
    feedback(won ? "victory" : "error");
    const xp = Math.min(20, score.me * 3 + (won ? 5 : 0));
    if (xp > 0) recordCompletion({ source: "game", sourceRef: xpRef, xp });
  }, [finished, rounds, score, feedback, xpRef]);

  function pick(o: number) {
    if (!round || !visible || winner !== null || locked) return;
    if (o === round.answer) {
      const rt = Math.round(performance.now() - shownAt.current);
      if (sala.hostRef.current) claim("host", idx, rt);
      else sala.send("claim", { i: idx, rt });
      setLocked(true);
    } else {
      feedback("error");
      setWrong(o);
      setLocked(true);
      sala.send("wrong", { i: idx });
      if (oneChance) {
        if (sala.hostRef.current) fail("host", idx);
      } else window.setTimeout(() => { setLocked(false); setWrong(null); }, LOCK_MS);
    }
  }

  const myName = sala.me?.name ?? "Vos";
  const rivalName = sala.rivalName;
  const link = typeof window !== "undefined" ? `${window.location.origin}${path}?sala=${code}` : "";
  const invite = `¡Te desafío a un ${title} en Jaikuaa! Cada uno en su celular, gana el más rápido.\nCódigo de sala: ${code}\nTocá acá para jugar:\n${link}`;

  // Sala de espera.
  if (!rounds) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="rounded-3xl bg-white p-5 shadow-2xl" style={{ color: theme.ink }}>
          <div className="flex items-center justify-center gap-4">
            <Avatar name={myName} color={theme.mine} />
            <p className="font-display text-3xl font-black" style={{ color: theme.accent }}>VS</p>
            <Avatar name={rivalName ?? "?"} color={rivalName ? theme.rival : "#B8BFCC"} dashed={!rivalName} />
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold">
            {rivalName ? <><Users className="h-4 w-4" aria-hidden /> ¡{rivalName} entró! Arrancamos…</> : <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Esperando a tu amigo</>}
          </p>
          <p className="mt-2 text-xs opacity-70">
            Sala <span className="font-display text-lg font-bold tracking-[0.3em]">{code}</span>
          </p>
          {!rivalName && sala.isHost && (
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(invite)}`} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1FA855] font-bold text-white">
                <MessageCircle className="h-5 w-5" aria-hidden /> Invitar por WhatsApp
              </a>
              <button type="button" aria-label="Copiar enlace" className="grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/15" onClick={() => { void navigator.clipboard?.writeText(link); toast.success("Enlace copiado"); }}>
                <Copy className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}
          {!rivalName && !sala.isHost && <p className="mt-3 text-sm opacity-75">Cuando tu amigo esté en la sala, arranca solo.</p>}
        </div>
        <button type="button" onClick={onExit} className="h-11 rounded-2xl px-6 text-sm font-semibold ring-1 ring-white/40">Cancelar</button>
      </div>
    );
  }

  if (finished) {
    const won = score.me > score.rival;
    const tie = score.me === score.rival;
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-3xl p-6 text-center text-white shadow-2xl ring-4 ring-white" style={{ background: tie ? theme.ink : won ? theme.mine : theme.rival }}>
        <p className="font-display text-3xl font-bold">{tie ? "¡Empate!" : won ? "¡Ganaste el duelo!" : `¡Ganó ${rivalName ?? "tu rival"}!`}</p>
        <p className="font-display text-6xl font-bold tabular-nums">{score.me} — {score.rival}</p>
        <p className="text-sm opacity-85">{myName} contra {rivalName ?? "tu rival"}</p>
        {!rivalName && <p className="text-sm font-semibold">Tu rival salió de la sala.</p>}
        <div className="flex flex-wrap justify-center gap-2">
          {rivalName && (
            <button type="button" onClick={() => (sala.isHost ? startMatch() : sala.send("rematch"))} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 font-bold" style={{ color: theme.ink }}>
              <RotateCcw className="h-5 w-5" aria-hidden /> Revancha
            </button>
          )}
          <button type="button" onClick={onExit} className="h-12 rounded-2xl px-5 font-semibold ring-1 ring-white/50">Salir</button>
        </div>
      </div>
    );
  }

  const secs = Math.max(0, Math.ceil((startAt - now) / 1000));
  return (
    <div className="mx-auto max-w-md space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg" style={{ color: theme.ink }}>
        <button type="button" onClick={onExit} aria-label="Salir del duelo" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-black/5"><X className="h-5 w-5" /></button>
        <ScoreSide name={myName} n={score.me} color={theme.mine} />
        <span className="text-xs font-bold opacity-50">a {target}</span>
        <ScoreSide name={rivalName ?? "Rival"} n={score.rival} color={theme.rival} right />
      </div>
      {!rivalName && <p className="rounded-xl bg-black/30 p-2 text-center text-sm text-white">Tu rival se desconectó. Esperando que vuelva…</p>}

      {counting ? (
        <div className="grid place-items-center rounded-3xl bg-white/10 py-16 text-white">
          <p className="text-sm font-semibold opacity-80">¡Prepárense!</p>
          <p key={secs} className="font-display text-8xl font-bold">{secs || "¡Ya!"}</p>
        </div>
      ) : round ? (
        <section className="rounded-3xl p-5 text-white shadow-2xl" style={{ background: winner === "rival" ? theme.rival : theme.mine }} aria-live="polite">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Ronda {idx + 1}</span>
            <span className="rounded-full bg-black/20 px-3 py-0.5">
              {winner === "me" ? "¡Punto tuyo!" : winner === "rival" ? `Punto de ${rivalName ?? "tu rival"}` : winner === "none" ? "Nadie acertó" : locked && wrong === null ? "Esperando…" : wrong !== null ? (oneChance ? "Fallaste, esperá…" : "Bloqueado…") : rivalFailed ? `${rivalName ?? "Tu rival"} falló` : "¡Rápido!"}
            </span>
          </div>
          {round.pre && <p lang="gn" className="mt-3 text-center font-display text-lg font-bold leading-snug">{round.pre}</p>}
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className={`text-center font-display font-bold leading-tight ${round.pre ? "text-base font-medium opacity-90" : round.prompt.length > 40 ? "text-xl" : "text-4xl"}`}>{round.prompt}</p>
            {round.audio && (
              <button type="button" aria-label="Escuchar otra vez" onClick={() => void playGuarani(round.audio!)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20"><Volume2 className="h-5 w-5" /></button>
            )}
          </div>
          {round.sub && <p className="mt-1 text-center text-sm opacity-80">{round.sub}</p>}
          <div className="mt-4 grid gap-2">
            {round.options.map((o, k) => {
              const correct = winner !== null && k === round.answer;
              const isWrong = wrong === k;
              return (
                <button
                  key={k}
                  type="button"
                  disabled={locked || winner !== null}
                  onPointerDown={(e) => { e.preventDefault(); pick(k); }}
                  className="min-h-12 whitespace-normal break-words rounded-2xl px-3 py-2 text-lg font-bold transition active:scale-[.98]"
                  style={{
                    background: correct ? "#fff" : isWrong ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.16)",
                    color: correct ? "#2F7A4A" : "#fff",
                    boxShadow: correct ? `0 0 0 3px ${theme.accent}` : "inset 0 0 0 2px rgba(255,255,255,.35)",
                    opacity: (locked || winner !== null) && !correct && !isWrong ? 0.6 : 1,
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Avatar({ name, color, dashed }: { name: string; color: string; dashed?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`grid h-16 w-16 place-items-center rounded-full font-display text-2xl font-bold text-white ${dashed ? "border-4 border-dashed border-[#B8BFCC] motion-safe:animate-pulse" : ""}`} style={{ background: dashed ? "transparent" : color, color: dashed ? "#8A94A6" : "#fff" }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <p className="mt-1 max-w-[6rem] truncate text-sm font-semibold">{dashed ? "Tu amigo" : name}</p>
    </div>
  );
}

function ScoreSide({ name, n, color, right }: { name: string; n: number; color: string; right?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${right ? "flex-row-reverse text-right" : ""}`}>
      <span key={n} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-2xl font-bold text-white" style={{ background: color }}>{n}</span>
      <span className="truncate text-sm font-semibold">{name}</span>
    </div>
  );
}
