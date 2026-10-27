import { useTX, type TXKey } from "@/lib/i18n-pages";
import { Link } from "@tanstack/react-router";
import { Flame, Trophy, Sparkles } from "lucide-react";
import { useStats } from "@/lib/gamification";
import { JaiPaw } from "@/components/py-icons";

export function StatsBar() {
  const stats = useStats();
  const tx = useTX();
  return (
    <section
      aria-label={tx("sbProgress")}
      className="grid grid-cols-3 gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-elegant sm:p-4"
    >
      <Stat
        icon={<Sparkles className="h-4 w-4" />}
        label={tx("sbXp")}
        value={stats.xp.toLocaleString("es-PY")}
        tone="primary"
      />
      <Stat
        icon={<Flame className={`h-4 w-4 ${stats.streak >= 1 ? "pulse-soft" : ""}`} />}
        label={tx("sbStreak")}
        value={
          <span>
            {stats.streak}{" "}
            <span className="text-sm font-medium text-muted-foreground">
              {stats.streak === 1 ? tx("day") : tx("days")}
            </span>{" "}
            <span className={stats.streak >= 1 ? "inline-block pulse-soft align-middle" : "inline-block align-middle"}><JaiPaw size={18} title={tx("sbPaw")} /></span>
          </span>
        }
        tone="accent"
      />
      <Link
        to="/logros"
        className="group flex flex-col items-start gap-1 rounded-xl border border-transparent p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 sm:p-3"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Trophy className="h-4 w-4 text-primary" /> {tx("lgHeading")}
        </div>
        <div className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {stats.badges.length}
          <span className="ml-1 text-sm font-medium text-muted-foreground">/ 4</span>
        </div>
        <span className="text-xs font-medium text-primary group-hover:underline">
          {tx("sbSeeAll")}
        </span>
      </Link>
    </section>
  );

}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone: "primary" | "accent";
}) {
  const toneCls =
    tone === "accent" ? "text-accent" : "text-primary";
  return (
    <div className="flex flex-col items-start gap-1 p-2 sm:p-3">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground`}
      >
        <span className={toneCls}>{icon}</span> {label}
      </div>
      <div className="font-display text-xl font-bold text-foreground sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

export function StreakBanner() {
  const stats = useStats();
  const tx = useTX();
  if (stats.streak < 1) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-3 text-center text-sm text-muted-foreground">
        {tx("sbStart")}
      </div>
    );
  }
  const msg =
    stats.streak >= 7
      ? tx("sbFire")
      : stats.streak >= 3
        ? tx("sbGood")
        : tx("sbStarted");
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-center text-sm font-medium text-accent">
      {tx("sbStreak")}: {stats.streak} {stats.streak === 1 ? tx("day") : tx("days")} 🔥 · {msg}
    </div>
  );
}
