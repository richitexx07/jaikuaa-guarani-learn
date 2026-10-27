import { createFileRoute, Link } from "@tanstack/react-router";
import { useEscolarTx, type EscolarKey } from "@/lib/i18n-escolar";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ESCOLAR_GRADES, loadEscolarGrade, saveEscolarGrade, temasFor, type QuizQuestion, type Tema } from "@/lib/guarani-tema";
import { useRecordOnMount, useRecordVisit } from "@/lib/gamification";
import { celebrate } from "@/lib/confetti";
import jaiFesteja from "@/assets/jai/jai-festeja.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiAnimo from "@/assets/jai/jai-animo.webp";
import { SpeakerButton } from "@/components/audio/speaker-button";


export const Route = createFileRoute("/_authenticated/guarani-escolar/rescate")({
  head: () => ({ meta: [{ title: "Jaikuaa — Modo Rescate" },
      { name: "description", content: "Accedé al espacio Modo Rescate de Guaraní Escolar en Jaikuaa; materiales en validación." },
      { property: "og:title", content: "Jaikuaa — Modo Rescate" },
      { property: "og:description", content: "Accedé al espacio Modo Rescate de Guaraní Escolar en Jaikuaa; materiales en validación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: ModoRescate,
});

const WHENS = ["Hoy", "Mañana", "En 3 días", "Esta semana"] as const;
const GRADES = ESCOLAR_GRADES;
type When = (typeof WHENS)[number];
type Grade = (typeof GRADES)[number];

type Phase =
  | { kind: "setup" }
  | { kind: "plan" }
  | { kind: "review"; topicIndex: number }
  | { kind: "exam" }
  | { kind: "done"; score: number; nota: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExam(temas: Tema[]): QuizQuestion[] {
  // Pick ~2 from each topic, total 10, then shuffle
  const pool: QuizQuestion[] = [];
  for (const t of temas) {
    pool.push(...shuffle(t.quiz).slice(0, 2));
  }
  return shuffle(pool).slice(0, 10);
}

function notaFromScore(score: number, total: number): number {
  const pct = score / total;
  if (pct >= 0.9) return 5;
  if (pct >= 0.75) return 4;
  if (pct >= 0.6) return 3;
  if (pct >= 0.4) return 2;
  return 1;
}

function feedbackFor(nota: number, t: ReturnType<typeof useEscolarTx>): string {
  if (nota === 5) return t("nota5");
  if (nota >= 3) return t("nota3");
  return t("nota1");
}

function ModoRescate() {
  useRecordVisit("rescate");
  const [when, setWhen] = useState<When | null>(null);
  const [grade, setGradeState] = useState<Grade>("6° grado");
  useEffect(() => setGradeState(loadEscolarGrade() as Grade), []);
  const setGrade = (g: Grade) => { setGradeState(g); saveEscolarGrade(g); };
  const TEMAS = temasFor(grade);
  const [phase, setPhase] = useState<Phase>({ kind: "setup" });

  if (phase.kind === "setup") {
    return (
      <SetupScreen
        when={when}
        setWhen={setWhen}
        grade={grade}
        setGrade={setGrade}
        onStart={() => setPhase({ kind: "plan" })}
      />
    );
  }

  if (phase.kind === "plan") {
    return (
      <PlanScreen
        when={when!}
        grade={grade}
        onStartReview={() => setPhase({ kind: "review", topicIndex: 0 })}
        onSkipToExam={() => setPhase({ kind: "exam" })}
      />
    );
  }

  if (phase.kind === "review") {
    const topic = TEMAS[phase.topicIndex];
    const isLast = phase.topicIndex === TEMAS.length - 1;
    return (
      <ReviewScreen
        topic={topic}
        index={phase.topicIndex}
        total={TEMAS.length}
        onNext={() =>
          isLast
            ? setPhase({ kind: "exam" })
            : setPhase({ kind: "review", topicIndex: phase.topicIndex + 1 })
        }
        onSkipToExam={() => setPhase({ kind: "exam" })}
      />
    );
  }

  if (phase.kind === "exam") {
    return (
      <ExamScreen
        temas={TEMAS}
        onDone={(score, total) =>
          setPhase({ kind: "done", score, nota: notaFromScore(score, total) })
        }
      />
    );
  }

  return (
    <DoneScreen
      score={phase.score}
      nota={phase.nota}
      onRetry={() => setPhase({ kind: "exam" })}
    />
  );
}

function UrgencyBadge({ when }: { when: When }) {
  const t = useEscolarTx();
  const tone =
    when === "Hoy" || when === "Mañana"
      ? "bg-accent text-accent-foreground"
      : "bg-primary text-primary-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {t("testWhen", { a: t(`w.${when}` as EscolarKey) })}
    </span>
  );
}

function SetupScreen({
  when,
  setWhen,
  grade,
  setGrade,
  onStart,
}: {
  when: When | null;
  setWhen: (w: When) => void;
  grade: Grade;
  setGrade: (g: Grade) => void;
  onStart: () => void;
}) {
  const t = useEscolarTx();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
          {t("rescue")} <span aria-hidden className="ml-2">🚨</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
          {t("calm")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
          {t("tellUs")}
        </p>
      </div>

      <div className="mt-8 space-y-6 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div>
          <label className="block text-sm font-semibold text-foreground">
            {t("whenTest")}
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {WHENS.map((w) => (
              <Button
                key={w}
                variant={w === when ? "cta" : "outline"}
                size="sm"
                onClick={() => setWhen(w)}
                aria-pressed={w === when}
              >
                {t(`w.${w}` as EscolarKey)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground">{t("whichGrade2")}</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <Button
                key={g}
                variant={g === grade ? "cta" : "outline"}
                size="sm"
                onClick={() => setGrade(g)}
                aria-pressed={g === grade}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant="cta"
          size="lg"
          className="w-full"
          disabled={!when}
          onClick={onStart}
        >
          {t("startRescue")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("adapted", { a: grade })}
        </p>
      </div>

      <div className="mt-6 text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/guarani-escolar">{t("back")}</Link>
        </Button>
      </div>
    </div>
  );
}

function PlanScreen({
  when,
  grade,
  onStartReview,
  onSkipToExam,
}: {
  when: When;
  grade: Grade;
  onStartReview: () => void;
  onSkipToExam: () => void;
}) {
  const t = useEscolarTx();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <UrgencyBadge when={when} />
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {grade}
        </span>
      </div>
      <h1 className="mt-4 text-center font-display text-3xl font-bold text-foreground">
        {t("yourPlan")}
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-base text-muted-foreground">
        {t("planSub")}
      </p>

      <ol className="mt-8 space-y-3">
        {temasFor(grade).map((tm, i) => (
          <li
            key={tm.slug}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
              {i + 1}
            </div>
            <div className="text-2xl" aria-hidden>
              {tm.emoji}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{tm.title}</div>
              <div className="text-xs text-muted-foreground">{tm.subtitle}</div>
            </div>
          </li>
        ))}
        <li className="flex items-center gap-3 rounded-xl border-2 border-accent/40 bg-accent/5 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
            ✓
          </div>
          <div className="text-2xl" aria-hidden>
            📝
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground">{t("mock")}</div>
            <div className="text-xs text-muted-foreground">
              {t("mockSub")}
            </div>
          </div>
        </li>
      </ol>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button variant="cta" size="lg" className="flex-1" onClick={onStartReview}>
          {t("startReview")}
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={onSkipToExam}>
          {t("directMock")}
        </Button>
      </div>
    </div>
  );
}

function ReviewScreen({
  topic,
  index,
  total,
  onNext,
  onSkipToExam,
}: {
  topic: Tema;
  index: number;
  total: number;
  onNext: () => void;
  onSkipToExam: () => void;
}) {
  const isLast = index === total - 1;
  const t = useEscolarTx();



  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>
          {t("topicN", { a: index + 1, b: total })}
        </span>
        <span className="text-accent">🚨 {t("rescue")}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${((index + 1) / (total + 1)) * 100}%` }}
        />
      </div>

      <div className="mt-6 flex items-start gap-3">
        <div className="text-4xl" aria-hidden>
          {topic.emoji}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {topic.title}
          </h1>
          <p className="text-sm text-muted-foreground">{topic.subtitle}</p>
          {t("contentEs") && <p className="mt-1 text-xs text-muted-foreground">{t("contentEs")}</p>}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-foreground">{topic.explanation}</p>
      </div>

      <h2 className="mt-6 font-display text-lg font-semibold text-foreground">
        {t("essential")}
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {topic.vocab.map((v) => (
          <li
            key={v.gn}
            className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm"
          >
            <div>
              <div className="font-display font-semibold text-primary">{v.gn}</div>
              <div className="text-xs text-muted-foreground">{v.es}</div>
            </div>
            <SpeakerButton gn={v.gn} size="md" />
          </li>
        ))}
      </ul>


      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button variant="cta" size="lg" className="flex-1" onClick={onNext}>
          {isLast ? t("toMock") : t("nextTopic")}
        </Button>
        <Button variant="outline" size="lg" onClick={onSkipToExam}>
          {t("skipMock")}
        </Button>
      </div>
    </div>
  );
}

function ExamScreen({ onDone, temas }: { onDone: (score: number, total: number) => void; temas: Tema[] }) {
  const questions = useMemo(() => buildExam(temas), [temas]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const q = questions[i];
  const isLast = i === questions.length - 1;
  const t = useEscolarTx();

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    if (opt === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (isLast) {
      onDone(score, questions.length);
    } else {
      setI((n) => n + 1);
      setPicked(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>
          {t("q", { a: i + 1, b: questions.length })}
        </span>
        <span className="text-accent">{t("mockTag")}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${((i + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          {q.prompt}
        </h2>
        <div className="mt-5 grid gap-3">
          {q.options.map((opt) => {
            const isCorrect = picked && opt === q.answer;
            const isWrongPick = picked === opt && opt !== q.answer;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => choose(opt)}
                disabled={!!picked}
                className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition disabled:cursor-not-allowed ${
                  isCorrect
                    ? "border-green-600 bg-green-50 text-green-800"
                    : isWrongPick
                      ? "border-accent bg-accent/10 text-accent"
                      : picked
                        ? "border-border/60 bg-card text-muted-foreground"
                        : "border-border/60 bg-card text-foreground hover:border-primary hover:bg-primary/5 active:scale-[0.99]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {t("score", { a: score, b: i + 1 })}
            </span>
            <Button variant="cta" onClick={next}>
              {isLast ? t("seeResult") : t("next")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function DoneScreen({
  score,
  nota,
  onRetry,
}: {
  score: number;
  nota: number;
  onRetry: () => void;
}) {
  const t = useEscolarTx();
  const feedback = feedbackFor(nota, t);
  useRecordOnMount({ xp: 30 + score * 5, perfectExam: nota === 5, source: "exam", sourceRef: "rescate" });
  useEffect(() => {
    if (nota >= 3) celebrate(nota === 5 ? "big" : "small");
  }, [nota]);

  const tone =
    nota === 5
      ? "from-green-500/15 to-primary/10 border-green-500/30"
      : nota >= 3
        ? "from-primary/15 to-accent/10 border-primary/30"
        : "from-accent/15 to-primary/10 border-accent/30";

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className={`rounded-3xl border-2 bg-gradient-to-br ${tone} p-8 shadow-sm`}>
        <img
          src={nota === 5 ? jaiFesteja : nota >= 3 ? jaiAplaude : jaiAnimo}
          alt=""
          className="mx-auto h-40 w-auto object-contain drop-shadow-xl"
        />
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
          {t("scored", { a: score, b: 10 })}
        </h1>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-5 py-2 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("grade")}
          </span>
          <span className="font-display text-3xl font-bold text-primary">{nota}</span>
          <span className="text-sm text-muted-foreground">/ 5</span>
        </div>
        <p className="mt-5 text-lg font-medium text-foreground">{feedback}</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="cta" size="lg" onClick={onRetry}>
          {t("redo")}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/guarani-escolar/tema">{t("byTopic")}</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link to="/guarani-escolar">{t("back")}</Link>
        </Button>
      </div>
    </div>
  );
}
