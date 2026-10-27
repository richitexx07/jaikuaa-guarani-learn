import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useGameFeedback } from "@/components/games/game-kit";
import { useGT } from "@/lib/i18n-games";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { GameStage } from "@/components/games/game-stage";
import { answerWordOfDay, getWordOfDay, type WordOfDayPackItem } from "@/lib/games.functions";
import { isNetworkError, isOffline, readOfflineCopy } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import { localWotdPlay, queueWotdAnswer, rememberWotdPlay } from "@/lib/offline-sync";
import { logAnswer } from "@/lib/answer-log";
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

function WordOfDay() {
  return (
    <GameStage
      title="Palabra del día"
      sponsorSlot="palabra-del-dia"
      css={CSS}
      ink={D.tinta}
      background={`radial-gradient(circle at 50% 108%, #FFF1B8 0 18%, #FBD266 18% 30%, transparent 30%), linear-gradient(180deg, #FFE3A3 0%, #F8B04F 55%, #EE8A2E 100%)`}
    >
      <WordOfDayContent />
    </GameStage>
  );
}

/* Amanecer y almanaque: cielo naranja, hoja de calendario y el sol como botón de audio. */
const D = { tinta: "#3A1A05", hoja: "#FFFDF7", rojo: "#D52B1E", sol: "#F6C445", verde: "#2F7A4A" };

const CSS = `
.dd-page { animation: dd-page .6s cubic-bezier(.2,.8,.2,1) 1 both; transform-origin: top center; }
@keyframes dd-page { from { transform: rotateX(-35deg) translateY(-10px); opacity: 0 } }
.dd-sol { animation: dd-sol 2.6s ease-in-out infinite; }
@keyframes dd-sol { 50% { box-shadow: 0 0 0 14px rgba(246,196,69,.25), 0 0 40px 6px rgba(246,196,69,.55) } }
.dd-sello { animation: dd-sello .45s cubic-bezier(.2,1.6,.4,1) 1 both; }
@keyframes dd-sello { from { transform: scale(2.2) rotate(-30deg); opacity: 0 } }
.dd-sol button { background: transparent !important; color: ${D.tinta} !important; border: 0 !important; }
@media (prefers-reduced-motion: reduce) { .dd-page, .dd-sol, .dd-sello { animation: none !important } }
`;

function fechaLarga(day: string) {
  const f = new Date(`${day}T12:00:00Z`);
  return {
    dia: f.toLocaleDateString("es-PY", { weekday: "long", timeZone: "UTC" }),
    num: f.getUTCDate(),
    mes: f.toLocaleDateString("es-PY", { month: "long", timeZone: "UTC" }) + " de " + f.getUTCFullYear(),
  };
}

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
  const { g: tr } = useGT();
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
    if (d.word) logAnswer(d.word.gn, correct, "wotd", d.day);
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
        if (d?.word) logAnswer(d.word.gn, r.correct, "wotd", d.day);
        void syncStats();
        void qc.invalidateQueries({ queryKey: ["word-of-day"] });
      } catch (e) {
        if (!isNetworkError(e) || !(await playOffline(choice))) throw e;
      }
    } finally {
      setBusy(false);
    }
  }

  const fecha = d ? fechaLarga(d.day) : null;
  return (
    <>
      {q.isLoading || !d ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !d.word ? (
        <p className="rounded-2xl bg-white/70 p-5 text-center text-sm">
          {d.missing
            ? tr("wotdOffline")
            : tr("wotdNoAudio")}
        </p>
      ) : (
        <div className="space-y-5">
          <div className="dd-page relative mx-auto max-w-md overflow-hidden rounded-2xl text-center shadow-[0_24px_50px_-20px_rgba(58,26,5,.55)]" style={{ background: D.hoja }}>
            <div className="flex justify-center gap-16 pt-2" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#3A1A05]/70" /><span className="h-3 w-3 rounded-full bg-[#3A1A05]/70" />
            </div>
            <div className="mx-3 mt-1 rounded-lg py-2 text-white" style={{ background: D.rojo }}>
              <p className="text-sm font-semibold capitalize">{fecha!.dia}</p>
            </div>
            <p className="font-display text-7xl font-bold leading-none" style={{ color: D.rojo }}>{fecha!.num}</p>
            <p className="text-sm opacity-70">{fecha!.mes}</p>
            <div className="mx-6 my-4 border-t border-dashed border-[#E8D9BC]" />
            <p className="text-sm opacity-75">{tr("wotdListen")}</p>
            <div className="dd-sol mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #FFF1B8, ${D.sol})` }}>
              <SpeakerButton gn={d.word.gn} size="md" className="h-20 w-20 [&_svg]:h-10 [&_svg]:w-10" />
            </div>
            <div className="px-4 pb-6 pt-4">
              {played ? (
                <div className="font-display text-5xl font-bold">{d.word.gn}</div>
              ) : (
                <div className="font-display text-4xl font-bold tracking-[0.3em] opacity-25" aria-hidden>? ? ?</div>
              )}
            </div>
            {played?.correct && (
              <span className="dd-sello absolute bottom-24 right-3 rotate-[-14deg] bg-[#FFFDF7]/90 rounded-lg border-[3px] px-2 py-1 text-xs font-bold uppercase" style={{ borderColor: D.verde, color: D.verde }}>
                ★ Coleccionada
              </span>
            )}
          </div>
          <p className="text-center text-xs font-medium opacity-70">{tr("wotdSame")}</p>
          <div className="mx-auto grid max-w-md gap-2 sm:grid-cols-2">
            {d.word.options.map((o) => {
              const isAnswer = played && o === played.answer;
              const isWrongChoice = played && o === played.choice && !played.correct;
              return (
                <button
                  key={o}
                  type="button"
                  disabled={!!played || busy}
                  onClick={() => void choose(o)}
                  className="min-h-14 rounded-2xl px-4 py-3 text-left font-display text-lg font-bold shadow transition active:scale-[.98]"
                  style={{
                    background: isAnswer ? D.verde : isWrongChoice ? D.rojo : D.hoja,
                    color: isAnswer || isWrongChoice ? "#fff" : D.tinta,
                    opacity: played && !isAnswer && !isWrongChoice ? 0.55 : 1,
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {played && (
            <div className="mx-auto max-w-md space-y-1 rounded-2xl bg-white/70 p-4 text-center">
              <p className="font-display text-xl font-bold">
                {played.correct ? tr("correct") : tr("itWas", { a: played.answer })}
              </p>
              {played.correct && <p className="font-bold" style={{ color: D.verde }}>+5 XP</p>}
              {d.offlineAnswer && (
                <p className="text-xs opacity-70">{tr("wotdSaved")}</p>
              )}
              {played.correct && <div className="pt-1"><ShareResult text={tr("wotdShare")} /></div>}
              <p className="text-sm opacity-70">{tr("wotdTomorrow")}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
