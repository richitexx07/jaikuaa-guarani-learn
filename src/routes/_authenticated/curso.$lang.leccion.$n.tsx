import { useTX, type TXKey } from "@/lib/i18n-pages";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { celebrate } from "@/lib/confetti";
import jaiProfe from "@/assets/jai-profe.webp";
import jaiFesteja from "@/assets/jai/jai-trofeo.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiAnimo from "@/assets/jai/jai-animo.webp";
import jaiPiensa from "@/assets/jai/jai-piensa.webp";

import { Button } from "@/components/ui/button";
import { getLanguage } from "@/lib/languages";
import { getCourseLesson, type CourseLesson, type CourseVocabItem as VocabItem } from "@/lib/lessons.functions";
import { useRecordOnMount, useRecordVisit } from "@/lib/gamification";
import { logAnswer } from "@/lib/answer-log";
import { OfflineMissingError, withOfflineCache } from "@/lib/offline-data";
import { K } from "@/lib/offline-pack";
import {
  clearLessonDraft,
  draftFitsLesson,
  readLessonDraft,
  saveLessonDraft,
  type ChoiceDraft,
  type LessonDraft,
  type MatchDraft,
} from "@/lib/lesson-draft";

export const Route = createFileRoute("/_authenticated/curso/$lang/leccion/$n")({
  head: ({ params }) => ({
    meta: [{ title: `Jaikuaa — Lección ${params.n}` },
      { name: "description", content: "Practicá el contenido de esta lección de Jaikuaa y seguí tu progreso de aprendizaje." },
      { property: "og:title", content: `Jaikuaa — Lección ${params.n}` },
      { property: "og:description", content: "Practicá el contenido de esta lección de Jaikuaa y seguí tu progreso de aprendizaje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ params }) => {
    const lang = getLanguage(params.lang);
    if (!lang) throw notFound();
    if (params.lang !== "guarani") {
      return { lang, lesson: null };
    }
    const n = Number(params.n);
    if (!Number.isInteger(n) || n < 1) throw notFound();
    const { lesson } = await withOfflineCache(K.lesson(n), () => getCourseLesson({ data: { n } }), {
      label: `La lección ${n}`,
    });
    if (!lesson) throw notFound();
    return { lang, lesson };
  },
  notFoundComponent: () => <LessonNotFound />,
  errorComponent: ({ error, reset }) => <LessonError error={error} reset={reset} />,
  component: LessonPage,
});

function LessonNotFound() {
  const tx = useTX();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{tx("lsNotFound")}</h1>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">{tx("backPanelPlain")}</Link>
        </Button>
      </div>
    </div>
  );
}

function LessonError({ error, reset }: { error: unknown; reset: () => void }) {
  const tx = useTX();
  return error instanceof OfflineMissingError || (error as Error)?.name === "OfflineMissingError" ? (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <div className="text-5xl" aria-hidden>📶</div>
          <h1 className="mt-3 font-display text-2xl font-bold">{tx("offline")}</h1>
          <p className="mt-2 text-muted-foreground">
            {tx("lsOffline")}
          </p>
          <Button asChild variant="cta" className="mt-6">
            <Link to="/dashboard">{tx("goPanel")}</Link>
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">{tx("errorHappened")}</h1>
          <Button variant="cta" className="mt-4" onClick={() => reset()}>
            {tx("retry")}
          </Button>
        </div>
      </div>
    );
}

import { SpeakerButton } from "@/components/audio/speaker-button";
import { useRememberPlace } from "@/lib/last-place";
import { ReportErrorButton } from "@/components/report-error-button";

type Phase = "intro" | "vocab" | "choice" | "match" | "done";

const STEPS: { id: Phase; label: TXKey }[] = [
  { id: "vocab", label: "stListen" },
  { id: "choice", label: "stChoose" },
  { id: "match", label: "stMatch" },
  { id: "done", label: "stDone" },
];

/** Los cuatro pasos de la lección: se ve en qué paso vas y cuánto falta. */
function LessonSteps({ phase }: { phase: Phase }) {
  const tx = useTX();
  const at = STEPS.findIndex((s) => s.id === phase);
  return (
    <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label={tx("lsSteps")}>
      {STEPS.map((s, i) => {
        const done = at > i;
        const now = at === i;
        return (
          <li key={s.id} className="min-w-0">
            <span className={`block h-2 rounded-full transition-colors ${done || now ? "bg-accent" : "bg-muted"}`} />
            <span className={`mt-1 block truncate text-center text-[11px] font-semibold ${now ? "text-accent" : done ? "text-foreground" : "text-muted-foreground"}`}>
              {tx(s.label)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Jai comenta la respuesta: aplaude si acertaste, te da ánimo si no. */
function JaiSays({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  return (
    <div className="lx-pop flex items-center gap-3 rounded-2xl bg-muted/60 p-2 pr-4" aria-live="polite">
      <img src={ok === null ? jaiPiensa : ok ? jaiAplaude : jaiAnimo} alt="" className="h-16 w-16 shrink-0 object-contain" />
      <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{children}</p>
    </div>
  );
}

const LESSON_CSS = `
.lx-pop { animation: lx-pop .4s cubic-bezier(.2,1.3,.4,1) both; }
@keyframes lx-pop { from { opacity: 0; transform: translateY(8px) scale(.97); } }
.lx-shake { animation: lx-shake .35s ease-in-out; }
@keyframes lx-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@media (prefers-reduced-motion: reduce) { .lx-pop, .lx-shake { animation: none; } }
`;

function LessonPage() {
  const tx = useTX();
  const { lang, lesson } = Route.useLoaderData() as unknown as {
    lang: NonNullable<ReturnType<typeof getLanguage>>;
    lesson: CourseLesson | null;
  };
  const navigate = useNavigate();
  const [phase, setPhaseState] = useState<Phase>("intro");
  const [resumed, setResumed] = useState(false);
  const [round, setRound] = useState(0);
  const draft = useRef<Omit<LessonDraft, "savedAt">>({ phase: "intro" });
  useRecordVisit(`${lang.slug ?? "curso"}:${lesson?.n ?? 0}`);
  useRememberPlace(lesson ? `Lección ${lesson.n}: ${lesson.title}` : "", "lesson", !!lesson);

  // Si quedó una lección a medias en este teléfono, se sigue desde la misma pregunta.
  useEffect(() => {
    if (!lesson) return;
    const d = readLessonDraft(lang.slug, lesson.n);
    if (d && d.phase !== "intro" && d.phase !== "done" && draftFitsLesson(d, lesson.vocab)) {
      draft.current = { phase: d.phase, choice: d.choice, match: d.match };
      setPhaseState(d.phase);
      setResumed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (patch: Partial<Omit<LessonDraft, "savedAt">>) => {
    if (!lesson) return;
    draft.current = { ...draft.current, ...patch };
    if (draft.current.phase === "done") clearLessonDraft(lang.slug, lesson.n);
    else if (draft.current.phase !== "intro") saveLessonDraft(lang.slug, lesson.n, draft.current);
  };
  const setPhase = (p: Phase) => {
    persist({ phase: p });
    setPhaseState(p);
  };
  const restart = () => {
    if (lesson) clearLessonDraft(lang.slug, lesson.n);
    draft.current = { phase: "intro" };
    setResumed(false);
    setRound((r) => r + 1);
    setPhaseState("intro");
  };

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {tx("lsSoon")}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {tx("lsSoonInfo", { n: lang.name })}
        </p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/curso/$lang" params={{ lang: lang.slug }}>
            {tx("backCourse")}
          </Link>
        </Button>
      </div>
    );
  }

  if (lesson.vocab.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">{tx("csInValidation")}</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {tx("lsValInfo")}
        </p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/curso/$lang" params={{ lang: lang.slug }}>
            {tx("backCourse")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/curso/$lang"
            params={{ lang: lang.slug }}
            className="flex items-center gap-2 font-display text-lg font-bold text-primary"
          >
            <BrandLogo />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({ to: "/curso/$lang", params: { lang: lang.slug } })
            }
          >
            {tx("exit")}
          </Button>
        </div>
      </header>

      {/* pb-28: deja lugar para «Volver» y Jai, que flotan abajo y tapaban las últimas tarjetas. */}
      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
        <style>{LESSON_CSS}</style>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">
              {tx("lsHeader", { n: lesson.n, l: lang.name })}
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{lesson.theme}</p>
            <LessonSteps phase={phase} />
          </div>

          {resumed && phase !== "done" && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
              <span className="text-foreground">{tx("lsResumed")}</span>
              <button type="button" onClick={restart} className="font-semibold text-primary underline-offset-2 hover:underline">
                {tx("lsRestart")}
              </button>
            </div>
          )}
          {phase === "intro" && (
            <IntroStep lesson={lesson} onStart={() => setPhase("vocab")} />
          )}
          {phase === "vocab" && (
            <VocabStep lesson={lesson} onNext={() => setPhase("choice")} />
          )}
          {phase === "choice" && (
            <ChoiceStep
              key={`c${round}`}
              lesson={lesson}
              lessonRef={`${lang.slug}:${lesson.n}`}
              initial={draft.current.choice}
              onChange={(choice) => persist({ choice })}
              onNext={() => setPhase("match")}
            />
          )}
          {phase === "match" && (
            <MatchStep
              key={`m${round}`}
              lesson={lesson}
              lessonRef={`${lang.slug}:${lesson.n}`}
              initial={draft.current.match}
              onChange={(match) => persist({ match })}
              onNext={() => setPhase("done")}
            />
          )}
          {phase === "done" && <DoneStep lesson={lesson} langSlug={lang.slug} />}
        </div>
      </main>
    </div>
  );
}

function IntroStep({
  lesson,
  onStart,
}: {
  lesson: { vocab: VocabItem[] };
  onStart: () => void;
}) {
  const tx = useTX();
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-elegant sm:flex-row sm:text-left">
      <img src={jaiProfe} alt={tx("lsJaiAlt")} className="h-32 w-auto shrink-0 object-contain drop-shadow-lg sm:h-40" />
      <div className="w-full">
      <p className="text-base text-foreground">
        {tx("lsIntro", { n: lesson.vocab.length })}
      </p>
      <Button variant="cta" size="lg" className="mt-6 w-full" onClick={onStart}>
        {tx("lsStart")}
      </Button>
      </div>
    </div>
  );
}

function VocabStep({
  lesson,
  onNext,
}: {
  lesson: { n: number; vocab: VocabItem[] };
  onNext: () => void;
}) {
  const tx = useTX();
  return (
    <div>
      <JaiSays ok={null}>{tx("lsListenTip")}</JaiSays>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {lesson.vocab.map((v) => (
          <li
            key={v.gn}
            className="relative flex min-h-[88px] items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <SpeakerButton gn={v.gn} size="md" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-bold leading-tight text-primary">{v.gn}</div>
              <div className="text-sm text-muted-foreground">{v.es}</div>
              {v.validated && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <Check className="h-3 w-3" aria-hidden /> {tx("glReviewed")}
                </span>
              )}
            </div>
            <div className="shrink-0">
              <ReportErrorButton gn={v.gn} es={v.es} lugar={`Lección ${lesson.n}`} />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="cta" size="lg" className="mt-6 w-full" onClick={onNext}>
        {tx("lsToExercises")}
      </Button>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ChoiceStep({
  lesson,
  onNext,
  initial,
  onChange,
  lessonRef,
}: {
  lesson: { vocab: VocabItem[] };
  lessonRef?: string;
  onNext: () => void;
  initial?: ChoiceDraft;
  onChange?: (d: ChoiceDraft) => void;
}) {
  const tx = useTX();
  const questions = useMemo(() => {
    if (initial) {
      const byGn = new Map(lesson.vocab.map((v) => [v.gn, v]));
      return initial.questions.map((q) => ({ item: byGn.get(q.gn)!, options: q.options }));
    }
    const pool = lesson.vocab;
    const items = shuffle(pool).slice(0, Math.min(5, pool.length));
    // Bilingüismo de doble vía: las preguntas pares van guaraní → castellano y las impares castellano → guaraní.
    return items.map((item, idx) => {
      const rev = idx % 2 === 1;
      const key = rev ? "gn" : "es";
      const distractors = shuffle(pool.filter((p) => p[key] !== item[key]))
        .slice(0, 3)
        .map((d) => d[key]);
      return { item, options: shuffle([item[key], ...distractors]) };
    });
  }, [lesson]);

  const [i, setI] = useState(initial?.i ?? 0);
  const [picked, setPicked] = useState<string | null>(initial?.picked ?? null);
  const [correct, setCorrect] = useState(initial?.correct ?? 0);

  // Cada respuesta queda guardada en el teléfono.
  useEffect(() => {
    onChange?.({
      questions: questions.map((q) => ({ gn: q.item.gn, options: q.options })),
      i,
      correct,
      picked,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, correct, picked]);

  if (i >= questions.length) {
    return (
      <div className="lx-pop rounded-3xl border border-border/60 bg-card p-6 text-center shadow-elegant">
        <img src={correct >= Math.ceil(questions.length / 2) ? jaiAplaude : jaiAnimo} alt="" className="mx-auto h-28 w-auto object-contain" />
        <div className="mt-2 font-display text-2xl font-bold text-foreground">
          {tx("lsGoodJob")}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {tx("lsGot", { a: correct, b: questions.length })}
        </p>
        <Button variant="cta" size="lg" className="mt-6 w-full" onClick={onNext}>
          {tx("lsNextMatch")}
        </Button>
      </div>
    );
  }

  const q = questions[i];
  const rev = i % 2 === 1;
  const answer = rev ? q.item.gn : q.item.es;
  const isCorrect = picked !== null && picked === answer;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{rev ? "¿Cómo se dice en guaraní?" : tx("lsMeaning")}</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5">
          {tx("csOf", { a: i + 1, b: questions.length })}
        </span>
      </div>
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-elegant sm:p-6">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          {!rev && <SpeakerButton gn={q.item.gn} size="md" />}
          <div className="font-display text-4xl font-bold leading-tight text-primary">{rev ? q.item.es : q.item.gn}</div>
        </div>

        <div className="mt-5 grid gap-2.5">
          {q.options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === answer;
            let cls =
              "flex min-h-14 items-center justify-between gap-2 rounded-2xl border-2 border-border/70 bg-background px-4 py-3 text-left text-base font-semibold transition active:scale-[0.98] hover:border-primary/50";
            if (picked) {
              if (isAnswer) cls += " border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
              else if (isPicked) cls += " lx-shake border-accent bg-accent/10 text-accent";
              else cls += " opacity-50";
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(opt);
                  if (opt === answer) setCorrect((c) => c + 1);
                  logAnswer(q.item.gn, opt === answer, "lesson", lessonRef);
                }}
                className={cls}
              >
                <span>{opt}</span>
                {picked && isAnswer && <Check className="h-5 w-5 shrink-0" />}
                {picked && !isAnswer && isPicked && <X className="h-5 w-5 shrink-0" />}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-5 space-y-3">
            <JaiSays ok={isCorrect}>
              {isCorrect ? tx("lsRight") : <>{tx("lsAlmost")} <strong>{q.item.gn}</strong> {tx("lsMeans")} «{q.item.es}».</>}
            </JaiSays>
            <Button
              variant="cta"
              size="lg"
              className="h-14 w-full text-base"
              onClick={() => {
                setPicked(null);
                setI((x) => x + 1);
              }}
            >
              {tx("next")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchStep({
  lesson,
  onNext,
  initial,
  onChange,
  lessonRef,
}: {
  lesson: { vocab: VocabItem[] };
  lessonRef?: string;
  onNext: () => void;
  initial?: MatchDraft;
  onChange?: (d: MatchDraft) => void;
}) {
  const tx = useTX();
  const pairs = useMemo(() => {
    if (initial) {
      const byGn = new Map(lesson.vocab.map((v) => [v.gn, v]));
      return initial.pairs.map((g) => byGn.get(g)!);
    }
    return shuffle(lesson.vocab).slice(0, Math.min(6, lesson.vocab.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);
  const leftItems = useMemo(() => initial?.left ?? shuffle(pairs).map((p) => p.gn), [pairs, initial]);
  const rightItems = useMemo(() => initial?.right ?? shuffle(pairs).map((p) => p.es), [pairs, initial]);

  const [selectedGn, setSelectedGn] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(() => new Set(initial?.matched ?? []));

  useEffect(() => {
    onChange?.({ pairs: pairs.map((p) => p.gn), left: leftItems, right: rightItems, matched: [...matched] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);
  const [wrong, setWrong] = useState<{ gn: string; es: string } | null>(null);

  const lookup = useMemo(() => {
    const m = new Map<string, string>();
    pairs.forEach((p) => m.set(p.gn, p.es));
    return m;
  }, [pairs]);

  function tryMatch(es: string) {
    if (!selectedGn) return;
    const ok = lookup.get(selectedGn) === es;
    logAnswer(selectedGn, ok, "lesson", lessonRef);
    if (ok) {
      setMatched((prev) => new Set(prev).add(selectedGn));
      setSelectedGn(null);
      setWrong(null);
    } else {
      setWrong({ gn: selectedGn, es });
      setTimeout(() => {
        setWrong(null);
        setSelectedGn(null);
      }, 600);
    }
  }

  const done = matched.size === pairs.length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{tx("lsMatchTitle")}</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5">
          {tx("csOf", { a: matched.size, b: pairs.length })}
        </span>
      </div>
      <div className="mb-4">
        <JaiSays ok={done ? true : wrong ? false : null}>
          {done ? tx("lsMatchDone") : wrong ? tx("lsMatchWrong") : tx("lsMatchHow")}
        </JaiSays>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-2.5">
          {leftItems.map((gn) => {
            const isMatched = matched.has(gn);
            const isSelected = selectedGn === gn;
            const isWrong = wrong?.gn === gn;
            let cls =
              "flex min-h-14 w-full items-center gap-2 rounded-2xl border-2 border-border/70 bg-card p-2.5 text-base font-display font-semibold shadow-sm transition";
            if (isMatched) cls += " border-emerald-600 bg-emerald-50 text-emerald-800 opacity-70 dark:bg-emerald-900/30 dark:text-emerald-200";
            else if (isWrong) cls += " lx-shake border-accent bg-accent/10 text-accent";
            else if (isSelected) cls += " border-primary bg-primary/10 text-primary";
            else cls += " hover:border-accent/60";
            // El parlante va al lado del botón de la palabra, no adentro: un botón dentro de otro
            // hacía que escuchar la palabra también la seleccionara.
            return (
              <div key={gn} className={cls}>
                <SpeakerButton gn={gn} />
                <button
                  type="button"
                  disabled={isMatched}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedGn(gn)}
                  className="flex-1 self-stretch text-left"
                >
                  {gn}
                </button>
              </div>
            );
          })}
        </div>
        <div className="space-y-2.5">
          {rightItems.map((es) => {
            const isMatched = [...matched].some((gn) => lookup.get(gn) === es);
            const isWrong = wrong?.es === es;
            let cls =
              "flex min-h-14 w-full items-center rounded-2xl border-2 border-border/70 bg-card p-3 text-left text-base font-medium shadow-sm transition active:scale-[0.98]";
            if (isMatched) cls += " border-emerald-600 bg-emerald-50 text-emerald-800 opacity-70 dark:bg-emerald-900/30 dark:text-emerald-200";
            else if (isWrong) cls += " lx-shake border-accent bg-accent/10 text-accent";
            else cls += " hover:border-accent/60";
            return (
              <button
                key={es}
                type="button"
                disabled={isMatched}
                onClick={() => tryMatch(es)}
                className={cls}
              >
                {es}
              </button>
            );
          })}
        </div>
      </div>

      {done && (
        <Button variant="cta" size="lg" className="mt-6 h-14 w-full text-base" onClick={onNext}>
          {tx("lsFinish")}
        </Button>
      )}
    </div>
  );
}

function DoneStep({
  lesson,
  langSlug,
}: {
  lesson: { n: number; title: string; vocab: VocabItem[] };
  langSlug: string;
}) {
  const tx = useTX();
  const xp = 10 + lesson.vocab.length * 2;
  useRecordOnMount({
    xp,
    isGuaraniLesson: langSlug === "guarani",
    source: "lesson",
    sourceRef: `${langSlug}:${lesson.n}`,
  });
  useEffect(() => { celebrate("big"); }, []);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-lift animate-scale-in">
      <img src={jaiFesteja} alt={tx("lgJaiAlt")} className="mx-auto h-44 w-auto object-contain drop-shadow-xl sm:h-52" />
      <h2 className="mt-4 font-display text-3xl font-bold text-foreground">
        {tx("lsCompleted")}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {tx("lsFinished", { t: lesson.title })} ¡Aguyje!
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-display text-base font-bold text-accent-foreground shadow">
        +{xp} XP
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" size="lg">
          <Link to="/curso/$lang" params={{ lang: langSlug }}>
            {tx("backCourse")}
          </Link>
        </Button>
        <Button asChild variant="cta" size="lg">
          <Link to="/dashboard">{tx("goPanel")}</Link>
        </Button>
      </div>
    </div>
  );
}
