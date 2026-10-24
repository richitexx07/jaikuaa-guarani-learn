import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadEscolarGrade, temasFor, type EscolarGrade } from "@/lib/guarani-tema";

export const Route = createFileRoute("/_authenticated/guarani-escolar/tema/")({
  head: () => ({ meta: [{ title: "Jaikuaa — Práctica por Tema" },
      { name: "description", content: "Elegí un tema para explorar los materiales de Guaraní Escolar de Jaikuaa, en validación." },
      { property: "og:title", content: "Jaikuaa — Práctica por Tema" },
      { property: "og:description", content: "Elegí un tema para explorar los materiales de Guaraní Escolar de Jaikuaa, en validación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: TemaIndex,
});

function TemaIndex() {
  const [grade, setGrade] = useState<EscolarGrade>("6° grado");
  useEffect(() => setGrade(loadEscolarGrade()), []);
  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          Práctica por Tema <span aria-hidden className="ml-2">📚</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
          Elegí un tema para practicar
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
          Contenido para <span className="font-semibold text-foreground">{grade}</span>. Cada tema tiene una breve explicación, vocabulario y un quiz de 5 preguntas.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {temasFor(grade).map((tema) => (
          <Link
            key={tema.slug}
            to="/guarani-escolar/tema/$topic"
            params={{ topic: tema.slug }}
            className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl" aria-hidden>
                {tema.emoji}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {tema.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{tema.subtitle}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{tema.vocab.length} palabras · {tema.quiz.length} preguntas</span>
              <span className="font-semibold text-primary group-hover:text-accent">Practicar →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
