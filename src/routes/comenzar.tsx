import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { recordCompletion } from "@/lib/gamification";
import { saveMotivation, markOnboardingDone, type Motivation } from "@/lib/onboarding";
import jaiImg from "@/assets/jai-tradicional.png";
const jaiAsset = { url: jaiImg };
import { celebrate } from "@/lib/confetti";
import { EarlyAccessBadge } from "@/components/early-access-badge";

export const Route = createFileRoute("/comenzar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jaikuaa — Conocé a Jai" },
      { name: "description", content: "Empezá tu camino en guaraní con Jai, el jaguaréte de Jaikuaa." },
      { property: "og:title", content: "Jaikuaa — Conocé a Jai" },
      { property: "og:description", content: "Conocé a Jai y elegí cómo empezar tu aprendizaje de guaraní." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.jaikuaa.com/comenzar" },
      { property: "og:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg" }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://www.jaikuaa.com/og-jaikuaa.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://www.jaikuaa.com/comenzar" }],
  }),
  component: Onboarding,
});

const OPTIONS: { id: Motivation; icon: string; label: string }[] = [
  { id: "trabajo", icon: "💼", label: "Para el trabajo" },
  { id: "colegio", icon: "📚", label: "Para el colegio" },
  { id: "familia", icon: "🏠", label: "Para mi familia" },
  { id: "gusta", icon: "🌍", label: "Porque me gusta" },
  { id: "probar", icon: "❓", label: "No sé, probemos" },
];

const REACTIONS: Record<Motivation, string> = {
  trabajo: "¡Buenísimo! El guaraní abre puertas en Paraguay. Empezamos con 3 frases para la oficina.",
  colegio: "¡Vamos a aprobar ese examen! Te enseño exactamente lo que te piden.",
  familia: "Tu abuela va a sonreír cuando le digas 'Mba'éichapa'. Empezamos con 3 palabras de saludo.",
  gusta: "Ya sos paraguayo completo. Solo falta despertar el ñe'ẽ que llevás dentro.",
  probar: "Perfecto. 3 palabras, 2 minutos. Sin presión, sin examen, sin vergüenza.",
};

const MINI_LESSON: { gn: string; es: string }[] = [
  { gn: "Mba'éichapa", es: "¿Cómo estás?" },
  { gn: "Iporã", es: "Bien / Está bien" },
  { gn: "Aguyje", es: "Gracias" },
];

function JaiCharacter({ size = 160 }: { size?: number }) {
  return (
    <img
      src={jaiAsset.url}
      alt="Jai, el jaguaréte de Jaikuaa"
      width={size}
      height={size}
      style={{
        width: size,
        height: "auto",
        objectFit: "contain",
        backgroundColor: "transparent",
      }}
      draggable={false}
      className="drop-shadow-md"
    />
  );
}

function Progress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{step} de 3</span>
    </div>
  );
}

function SkipLink({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="text-xs text-muted-foreground/70 underline-offset-4 hover:text-muted-foreground hover:underline"
    >
      Saltar
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [lessonDone, setLessonDone] = useState(false);

  const finishOnboarding = () => {
    markOnboardingDone();
    void navigate({ to: "/auth", search: { mode: "signup" } });
  };

  const skip = () => {
    markOnboardingDone();
    void navigate({ to: "/auth", search: { mode: "signup" } });
  };

  const pick = (m: Motivation) => {
    setMotivation(m);
    saveMotivation(m);
    setStep(2);
  };

  const completeLesson = () => {
    // Award XP through the existing system — do not modify it.
    try {
      recordCompletion({ xp: 15, source: "onboarding", sourceRef: "comenzar" });
    } catch {}
    setLessonDone(true);
    celebrate("big");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f4f6fa] px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header className="flex items-center justify-between">
          <Progress step={step} />
          {step < 3 || !lessonDone ? <SkipLink onSkip={skip} /> : <span />}
        </header>

        {step === 1 && (
          <section className="flex flex-col items-center gap-6 text-center">
            <EarlyAccessBadge />
            <JaiCharacter />
            <h1 className="font-display text-2xl font-semibold leading-snug text-primary sm:text-3xl">
              ¡Mba'éichapa! 🐆 Soy Jai, el jaguaréte de Jaikuaa.
              <br />
              <span className="text-foreground">¿Para qué querés aprender guaraní?</span>
            </h1>
            <div className="flex w-full flex-col gap-3">
              {OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pick(o.id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 text-left text-base font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
                >
                  <span className="text-2xl" aria-hidden>{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && motivation && (
          <section className="flex flex-col items-center gap-6 text-center">
            <JaiCharacter />
            <p className="rounded-2xl bg-white px-6 py-5 font-display text-lg leading-relaxed text-foreground shadow-sm sm:text-xl">
              {REACTIONS[motivation]}
            </p>
            <Button variant="cta" size="lg" className="w-full" onClick={() => setStep(3)}>
              ▶️ Empezar
            </Button>
          </section>
        )}

        {step === 3 && !lessonDone && (
          <section className="flex flex-col items-center gap-6 text-center">
            <JaiCharacter size={120} />
            <div className="w-full rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Palabra {lessonIdx + 1} de {MINI_LESSON.length}
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl font-bold text-primary sm:text-4xl">
                    {MINI_LESSON[lessonIdx].gn}
                  </span>
                  <SpeakerButton gn={MINI_LESSON[lessonIdx].gn} size="md" />
                </div>
                <p className="text-base text-muted-foreground">{MINI_LESSON[lessonIdx].es}</p>
              </div>
              <Button
                variant="cta"
                size="lg"
                className="mt-6 w-full"
                onClick={() => {
                  if (lessonIdx < MINI_LESSON.length - 1) setLessonIdx(lessonIdx + 1);
                  else completeLesson();
                }}
              >
                {lessonIdx < MINI_LESSON.length - 1 ? "Siguiente" : "Terminar"}
              </Button>
            </div>
          </section>
        )}

        {step === 3 && lessonDone && (
          <section className="flex flex-col items-center gap-6 text-center">
            <JaiCharacter />
            <p className="font-display text-2xl font-semibold leading-snug text-primary sm:text-3xl">
              ¡Ganaste tu primera racha! 🐆
              <br />
              <span className="text-foreground">Volvé mañana para seguir.</span>
            </p>
            <Button variant="cta" size="lg" className="w-full" onClick={finishOnboarding}>
              Crear mi cuenta y guardar mi progreso
            </Button>
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ahora no
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
