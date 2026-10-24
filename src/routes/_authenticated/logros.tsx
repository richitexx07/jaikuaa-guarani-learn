import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BADGES, useStats } from "@/lib/gamification";
import { StatsBar } from "@/components/gamification/stats-bar";

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
            <Link to="/dashboard">← Volver al panel</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              Tus logros <span aria-hidden className="ml-2">🏆</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
              ¡Mirá cuánto avanzaste!
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
              Sumá XP, mantené tu racha y desbloqueá logros mientras aprendés Guaraní.
            </p>
          </div>

          <div className="mt-8">
            <StatsBar />
          </div>

          <h2 className="mt-10 font-display text-2xl font-bold text-foreground">
            Logros
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Desbloqueaste <span className="font-semibold text-foreground">{stats.badges.length}</span> de {BADGES.length}.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {BADGES.map((b) => {
              const earned = stats.badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`flex items-start gap-4 rounded-2xl border p-5 shadow-sm transition ${
                    earned
                      ? "border-accent/40 bg-accent/5"
                      : "border-border/60 bg-card opacity-80"
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                      earned ? "bg-accent/15" : "bg-muted"
                    }`}
                    aria-hidden
                  >
                    {earned ? b.emoji : <Lock className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {b.name}
                      </h3>
                      {earned && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                          Conseguido
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {b.description}
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
