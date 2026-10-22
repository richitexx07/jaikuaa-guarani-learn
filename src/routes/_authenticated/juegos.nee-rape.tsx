import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Loader2, MessageCircle, RotateCcw, Users, Volume2, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameShell, XpNote, shuffle, useGameWords } from "@/components/games/game-shell";
import { ShareResult } from "@/components/games/share-result";
import { useGameFeedback } from "@/components/games/game-kit";
import { supabase } from "@/integrations/supabase/client";
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
  { id: "neenga", emoji: "🪕", gn: "Ñe'ẽnga", es: "Dichos y poesía", desc: "En preparación con docentes y pasantes del Ateneo.", tip: "", ready: false },
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
  const pool = words.data?.words ?? [];
  const current = SENDEROS.find((s) => s.id === sendero)!;
  const enough = sendero === "arandupy" || new Set(pool.map((w) => w.gn)).size >= 8;

  return (
    <GameShell title="Ñe'ẽ Rape" emoji="🛤️" sponsorSlot="nee-rape">
      {mode === "menu" && (
        <div className="space-y-6">
          <p className="text-center text-sm text-muted-foreground">
            El camino de la palabra. Desafiá a un compañero: cada uno juega desde su celular.
          </p>
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.es}</p>
                  </div>
                  {!s.ready && <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">Próximamente</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </button>
            ))}
          </div>
          {sendero === "arandupy" && (
            <p className="rounded-lg bg-secondary/10 p-3 text-center text-xs text-muted-foreground">Preguntas de cultura en validación docente.</p>
          )}
          {words.isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !enough ? (
            <p className="text-center text-sm text-muted-foreground">Todavía no hay suficientes palabras publicadas para este sendero.</p>
          ) : (
            <div className="grid gap-3">
              <Button size="lg" className="h-14 text-base" onClick={() => { setCode(newCode()); setIsHost(true); setMode("remote"); }}>
                <Wifi className="mr-2 h-5 w-5" /> Desafiar a distancia
              </Button>
              <Button size="lg" variant="outline" onClick={() => setMode("solo")}>Practicar solo · {current.es}</Button>
            </div>
          )}
          <div className="rounded-2xl border border-dashed border-border p-4">
            <p className="text-sm font-semibold text-foreground">¿Te invitaron? Ingresá el código</p>
            <div className="mt-2 flex gap-2">
              <Input value={joinCode} maxLength={4} placeholder="Ej. K7PM" className="uppercase tracking-[0.3em]" onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
              <Button disabled={joinCode.length !== 4} onClick={() => { setCode(joinCode); setIsHost(false); setMode("remote"); }}>Unirme</Button>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">Contenido basado en el vocabulario validado por docentes y en las normas de la Academia de la Lengua Guaraní.</p>
        </div>
      )}
      {mode === "solo" && <Solo sendero={sendero} pool={pool} onExit={() => setMode("menu")} />}
      {mode === "remote" && code && (
        <Remote code={code} isHost={isHost} sendero={sendero} pool={pool} onExit={() => { setMode("menu"); setCode(null); }} />
      )}
    </GameShell>
  );
}

function Solo({ sendero, pool, onExit }: { sendero: SenderoId; pool: GameWord[]; onExit: () => void }) {
  const [match, setMatch] = useState<Match>(() => ({ sendero, rounds: buildRounds(sendero, pool), startAt: Date.now() + COUNTDOWN_MS }));
  return (
    <Arena
      key={match.startAt}
      match={match}
      names={["Vos", ""]}
      rival={{}}
      onAnswer={() => {}}
      onRematch={() => setMatch({ sendero, rounds: buildRounds(sendero, pool), startAt: Date.now() + COUNTDOWN_MS })}
      onExit={onExit}
    />
  );
}

function Remote({ code, isHost, sendero, pool, onExit }: { code: string; isHost: boolean; sendero: SenderoId; pool: GameWord[]; onExit: () => void }) {
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [rivalName, setRivalName] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [rival, setRival] = useState<Record<number, Answer>>({});
  const [reaction, setReaction] = useState<{ e: string; k: number } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hostRef = useRef(isHost);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const full = (u.user_metadata?.full_name as string | undefined) ?? u.email?.split("@")[0] ?? "Jugador";
      setMe({ id: u.id, name: full.split(" ")[0]!.slice(0, 16) });
    });
  }, []);

  const startMatch = useCallback(() => {
    const ch = channelRef.current;
    if (!ch || !hostRef.current) return;
    const rounds = buildRounds(sendero, pool);
    ch.send({ type: "broadcast", event: "start", payload: { sendero, rounds, delay: COUNTDOWN_MS } });
    setRival({});
    setMatch({ sendero, rounds, startAt: Date.now() + COUNTDOWN_MS });
  }, [sendero, pool]);

  useEffect(() => {
    if (!me) return;
    const ch = supabase.channel(`nee-rape:${code}`, { config: { presence: { key: me.id }, broadcast: { self: false } } });
    channelRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ name: string; host: boolean }>();
      const others = Object.entries(state).filter(([k]) => k !== me.id);
      const other = others[0]?.[1]?.[0];
      setRivalName(other?.name ?? null);
      // Si nadie es anfitrión (por ejemplo, entré por enlace primero), el primero en llegar lo es.
      if (other && !hostRef.current && !other.host) {
        const keys = Object.keys(state).sort();
        if (keys[0] === me.id) hostRef.current = true;
      }
    })
      .on("broadcast", { event: "start" }, ({ payload }) => {
        setRival({});
        setMatch({ sendero: payload.sendero, rounds: payload.rounds, startAt: Date.now() + payload.delay });
      })
      .on("broadcast", { event: "answer" }, ({ payload }) => setRival((r) => ({ ...r, [payload.round]: payload.answer })))
      .on("broadcast", { event: "react" }, ({ payload }) => setReaction({ e: payload.e, k: Date.now() }))
      .on("broadcast", { event: "rematch" }, () => { if (hostRef.current) startMatch(); })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void ch.track({ name: me.name, host: hostRef.current });
      });
    return () => { void supabase.removeChannel(ch); channelRef.current = null; };
  }, [me, code, startMatch]);

  // El anfitrión arranca apenas llega el rival.
  useEffect(() => {
    if (rivalName && hostRef.current && !match) {
      const t = window.setTimeout(startMatch, 600);
      return () => window.clearTimeout(t);
    }
  }, [rivalName, match, startMatch]);

  const link = typeof window !== "undefined" ? `${window.location.origin}/juegos/nee-rape?sala=${code}` : "";
  const invite = `¡Te desafío en Jaikuaa! A ver si me ganás.\nCódigo de sala: ${code}\nTocá acá para jugar:\n${link}`;

  if (!match) {
    return (
      <div className="space-y-5 text-center">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/40 blur-2xl motion-safe:animate-pulse" />
          <div className="relative flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground font-display text-2xl font-bold text-primary ring-4 ring-primary-foreground/30">
                {(me?.name ?? "V").charAt(0).toUpperCase()}
              </div>
              <p className="mt-1 text-sm font-semibold">{me?.name ?? "Vos"}</p>
            </div>
            <p className="font-display text-3xl font-black text-secondary motion-safe:animate-bounce">VS</p>
            <div className="flex flex-col items-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed font-display text-2xl font-bold ${rivalName ? "border-secondary bg-secondary text-secondary-foreground" : "border-primary-foreground/50 motion-safe:animate-pulse"}`}>
                {rivalName ? rivalName.charAt(0).toUpperCase() : "?"}
              </div>
              <p className="mt-1 text-sm font-semibold">{rivalName ?? "Tu amigo"}</p>
            </div>
          </div>
          <div className="relative mt-5 flex items-center justify-center gap-2 text-sm">
            {rivalName ? <><Users className="h-4 w-4" /> ¡{rivalName} entró! Arrancamos…</> : <><Loader2 className="h-4 w-4 animate-spin" /> Esperando que tu amigo abra el enlace</>}
          </div>
          <p className="relative mt-3 text-xs uppercase tracking-widest opacity-80">Sala <span className="font-display text-base font-bold tracking-[0.3em]">{code}</span></p>
        </div>
        {!rivalName && (
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-foreground">1. Mandale el desafío · 2. Cuando abra, arranca solo</p>
            <Button asChild size="lg" className="h-14 text-base shadow-lg">
              <a href={`https://wa.me/?text=${encodeURIComponent(invite)}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-5 w-5" /> Mandar por WhatsApp</a>
            </Button>
            <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(link); toast.success("Enlace copiado"); }}>
              <Copy className="mr-2 h-4 w-4" /> Copiar enlace
            </Button>
          </div>
        )}
        <Button variant="ghost" onClick={onExit}>Cancelar</Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {reaction && (
        <div key={reaction.k} className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center text-7xl animate-in zoom-in fade-in duration-300">
          {reaction.e}
        </div>
      )}
      <Arena
        key={match.startAt}
        match={match}
        names={[me?.name ?? "Vos", rivalName ?? "Rival"]}
        rival={rival}
        onAnswer={(round, answer) => channelRef.current?.send({ type: "broadcast", event: "answer", payload: { round, answer } })}
        onReact={(e) => channelRef.current?.send({ type: "broadcast", event: "react", payload: { e } })}
        onRematch={() => { if (hostRef.current) startMatch(); else channelRef.current?.send({ type: "broadcast", event: "rematch", payload: {} }); }}
        onExit={onExit}
        rivalLeft={!rivalName}
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

function Arena({ match, names, rival, onAnswer, onReact, onRematch, onExit, rivalLeft }: {
  match: Match;
  names: [string, string];
  rival: Record<number, Answer>;
  onAnswer: (round: number, a: Answer) => void;
  onReact?: (e: string) => void;
  onRematch: () => void;
  onExit: () => void;
  rivalLeft?: boolean;
}) {
  const feedback = useGameFeedback();
  const remote = Boolean(names[1]);
  const [mine, setMine] = useState<Record<number, Answer>>({});
  const elapsed = Date.now() - match.startAt;
  const finished = elapsed >= ROUNDS * SLOT_MS;
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
  const done = t >= ROUNDS * SLOT_MS;
  const myCorrect = Object.values(mine).filter((a) => a.correct).length;
  const won = !remote || myScore > rivalScore;
  const xp = Math.min(20, myCorrect * 3 + (remote && myScore > rivalScore ? 5 : 0));

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
    const tie = remote && myScore === rivalScore;
    return (
      <div className="space-y-5 text-center">
        <p className="text-6xl" aria-hidden>{tie ? "🤝" : won ? "🏆" : "🥈"}</p>
        <h2 className="font-display text-3xl font-bold">{!remote ? "¡Sendero completo!" : tie ? "¡Empate!" : won ? "¡Ganaste el duelo!" : `Ganó ${names[1]}`}</h2>
        <div className={`grid gap-3 ${remote ? "grid-cols-2" : "grid-cols-1"}`}>
          <ScoreCard name={names[0]} score={myScore} correct={myCorrect} highlight={won && !tie} />
          {remote && <ScoreCard name={names[1]} score={rivalScore} correct={Object.values(rival).filter((a) => a.correct).length} highlight={!won && !tie} />}
        </div>
        <XpNote xp={xp} />
        <div className="rounded-2xl bg-muted/50 p-4 text-left text-sm">
          <p className="font-semibold">Repaso</p>
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
          <Button size="lg" onClick={onRematch} disabled={rivalLeft}><RotateCcw className="mr-2 h-4 w-4" /> Revancha</Button>
          <ShareResult text={remote ? `${won ? "¡Gané" : "Jugué"} un duelo de Ñe'ẽ Rape (${sendero.es}) ${myScore}-${rivalScore} en Jaikuaa 🛤️ ¿Te animás?` : `Hice ${myCorrect}/${ROUNDS} en Ñe'ẽ Rape (${sendero.es}) en Jaikuaa 🛤️`} />
          <Button variant="ghost" onClick={onExit}>Elegir otro sendero</Button>
        </div>
      </div>
    );
  }

  const my = mine[idx];
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
        <p className={`mt-3 font-display font-bold text-foreground ${round.prompt.length > 40 ? "text-xl" : "text-3xl"}`}>{round.prompt}</p>
        {round.audio && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => void playGuarani(round.audio!)}><Volume2 className="mr-1 h-4 w-4" /> Escuchar</Button>
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
        <p className="rounded-xl bg-accent/40 p-3 text-center text-sm text-foreground animate-in fade-in">💡 {round.tip}</p>
      )}
      {!revealing && my && <p className="text-center text-sm text-muted-foreground">{remote && !theirs ? `Esperando a ${names[1]}…` : my.correct ? "¡Bien!" : "Ups…"}</p>}
      {remote && onReact && (
        <div className="flex justify-center gap-2 pt-1">
          {REACTIONS.map((e) => (
            <button key={e} type="button" aria-label={`Reaccionar ${e}`} onClick={() => onReact(e)} className="h-10 w-10 rounded-full bg-muted text-xl transition active:scale-90">{e}</button>
          ))}
        </div>
      )}
      {rivalLeft && <p className="text-center text-xs text-destructive">Tu rival se desconectó.</p>}
    </div>
  );
}

function ScoreCard({ name, score, correct, highlight }: { name: string; score: number; correct: number; highlight: boolean }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${highlight ? "border-primary bg-primary/10" : "border-border"}`}>
      <p className="font-semibold">{name}</p>
      <p className="font-display text-3xl font-bold text-primary">{score}</p>
      <p className="text-xs text-muted-foreground">{correct}/{ROUNDS} aciertos</p>
    </div>
  );
}
