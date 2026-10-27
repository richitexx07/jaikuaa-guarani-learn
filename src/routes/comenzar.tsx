import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { recordCompletion } from "@/lib/gamification";
import { saveMotivation, markOnboardingDone, type Motivation } from "@/lib/onboarding";
import jaiBienvenida from "@/assets/jai/jai-bienvenida.webp";
import jaiAplaude from "@/assets/jai/jai-aplaude.webp";
import jaiFesteja from "@/assets/jai/jai-festeja.webp";
import jaiSaluda from "@/assets/jai/jai-saluda.webp";
import jaiPiensa from "@/assets/jai/jai-piensa.webp";
import jaiTurismo from "@/assets/jai/jai-turismo.webp";
import jaiProfe from "@/assets/jai-profe.webp";
import jaiAtencion from "@/assets/jai-atencion-pro.webp";
import { NandutiDisc } from "@/components/nanduti-disc";
import { celebrate } from "@/lib/confetti";
import { EarlyAccessBadge } from "@/components/early-access-badge";
import { AppLanguageToggle } from "@/components/app-language-toggle";
import { useTX, type TXKey } from "@/lib/i18n-pages";

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

const OPTIONS: { id: Motivation; img: string; label: string }[] = [
  { id: "trabajo", img: jaiAtencion, label: "Para el trabajo" },
  { id: "colegio", img: jaiProfe, label: "Para el colegio" },
  { id: "familia", img: jaiSaluda, label: "Para mi familia" },
  { id: "gusta", img: jaiTurismo, label: "Porque me gusta" },
  { id: "probar", img: jaiPiensa, label: "No sé, probemos" },
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

function JaiCharacter({ src = jaiBienvenida, size = 176, alt = "Jai, el jaguaréte de Jaikuaa" }: { src?: string; size?: number; alt?: string }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <NandutiDisc className="absolute inset-0 h-full w-full text-primary" />
      <img src={src} alt={alt} draggable={false} className="cz-jai relative h-full w-full object-contain drop-shadow-xl" />
    </div>
  );
}

/** Avance en tres pasos: barritas que se van llenando. */
function Progress({ step }: { step: 1 | 2 | 3 }) {
  const tx = useTX();
  return (
    <div className="flex items-center gap-2" aria-label={tx("czStep", { n: step })}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-2 w-10 rounded-full transition-colors ${n <= step ? "bg-accent" : "bg-muted"}`} />
      ))}
    </div>
  );
}

function SkipLink({ onSkip }: { onSkip: () => void }) {
  const tx = useTX();
  return (
    <button
      type="button"
      onClick={onSkip}
      className="text-xs text-muted-foreground/70 underline-offset-4 hover:text-muted-foreground hover:underline"
    >
      {tx("czSkip")}
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const tx = useTX();
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
    <div className="min-h-screen bg-background px-4 pb-10 pt-5 sm:py-10">
      <style>{`.cz-jai{animation:cz-in .6s cubic-bezier(.2,.8,.2,1) both}@keyframes cz-in{from{opacity:0;transform:translateY(16px) scale(.96)}}@media (prefers-reduced-motion: reduce){.cz-jai{animation:none}}`}</style>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header className="flex items-center justify-between">
          <Progress step={step} />
          <div className="flex items-center gap-3"><AppLanguageToggle />{step < 3 || !lessonDone ? <SkipLink onSkip={skip} /> : null}</div>
        </header>

        {step === 1 && (
          <section className="flex flex-col items-center gap-6 text-center">
            <JaiCharacter size={150} />
            <h1 className="font-display text-2xl font-semibold leading-snug text-primary sm:text-3xl">
              {tx("czHi")}
              <br />
              <span className="text-foreground">{tx("czWhy")}</span>
            </h1>
            <EarlyAccessBadge className="-mt-2" />
            <div className="flex w-full flex-col gap-3">
              {OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pick(o.id)}
                  className="flex min-h-[68px] w-full items-center gap-4 rounded-2xl border border-border bg-card px-3 py-2 text-left text-base font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
                >
                  <img src={o.img} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-primary/5 object-contain p-0.5" />
                  <span className="flex-1">{tx(`czO.${o.id}` as TXKey)}</span>
                  <span className="text-xl text-muted-foreground" aria-hidden>›</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && motivation && (
          <section className="flex flex-col items-center gap-6 text-center">
            <JaiCharacter src={jaiAplaude} alt="Jai aplaude" />
            <p className="rounded-2xl bg-card px-6 py-5 font-display text-lg leading-relaxed text-foreground shadow-sm sm:text-xl">
              {tx(`czR.${motivation}` as TXKey)}
            </p>
            <Button variant="cta" size="lg" className="w-full" onClick={() => setStep(3)}>
              {tx("czStart")}
            </Button>
          </section>
        )}

        {step === 3 && !lessonDone && (
          <section className="flex flex-col items-center gap-6 text-center">
            <JaiCharacter src={jaiProfe} size={128} alt="Jai, el profe" />
            <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tx("czWord", { a: lessonIdx + 1, b: MINI_LESSON.length })}
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl font-bold text-primary sm:text-4xl">
                    {MINI_LESSON[lessonIdx].gn}
                  </span>
                  <SpeakerButton gn={MINI_LESSON[lessonIdx].gn} size="md" />
                </div>
                <p className="text-base text-muted-foreground"><span className="sr-only">{tx("czMeaning")}: </span>{MINI_LESSON[lessonIdx].es}</p>
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
                {lessonIdx < MINI_LESSON.length - 1 ? tx("czNext") : tx("czFinish")}
              </Button>
            </div>
          </section>
        )}

        {step === 3 && lessonDone && (
          <section className="flex flex-col items-center gap-6 text-center">
            <JaiCharacter src={jaiFesteja} alt="Jai festeja" />
            <p className="font-display text-2xl font-semibold leading-snug text-primary sm:text-3xl">
              {tx("czStreak")}
              <br />
              <span className="text-foreground">{tx("czTomorrow")}</span>
            </p>
            <Button variant="cta" size="lg" className="w-full" onClick={finishOnboarding}>
              {tx("czCreate")}
            </Button>
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {tx("czLater")}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
