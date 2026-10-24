import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-display text-2xl font-bold">Tema no encontrado</h1>
      <Button asChild variant="cta" className="mt-6">
        <Link to="/guarani-escolar/tema">Volver a los temas</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-display text-2xl font-bold">Ocurrió un error</h1>
      <Button variant="cta" className="mt-4" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  ),
  component: TemaPage,
});

import { SpeakerButton } from "@/components/audio/speaker-button";

type Phase = "learn" | "quiz" | "done";

function TemaPage() {
  const { tema } = Route.useLoaderData() as unknown as { tema: Tema };
  useRecordVisit(`tema:${tema.slug}`);
  const [phase, setPhase] = useState<Phase>("learn");
  const [score, setScore] = useState(0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2">
        <Link
          to={isAgro(tema.slug) ? "/agro" : "/guarani-escolar/tema"}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
        >
          {isAgro(tema.slug) ? "← Volver a Jaikuaa Agro-Rural" : "← Volver a los temas"}
        </Link>
      </div>

      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-accent">
          {isAgro(tema.slug) ? "Jaikuaa Agro-Rural · Ñemitỹ ha Ka'aguy" : "Práctica por Tema"}
        </div>
        <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
          <span aria-hidden>{tema.emoji}</span>
          {tema.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{tema.subtitle}</p>
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="font-display text-lg font-semibold text-primary">
          ¿De qué se trata?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {tema.explanation}
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Vocabulario
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tocá el 🔊 para escuchar cada palabra.
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
        Empezar el quiz →
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
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  const q = questions[i];
  const isCorrect = picked !== null && picked === q.answer;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Pregunta {i + 1} de {questions.length}</span>
        <span>Aciertos: {correct}</span>
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
            {isCorrect ? "¡Correcto!" : "Continuar"} →
          </Button>
        )}
      </div>
    </div>
  );
}

function feedback(score: number, total: number): { emoji: string; title: string; message: string } {
  const ratio = score / total;
  if (ratio === 1) return { emoji: "🏆", title: "¡Perfecto!", message: "Sos un crack del guaraní. ¡Iporãiterei!" };
  if (ratio >= 0.8) return { emoji: "🎉", title: "¡Muy bien!", message: "Ya casi lo dominás. Seguí practicando." };
  if (ratio >= 0.6) return { emoji: "💪", title: "¡Buen trabajo!", message: "Vas bien encaminado. Repasá las que fallaste." };
  if (ratio >= 0.4) return { emoji: "📖", title: "¡A seguir!", message: "Con un poco más de práctica vas a mejorar." };
  return { emoji: "🌱", title: "¡No te rindas!", message: "Volvé a leer el tema y probá de nuevo. ¡Vos podés!" };
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
  const fb = feedback(score, total);
  const xp = 15 + score * 5;
  useRecordOnMount({ xp, perfectExam: score === total, source: "exam", sourceRef: `tema:${tema.slug}` });
  useEffect(() => {
    if (score / total >= 0.6) celebrate(score === total ? "big" : "small");
  }, [score, total]);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-lift animate-scale-in">
      <div className="text-6xl" aria-hidden>{fb.emoji}</div>

      <h2 className="mt-4 font-display text-3xl font-bold text-foreground">
        {fb.title}
      </h2>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-display text-base font-bold text-primary-foreground shadow">
        Sacaste {score}/{total}
      </div>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">{fb.message}</p>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" size="lg" onClick={onRetry}>
          Reintentar quiz
        </Button>
        <Button asChild variant="cta" size="lg">
          {isAgro(tema.slug) ? (
            <Link to="/agro">Más temas del Agro →</Link>
          ) : (
            <Link to="/guarani-escolar/tema">Otro tema →</Link>
          )}
        </Button>
      </div>
    </div>
  );
}
