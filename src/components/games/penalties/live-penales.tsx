import { ElegirEstirada } from "./elegir-estirada";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Users, WifiOff, X } from "lucide-react";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { useGameFeedback } from "@/components/games/game-kit";
import { Compartir } from "@/components/games/reto";
import { PenaltyPitch } from "@/components/games/penalties/pitch";
import { duelFinished, isGoal, labels, xpFor, type Dive, type Outcome, type Point, type Shot } from "@/components/games/penalties/physics";
import { playGuarani } from "@/lib/audio";
import { recordCompletion } from "@/lib/gamification";
import { newSeed, orderedBy, shufflerFor } from "@/lib/reto";
import { useSala } from "@/lib/use-sala";
import { toast } from "sonner";
import type { GameWord } from "@/lib/games.functions";
import { kitSeguro, useMiKit, type Kit } from "@/components/games/penalties/camisetas";
import { guardarClasico, Hinchada, leerClasico, sumarClasico, textoCargada, type Clasico } from "@/components/games/penalties/hinchada";
import { MonedaJai, type Lado } from "@/components/games/penalties/moneda-jai";
import { BarraEmojis, EmojisFlotando, esEmoji, useReacciones, type Emoji } from "@/components/games/penalties/reacciones";

/**
 * Penales a distancia, cada uno en su celular. Se turnan: uno patea (responde la palabra y
 * patea al arco) y el otro ataja (elige en secreto hacia dónde se tira). Cinco penales cada uno
 * y, si empatan, muerte súbita.
 *
 * Igual que los duelos: si el otro sale de la app o pierde la señal, se pausa y se lo espera
 * 30 segundos; si toca Salir, ganás por abandono; una tercera persona ve «Sala llena».
 */

const P = { noche: "#071A33", led: "#FFB23E", gol: "#3BE38A", mal: "#FF5A4E", blanco: "#F4F7FB", host: "#2F6FDE", guest: "#D9452B" };
const EVENTS = ["start", "dive", "answer", "aim", "kick", "shot", "sync", "hello", "ended", "llena", "rematch", "kit", "emo", "lado"] as const;
const GRACE_RIVAL_MS = 30000;
const GRACE_ME_MS = 45000;
/** Segundos que tiene el arquero para elegir mientras el pateador responde. */
const TURNO_S = 10;
const NEXT_MS = 2600;

type Role = "host" | "guest";
type W = { gn: string; es: string; hasAudio: boolean };
type Match = { words: W[]; options: string[][]; hostUid: string; guestUid: string; primero?: Role };

/** Moneda: quien gana el sorteo patea primero y después se alterna, uno patea y el otro ataja. */
export function pateadorEn(primero: Role | undefined, t: number): Role {
  const p: Role = primero ?? "host";
  const otro: Role = p === "host" ? "guest" : "host";
  return t % 2 === 0 ? p : otro;
}
type Results = { host: Outcome[]; guest: Outcome[] };
type End = null | "abandono" | "sin-conexion" | "tarde";

/** Arma la tanda: palabras y opciones (las arma el anfitrión y las manda al otro celular). */
export function armarTanda(words: GameWord[], hostUid: string, guestUid: string): Match {
  const seed = newSeed();
  const pool = orderedBy(words, (w) => w.gn);
  const deck = shufflerFor(seed)(pool).slice(0, 16);
  const options = deck.map((w, i) => {
    const mezclar = shufflerFor(seed, i + 1);
    return mezclar([w.gn, ...mezclar(pool.filter((o) => o.gn !== w.gn)).slice(0, 2).map((o) => o.gn)]);
  });
  return { words: deck.map((w) => ({ gn: w.gn, es: w.es, hasAudio: w.hasAudio })), options, hostUid, guestUid, primero: Math.random() < 0.5 ? "host" : "guest" };
}

export function PenalesLive({ code, host, words, ledText, muted, onExit }: { code: string; host: boolean; words: GameWord[]; ledText: string; muted: boolean; onExit: () => void }) {
  const feedback = useGameFeedback();
  const hinchada = useRef(new Hinchada());
  hinchada.current.muted = muted;
  useEffect(() => () => hinchada.current.dispose(), []);
  const { flotan, mostrar } = useReacciones();
  const rivalNameRef = useRef("tu rival");
  const [match, setMatch] = useState<Match | null>(null);
  const [results, setResults] = useState<Results>({ host: [], guest: [] });
  const [dive, setDive] = useState<Dive | null>(null);
  const [myDive, setMyDive] = useState<Dive | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [rivalChoice, setRivalChoice] = useState<string | null>(null);
  // Lo que ve el arquero en vivo: hacia dónde apunta el otro y el tiro.
  const [watchAim, setWatchAim] = useState<{ aim: Point; phase: "aim" | "power" } | null>(null);
  const [watchShot, setWatchShot] = useState<Shot | null>(null);
  const kickRecibido = useRef(-1);
  // La camiseta de cada uno (la del otro llega por la sala).
  const [miKit] = useMiKit();
  const [rivalKit, setRivalKit] = useState<Kit | null>(null);
  const [last, setLast] = useState<Outcome | null>(null);
  const [moneda, setMoneda] = useState(false);
  const [lado, setLado] = useState<Lado | null>(null);
  const [end, setEnd] = useState<End>(null);
  const [llena, setLlena] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [verFinal, setVerFinal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const matchRef = useRef<Match | null>(null);
  const resultsRef = useRef<Results>({ host: [], guest: [] });
  const endRef = useRef<End>(null);
  const meUid = useRef<string | null>(null);
  const nextTimer = useRef<number | null>(null);
  const recorded = useRef(false);
  const lastRivalName = useRef<string | null>(null);
  endRef.current = end;

  useEffect(() => {
    const on = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const roleOf = (m: Match | null): Role | "fuera" | null => (!m || !meUid.current ? null : m.hostUid === meUid.current ? "host" : m.guestUid === meUid.current ? "guest" : "fuera");
  const salaRef = useRef<ReturnType<typeof useSala> | null>(null);
  const send = (e: string, p: Record<string, unknown> = {}) => salaRef.current?.send(e, p);

  /** Pone la tanda en un estado (al arrancar o al retomar después de una pausa). */
  const apply = useCallback((m: Match, r: Results, fresh: boolean) => {
    if (nextTimer.current) window.clearTimeout(nextTimer.current);
    nextTimer.current = null;
    matchRef.current = m;
    resultsRef.current = r;
    if (fresh) { recorded.current = false; setLado(null); setMoneda(true); }
    setMatch(m);
    setResults(r);
    setDive(null);
    setMyDive(null);
    setChoice(null);
    setRivalChoice(null);
    setWatchAim(null);
    setWatchShot(null);
    kickRecibido.current = -1;
    setLast(null);
    setEnd(null);
    setVerFinal(duelFinished(r.host, r.guest) || r.host.length + r.guest.length >= 16);
  }, []);

  const applyShot = useCallback((t: number, outcome: Outcome) => {
    const r = resultsRef.current;
    if (r.host.length + r.guest.length !== t) return; // ya contado
    const shooter: Role = pateadorEn(matchRef.current?.primero, t);
    const next: Results = { host: shooter === "host" ? [...r.host, outcome] : r.host, guest: shooter === "guest" ? [...r.guest, outcome] : r.guest };
    resultsRef.current = next;
    setResults(next);
    setLast(outcome);
    hinchada.current.reaccion(outcome);
    const mine = roleOf(matchRef.current);
    if (isGoal(outcome) === (shooter === mine)) feedback("success");
    else feedback("error");
    if (duelFinished(next.host, next.guest) || next.host.length + next.guest.length >= 16) {
      // Se ve el último penal y después el resultado final.
      nextTimer.current = window.setTimeout(() => { nextTimer.current = null; setVerFinal(true); }, NEXT_MS);
      return;
    }
    nextTimer.current = window.setTimeout(() => {
      nextTimer.current = null;
      setDive(null);
      setMyDive(null);
      setChoice(null);
      setRivalChoice(null);
      setWatchAim(null);
      setWatchShot(null);
      setLast(null);
    }, NEXT_MS);
  }, [feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const startMatch = useCallback(() => {
    const s = salaRef.current;
    if (!s?.me || !s.rival.uid) return;
    const m = armarTanda(words, s.me.uid, s.rival.uid);
    send("start", m);
    apply(m, { host: [], guest: [] }, true);
  }, [words, apply]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendSync = useCallback(() => {
    const m = matchRef.current;
    if (!m) return;
    send("sync", { ...m, results: resultsRef.current });
    apply(m, resultsRef.current, false);
  }, [apply]); // eslint-disable-line react-hooks/exhaustive-deps

  const sala = useSala({
    ns: "penales",
    code,
    host,
    events: EVENTS,
    rivalUid: match && meUid.current ? (match.hostUid === meUid.current ? match.guestUid : match.hostUid) : null,
    onEvent: (e, p, from) => {
      const m = matchRef.current;
      const role = roleOf(m);
      const isMatch = Array.isArray(p.words) && Array.isArray(p.options) && typeof p.hostUid === "string" && typeof p.guestUid === "string";
      const t = resultsRef.current.host.length + resultsRef.current.guest.length;
      if ((e === "start" || e === "sync") && isMatch) {
        const nm: Match = { words: p.words as W[], options: p.options as string[][], hostUid: p.hostUid as string, guestUid: p.guestUid as string, primero: p.primero === "guest" ? "guest" : "host" };
        const r = (p.results ?? { host: [], guest: [] }) as Results;
        apply(nm, e === "start" ? { host: [], guest: [] } : { host: r.host ?? [], guest: r.guest ?? [] }, e === "start");
      } else if (e === "dive" && Number(p.t) === t) setDive(p.dive as Dive);
      else if (e === "answer" && Number(p.t) === t) setRivalChoice(String(p.gn));
      else if (e === "aim" && Number(p.t) === t) setWatchAim({ aim: { x: Number(p.x), y: Number(p.y) }, phase: p.phase === "power" ? "power" : "aim" });
      else if (e === "kick" && Number(p.t) === t && p.shot) {
        kickRecibido.current = t;
        setWatchShot(p.shot as Shot);
      }
      // Si vi el tiro en vivo, el resultado lo pone mi propia animación al terminar.
      else if (e === "shot") {
        const tt = Number(p.t);
        if (kickRecibido.current !== tt) applyShot(tt, p.outcome as Outcome);
        // Por las dudas: si mi animación no termina (celular lento), igual se cuenta el penal.
        else window.setTimeout(() => applyShot(tt, p.outcome as Outcome), 3000);
      }
      else if (e === "lado" && (p.lado === "cara" || p.lado === "cruz")) setLado((x) => x ?? (p.lado as Lado));
      else if (e === "kit") setRivalKit(kitSeguro(p.kit));
      else if (e === "emo" && esEmoji(p.e)) mostrar(p.e, rivalNameRef.current, false);
      else if (e === "rematch" && role === "host") startMatch();
      else if (e === "hello" && m && from && (from === m.hostUid || from === m.guestUid)) {
        if (endRef.current) send("ended");
        else sendSync();
      } else if (e === "hello" && m && from && role === "host") send("llena", { hostUid: m.hostUid, guestUid: m.guestUid });
      else if (e === "llena" && !m && meUid.current && p.hostUid !== meUid.current && p.guestUid !== meUid.current) setLlena(true);
      else if (e === "ended" && m && !endRef.current) setEnd("tarde");
    },
  });
  salaRef.current = sala;
  const claveSala = match ? `${match.hostUid}|${match.guestUid}` : null;
  const kitPropio: Kit = { ...miKit, nombre: miKit.nombre.trim() || (sala.me?.name ?? "").trim().slice(0, 12) };
  const kitTxt = JSON.stringify(kitPropio);
  useEffect(() => {
    if (claveSala) send("kit", { kit: kitPropio });
  }, [claveSala, sala.rival.uid, kitTxt]); // eslint-disable-line react-hooks/exhaustive-deps
  meUid.current = sala.me?.uid ?? null;
  if (sala.rival.name) lastRivalName.current = sala.rival.name;

  const role = roleOf(match);
  const t = results.host.length + results.guest.length;
  const naturalEnd = duelFinished(results.host, results.guest) || t >= 16;
  const doneNow = !!end || (!!match && naturalEnd);
  const inMatch = !!match && !doneNow && role !== "fuera";
  const pauseReason: null | "rival" | "yo" = !inMatch ? null : sala.conn !== "online" || hidden ? "yo" : !sala.rival.present || sala.rival.away ? "rival" : null;
  const paused = pauseReason !== null;
  const [pauseSince, setPauseSince] = useState<number | null>(null);
  const wasPaused = useRef(false);

  useEffect(() => {
    if (paused && !wasPaused.current) {
      wasPaused.current = true;
      setPauseSince(Date.now());
    } else if (!paused && wasPaused.current) {
      wasPaused.current = false;
      setPauseSince(null);
      if (end || !inMatch) return;
      if (role === "host") sendSync();
      else send("hello");
    }
  }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (inMatch && sala.rival.bye) setEnd("abandono");
  }, [inMatch, sala.rival.bye]);

  useEffect(() => {
    if (!paused || pauseSince === null) return;
    const limit = pauseReason === "yo" ? GRACE_ME_MS : GRACE_RIVAL_MS;
    const tm = window.setTimeout(() => setEnd(pauseReason === "yo" ? "sin-conexion" : "abandono"), Math.max(0, pauseSince + limit - Date.now()));
    return () => window.clearTimeout(tm);
  }, [paused, pauseSince, pauseReason]);

  useEffect(() => {
    if (!paused) return;
    const tm = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(tm);
  }, [paused]);

  const helloSent = useRef<string | null>(null);
  useEffect(() => {
    if (match || !sala.rival.present || sala.conn !== "online" || !sala.rival.uid || helloSent.current === sala.rival.uid) return;
    helloSent.current = sala.rival.uid;
    send("hello");
  }, [match, sala.rival.present, sala.rival.uid, sala.conn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sala.rival.present && sala.isHost && !match && sala.conn === "online") {
      const tm = window.setTimeout(startMatch, 1200);
      return () => window.clearTimeout(tm);
    }
  }, [sala.rival.present, sala.isHost, match, sala.conn, startMatch]);

  useEffect(() => () => { if (nextTimer.current) window.clearTimeout(nextTimer.current); }, []);

  // En vivo: silbato y reloj para los dos a la vez. Si el arquero no elige a tiempo, se tira solo.
  const [restan, setRestan] = useState(TURNO_S);
  const corre = inMatch && !last && !paused && !moneda;
  useEffect(() => {
    if (!corre) return;
    setRestan(TURNO_S);
    hinchada.current.silbato();
    hinchada.current.tension(true);
    try { navigator.vibrate?.(120); } catch { /* sin vibración */ }
    const id = window.setInterval(() => setRestan((s) => Math.max(0, s - 1)), 1000);
    // Muerte súbita: late el corazón cada segundo y vibra como un pulso.
    const latir = t >= 10 ? window.setInterval(() => {
      hinchada.current.latido();
      try { navigator.vibrate?.([30, 120, 20]); } catch { /* sin vibración */ }
    }, 1000) : null;
    return () => { window.clearInterval(id); if (latir) window.clearInterval(latir); };
  }, [t, corre]);
  useEffect(() => {
    if (restan !== 0 || !corre || myDive) return;
    const pateador: Role = pateadorEn(match?.primero, t);
    if (role === pateador) return;
    const todas: Dive[] = ["left", "center", "right", "left-high", "center-high", "right-high"];
    const d = todas[Math.floor(Math.random() * todas.length)]!;
    setMyDive(d);
    send("dive", { t, dive: d });
  }, [restan, corre]); // eslint-disable-line react-hooks/exhaustive-deps

  const mine = role === "guest" ? results.guest : results.host;
  const theirs = role === "guest" ? results.host : results.guest;
  const myGoals = mine.filter(isGoal).length;
  const theirGoals = theirs.filter(isGoal).length;
  const showFinal = !!end || verFinal;

  useEffect(() => {
    if (!doneNow || !match || role === "fuera" || recorded.current) return;
    recorded.current = true;
    const xp = Math.min(20, xpFor(mine) + (!end && myGoals > theirGoals ? 5 : 0));
    if (xp > 0) recordCompletion({ source: "game", sourceRef: "penales", xp });
  }, [doneNow]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tribuna: suena mientras se juega la tanda y se calla al terminar o si se silencia.
  const tribuna = inMatch && !showFinal && !muted;
  useEffect(() => {
    if (tribuna) hinchada.current.empezar(); else hinchada.current.parar();
  }, [tribuna]);
  useEffect(() => { if (last) hinchada.current.tension(false); }, [last]);

  // Historial del clásico contra este rival (se suma una vez por tanda terminada).
  const rivalId = sala.rival.uid ?? "";
  const [clasico, setClasico] = useState<Clasico | null>(null);
  const contado = useRef<Match | null>(null);
  useEffect(() => {
    if (!showFinal || !doneNow || end || !rivalId || !match || contado.current === match) return;
    contado.current = match;
    const c = sumarClasico(leerClasico(rivalId), myGoals, theirGoals);
    guardarClasico(rivalId, c);
    setClasico(c);
  }, [showFinal, doneNow, end, rivalId, match]); // eslint-disable-line react-hooks/exhaustive-deps

  function salir() {
    sala.leave();
    onExit();
  }

  // Aviso fuerte cuando el amigo entra a la sala (aunque estés en WhatsApp).
  const avisado = useRef(false);
  useEffect(() => {
    if (match || !sala.rival.present || avisado.current) return;
    avisado.current = true;
    const nombre = sala.rival.name ?? "Tu amigo";
    toast.success(`¡${nombre} entró a la sala! Arrancamos…`);
    try { navigator.vibrate?.([200, 100, 200]); } catch { /* sin vibración */ }
    const antes = document.title;
    document.title = `¡${nombre} te espera! · Jaikuaa`;
    window.setTimeout(() => { document.title = antes; }, 8000);
    try {
      if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") new Notification("Jaikuaa", { body: `¡${nombre} entró a tu sala de penales!` });
    } catch { /* sin avisos */ }
  }, [sala.rival.present, match]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try { if (host && "Notification" in window && Notification.permission === "default") void Notification.requestPermission(); } catch { /* sin avisos */ }
  }, [host]);
  const myName = sala.me?.name ?? "Vos";
  const rivalName = sala.rival.name ?? lastRivalName.current ?? "tu rival";
  rivalNameRef.current = rivalName;
  const mandarEmoji = (e: Emoji) => { send("emo", { e }); mostrar(e, myName, true); };
  const link = typeof window !== "undefined" ? `${window.location.origin}/juegos/penales?sala=${code}` : "";
  const invite = `¡Te desafío a una tanda de penales en guaraní en Jaikuaa! Cada uno en su celular: uno patea, el otro ataja.\nCódigo de sala: ${code}\n${link}`;
  const card = "rounded-3xl bg-white p-5 text-center shadow-2xl text-[#071A33]";

  if (llena || (match && role === "fuera")) {
    return (
      <div className={card}>
        <Users className="mx-auto h-10 w-10 opacity-60" aria-hidden />
        <p className="mt-2 font-display text-2xl font-bold">Esta sala ya está llena</p>
        <p className="mt-1 text-sm opacity-75">Ya hay dos personas pateando penales. Podés crear tu propia sala.</p>
        <button type="button" onClick={salir} className="mt-4 h-12 w-full rounded-2xl font-bold" style={{ background: P.led, color: P.noche }}>Volver</button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="space-y-4">
        <div className={card}>
          <p className="font-display text-2xl font-bold">⚽ Penales a distancia</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold">
            {sala.conn === "offline" ? <><WifiOff className="h-4 w-4" aria-hidden /> Sin conexión. Revisá tu internet.</>
              : sala.rival.present ? <><Users className="h-4 w-4" aria-hidden /> ¡{sala.rival.name} entró! Arrancamos…</>
              : <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Esperando a tu amigo</>}
          </p>
          <p className="mt-1 text-xs opacity-70">Sala <span className="font-display text-lg font-bold tracking-[0.3em]">{code}</span></p>
          {!sala.rival.present && sala.isHost && <div className="mt-4 text-left"><Compartir url={link} texto={invite} titulo="Penales" /></div>}
          {!sala.rival.present && !sala.isHost && <p className="mt-3 text-sm opacity-75">Cuando tu amigo esté en la sala, arranca solo.</p>}
        </div>
        <button type="button" onClick={salir} className="mx-auto block h-11 rounded-2xl px-6 text-sm font-semibold ring-1 ring-white/40">Cancelar</button>
      </div>
    );
  }

  if (showFinal && doneNow) {
    const tie = !end && myGoals === theirGoals;
    const won = end === "abandono" || (!end && myGoals > theirGoals);
    const titulo = end === "abandono" ? "¡Ganaste por abandono!" : end === "sin-conexion" ? "Se cortó tu conexión" : end === "tarde" ? "La tanda terminó" : tie ? "¡Empate!" : won ? "¡Ganaste la tanda!" : `¡Ganó ${rivalName}!`;
    const bajada = end === "abandono" ? `${rivalName} salió y no volvió.` : end === "sin-conexion" ? "La tanda quedó sin terminar." : end === "tarde" ? `Estuviste afuera mucho tiempo y ${rivalName} ganó por abandono.` : `${myName} contra ${rivalName}`;
    const revancha = !end && sala.rival.present && !sala.rival.bye && sala.conn === "online";
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-3xl p-6 text-white shadow-2xl ring-4 ring-white" style={{ background: won ? P.host : tie || end ? P.noche : P.guest }}>
          <p className="font-display text-3xl font-bold">{titulo}</p>
          <p className="mt-2 font-display text-6xl font-bold tabular-nums">{myGoals} — {theirGoals}</p>
          <p className="mt-1 text-sm opacity-85">{bajada}</p>
          {clasico && !end && (
            <p className="mt-3 rounded-2xl bg-black/20 px-3 py-2 text-sm font-semibold">
              El clásico: {myName} {clasico.yo} — {clasico.rival} {rivalName}{clasico.empates ? ` · ${clasico.empates} empate${clasico.empates > 1 ? "s" : ""}` : ""}
            </p>
          )}
        </div>
        {!end && (
          <div className="text-left">
            <p className="mb-2 text-center text-sm font-bold text-white">Mandá la cargada al grupo</p>
            <Compartir oscuro url={`${typeof window !== "undefined" ? window.location.origin : ""}/juegos/penales`} texto={textoCargada(myName, rivalName, myGoals, theirGoals, `${typeof window !== "undefined" ? window.location.origin : ""}/juegos/penales?de=reto`)} titulo="Penales en Jaikuaa" />
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {revancha && (
            <button type="button" onClick={() => (role === "host" ? startMatch() : send("rematch"))} className="inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-bold" style={{ background: P.led, color: P.noche }}>
              <RotateCcw className="h-5 w-5" aria-hidden /> Revancha
            </button>
          )}
          <button type="button" onClick={salir} className="h-12 rounded-2xl px-5 font-semibold ring-1 ring-white/40">Salir</button>
        </div>
        {sala.rival.present && <BarraEmojis onMandar={mandarEmoji} />}
        <EmojisFlotando flotan={flotan} />
      </div>
    );
  }

  // Mientras se ve el resultado de un penal, se sigue mostrando ese penal (no el próximo).
  const tv = last ? Math.max(0, t - 1) : t;
  const shooter: Role = pateadorEn(match.primero, tv);
  const iShoot = role === shooter;
  const word = match.words[tv % match.words.length]!;
  const options = match.options[tv % match.options.length] ?? [];
  const sudden = tv >= 10;
  const shooterName = iShoot ? myName : rivalName;
  const knew = choice === word.gn;
  const waitLeft = pauseSince === null ? 0 : Math.max(0, Math.ceil((pauseSince + (pauseReason === "yo" ? GRACE_ME_MS : GRACE_RIVAL_MS) - now) / 1000));

  return (
    <div className="space-y-4">
      {moneda && t === 0 && (role === "host" || role === "guest") && (
        <MonedaJai
          role={role}
          primero={match.primero}
          lado={lado}
          rivalName={rivalName}
          muted={muted}
          onElegir={(l) => { if (lado) return; setLado(l); if (role === "host") send("lado", { lado: l }); }}
          onFin={() => setMoneda(false)}
        />
      )}
      {/* Marcador */}
      <div className="flex items-center gap-2 rounded-2xl border-4 border-[#1C2B44] bg-black p-2">
        <button type="button" onClick={() => setConfirmExit(true)} aria-label="Salir de la tanda" className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-white/85 ring-1 ring-white/25 hover:bg-white/10"><X className="h-4 w-4" aria-hidden />Salir</button>
        {[{ n: `Vos (${myName})`, r: mine, c: P.host }, { n: rivalName, r: theirs, c: P.guest }].map((x, k) => (
          <div key={k} className="min-w-0 flex-1 px-1">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-xs font-bold uppercase text-white/75">{x.n}</span>
              <strong className="font-display text-2xl" style={{ color: P.led }}>{x.r.filter(isGoal).length}</strong>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.from({ length: Math.max(5, x.r.length) }, (_, i) => {
                const o = x.r[i];
                return <span key={i} className="h-3 w-3 rounded-full" style={{ background: o ? (isGoal(o) ? P.gol : P.mal) : "#2A3448" }} />;
              })}
            </div>
          </div>
        ))}
      </div>

      {confirmExit && (
        <div className={card} role="alertdialog" aria-label="¿Salir de la tanda?">
          <p className="font-display text-lg font-bold">¿Salir de la tanda?</p>
          <p className="mt-1 text-sm opacity-75">Si salís ahora, {rivalName} gana por abandono.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmExit(false)} className="h-11 rounded-xl font-bold" style={{ background: P.led, color: P.noche }}>Seguir jugando</button>
            <button type="button" onClick={salir} className="h-11 rounded-xl font-bold ring-1 ring-black/20">Salir</button>
          </div>
        </div>
      )}

      {paused ? (
        <div className={card} role="status" aria-live="polite">
          {pauseReason === "yo" ? <WifiOff className="mx-auto h-10 w-10 opacity-70" aria-hidden /> : <Loader2 className="mx-auto h-10 w-10 animate-spin opacity-70" aria-hidden />}
          <p className="mt-3 font-display text-2xl font-bold">Tanda en pausa</p>
          <p className="mt-1 text-sm opacity-80">
            {pauseReason === "yo" ? "Se cortó tu conexión. Estamos intentando reconectar…" : sala.rival.away ? `${rivalName} salió de la app. Lo esperamos para seguir.` : `${rivalName} perdió la conexión. Lo esperamos para seguir.`}
          </p>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums">{waitLeft}</p>
          <p className="text-xs opacity-60">segundos · Si no vuelve, {pauseReason === "yo" ? "la tanda queda sin terminar" : "ganás por abandono"}.</p>
        </div>
      ) : (
        <>
          <p className={`text-center font-bold uppercase tracking-wide ${sudden ? "animate-pulse text-base" : "text-xs"}`} style={{ color: sudden ? P.mal : P.led }}>
            {sudden ? "Muerte súbita" : `Penal ${Math.floor(tv / 2) + 1} de 5`} · {iShoot ? "Te toca patear" : `Te toca atajar (${shooterName} patea)`}
          </p>

          {last ? (
            <div className={card} aria-live="polite">
              <p className="font-display text-3xl font-bold" style={{ color: isGoal(last) ? "#1E9E5A" : P.mal }}>{labels[last]}</p>
              <p className="mt-1 text-sm opacity-75">{word.gn} — {word.es}</p>
              {!duelFinished(results.host, results.guest) && t < 16 && (
                <p className="mt-2 font-display text-base font-bold">{pateadorEn(match.primero, t) === role ? "Ahora te toca patear" : "Ahora te toca el arco"}</p>
              )}
            </div>
          ) : iShoot ? (
            (
              <>
                {!dive ? (
                  <div className={card} aria-live="polite">
                    <p className="font-display text-5xl font-bold tabular-nums" style={{ color: restan <= 3 ? P.mal : P.noche }}>{restan}</p>
                    <p className="mt-1 font-display text-lg font-bold">¡Silbato! {rivalName} ya está en el arco</p>
                    <p className="text-sm opacity-70">Respondé rápido: el arco se abre apenas se acomode.</p>
                  </div>
                ) : (
                <div className="overflow-hidden rounded-2xl ring-4 ring-black/40">
                  <PenaltyPitch
                    key={t}
                    kit={kitPropio}
                    guess={dive}
                    knew={knew}
                    ready={choice !== null}
                    muted={muted}
                    ledText={ledText}
                    onShot={(o) => { send("shot", { t, outcome: o }); applyShot(t, o); }}
                    onAim={(pt, phase) => send("aim", { t, x: Math.round(pt.x), y: Math.round(pt.y), phase })}
                    onKick={(shotData) => send("kick", { t, shot: shotData })}
                  />
                </div>
                )}
                <div className="space-y-3 text-center">
                  <p className="text-sm text-white/70">¿Cómo se dice en guaraní?</p>
                  <h2 className="break-words font-display text-3xl font-bold text-white">{word.es}</h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {options.map((o) => {
                      const ok = choice !== null && o === word.gn;
                      const bad = choice === o && !ok;
                      return (
                        <button
                          key={o}
                          type="button"
                          disabled={choice !== null}
                          onClick={() => {
                            setChoice(o);
                            send("answer", { t, gn: o });
                            if (word.hasAudio && !muted) void playGuarani(word.gn);
                          }}
                          className="min-h-14 rounded-2xl px-3 py-3 font-display text-lg font-bold text-white transition active:scale-95"
                          style={ok ? { background: P.gol, color: P.noche } : bad ? { background: P.mal } : choice !== null ? { opacity: 0.4, background: "rgba(255,255,255,.08)" } : { background: "rgba(255,255,255,.08)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.18)" }}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {choice !== null && <p className="text-sm font-semibold" style={{ color: P.led }}>{knew ? "¡Bien! Ahora deslizá sobre el arco para apuntar y tocá para patear." : "Esta vez no. Igual podés patear: apuntá y tocá."}</p>}
                </div>
              </>
            )
          ) : !myDive ? (
            <section className={card} aria-label="Turno del arquero">
              <p className="text-xs font-semibold uppercase tracking-widest">🧤 Te toca atajar</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Elegí en secreto hacia dónde te tirás</h2>
              <p className="mt-1 font-display text-4xl font-bold tabular-nums" style={{ color: restan <= 3 ? P.mal : P.noche }} aria-live="polite">{restan}</p>
              <p className="text-sm opacity-75">{rivalName} ya está respondiendo. Si no elegís a tiempo, te tirás a cualquier lado.</p>
              <ElegirEstirada onElegir={(d) => { setMyDive(d); send("dive", { t, dive: d }); }} />
            </section>
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl ring-4 ring-black/40">
                <PenaltyPitch
                  key={`ver-${t}`}
                  kit={rivalKit ?? { ...miKit, pais: "PY", nombre: "" }}
                  guess={myDive}
                  knew={rivalChoice === word.gn}
                  ready={false}
                  muted={muted}
                  ledText={ledText}
                  watch={{ aim: watchAim?.aim ?? null, phase: watchAim?.phase ?? null, shot: watchShot }}
                  onShot={(o) => { if (kickRecibido.current === t) applyShot(t, o); }}
                />
              </div>
              <div className="rounded-2xl bg-white/[.07] p-3 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">🧤 Te tiraste {myDive.startsWith("left") ? "a la izquierda" : myDive.startsWith("right") ? "a la derecha" : "al centro"}{myDive.endsWith("-high") ? ", arriba" : ", abajo"}</p>
                <p className="mt-1 font-display text-lg font-bold">{watchShot ? "¡Pateó!" : watchAim ? `${rivalName} está apuntando…` : `${rivalName} está respondiendo…`}</p>
                <p className="mt-1 text-sm text-white/75">La palabra: «{word.es}»</p>
                {rivalChoice && (
                  <p className="mt-1 flex items-center justify-center gap-2 text-sm">
                    Respondió <b>{rivalChoice}</b> {rivalChoice === word.gn ? "✅" : "❌"} {word.hasAudio && <SpeakerButton gn={word.gn} />}
                  </p>
                )}
              </div>
            </div>
          )}
          <BarraEmojis onMandar={mandarEmoji} />
        </>
      )}
      <EmojisFlotando flotan={flotan} />
    </div>
  );
}
