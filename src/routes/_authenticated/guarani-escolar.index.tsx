import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ESCOLAR_GRADES, loadEscolarGrade, saveEscolarGrade, type EscolarGrade } from "@/lib/guarani-tema";
import { Button } from "@/components/ui/button";
import bannerEscolar from "@/assets/banners/banner-escolar.webp";
import jaiPiensa from "@/assets/jai/jai-piensa.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiProfe from "@/assets/jai-profe.webp";

export const Route = createFileRoute("/_authenticated/guarani-escolar/")({
  head: () => ({ meta: [{ title: "Guaraní Escolar | Jaikuaa" }, { name: "description", content: "Prepará tus pruebas de Guaraní: Modo Rescate, Plan Semanal y práctica por tema." }, { property: "og:title", content: "Guaraní Escolar | Jaikuaa" }, { property: "og:description", content: "Prepará tus pruebas de Guaraní paso a paso." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: GuaraniEscolarEntry,
});

const GRADES = ESCOLAR_GRADES;
type Grade = EscolarGrade;

const PATHS = [
  {
    to: "/guarani-escolar/rescate",
    img: jaiPiensa,
    title: "Modo Rescate",
    description: "Tenés prueba pronto y necesitás aprobar.",
    style: "border-accent/40 hover:border-accent hover:bg-accent/5",
  },
  {
    to: "/guarani-escolar/semanal",
    img: jaiProfe,
    title: "Plan Semanal",
    description: "Estudiá organizado durante la semana.",
    style: "border-primary/30 hover:border-primary hover:bg-primary/5",
  },
  {
    to: "/guarani-escolar/tema",
    img: jaiAplaude,
    title: "Práctica por Tema",
    description: "Reforzá un tema específico.",
    style: "border-primary/30 hover:border-primary hover:bg-primary/5",
  },
];

function GuaraniEscolarEntry() {
  const [grade, setGradeState] = useState<Grade>("6° grado");
  useEffect(() => setGradeState(loadEscolarGrade()), []);
  const setGrade = (g: Grade) => { setGradeState(g); saveEscolarGrade(g); };

  return (
    <div className="mx-auto max-w-4xl">
      <img
        src={bannerEscolar}
        alt="Jai levanta la mano en un aula paraguaya, con un libro abierto sobre el pupitre"
        className="mb-6 aspect-[16/9] w-full rounded-3xl object-cover shadow-elegant sm:aspect-[21/9]"
        width={1280}
        height={720}
      />
      <div className="text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
          Guaraní Escolar <span aria-hidden className="ml-2">🎒</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
          ¿Qué necesitás hoy?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
          Todo lo que necesitás para entender y aprobar Guaraní en la escuela, paso a paso.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <label className="block text-center text-sm font-medium text-muted-foreground">
          Elegí tu año
        </label>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {GRADES.map((g) => (
            <Button
              key={g}
              variant={g === grade ? "cta" : "outline"}
              className="h-11 w-full"
              onClick={() => setGrade(g)}
              aria-pressed={g === grade}
            >
              {g}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Contenido adaptado para <span className="font-semibold text-foreground">{grade}</span>.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PATHS.map((path) => (
          <Link
            key={path.to}
            to={path.to}
            
            className={`group flex flex-row items-center gap-4 rounded-2xl border bg-card p-4 sm:flex-col sm:items-stretch sm:p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${path.style}`}
          >
            <img src={path.img} alt="" className="h-20 w-20 shrink-0 object-contain sm:mx-auto sm:h-28 sm:w-28" loading="lazy" />
            <div className="flex-1">
            <h2 className="font-display sm:mt-4 text-xl font-semibold text-foreground">
              {path.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {path.description}
            </p>
            </div>
            <span className="text-2xl text-muted-foreground sm:hidden" aria-hidden>›</span>
            <span className="hidden sm:mt-5 sm:inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground shadow transition group-hover:bg-accent/90 group-active:scale-95">
              Entrar →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
