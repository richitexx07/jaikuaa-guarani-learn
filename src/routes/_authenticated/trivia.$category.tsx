import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ValidationNotice } from "@/components/validation-notice";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import {
  TRIVIA,
  TRIVIA_ORDER,
  QUESTION_SECONDS,
  XP_PER_CORRECT,
  XP_STREAK_BONUS,
  type TriviaCategoryId,
} from "@/lib/trivia";
import { recordCompletion, useRecordVisit } from "@/lib/gamification";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trivia/$category")({
  head: ({ params }) => ({ meta: [{ title: `Jaikuaa — Trivia: ${params.category}` },
      { name: "description", content: "Practicá con las preguntas de esta categoría de trivia de Jaikuaa." },
      { property: "og:title", content: `Jaikuaa — Trivia: ${params.category}` },
      { property: "og:description", content: "Practicá con las preguntas de esta categoría de trivia de Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  loader: ({ params }) => {
    if (!TRIVIA_ORDER.includes(params.category as TriviaCategoryId)) throw notFound();
    return { category: params.category as TriviaCategoryId };
  },
  component: TriviaQuiz,
});

type Phase = "playing" | "done";

// ── Rotating error messages (never repeat the same one twice in a row) ────────
function buildErrorMessage(correctAnswer: string, index: number): string {
  const templates = [
    `¡Casi, che! La respuesta era **${correctAnswer}**.\n\nNo te preocupés, el guaraní ya está en vos. Solo hay que despertarlo. 🐆`,
    `¡Uy, esa era difícil! Era **${correctAnswer}**.\n\nNadie nace sabiendo. Cada guaraní que aprendés es una raíz que recuperás. 💙`,
    `¡Casi la tenés! Era **${correctAnswer}**.\n\nEl jaguaréte también tropieza, pero siempre se levanta. Seguí. 🐆`,
    `El guaraní es como el mate: se aprende tomando. 🧉\n\nLa correcta era **${correctAnswer}**. ¡Otra más!`,
    `¡No pasa nada, che! Era **${correctAnswer}**.\n\nEn Paraguay nadie te juzga por equivocarte. Acá se aprende junto. 💙`,
    `Era **${correctAnswer}**.\n\nCada error es una palabra que ya no se te olvida. Tu ñe'ẽ crece. 🌱`,
    `¡Casi! Era **${correctAnswer}**.\n\nVos no estás aprendiendo un idioma. Estás recuperando lo que siempre fue tuyo. 🐆`,
    `Era **${correctAnswer}**.\n\nEl que nunca se equivoca, nunca aprende. Vos ya estás un paso adelante. 💪`,
  ];
  return templates[index % templates.length];
}

function buildSuccessMessage(
  category: TriviaCategoryId,
  answer: string,
  explanation: string,
): string {
  switch (category) {
    case "vocabulario":
      return `¡Añete! **${answer}**.\n\n${explanation} Ahora podés decírselo a tu abuela. Ella va a sonreír. 🐆`;
    case "mitos":
      return `¡Sí! **${answer}**.\n\n${explanation} Tu historia vive. 🔥`;
    case "cultura":
      return `¡Exacto! **${answer}**.\n\n${explanation} Vos la seguís viva. 💙`;
    default:
      return `¡Muy bien! **${answer}**.\n\n${explanation} 🇵🇾`;
  }
}

function streakLabel(n: number): string | null {
  if (n === 2) return "¡Vas bien, che! 🔥";
  if (n === 3) return "¡Racha x3! El jaguaréte está orgulloso. 🐆";
  if (n === 4) return "¡Imparable! ¿Vos ya sabías guaraní en otra vida? ✨";
  if (n >= 5) return "¡PERFECTO! El jaguaréte te nombra guerrero del Ñe'ẽ. 🐆⚔️";
  return null;
}

// Simple markdown-lite: **bold** and newlines
function renderCopy(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={i > 0 ? "mt-2" : ""}>
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} className="font-bold">
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{p}</span>
          ),
        )}
      </p>
    );
  });
}

function TriviaQuiz() {
  const { category } = Route.useLoaderData() as { category: TriviaCategoryId };
  useRecordVisit(`trivia:${category}`);
  const cat = TRIVIA[category];
  const navigate = useNavigate();

  const [runKey, setRunKey] = useState(0);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [selected, setSelected] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showStreakBadge, setShowStreakBadge] = useState<string | null>(null);
  const [streakBroken, setStreakBroken] = useState(false);
  const errorSeedRef = useRef(Math.floor(Math.random() * 8));
  const timerRef = useRef<number | null>(null);
  const awardedRef = useRef(false);

  const total = cat.questions.length;
  const question = cat.questions[idx];
  const answered = selected !== null || timedOut;
  const correctAnswerText = question.options[question.answer];

  // Timer
  useEffect(() => {
    if (phase !== "playing" || answered) return;
    setTimeLeft(QUESTION_SECONDS);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, QUESTION_SECONDS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 100);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase, runKey]);

  function handleTimeout() {
    setTimedOut(true);
    if (streak >= 2) setStreakBroken(true);
    setStreak(0);
  }

  function handleSelect(i: number) {
    if (answered) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setSelected(i);
    if (i === question.answer) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
      let gained = XP_PER_CORRECT;
      if (newStreak >= 3) gained += XP_STREAK_BONUS;
      const label = streakLabel(newStreak);
      if (label) {
        setShowStreakBadge(label);
        window.setTimeout(() => setShowStreakBadge(null), 1600);
      }
      setXpEarned((x) => x + gained);
    } else {
      if (streak >= 2) setStreakBroken(true);
      setStreak(0);
    }
  }

  function handleNext() {
    setStreakBroken(false);
    if (idx + 1 >= total) {
      setPhase("done");
      if (!awardedRef.current) {
        awardedRef.current = true;
        recordCompletion({ xp: xpEarned, source: "trivia", sourceRef: category });
      }
      if (correctCount === total) celebrate("big");
      else if (correctCount >= 3) celebrate("small");
      return;
    }
    setIdx((n) => n + 1);
    setSelected(null);
    setTimedOut(false);
  }

  function reset() {
    setRunKey((k) => k + 1);
    setIdx(0);
    setPhase("playing");
    setSelected(null);
    setTimedOut(false);
    setTimeLeft(QUESTION_SECONDS);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setXpEarned(0);
    setStreakBroken(false);
    errorSeedRef.current = Math.floor(Math.random() * 8);
    awardedRef.current = false;
  }

  const pct = ((idx + (answered ? 1 : 0)) / total) * 100;
  const timePct = (timeLeft / QUESTION_SECONDS) * 100;
  const timerColor =
    timePct > 60 ? "bg-primary" : timePct > 30 ? "bg-amber-500" : "bg-destructive";

  const isCorrectAnswered = answered && selected === question.answer;
  const errorCopy = buildErrorMessage(correctAnswerText, errorSeedRef.current + idx);
  const successCopy = buildSuccessMessage(category, correctAnswerText, question.explanation);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ValidationNotice />
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Link to="/trivia" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Salir
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          {phase === "playing" ? (
            <>
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg" aria-hidden>{cat.emoji}</span>
                  <span className="font-semibold text-foreground">{cat.title}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Pregunta {idx + 1} de {total}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Timer bar */}
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn("h-full rounded-full transition-colors duration-300", timerColor)}
                  style={{ width: `${timePct}%`, transitionProperty: "width, background-color" }}
                />
              </div>

              {/* Streak badge floating */}
              {showStreakBadge && (
                <div className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 animate-fade-in">
                  <div className="max-w-xs rounded-full bg-accent px-4 py-2 text-center font-display text-sm font-bold text-accent-foreground shadow-lg sm:text-base">
                    {showStreakBadge}
                  </div>
                </div>
              )}

              {/* Question card */}
              <div key={idx} className="rounded-2xl border border-border/60 bg-card p-5 shadow-elegant animate-fade-in sm:p-7">
                <h2 className="font-display text-xl font-bold leading-snug text-foreground sm:text-2xl">
                  {question.q}
                </h2>

                <div className="mt-5 grid gap-2.5">
                  {question.options.map((opt, i) => {
                    const isCorrect = i === question.answer;
                    const isPicked = selected === i;
                    let cls =
                      "w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-left text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 sm:text-base";
                    if (answered) {
                      if (isCorrect) {
                        cls =
                          "w-full rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-left text-sm font-medium text-emerald-900 sm:text-base";
                      } else if (isPicked) {
                        cls =
                          "w-full rounded-xl border-2 border-destructive bg-destructive/10 px-4 py-3 text-left text-sm font-medium text-destructive sm:text-base";
                      } else {
                        cls =
                          "w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-left text-sm font-medium text-muted-foreground opacity-70 sm:text-base";
                      }
                    }
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelect(i)}
                        disabled={answered}
                        className={cn(cls, "disabled:cursor-default")}
                      >
                        <span className="mr-2 font-bold text-primary/70">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                        {answered && isCorrect && <span className="ml-2">✓</span>}
                        {answered && isPicked && !isCorrect && <span className="ml-2">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className="mt-5 animate-fade-in space-y-3">
                    <div
                      className={cn(
                        "rounded-xl px-4 py-3 text-sm leading-relaxed",
                        isCorrectAnswered
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-primary/5 text-foreground",
                      )}
                    >
                      {isCorrectAnswered
                        ? renderCopy(successCopy)
                        : timedOut && selected === null
                          ? renderCopy(
                              `⏱️ Se acabó el tiempo, che.\n\n${errorCopy}`,
                            )
                          : renderCopy(errorCopy)}
                    </div>

                    {streakBroken && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
                        {renderCopy(
                          "Se cortó la racha... 😔\n\nPero no importa, che. El guaraní no se aprende de una. Tu abuela tampoco la acertó todo el primer día.\n\n**Volvé mañana. El jaguaréte te espera.** 🐆",
                        )}
                      </div>
                    )}

                    <Button onClick={handleNext} className="w-full" size="lg">
                      {idx + 1 >= total ? "Ver resultado" : "¡Seguimos! →"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Live streak */}
              {streak >= 2 && !answered && (
                <div className="mt-3 text-center text-xs font-semibold text-accent">
                  🔥 Racha actual: {streak}
                </div>
              )}
            </>
          ) : (
            <ResultsScreen
              category={cat.title}
              correct={correctCount}
              total={total}
              xp={xpEarned}
              bestStreak={bestStreak}
              onReplay={reset}
              onChoose={() => navigate({ to: "/trivia" })}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ResultsScreen({
  category,
  correct,
  total,
  xp,
  bestStreak,
  onReplay,
  onChoose,
}: {
  category: string;
  correct: number;
  total: number;
  xp: number;
  bestStreak: number;
  onReplay: () => void;
  onChoose: () => void;
}) {
  const isPerfect = correct === total;
  const verdict = useMemo(() => {
    if (isPerfect) return "¡Iporãite!";
    if (correct >= 3) return "¡Iporã!";
    return "¡Seguí practicando!";
  }, [correct, total, isPerfect]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-elegant animate-fade-in">
      <div className="text-5xl" aria-hidden>
        {isPerfect ? "🐆" : "🏆"}
      </div>
      <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
        {correct} de {total} {verdict}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{category}</p>

      {isPerfect && (
        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4 text-left text-sm leading-relaxed text-foreground">
          <p className="font-display text-lg font-bold text-accent">
            ¡PERFECTO, CHE! 🐆🐆🐆
          </p>
          <p className="mt-2">
            El jaguaréte te nombra <strong>Guerrero del Ñe'ẽ</strong>.
          </p>
          <p className="mt-1">
            Tu nombre queda grabado en las estrellas de Tupã.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary">XP ganado</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">+{xp}</div>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Mejor racha</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">
            {bestStreak} 🔥
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onReplay} className="flex-1" size="lg">
          Jugar de nuevo
        </Button>
        <Button onClick={onChoose} variant="outline" className="flex-1" size="lg">
          Elegir otra categoría
        </Button>
      </div>
    </div>
  );
}
