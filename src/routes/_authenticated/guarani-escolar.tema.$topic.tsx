import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEscolarTx } from "@/lib/i18n-escolar";
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTema, type Tema } from "@/lib/guarani-tema";
import { useRecordOnMount, useRecordVisit } from "@/lib/gamification";
import { celebrate } from "@/lib/confetti";
import { usePrefetchAudios } from "@/lib/audio";
import { TEMAS_AGRO } from "@/lib/guarani-tema-agro";

const AGRO_SLUGS = new Set(TEMAS_AGRO.map((t) => t.slug));
const isAgro = (slug: string) => AGRO_SLUGS.has(slug);



export const Route = createFileRoute("/_authenticated/guarani-escolar/tema/$topic")({
  head: ({ params }) => ({
    meta: [{ title: `Jaikuaa — ${params.topic}` },
      { name: "description", content: "Explorá este tema de Guaraní Escolar en Jaikuaa y sus materiales en validación." },
      { property: "og:title", content: `Jaikuaa — ${params.topic}` },
      { property: "og:description", content: "Explorá este tema de Guaraní Escolar en Jaikuaa y sus materiales en validación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ params }) => {
    const tema = getTema(params.topic);
    if (!tema) throw notFound();
    return { tema };
  },
  notFoundComponent: function NF() {
    const t = useEscolarTx();
    return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-display text-2xl font-bold">{t("notFound")}</h1>
      <Button asChild variant="cta" className="mt-6">
        <Link to="/guarani-escolar/tema">{t("backTopics")}</Link>
      </Button>
    </div>
    );
  },
  errorComponent: function EC({ reset }) {
    const t = useEscolarTx();
    return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-display text-2xl font-bold">{t("error")}</h1>
      <Button variant="cta" className="mt-4" onClick={() => reset()}>
        {t("retry")}
      </Button>
    </div>
    );
  },
  component: TemaPage,
});

import jaiFesteja from "@/assets/jai/jai-trofeo.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiAnimo from "@/assets/jai/jai-animo.webp";
import jaiPiensa from "@/assets/jai/jai-piensa.webp";
import { SpeakerButton } from "@/components/audio/speaker-button";

type Phase = "learn" | "quiz" | "done";

function TemaPage() {
  const { tema } = Route.useLoaderData() as unknown as { tema: Tema };
  useRecordVisit(`tema:${tema.slug}`);
  const t = useEscolarTx();
  const [phase, setPhase] = useState<Phase>("learn");
  const [score, setScore] = useState(0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2">
        <Link
          to={isAgro(tema.slug) ? "/agro" : "/guarani-escolar/tema"}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
        >
          {isAgro(tema.slug) ? t("backAgro") : t("backTopics")}
        </Link>
      </div>

      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-accent">
          {isAgro(tema.slug) ? "Jaikuaa Agro-Rural · Ñemitỹ ha Ka'aguy" : t("practice")}
        </div>
        <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
          <span aria-hidden>{tema.emoji}</span>
          {tema.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{tema.subtitle}</p>
        {t("contentEs") && <p className="mt-2 text-xs text-muted-foreground">{t("contentEs")}</p>}
      </div>

      {phase === "learn" && (
        <LearnStep tema={tema} onNext={() => setPhase("quiz")} />
      )}
      {phase === "quiz" && (
        <QuizStep
          tema={tema}
          onDone={(s) => {
            setScore(s);
            setPhase("done");
          }}
        />
      )}
      {phase === "done" && <DoneStep tema={tema} score={score} onRetry={() => { setScore(0); setPhase("quiz"); }} />}
    </div>
  );
}

function LearnStep({ tema, onNext }: { tema: Tema; onNext: () => void }) {
  usePrefetchAudios(tema.vocab.map((v) => v.gn), 10);
  const t = useEscolarTx();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">
          {t("about")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {tema.explanation}
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t("vocab")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("tap")}
        </p>
        <ul className="mt-3 space-y-2">
          {tema.vocab.map((v) => (
            <li
              key={v.gn}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <SpeakerButton gn={v.gn} />
              <div>
                <div className="font-display text-base font-semibold text-foreground">
                  {v.gn}
                </div>
                <div className="text-sm text-muted-foreground">{v.es}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Button variant="cta" size="lg" className="w-full" onClick={onNext}>
        {t("startQuiz")}
      </Button>
    </div>
  );
}

function QuizStep({
  tema,
  onDone,
}: {
  tema: Tema;
  onDone: (score: number) => void;
}) {
  const questions = useMemo(() => tema.quiz, [tema]);
  const t = useEscolarTx();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  const q = questions[i];
  const isCorrect = picked !== null && picked === q.answer;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("q", { a: i + 1, b: questions.length })}</span>
        <span>{t("hits", { a: correct })}</span>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <p className="font-display text-lg font-semibold text-foreground">
          {q.prompt}
        </p>

        <div className="mt-5 grid gap-2">
          {q.options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === q.answer;
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
                  if (opt === q.answer) setCorrect((c) => c + 1);
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
              if (i + 1 >= questions.length) {
                onDone(correct);
              } else {
                setI((x) => x + 1);
              }
            }}
          >
            {isCorrect ? t("correct") : t("cont")} →
          </Button>
        )}
      </div>
    </div>
  );
}

function feedback(score: number, total: number, t: ReturnType<typeof useEscolarTx>): { img: string; title: string; message: string } {
  const ratio = score / total;
  if (ratio === 1) return { img: jaiFesteja, title: t("f1t"), message: t("f1m") };
  if (ratio >= 0.8) return { img: jaiAplaude, title: t("f2t"), message: t("f2m") };
  if (ratio >= 0.6) return { img: jaiAnimo, title: t("f3t"), message: t("f3m") };
  if (ratio >= 0.4) return { img: jaiPiensa, title: t("f4t"), message: t("f4m") };
  return { img: jaiAnimo, title: t("f5t"), message: t("f5m") };
}

function DoneStep({
  tema,
  score,
  onRetry,
}: {
  tema: Tema;
  score: number;
  onRetry: () => void;
}) {
  const total = tema.quiz.length;
  const t = useEscolarTx();
  const fb = feedback(score, total, t);
  const xp = 15 + score * 5;
  useRecordOnMount({ xp, perfectExam: score === total, source: "exam", sourceRef: `tema:${tema.slug}` });
  useEffect(() => {
    if (score / total >= 0.6) celebrate(score === total ? "big" : "small");
  }, [score, total]);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-lift animate-scale-in">
      <img src={fb.img} alt="" className="mx-auto h-40 w-auto object-contain drop-shadow-xl" />

      <h2 className="mt-4 font-display text-3xl font-bold text-foreground">
        {fb.title}
      </h2>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-display text-base font-bold text-primary-foreground shadow">
        {t("scored", { a: score, b: total })}
      </div>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">{fb.message}</p>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" size="lg" onClick={onRetry}>
          {t("retryQuiz")}
        </Button>
        <Button asChild variant="cta" size="lg">
          {isAgro(tema.slug) ? (
            <Link to="/agro">{t("moreAgro")}</Link>
          ) : (
            <Link to="/guarani-escolar/tema">{t("otherTopic")}</Link>
          )}
        </Button>
      </div>
    </div>
  );
}
