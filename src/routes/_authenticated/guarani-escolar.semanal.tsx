import { createFileRoute, Link } from "@tanstack/react-router";
import { useEscolarTx } from "@/lib/i18n-escolar";
import { useEffect, useState } from "react";
import { Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ESCOLAR_GRADES, temasFor, saveEscolarGrade, type EscolarGrade } from "@/lib/guarani-tema";
import { recordCompletion, useRecordVisit } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/guarani-escolar/semanal")({
  head: () => ({ meta: [{ title: "Jaikuaa — Plan Semanal" },
      { name: "description", content: "Consultá el espacio Plan Semanal de Guaraní Escolar en Jaikuaa; materiales en validación." },
      { property: "og:title", content: "Jaikuaa — Plan Semanal" },
      { property: "og:description", content: "Consultá el espacio Plan Semanal de Guaraní Escolar en Jaikuaa; materiales en validación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: PlanSemanal,
});

const GRADES = ESCOLAR_GRADES;
type Grade = (typeof GRADES)[number];

type DayPlan = {
  day: string;
  short: string;
  topicIdx: number[];
  label: string;
  isReview?: boolean;
};

const WEEK: DayPlan[] = [
  { day: "Lunes", short: "Lun", topicIdx: [0], label: "" },
  { day: "Martes", short: "Mar", topicIdx: [1], label: "" },
  { day: "Miércoles", short: "Mié", topicIdx: [2], label: "" },
  { day: "Jueves", short: "Jue", topicIdx: [3], label: "" },
  {
    day: "Viernes",
    short: "Vie",
    topicIdx: [4, 5],
    label: "Temas 5 y 6 + repaso",
    isReview: true,
  },
];

const STORAGE_KEY = "aranduka:plan-semanal";

type Saved = { grade: Grade; completed: Record<string, boolean> };

function loadState(): Saved {
  if (typeof window === "undefined") return { grade: "6° grado", completed: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) { const s = JSON.parse(raw) as Saved; if (!(GRADES as readonly string[]).includes(s.grade)) s.grade = "1° Media"; return s; }
  } catch {}
  return { grade: "6° grado", completed: {} };
}

function PlanSemanal() {
  useRecordVisit("semanal");
  const t = useEscolarTx();
  const dayIdx = (day: string) => WEEK.findIndex((w) => w.day === day);
  const [phase, setPhase] = useState<"setup" | "plan">("setup");
  const [grade, setGrade] = useState<Grade>("6° grado");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const s = loadState();
    setGrade(s.grade);
    setCompleted(s.completed);
    if (s.completed && Object.keys(s.completed).length > 0) setPhase("plan");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ grade, completed } satisfies Saved),
    );
  }, [grade, completed]);

  const doneCount = WEEK.filter((d) => completed[d.day]).length;
  const totalDays = WEEK.length;
  const pct = Math.round((doneCount / totalDays) * 100);

  const feedback =
    doneCount === 0
      ? t("fb0")
      : doneCount < 3
        ? t("fb1")
        : doneCount < 5
          ? t("fb2")
          : t("fb3");

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {t("plan")} <span aria-hidden className="ml-2">📅</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
            {t("organize")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t("oneADay")}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <label className="block text-sm font-medium text-muted-foreground">
            {t("whichGrade")}
          </label>
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

          <Button
            variant="cta"
            className="mt-6 w-full"
            onClick={() => setPhase("plan")}
          >
            {t("seePlan")}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/guarani-escolar"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("backEscolar")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Calendar className="size-3.5" /> {t("plan")} · {grade}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
            {t("yourWeek")}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPhase("setup")}>
          {t("changeGrade")}
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {t("doneDays", { a: doneCount, b: totalDays })}
          </p>
          <span className="text-sm font-semibold text-primary">{pct}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{feedback}</p>
      </div>

      <ul className="mt-6 space-y-3">
        {WEEK.map((d) => {
          const isDone = !!completed[d.day];
          const all = temasFor(grade as EscolarGrade);
          const topics = d.topicIdx.map((n) => all[n]).filter(Boolean);
          return (
            <li
              key={d.day}
              className={`rounded-2xl border bg-card p-4 shadow-sm transition ${
                isDone ? "border-accent/40 bg-accent/5" : "border-border/60"
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-bold ${
                    isDone
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                  aria-hidden
                >
                  {isDone ? <Check className="size-5" /> : t(`s${dayIdx(d.day)}` as "s0")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(`d${dayIdx(d.day)}` as "d0")}
                    {d.isReview && (
                      <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {t("review")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-display text-base font-semibold text-foreground">
                    {topics.map((tp) => `${tp.emoji} ${tp.title}`).join(" + ")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {topics.map((tp) => (
                  <Button
                    key={tp.slug}
                    asChild
                    variant={isDone ? "outline" : "cta"}
                    size="sm"
                  >
                    <Link
                      to="/guarani-escolar/tema/$topic"
                      params={{ topic: tp.slug }}
                    >
                      {topics.length > 1 ? t("doTopic", { a: tp.title }) : t("doLesson")} →
                    </Link>
                  </Button>
                ))}
                <Button
                  variant={isDone ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setCompleted((c) => {
                      const wasDone = !!c[d.day];
                      if (!wasDone) recordCompletion({ xp: 20, source: "weekly", sourceRef: `semanal:${d.day}` });
                      return { ...c, [d.day]: !wasDone };
                    })
                  }
                >
                  {isDone ? t("unmark") : t("mark")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/guarani-escolar"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("backEscolar")}
        </Link>
        {doneCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCompleted({})}
          >
            {t("resetWeek")}
          </Button>
        )}
      </div>
    </div>
  );
}
