import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { celebrate } from "@/lib/confetti";

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
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Lección no encontrada</h1>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) =>
    error instanceof OfflineMissingError || (error as Error)?.name === "OfflineMissingError" ? (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <div className="text-5xl" aria-hidden>📶</div>
          <h1 className="mt-3 font-display text-2xl font-bold">Sin conexión</h1>
          <p className="mt-2 text-muted-foreground">
            Esta lección todavía no está descargada en tu teléfono. Cuando tengas señal, tocá
            «Descargar para usar sin internet» en tu panel y vas a poder hacerla en cualquier lugar.
          </p>
          <Button asChild variant="cta" className="mt-6">
            <Link to="/dashboard">Ir al panel</Link>
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Ocurrió un error</h1>
          <Button variant="cta" className="mt-4" onClick={() => reset()}>
            Reintentar
          </Button>
        </div>
      </div>
    ),
  component: LessonPage,
});

import { SpeakerButton } from "@/components/audio/speaker-button";
import { ReportErrorButton } from "@/components/report-error-button";

type Phase = "intro" | "vocab" | "choice" | "match" | "done";

function LessonPage() {
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
          Contenido próximamente
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Las lecciones de {lang.name} estarán disponibles muy pronto.
        </p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/curso/$lang" params={{ lang: lang.slug }}>
            Volver al curso
          </Link>
        </Button>
      </div>
    );
  }

  if (lesson.vocab.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">En validación</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Las palabras de esta lección todavía están siendo revisadas por docentes.
        </p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/curso/$lang" params={{ lang: lang.slug }}>
            Volver al curso
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
            ✕ Salir
          </Button>
        </div>
      </header>

      {/* pb-28: deja lugar para «Volver» y Jai, que flotan abajo y tapaban las últimas tarjetas. */}
      <main className="flex-1 px-4 pb-28 pt-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">
              Lección {lesson.n} · {lang.name}
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              {lesson.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{lesson.theme}</p>
          </div>

          {resumed && phase !== "done" && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
              <span className="text-foreground">↩︎ Seguís donde habías quedado.</span>
              <button type="button" onClick={restart} className="font-semibold text-primary underline-offset-2 hover:underline">
                Empezar de nuevo
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
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <p className="text-base text-foreground">
        Vas a aprender <strong>{lesson.vocab.length}</strong> palabras en guaraní.
        Primero las practicamos, después hacemos ejercicios.
      </p>
      <Button variant="cta" size="lg" className="mt-6 w-full" onClick={onStart}>
        Empezar lección
      </Button>
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
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground">
        Vocabulario
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tocá el 🔊 para escuchar cada palabra.
      </p>
      <ul className="mt-4 space-y-2">
        {lesson.vocab.map((v) => (
          <li
            key={v.gn}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <SpeakerButton gn={v.gn} />
              <div>
                <div className="font-display text-base font-semibold text-foreground">
                  {v.gn}
                </div>
                <div className="text-sm text-muted-foreground">{v.es}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {v.validated && (
                <span className="text-[11px] font-medium text-primary/80">
                  ✓ Validado por docente
                </span>
              )}
              <ReportErrorButton gn={v.gn} es={v.es} lugar={`Lección ${lesson.n}`} />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="cta" size="lg" className="mt-6 w-full" onClick={onNext}>
        Continuar a los ejercicios →
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
  const questions = useMemo(() => {
    if (initial) {
      const byGn = new Map(lesson.vocab.map((v) => [v.gn, v]));
      return initial.questions.map((q) => ({ item: byGn.get(q.gn)!, options: q.options }));
    }
    const pool = lesson.vocab;
    const items = shuffle(pool).slice(0, Math.min(5, pool.length));
    return items.map((item) => {
      const distractors = shuffle(pool.filter((p) => p.es !== item.es))
        .slice(0, 3)
        .map((d) => d.es);
      return { item, options: shuffle([item.es, ...distractors]) };
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
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
        <div className="font-display text-2xl font-bold text-foreground">
          ¡Buen trabajo!
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Acertaste {correct} de {questions.length}.
        </p>
        <Button variant="cta" size="lg" className="mt-6 w-full" onClick={onNext}>
          Siguiente: emparejar →
        </Button>
      </div>
    );
  }

  const q = questions[i];
  const isCorrect = picked !== null && picked === q.item.es;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Opción múltiple</span>
        <span>
          {i + 1} / {questions.length}
        </span>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">¿Qué significa?</p>
        <div className="mt-3 flex items-center gap-3">
          <SpeakerButton gn={q.item.gn} />
          <div className="font-display text-3xl font-bold text-primary">
            {q.item.gn}
          </div>
        </div>

        <div className="mt-6 grid gap-2">
          {q.options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === q.item.es;
            let cls =
              "flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 text-left text-sm font-medium transition hover:border-accent/60";
            if (picked) {
              if (isAnswer) cls += " border-green-600 bg-green-50 text-green-800";
              else if (isPicked) cls += " border-accent bg-accent/10 text-accent";
              else cls += " opacity-60";
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(opt);
                  if (opt === q.item.es) setCorrect((c) => c + 1);
                  logAnswer(q.item.gn, opt === q.item.es, "lesson", lessonRef);
                }}
                className={cls}
              >
                <span>{opt}</span>
                {picked && isAnswer && <Check className="h-4 w-4" />}
                {picked && !isAnswer && isPicked && <X className="h-4 w-4" />}
              </button>
            );
          })}
        </div>

        {picked && (
          <Button
            variant="cta"
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              setPicked(null);
              setI((x) => x + 1);
            }}
          >
            {isCorrect ? "¡Correcto!" : "Continuar"} →
          </Button>
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
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Emparejar</span>
        <span>
          {matched.size} / {pairs.length}
        </span>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Tocá una palabra en guaraní y después su significado en español.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {leftItems.map((gn) => {
            const isMatched = matched.has(gn);
            const isSelected = selectedGn === gn;
            const isWrong = wrong?.gn === gn;
            let cls =
              "flex w-full items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-sm font-display font-semibold shadow-sm transition";
            if (isMatched) cls += " border-green-600 bg-green-50 text-green-800 opacity-70";
            else if (isWrong) cls += " border-accent bg-accent/10 text-accent";
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
        <div className="space-y-2">
          {rightItems.map((es) => {
            const isMatched = [...matched].some((gn) => lookup.get(gn) === es);
            const isWrong = wrong?.es === es;
            let cls =
              "flex w-full items-center rounded-xl border border-border/60 bg-card p-3 text-left text-sm font-medium shadow-sm transition";
            if (isMatched) cls += " border-green-600 bg-green-50 text-green-800 opacity-70";
            else if (isWrong) cls += " border-accent bg-accent/10 text-accent";
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
        <Button variant="cta" size="lg" className="mt-6 w-full" onClick={onNext}>
          ¡Listo! Terminar lección →
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
      <div className="text-6xl" aria-hidden>
        🎉
      </div>
      <h2 className="mt-4 font-display text-3xl font-bold text-foreground">
        ¡Lección completada!
      </h2>
      <p className="mt-2 text-muted-foreground">
        Terminaste “{lesson.title}”. ¡Aguyje!
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-display text-base font-bold text-accent-foreground shadow">
        +{xp} XP
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" size="lg">
          <Link to="/curso/$lang" params={{ lang: langSlug }}>
            Volver al curso
          </Link>
        </Button>
        <Button asChild variant="cta" size="lg">
          <Link to="/dashboard">Ir al panel</Link>
        </Button>
      </div>
    </div>
  );
}
