import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Loader2, MessageCircle, RotateCcw, Users, Volume2, WifiOff, Wifi, X } from "lucide-react";
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
 *
 * Qué pasa si alguien se va (para que el juego nunca siga como si nada):
 * - Si el rival toca Salir o cierra el juego: el duelo termina y ganás por abandono.
 * - Si el rival cambia de app, apaga la pantalla o pierde la señal: el duelo se PAUSA y se lo
 *   espera 30 segundos. Si vuelve, siguen desde la misma pregunta y con el mismo marcador.
 *   Si no vuelve, ganás por abandono.
 * - Si el que pierde la señal sos vos: se pausa y se intenta reconectar; si no vuelve, el duelo
 *   queda sin terminar.
 * - Si entra una tercera persona con el mismo enlace: ve «Sala llena» y no juega.
 */

export type LiveRound = { prompt: string; pre?: string; sub?: string; options: string[]; answer: number; audio?: string };

export type LiveTheme = { mine: string; rival: string; ink: string; accent: string };

const EVENTS = ["start", "claim", "wrong", "point", "rematch", "hello", "sync", "ended", "llena"] as const;
const LOCK_MS = 1000;
const NEXT_MS = 1500;
const ROUND_MS = 15000;
const DECIDE_MS = 350;
const COUNTDOWN_MS = 3000;
const RESUME_MS = 3000;
/** Cuánto se espera a un rival que se fue de la app o perdió la señal. */
export const GRACE_RIVAL_MS = 30000;
/** Cuánto se intenta reconectar cuando el que perdió la señal soy yo. */
export const GRACE_ME_MS = 45000;

type Role = "host" | "guest";
type Winner = Role | "none";
type Match = { rounds: LiveRound[]; hostUid: string; guestUid: string };
type Score = { host: number; guest: number };
type End = null | "abandono" | "sin-conexion" | "tarde";

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

/** Quién gana una ronda: el tiempo de reacción más corto entre los que acertaron. */
export function ganadorRonda(c: Partial<Record<Role, number>>): Winner {
  if (c.host === undefined && c.guest === undefined) return "none";
  if (c.guest === undefined) return "host";
  if (c.host === undefined) return "guest";
  return c.host <= c.guest ? "host" : "guest";
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
  const [match, setMatch] = useState<Match | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [resumed, setResumed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<Score>({ host: 0, guest: 0 });
  const [winner, setWinner] = useState<Winner | null>(null);
  const [locked, setLocked] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [rivalFailed, setRivalFailed] = useState(false);
  const [end, setEnd] = useState<End>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [llena, setLlena] = useState(false);
  const [now, setNow] = useState(Date.now());

  const matchRef = useRef<Match | null>(null);
  const idxRef = useRef(0);
  const scoreRef = useRef<Score>({ host: 0, guest: 0 });
  const shownAt = useRef(0);
  const claims = useRef(new Map<number, Partial<Record<Role, number>>>());
  const resolved = useRef(new Set<number>());
  const fails = useRef(new Map<number, Set<Role>>());
  const decideTimer = useRef<number | null>(null);
  const roundTimer = useRef<number | null>(null);
  const nextTimer = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const recorded = useRef(false);
  const meUid = useRef<string | null>(null);
  const endRef = useRef<End>(null);
  // ¿Estoy mirando el juego? (si cambié de app, mi lado también se pausa)
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const clearTimers = () => {
    for (const t of [decideTimer, roundTimer, nextTimer]) {
      if (t.current) window.clearTimeout(t.current);
      t.current = null;
    }
  };

  const rivalUidOf = (m: Match | null) => (m && meUid.current ? (m.hostUid === meUid.current ? m.guestUid : m.hostUid) : null);
  const roleOf = (m: Match | null): Role | "fuera" | null =>
    !m || !meUid.current ? null : m.hostUid === meUid.current ? "host" : m.guestUid === meUid.current ? "guest" : "fuera";

  // `sala` se usa dentro de funciones que se llaman después de crearla.
  const salaRef = useRef<ReturnType<typeof useSala> | null>(null);
  const send = (e: string, p: Record<string, unknown> = {}) => salaRef.current?.send(e, p);

  /** Pone el duelo en un estado dado (al arrancar, al volver alguien o al reconectar). */
  const applyState = useCallback((m: Match, i: number, sc: Score, delay: number, isResume: boolean) => {
    clearTimers();
    claims.current = new Map();
    fails.current = new Map();
    resolved.current = new Set(Array.from({ length: i }, (_, k) => k));
    matchRef.current = m;
    idxRef.current = i;
    scoreRef.current = sc;
    if (!isResume) recorded.current = false;
    setMatch(m);
    setIdx(i);
    setScore(sc);
    setStartAt(Date.now() + delay);
    setResumed(isResume);
    setWinner(null);
    setLocked(false);
    setWrong(null);
    setRivalFailed(false);
    setEnd(null);
  }, []);

  const applyPoint = useCallback((i: number, w: Winner) => {
    if (i !== idxRef.current || pausedRef.current) return;
    resolved.current.add(i);
    const next: Score = { host: scoreRef.current.host + (w === "host" ? 1 : 0), guest: scoreRef.current.guest + (w === "guest" ? 1 : 0) };
    scoreRef.current = next;
    setScore(next);
    setWinner(w);
    const mine = roleOf(matchRef.current);
    if (w === mine) feedback("success");
    else if (w !== "none") feedback("error");
    if (roundTimer.current) window.clearTimeout(roundTimer.current);
    roundTimer.current = null;
    if (next.host >= target || next.guest >= target) return;
    nextTimer.current = window.setTimeout(() => {
      nextTimer.current = null;
      idxRef.current = i + 1;
      setIdx(i + 1);
      setWinner(null);
      setLocked(false);
      setWrong(null);
      setRivalFailed(false);
    }, NEXT_MS);
  }, [feedback, target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Solo el anfitrión decide cada punto.
  const decide = useCallback((i: number) => {
    if (resolved.current.has(i) || pausedRef.current) return;
    if (decideTimer.current) window.clearTimeout(decideTimer.current);
    decideTimer.current = null;
    const w = ganadorRonda(claims.current.get(i) ?? {});
    send("point", { i, w });
    applyPoint(i, w);
  }, [applyPoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const claim = useCallback((role: Role, i: number, rt: number) => {
    if (resolved.current.has(i) || i !== idxRef.current || pausedRef.current || !Number.isFinite(rt)) return;
    const c = claims.current.get(i) ?? {};
    if (c[role] !== undefined) return;
    c[role] = Math.max(0, rt);
    claims.current.set(i, c);
    if (c.host !== undefined && c.guest !== undefined) decide(i);
    else if (!decideTimer.current) decideTimer.current = window.setTimeout(() => { decideTimer.current = null; decide(i); }, DECIDE_MS);
  }, [decide]);

  // Con una sola chance: si los dos fallaron, nadie gana la ronda.
  const fail = useCallback((role: Role, i: number) => {
    if (!oneChance || resolved.current.has(i)) return;
    const f = fails.current.get(i) ?? new Set<Role>();
    f.add(role);
    fails.current.set(i, f);
    if (f.size === 2) decide(i);
  }, [oneChance, decide]);

  const startMatch = useCallback(() => {
    const s = salaRef.current;
    if (!s?.me || !s.rival.uid) return;
    const m: Match = { rounds: buildRounds(), hostUid: s.me.uid, guestUid: s.rival.uid };
    send("start", { ...m, delay: COUNTDOWN_MS });
    applyState(m, 0, { host: 0, guest: 0 }, COUNTDOWN_MS, false);
  }, [buildRounds, applyState]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Manda el estado completo al otro celular (para retomar después de una pausa). */
  const sendSync = useCallback(() => {
    const m = matchRef.current;
    if (!m) return;
    // Si la ronda actual ya tenía ganador, se sigue con la próxima.
    const i = resolved.current.has(idxRef.current) ? idxRef.current + 1 : idxRef.current;
    send("sync", { ...m, i, score: scoreRef.current, delay: RESUME_MS });
    applyState(m, i, scoreRef.current, RESUME_MS, true);
  }, [applyState]); // eslint-disable-line react-hooks/exhaustive-deps

  const sala = useSala({
    ns,
    code,
    host,
    events: EVENTS,
    rivalUid: rivalUidOf(match),
    onEvent: (e, p, from) => {
      const m = matchRef.current;
      const role = roleOf(m);
      const isMatch = (x: Record<string, unknown>) => Array.isArray(x.rounds) && typeof x.hostUid === "string" && typeof x.guestUid === "string";
      if ((e === "start" || e === "sync") && isMatch(p)) {
        const nm: Match = { rounds: p.rounds as LiveRound[], hostUid: p.hostUid as string, guestUid: p.guestUid as string };
        if (e === "start") applyState(nm, 0, { host: 0, guest: 0 }, Number(p.delay ?? COUNTDOWN_MS), false);
        else {
          const sc = (p.score ?? { host: 0, guest: 0 }) as Score;
          applyState(nm, Number(p.i ?? 0), { host: Number(sc.host) || 0, guest: Number(sc.guest) || 0 }, Number(p.delay ?? RESUME_MS), true);
        }
      } else if (e === "claim" && role === "host") claim("guest", Number(p.i), Number(p.rt));
      else if (e === "point" && role === "guest") applyPoint(Number(p.i), p.w as Winner);
      else if (e === "wrong" && Number(p.i) === idxRef.current) {
        setRivalFailed(true);
        if (role === "host") fail("guest", Number(p.i));
      } else if (e === "rematch" && role === "host") startMatch();
      // Alguien volvió (o recargó la página) y pide el estado: se lo mandamos, o le avisamos que ya terminó.
      else if (e === "hello" && m && from && (from === m.hostUid || from === m.guestUid)) {
        if (endRef.current) send("ended");
        else sendSync();
      }
      // Entró una tercera persona: se le avisa que la sala ya tiene dos jugadores.
      else if (e === "hello" && m && from && role === "host") send("llena", { hostUid: m.hostUid, guestUid: m.guestUid });
      else if (e === "llena" && !m && meUid.current && p.hostUid !== meUid.current && p.guestUid !== meUid.current) setLlena(true); else if (e === "ended" && m && !endRef.current) {
        clearTimers();
        setEnd("tarde");
      }
    },
  });
  salaRef.current = sala;
  meUid.current = sala.me?.uid ?? null;

  endRef.current = end;
  const role = roleOf(match);
  // Se recuerda el nombre del rival aunque se haya desconectado.
  const lastRivalName = useRef<string | null>(null);
  if (sala.rival.name) lastRivalName.current = sala.rival.name;
  const rivalName = sala.rival.name ?? lastRivalName.current ?? (match ? "tu rival" : null);
  const finished = !!end || (!!match && (score.host >= target || score.guest >= target || idx >= match.rounds.length));
  const inMatch = !!match && !finished && role !== "fuera";

  // Pausa: el rival no está (cambió de app, perdió señal) o el que no tiene conexión soy yo.
  const pauseReason: null | "rival" | "yo" = !inMatch ? null : sala.conn !== "online" || hidden ? "yo" : !sala.rival.present || sala.rival.away ? "rival" : null;
  const paused = pauseReason !== null;
  pausedRef.current = paused;
  const [pauseSince, setPauseSince] = useState<number | null>(null);
  const wasPaused = useRef(false);

  useEffect(() => {
    if (paused && !wasPaused.current) {
      wasPaused.current = true;
      setPauseSince(Date.now());
      clearTimers();
      setLocked(false);
      setWrong(null);
    } else if (!paused && wasPaused.current) {
      wasPaused.current = false;
      setPauseSince(null);
      // Si la pausa terminó porque el duelo terminó (abandono), no se retoma nada.
      if (end || !inMatch) return;
      // Volvieron los dos: el anfitrión retoma desde donde quedó; el invitado le pide el estado.
      if (role === "host") sendSync();
      else send("hello");
    }
  }, [paused, role, sendSync, end, inMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si el rival tocó Salir o cerró el juego: termina el duelo por abandono.
  useEffect(() => {
    if (inMatch && sala.rival.bye) {
      clearTimers();
      setEnd("abandono");
    }
  }, [inMatch, sala.rival.bye]);

  // Se acabó la espera.
  useEffect(() => {
    if (!paused || pauseSince === null) return;
    const limit = pauseReason === "yo" ? GRACE_ME_MS : GRACE_RIVAL_MS;
    const t = window.setTimeout(() => {
      clearTimers();
      setEnd(pauseReason === "yo" ? "sin-conexion" : "abandono");
    }, Math.max(0, pauseSince + limit - Date.now()));
    return () => window.clearTimeout(t);
  }, [paused, pauseSince, pauseReason]);

  // Pido el estado si entré (o volví) sin él y ya hay alguien en la sala.
  const helloSent = useRef<string | null>(null);
  useEffect(() => {
    if (match || !sala.rival.present || sala.conn !== "online" || !sala.rival.uid) return;
    if (helloSent.current === sala.rival.uid) return;
    helloSent.current = sala.rival.uid;
    send("hello");
  }, [match, sala.rival.present, sala.rival.uid, sala.conn]); // eslint-disable-line react-hooks/exhaustive-deps

  // El anfitrión arranca cuando entra el rival (si nadie tenía un duelo en curso).
  useEffect(() => {
    if (sala.rival.present && sala.isHost && !match && sala.conn === "online") {
      const t = window.setTimeout(startMatch, 1200);
      return () => window.clearTimeout(t);
    }
  }, [sala.rival.present, sala.isHost, match, sala.conn, startMatch]);

  // Reloj (cuenta regresiva, ronda y espera).
  useEffect(() => {
    if (!match || (finished && !paused)) return;
    const t = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(t);
  }, [match, finished, paused]);

  const counting = !!match && now < startAt;
  const round = match?.rounds[idx];
  const visible = !!round && inMatch && !counting && !paused;

  // Cuando aparece una ronda: marca el tiempo, suena el audio y (anfitrión) pone el límite.
  useEffect(() => {
    if (!visible || !round) return;
    shownAt.current = performance.now();
    if (round.audio) void playGuarani(round.audio);
    if (role === "host") {
      if (roundTimer.current) window.clearTimeout(roundTimer.current);
      const i = idx;
      roundTimer.current = window.setTimeout(() => decide(i), ROUND_MS);
    }
  }, [visible, idx, startAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimers(), []);

  // XP al terminar.
  const my = role === "guest" ? score.guest : score.host;
  const their = role === "guest" ? score.host : score.guest;
  useEffect(() => {
    if (!finished || !match || role === "fuera" || recorded.current) return;
    recorded.current = true;
    const won = end === "abandono" || (!end && my > their);
    feedback(won ? "victory" : "error");
    // Por abandono se cuentan los puntos hechos, sin el premio de ganar.
    const xp = Math.min(20, my * 3 + (!end && my > their ? 5 : 0));
    if (xp > 0) recordCompletion({ source: "game", sourceRef: xpRef, xp });
  }, [finished, match, role, end, my, their, feedback, xpRef]);

  function pick(o: number) {
    if (!round || !visible || winner !== null || locked || (role !== "host" && role !== "guest")) return;
    if (o === round.answer) {
      const rt = Math.round(performance.now() - shownAt.current);
      if (role === "host") claim("host", idx, rt);
      else send("claim", { i: idx, rt });
      setLocked(true);
    } else {
      feedback("error");
      setWrong(o);
      setLocked(true);
      send("wrong", { i: idx });
      if (oneChance) {
        if (role === "host") fail("host", idx);
      } else window.setTimeout(() => { setLocked(false); setWrong(null); }, LOCK_MS);
    }
  }

  function salir() {
    sala.leave();
    onExit();
  }

  const myName = sala.me?.name ?? "Vos";
  const link = typeof window !== "undefined" ? `${window.location.origin}${path}?sala=${code}` : "";
  const invite = `¡Te desafío a un ${title} en Jaikuaa! Cada uno en su celular, gana el más rápido.\nCódigo de sala: ${code}\nTocá acá para jugar:\n${link}`;

  // Sala llena: entró una tercera persona.
  if (llena || (match && role === "fuera")) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl" style={{ color: theme.ink }}>
        <Users className="mx-auto h-10 w-10 opacity-60" aria-hidden />
        <p className="mt-2 font-display text-2xl font-bold">Esta sala ya está llena</p>
        <p className="mt-1 text-sm opacity-75">Ya hay dos personas jugando este duelo. Podés crear tu propia sala e invitar a alguien.</p>
        <button type="button" onClick={salir} className="mt-4 h-12 w-full rounded-2xl font-bold text-white" style={{ background: theme.mine }}>Volver</button>
      </div>
    );
  }

  // Sala de espera.
  if (!match) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="rounded-3xl bg-white p-5 shadow-2xl" style={{ color: theme.ink }}>
          <div className="flex items-center justify-center gap-4">
            <Avatar name={myName} color={theme.mine} />
            <p className="font-display text-3xl font-black" style={{ color: theme.accent }}>VS</p>
            <Avatar name={sala.rival.name ?? "?"} color={sala.rival.present ? theme.rival : "#B8BFCC"} dashed={!sala.rival.present} />
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold">
            {sala.conn === "offline" ? <><WifiOff className="h-4 w-4" aria-hidden /> Sin conexión. Revisá tu internet.</>
              : sala.rival.present ? <><Users className="h-4 w-4" aria-hidden /> ¡{sala.rival.name} entró! Arrancamos…</>
              : <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Esperando a tu amigo</>}
          </p>
          <p className="mt-2 text-xs opacity-70">
            Sala <span className="font-display text-lg font-bold tracking-[0.3em]">{code}</span>
          </p>
          {!sala.rival.present && sala.isHost && (
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(invite)}`} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1FA855] font-bold text-white">
                <MessageCircle className="h-5 w-5" aria-hidden /> Invitar por WhatsApp
              </a>
              <button type="button" aria-label="Copiar enlace" className="grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/15" onClick={() => { void navigator.clipboard?.writeText(link); toast.success("Enlace copiado"); }}>
                <Copy className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}
          {!sala.rival.present && !sala.isHost && <p className="mt-3 text-sm opacity-75">Cuando tu amigo esté en la sala, arranca solo.</p>}
        </div>
        <button type="button" onClick={salir} className="h-11 rounded-2xl px-6 text-sm font-semibold ring-1 ring-white/40">Cancelar</button>
      </div>
    );
  }

  if (finished) {
    const tie = !end && my === their;
    const won = end === "abandono" || (!end && my > their);
    const titulo =
      end === "abandono" ? "¡Ganaste por abandono!"
      : end === "sin-conexion" ? "Se cortó tu conexión"
      : end === "tarde" ? "El duelo terminó"
      : tie ? "¡Empate!" : won ? "¡Ganaste el duelo!" : `¡Ganó ${rivalName}!`;
    const bajada =
      end === "abandono" ? `${rivalName} salió del duelo y no volvió.`
      : end === "sin-conexion" ? "El duelo quedó sin terminar. Revisá tu internet y armá otra sala."
      : end === "tarde" ? `Estuviste afuera mucho tiempo y ${rivalName} ganó por abandono.`
      : `${myName} contra ${rivalName}`;
    const puedeRevancha = !end && sala.rival.present && !sala.rival.bye && sala.conn === "online";
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-3xl p-6 text-center text-white shadow-2xl ring-4 ring-white" style={{ background: end === "sin-conexion" || end === "tarde" || tie ? theme.ink : won ? theme.mine : theme.rival }}>
        <p className="font-display text-3xl font-bold">{titulo}</p>
        <p className="font-display text-6xl font-bold tabular-nums">{my} — {their}</p>
        <p className="text-sm opacity-85">{bajada}</p>
        {!end && !sala.rival.present && <p className="text-sm font-semibold">Tu rival salió de la sala.</p>}
        <div className="flex flex-wrap justify-center gap-2">
          {puedeRevancha && (
            <button type="button" onClick={() => (role === "host" ? startMatch() : send("rematch"))} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 font-bold" style={{ color: theme.ink }}>
              <RotateCcw className="h-5 w-5" aria-hidden /> Revancha
            </button>
          )}
          <button type="button" onClick={salir} className="h-12 rounded-2xl px-5 font-semibold ring-1 ring-white/50">Salir</button>
        </div>
      </div>
    );
  }

  const secs = Math.max(0, Math.ceil((startAt - now) / 1000));
  const waitLeft = pauseSince === null ? 0 : Math.max(0, Math.ceil((pauseSince + (pauseReason === "yo" ? GRACE_ME_MS : GRACE_RIVAL_MS) - now) / 1000));
  return (
    <div className="relative mx-auto max-w-md space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg" style={{ color: theme.ink }}>
        <button type="button" onClick={() => setConfirmExit(true)} aria-label="Salir del duelo" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-black/5"><X className="h-5 w-5" /></button>
        <ScoreSide name={myName} n={my} color={theme.mine} />
        <span className="text-xs font-bold opacity-50">a {target}</span>
        <ScoreSide name={rivalName ?? "Rival"} n={their} color={theme.rival} right />
      </div>

      {confirmExit && (
        <div className="rounded-2xl bg-white p-4 text-center shadow-xl" style={{ color: theme.ink }} role="alertdialog" aria-label="¿Salir del duelo?">
          <p className="font-display text-lg font-bold">¿Salir del duelo?</p>
          <p className="mt-1 text-sm opacity-75">Si salís ahora, el duelo termina y {rivalName} gana por abandono.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmExit(false)} className="h-11 rounded-xl font-bold text-white" style={{ background: theme.mine }}>Seguir jugando</button>
            <button type="button" onClick={salir} className="h-11 rounded-xl font-bold ring-1 ring-black/20">Salir</button>
          </div>
        </div>
      )}

      {paused ? (
        <div className="grid place-items-center rounded-3xl bg-white p-6 text-center shadow-2xl" style={{ color: theme.ink }} role="status" aria-live="polite">
          {pauseReason === "yo" ? <WifiOff className="h-10 w-10 opacity-70" aria-hidden /> : <Loader2 className="h-10 w-10 animate-spin opacity-70" aria-hidden />}
          <p className="mt-3 font-display text-2xl font-bold">Duelo en pausa</p>
          <p className="mt-1 text-sm opacity-80">
            {pauseReason === "yo"
              ? "Se cortó tu conexión. Estamos intentando reconectar…"
              : sala.rival.away
                ? `${rivalName} salió de la app. Lo esperamos para seguir.`
                : `${rivalName} perdió la conexión. Lo esperamos para seguir.`}
          </p>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums">{waitLeft}</p>
          <p className="text-xs opacity-60">segundos</p>
          <p className="mt-3 text-xs opacity-70">
            {pauseReason === "yo" ? "Si no vuelve la señal, el duelo queda sin terminar." : `Si no vuelve, ganás por abandono. El marcador queda ${my} a ${their}.`}
          </p>
        </div>
      ) : counting ? (
        <div className="grid place-items-center rounded-3xl bg-white/10 py-16 text-white">
          <p className="text-sm font-semibold opacity-80">{resumed ? `¡Seguimos! ${my} a ${their}` : "¡Prepárense!"}</p>
          <p key={secs} className="font-display text-8xl font-bold">{secs || "¡Ya!"}</p>
        </div>
      ) : round ? (
        <section className="rounded-3xl p-5 text-white shadow-2xl" style={{ background: winner !== null && winner !== "none" && winner !== role ? theme.rival : theme.mine }} aria-live="polite">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Ronda {idx + 1}</span>
            <span className="rounded-full bg-black/20 px-3 py-0.5">
              {winner !== null && winner === role ? "¡Punto tuyo!" : winner === "none" ? "Nadie acertó" : winner !== null ? `Punto de ${rivalName}` : locked && wrong === null ? "Esperando…" : wrong !== null ? (oneChance ? "Fallaste, esperá…" : "Bloqueado…") : rivalFailed ? `${rivalName} falló` : "¡Rápido!"}
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
