import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameFeedback } from "@/components/games/game-kit";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { GameShell, XpNote } from "@/components/games/game-shell";
import { answerWordOfDay, getWordOfDay, type WordOfDayPackItem } from "@/lib/games.functions";
import { isNetworkError, isOffline, readOfflineCopy } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import { localWotdPlay, queueWotdAnswer, rememberWotdPlay } from "@/lib/offline-sync";
import { ShareResult } from "@/components/games/share-result";
import { syncStats } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/juegos/palabra-del-dia")({
  head: () => ({
    meta: [
      { title: "Palabra del día | Jaikuaa" },
      { name: "description", content: "Escuchá la palabra guaraní del día y elegí su significado." },
      { property: "og:title", content: "Palabra del día | Jaikuaa" },
      { property: "og:description", content: "Una palabra guaraní por día, con audio humano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WordOfDay,
});

function WordOfDay() { return <GameShell title="Palabra del día" emoji="📅" sponsorSlot="palabra-del-dia"><WordOfDayContent/></GameShell>; }

type WotdView = {
  day: string;
  word: { gn: string; options: string[] } | null;
  played: { choice: string; correct: boolean; answer: string } | null;
  /** Solo sin señal: la respuesta sale del paquete descargado. */
  offlineAnswer?: string;
  missing?: boolean;
};

function asuncionToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

/** Sin señal: la palabra de hoy sale del paquete de las próximas semanas guardado en el teléfono. */
async function offlineWordOfDay(): Promise<WotdView> {
  const day = asuncionToday();
  const pack = await readOfflineCopy<{ items: WordOfDayPackItem[] }>(K.wotd);
  const item = pack?.items.find((x) => x.day === day);
  if (!item) return { day, word: null, played: null, missing: true };
  const local = localWotdPlay(day);
  return {
    day,
    word: { gn: item.gn, options: item.options },
    played: local ? { choice: local.choice, correct: local.correct, answer: local.answer } : null,
    offlineAnswer: item.answer,
  };
}

async function loadWordOfDay(getFn: () => Promise<WotdView>): Promise<WotdView> {
  if (isOffline()) return offlineWordOfDay();
  try {
    const d = await getFn();
    // Una jugada hecha sin señal que todavía no llegó al servidor se sigue mostrando.
    const local = localWotdPlay(d.day);
    return !d.played && local ? { ...d, played: local } : d;
  } catch (e) {
    if (isNetworkError(e)) return offlineWordOfDay();
    throw e;
  }
}

function WordOfDayContent() {
  const feedback = useGameFeedback();
  const getFn = useServerFn(getWordOfDay);
  const answerFn = useServerFn(answerWordOfDay);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["word-of-day"],
    queryFn: () => loadWordOfDay(() => getFn() as Promise<WotdView>),
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ choice: string; correct: boolean; answer: string } | null>(null);

  const d = q.data;
  const played = result ?? d?.played ?? null;

  // Sin señal se corrige con el paquete y la jugada queda guardada; los puntos los confirma el
  // servidor cuando vuelve la conexión.
  async function playOffline(choice: string) {
    let answer = d?.offlineAnswer;
    if (!answer && d) {
      const pack = await readOfflineCopy<{ items: WordOfDayPackItem[] }>(K.wotd);
      answer = pack?.items.find((x) => x.day === d.day)?.answer;
    }
    if (!d || !answer) return false;
    const correct = choice === answer;
    rememberWotdPlay({ day: d.day, choice, correct, answer });
    queueWotdAnswer(d.day, choice);
    setResult({ choice, correct, answer });
    feedback(correct ? "victory" : "error");
    return true;
  }

  async function choose(choice: string) {
    if (played || busy) return;
    setBusy(true);
    try {
      if (isOffline() || d?.offlineAnswer) {
        await playOffline(choice);
        return;
      }
      try {
        const r = await answerFn({ data: { choice } });
        setResult({ choice, correct: r.correct, answer: r.answer });
        feedback(r.correct ? "victory" : "error");
        void syncStats();
        void qc.invalidateQueries({ queryKey: ["word-of-day"] });
      } catch (e) {
        if (!isNetworkError(e) || !(await playOffline(choice))) throw e;
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {q.isLoading || !d ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !d.word ? (
        <p className="text-center text-sm text-muted-foreground">
          {d.missing
            ? "Sin conexión: la Palabra del día de hoy no está descargada. Con señal, tocá «Descargar para usar sin internet» en tu panel."
            : "Todavía no hay palabras con audio publicadas."}
        </p>
      ) : (
        <div className="space-y-6">
          <p className="text-center text-xs text-muted-foreground">La misma palabra para todos hoy</p>
          <div className="daily-card relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl p-7 text-center">
            <svg viewBox="0 0 100 100" className="daily-lace pointer-events-none absolute -right-10 -top-10 h-48 w-48" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
              {Array.from({ length: 16 }, (_, k) => <line key={k} x1="50" y1="50" x2={50 + 48 * Math.cos((k * Math.PI) / 8)} y2={50 + 48 * Math.sin((k * Math.PI) / 8)} />)}
              {[10, 22, 34, 46].map((r) => <circle key={r} cx="50" cy="50" r={r} strokeDasharray={r > 20 ? "3 3" : undefined} />)}
            </svg>
            <span className="daily-chip rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest">Carta del día · {d.day}</span>
            <p className="text-sm opacity-85">Escuchala y elegí qué significa</p>
            <div className="daily-play flex h-24 w-24 items-center justify-center rounded-full">
              <SpeakerButton gn={d.word.gn} size="md" className="h-20 w-20 [&_svg]:h-9 [&_svg]:w-9" />
            </div>
            {played ? (
              <div className="font-display text-4xl font-bold">{d.word.gn}</div>
            ) : (
              <div className="font-display text-4xl font-bold tracking-[0.3em] opacity-40" aria-hidden>? ? ?</div>
            )}
            {played?.correct && <span className="daily-chip rounded-full px-3 py-1 text-xs font-bold">★ Coleccionada</span>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {d.word.options.map((o) => {
              const isAnswer = played && o === played.answer;
              const isWrongChoice = played && o === played.choice && !played.correct;
              return (
                <Button variant="ghost"
                  key={o}
                  type="button"
                  disabled={!!played || busy}
                  onClick={() => void choose(o)}
                  className={`h-auto whitespace-normal break-words justify-start rounded-lg border-2 p-4 text-left font-semibold transition ${
                    isAnswer
                      ? "border-primary bg-primary/10 text-primary"
                      : isWrongChoice
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-foreground hover:border-primary"
                  }`}
                >
                  {o}
                </Button>
              );
            })}
          </div>
          {played && (
            <div className="space-y-1 text-center">
              <p className="font-display text-lg font-bold text-foreground">
                {played.correct ? "¡Correcto!" : `Era: ${played.answer}`}
              </p>
              {played.correct && <XpNote xp={5} />}
              {d.offlineAnswer && (
                <p className="text-xs text-muted-foreground">Sin conexión: tu jugada quedó guardada y se envía cuando vuelva la señal.</p>
              )}
              {played.correct && <div className="pt-1"><ShareResult text="¡Acerté la Palabra del día en guaraní de Jaikuaa! ¿Vos la sabés?" /></div>}
              <p className="text-sm text-muted-foreground">Volvé mañana para una palabra nueva.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
