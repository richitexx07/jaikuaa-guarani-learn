import { useTX, type TXKey } from "@/lib/i18n-pages";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BADGES, useStats } from "@/lib/gamification";
import { StatsBar } from "@/components/gamification/stats-bar";
import jaiFesteja from "@/assets/jai/jai-festeja.webp";
import medallaPrimerPaso from "@/assets/medallas/medalla-primer-paso.webp";
import medallaGuaranihablante from "@/assets/medallas/medalla-guaranihablante.webp";
import medallaEstrella from "@/assets/medallas/medalla-estudiante-estrella.webp";
import medallaRacha from "@/assets/medallas/medalla-racha-fuego.webp";

const MEDALLA: Record<string, string> = {
  "primer-paso": medallaPrimerPaso,
  guaranihablante: medallaGuaranihablante,
  "estudiante-estrella": medallaEstrella,
  "racha-fuego": medallaRacha,
};

export const Route = createFileRoute("/_authenticated/logros")({
  head: () => ({ meta: [{ title: "Jaikuaa — Logros" },
      { name: "description", content: "Consultá tus insignias y el progreso de aprendizaje que alcanzaste en Jaikuaa." },
      { property: "og:title", content: "Jaikuaa — Logros" },
      { property: "og:description", content: "Consultá tus insignias y el progreso de aprendizaje que alcanzaste en Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: LogrosPage,
});

function LogrosPage() {
  const stats = useStats();
  const tx = useTX();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-primary"
          >
            <BrandLogo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">{tx("backPanel")}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-8 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <img
              src={jaiFesteja}
              alt={tx("lgJaiAlt")}
              className="mx-auto mb-1 h-24 w-auto object-contain drop-shadow-lg sm:mb-2 sm:h-40"
            />
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {tx("lgYours")} <span aria-hidden className="ml-2">🏆</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-foreground sm:mt-4 sm:text-4xl">
              {tx("lgTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground sm:mt-3 sm:text-base">
              {tx("lgSub")}
            </p>
          </div>

          <div className="mt-5 sm:mt-8">
            <StatsBar />
          </div>

          <h2 className="mt-7 font-display text-2xl font-bold text-foreground sm:mt-10">
            {tx("lgHeading")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx("lgUnlocked", { a: stats.badges.length, b: BADGES.length })}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {BADGES.map((b) => {
              const earned = stats.badges.includes(b.id);
              const medalla = MEDALLA[b.id];
              return (
                <div
                  key={b.id}
                  className={`flex items-start gap-4 rounded-2xl border p-5 shadow-sm transition ${
                    earned
                      ? "border-accent/40 bg-accent/5"
                      : "border-border/60 bg-card opacity-80"
                  }`}
                >
                  {medalla ? (
                    <div className="relative h-20 w-20 shrink-0" aria-hidden>
                      <img
                        src={medalla}
                        alt=""
                        className={`h-full w-full object-contain ${
                          earned ? "drop-shadow-md" : "opacity-40 grayscale"
                        }`}
                        loading="lazy"
                      />
                      {!earned && (
                        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                        earned ? "bg-accent/15" : "bg-muted"
                      }`}
                      aria-hidden
                    >
                      {earned ? b.emoji : <Lock className="h-6 w-6 text-muted-foreground" />}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {tx(`badge.${b.id}` as TXKey)}
                      </h3>
                      {earned && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                          {tx("lgEarned")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tx(`badgeD.${b.id}` as TXKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
