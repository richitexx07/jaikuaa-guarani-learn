import miniPenales from "@/assets/covers/mini/mini-penales.webp";
import { useTX, type TXKey } from "@/lib/i18n-pages";
import { useAppLang } from "@/lib/i18n";
import { localizarVocab } from "@/lib/significado";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Pointer, Volume2, X } from "lucide-react";
import { playGuarani } from "@/lib/audio";
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

/**
 * La voz con su tiempo: suena la palabra y, mientras suena (y un respiro después), la lección
 * no se apura. Así se escucha entera y se puede repetir en voz alta.
 */
function useVozConTiempo() {
  const [sonando, setSonando] = useState<string | null>(null);
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);
  const decir = useCallback((gn: string, respiro = 450) => {
    setSonando(gn);
    let hecho = false;
    const fin = () => {
      if (hecho) return;
      hecho = true;
      window.setTimeout(() => { if (vivo.current) setSonando(null); }, respiro);
    };
    // Si el audio no llega, la lección sigue igual a los pocos segundos.
    window.setTimeout(fin, 4000);
    return playGuarani(gn).catch(() => false).finally(fin);
  }, []);
  return { sonando, decir };
}

const LESSON_CSS = `
.lx-pop { animation: lx-pop .4s cubic-bezier(.2,1.3,.4,1) both; }
@keyframes lx-pop { from { opacity: 0; transform: translateY(8px) scale(.97); } }
.lx-shake { animation: lx-shake .35s ease-in-out; }
@keyframes lx-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.lx-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: lx-draw .5s cubic-bezier(.3,.7,.2,1) forwards; }
@keyframes lx-draw { to { stroke-dashoffset: 0; } }
.lx-hand { animation: lx-hand 1.1s ease-in-out infinite; }
@keyframes lx-hand { 50% { transform: translate(-6px, -6px) scale(.92); } }
.lx-nudge { animation: lx-nudge .9s ease-in-out infinite; }
@keyframes lx-nudge { 50% { transform: translateX(4px); } }
.lx-match { animation: lx-match .45s cubic-bezier(.2,1.4,.4,1); }
@keyframes lx-match { 40% { transform: scale(1.06); } }
@media (prefers-reduced-motion: reduce) { .lx-pop, .lx-shake, .lx-hand, .lx-nudge, .lx-match { animation: none; } .lx-draw { animation: none; stroke-dashoffset: 0; } }
`;

function LessonPage() {
  const tx = useTX();
  const { lang, lesson: crudo } = Route.useLoaderData() as unknown as {
    lang: NonNullable<ReturnType<typeof getLanguage>>;
    lesson: CourseLesson | null;
  };
  // El significado se muestra en el idioma de la persona (solo lo revisado por un docente; si falta, en castellano).
  const appLang = useAppLang();
  const lesson = useMemo(() => (crudo ? { ...crudo, vocab: localizarVocab(crudo.vocab, appLang) } : null), [crudo, appLang]);
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
  const { sonando, decir } = useVozConTiempo();
  const [enRonda, setEnRonda] = useState(false);
  const corta = useRef(false);
  useEffect(() => () => { corta.current = true; }, []);
  // Una por una, con un respiro entre palabra y palabra para repetirla en voz alta.
  async function escucharTodas() {
    if (enRonda) { corta.current = true; return; }
    corta.current = false;
    setEnRonda(true);
    for (const v of lesson.vocab) {
      if (corta.current) break;
      await decir(v.gn, 0);
      if (corta.current) break;
      await new Promise((r) => window.setTimeout(r, 1600));
    }
    setEnRonda(false);
  }
  return (
    <div>
      <JaiSays ok={null}>{tx("lsListenTip")}</JaiSays>
      <button
        type="button"
        onClick={() => void escucharTodas()}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/5 px-4 font-display text-base font-bold text-primary transition hover:bg-primary/10 active:scale-[0.99]"
      >
        {enRonda ? <X className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
        {enRonda ? tx("lsEscuchaParar") : tx("lsEscuchaTodas")}
      </button>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {lesson.vocab.map((v) => (
          <li
            key={v.gn}
            className={`relative flex min-h-[88px] items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition ${sonando === v.gn ? "border-[#E0A800] ring-4 ring-[#F6C445]/40" : "border-border/60"}`}
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
              <ReportErrorButton gn={v.gn} es={(v as VocabItem & { orig?: string }).orig ?? v.es} lugar={`Lección ${lesson.n}`} />
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
  const { sonando, decir } = useVozConTiempo();

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
        <span>{rev ? tx("lsHowGn") : tx("lsMeaning")}</span>
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
              "flex min-h-14 items-center justify-between gap-2 rounded-2xl border-2 border-border bg-background px-4 py-3 text-left text-base font-semibold tap-3d hover:border-primary/50";
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
                  // Acierte o no, se escucha cómo se dice, entera y sin apuro.
                  void decir(q.item.gn);
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
              disabled={sonando !== null}
              onClick={() => {
                setPicked(null);
                setI((x) => x + 1);
              }}
            >
              {sonando ? <><Volume2 className="h-5 w-5 motion-safe:animate-pulse" aria-hidden /> {tx("lsEscuchando")}</> : tx("next")}
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
  const [justMatched, setJustMatched] = useState<string | null>(null);
  const { sonando, decir } = useVozConTiempo();

  const lookup = useMemo(() => {
    const m = new Map<string, string>();
    pairs.forEach((p) => m.set(p.gn, p.es));
    return m;
  }, [pairs]);

  // Cada pareja unida lleva su color y su número, en las dos tarjetas y en la línea que las une:
  // así se ve de un vistazo qué va con qué.
  const order = [...matched];
  const pairIdx = (gn: string) => order.indexOf(gn);
  const gnOfEs = useMemo(() => {
    const m = new Map<string, string>();
    pairs.forEach((p) => m.set(p.es, p.gn));
    return m;
  }, [pairs]);

  function tryMatch(es: string) {
    if (!selectedGn || sonando) return;
    const ok = lookup.get(selectedGn) === es;
    logAnswer(selectedGn, ok, "lesson", lessonRef);
    if (ok) {
      const gn = selectedGn;
      setMatched((prev) => new Set(prev).add(gn));
      setSelectedGn(null);
      setWrong(null);
      setJustMatched(gn);
      // Al unirla, se escucha la palabra con su voz real, entera antes de seguir.
      void decir(gn);
    } else {
      setWrong({ gn: selectedGn, es });
      setTimeout(() => {
        setWrong(null);
        setSelectedGn(null);
      }, 650);
    }
  }

  // Líneas que unen cada pareja: se dibujan sobre las dos columnas.
  const boxRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef(new Map<string, HTMLElement>());
  const rightRefs = useRef(new Map<string, HTMLElement>());
  const [lines, setLines] = useState<{ gn: string; d: string; i: number }[]>([]);
  const measure = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    const out: { gn: string; d: string; i: number }[] = [];
    [...matched].forEach((gn, i) => {
      const l = leftRefs.current.get(gn);
      const r = rightRefs.current.get(lookup.get(gn) ?? "");
      if (!l || !r) return;
      const a = l.getBoundingClientRect();
      const c = r.getBoundingClientRect();
      const x1 = a.right - b.left - 2, y1 = a.top + a.height / 2 - b.top;
      const x2 = c.left - b.left + 2, y2 = c.top + c.height / 2 - b.top;
      const mx = (x1 + x2) / 2;
      out.push({ gn, i, d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}` });
    });
    setLines(out);
  }, [matched, lookup]);
  useLayoutEffect(() => {
    measure();
  }, [measure]);
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(box);
    return () => ro.disconnect();
  }, [measure]);

  const done = matched.size === pairs.length;
  const paso = sonando ? tx("lsMatchEscucha", { w: sonando }) : done ? tx("lsMatchDone") : wrong ? tx("lsMatchWrong") : selectedGn ? tx("lsMatchPaso2", { w: selectedGn }) : tx("lsMatchPaso1");

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
          <span aria-live="polite">{paso}</span>
        </JaiSays>
      </div>
      <div ref={boxRef} className="relative grid grid-cols-2 gap-x-9 sm:gap-x-14">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {lines.map((ln) => (
            <g key={ln.gn}>
              <path d={ln.d} fill="none" stroke="var(--background, #fff)" strokeWidth="9" strokeLinecap="round" pathLength={1} className="lx-draw" />
              <path d={ln.d} fill="none" stroke={PAIR_COLORS[ln.i % PAIR_COLORS.length]!.c} strokeWidth="5" strokeLinecap="round" pathLength={1} className="lx-draw" />
            </g>
          ))}
        </svg>
        <div className="space-y-2.5">
          {leftItems.map((gn, idx) => {
            const isMatched = matched.has(gn);
            const isSelected = selectedGn === gn;
            const isWrong = wrong?.gn === gn;
            const pc = isMatched ? PAIR_COLORS[pairIdx(gn) % PAIR_COLORS.length]! : null;
            let cls =
              "relative flex min-h-14 w-full items-center gap-2 rounded-2xl border-2 p-2.5 text-base font-display font-semibold shadow-sm transition";
            if (isMatched) cls += " bg-card text-foreground";
            else if (isWrong) cls += " lx-shake border-accent bg-accent/10 text-accent";
            else if (isSelected) cls += " -translate-y-0.5 scale-[1.03] border-[#E0A800] bg-[#FFF4CC] text-[#13233A] shadow-lg ring-4 ring-[#F6C445]/40 dark:bg-[#4A3A0A] dark:text-[#FFF4CC]";
            else cls += " border-border/70 bg-card hover:border-[#F6C445]";
            if (isMatched && justMatched === gn) cls += " lx-match";
            if (sonando === gn) cls += " ring-4 ring-[#F6C445]/50";
            return (
              <div
                key={gn}
                ref={(e) => {
                  if (e) leftRefs.current.set(gn, e);
                  else leftRefs.current.delete(gn);
                }}
                className={cls}
                style={pc ? { borderColor: pc.c, background: pc.bg } : undefined}
              >
                <SpeakerButton gn={gn} />
                <button
                  type="button"
                  disabled={isMatched}
                  aria-pressed={isSelected}
                  onClick={() => { if (!sonando) setSelectedGn(isSelected ? null : gn); }}
                  className="flex-1 self-stretch text-left"
                >
                  {gn}
                </button>
                {pc && <PairBadge n={pairIdx(gn) + 1} pc={pc} side="right" />}
                {isSelected && (
                  <span className="lx-nudge absolute -right-8 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-[#F6C445] text-[#13233A] shadow sm:-right-11" aria-hidden>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
                {!done && matched.size === 0 && !selectedGn && idx === 0 && (
                  <span className="lx-hand pointer-events-none absolute -bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-[#F6C445] text-[#13233A] shadow-lg" aria-hidden>
                    <Pointer className="h-5 w-5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="space-y-2.5">
          {rightItems.map((es) => {
            const gnM = gnOfEs.get(es);
            const isMatched = !!gnM && matched.has(gnM);
            const isWrong = wrong?.es === es;
            const pc = isMatched ? PAIR_COLORS[pairIdx(gnM!) % PAIR_COLORS.length]! : null;
            let cls =
              "relative flex min-h-14 w-full items-center rounded-2xl border-2 p-3 text-left text-base font-medium shadow-sm transition active:scale-[0.98]";
            if (isMatched) cls += " bg-card text-foreground";
            else if (isWrong) cls += " lx-shake border-accent bg-accent/10 text-accent";
            else if (selectedGn) cls += " border-[#F6C445] bg-card hover:bg-[#FFF4CC] dark:hover:bg-[#4A3A0A]";
            else cls += " border-border/70 bg-card opacity-80";
            if (isMatched && justMatched === gnM) cls += " lx-match";
            return (
              <button
                key={es}
                ref={(e) => {
                  if (e) rightRefs.current.set(es, e);
                  else rightRefs.current.delete(es);
                }}
                type="button"
                disabled={isMatched || !selectedGn}
                onClick={() => tryMatch(es)}
                className={cls}
                style={pc ? { borderColor: pc.c, background: pc.bg, opacity: 1 } : undefined}
              >
                {pc && <PairBadge n={pairIdx(gnM!) + 1} pc={pc} side="left" />}
                {es}
              </button>
            );
          })}
        </div>
      </div>

      {done && (
        <Button variant="cta" size="lg" className="mt-6 h-14 w-full text-base" disabled={sonando !== null} onClick={onNext}>
          {tx("lsFinish")}
        </Button>
      )}
    </div>
  );
}

/** Colores de las parejas unidas: los de la bandera y la marca, con su fondo suave. */
const PAIR_COLORS = [
  { c: "#D52B1E", bg: "rgba(213,43,30,.10)", fg: "#fff" },
  { c: "#0038A8", bg: "rgba(0,56,168,.10)", fg: "#fff" },
  { c: "#E0A800", bg: "rgba(246,196,69,.18)", fg: "#13233A" },
  { c: "#1F7A4D", bg: "rgba(31,122,77,.12)", fg: "#fff" },
  { c: "#7B3FA0", bg: "rgba(123,63,160,.10)", fg: "#fff" },
  { c: "#0E8A8A", bg: "rgba(14,138,138,.12)", fg: "#fff" },
] as const;

function PairBadge({ n, pc, side }: { n: number; pc: (typeof PAIR_COLORS)[number]; side: "left" | "right" }) {
  return (
    <span
      className={`absolute -top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold shadow ${side === "right" ? "-right-2" : "-left-2"}`}
      style={{ background: pc.c, color: pc.fg }}
      aria-hidden
    >
      {n}
    </span>
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

      {/* El premio: el juego refuerza lo que se acaba de aprender (con las palabras de esta lección). */}
      {langSlug === "guarani" && lesson.vocab.length >= 5 && (
        <a
          href={`/juegos/penales?leccion=${lesson.n}`}
          className="mt-8 flex items-center gap-3 overflow-hidden rounded-2xl bg-primary p-2 pr-4 text-left text-primary-foreground shadow-lift transition active:scale-[0.98]"
        >
          <img src={miniPenales} alt="" width={184} height={144} className="h-[72px] w-[92px] shrink-0 rounded-xl object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-[#F6C445]">{tx("lsPremio")}</span>
            <span className="block font-display text-base font-bold leading-tight sm:text-lg">{tx("lsPremioT")}</span>
          </span>
          <span className="shrink-0 rounded-xl bg-[#F6C445] px-3 py-2 text-sm font-bold text-[#13233A]">{tx("lsPremioJugar")}</span>
        </a>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
