import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getWeeklyRanking, type RankingRow } from "@/lib/community.functions";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({ meta: [{ title: "Jaikuaa — Ranking semanal" },
      { name: "description", content: "Consultá el ranking semanal de aprendizaje de tu grupo en Jaikuaa." },
      { property: "og:title", content: "Jaikuaa — Ranking semanal" },
      { property: "og:description", content: "Consultá el ranking semanal de aprendizaje de tu grupo en Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: RankingPage,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function Row({ r }: { r: RankingRow }) {
  return (
    <li
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        r.isMe ? "border-accent bg-accent/10" : "border-border/60 bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-8 text-center font-display text-lg font-bold text-muted-foreground">
          {MEDALS[r.rank - 1] ?? r.rank}
        </span>
        <span className="font-semibold text-foreground">
          {r.name}
          {r.isMe && <span className="ml-2 text-xs font-medium text-accent">(vos)</span>}
        </span>
      </div>
      <span className="font-display font-bold text-primary">{r.xp} XP</span>
    </li>
  );
}

function RankingPage() {
  const fn = useServerFn(getWeeklyRanking);
  const q = useQuery({ queryKey: ["weekly-ranking"], queryFn: () => fn(), staleTime: 60_000 });
  const d = q.data;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <BrandLogo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver al panel</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="text-center">
            <div className="text-4xl" aria-hidden>
              🏆
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-foreground">Ranking semanal</h1>
            {d && (
              <p className="mt-2 text-sm text-muted-foreground">
                {d.group} · desde el lunes {new Date(d.weekStart).toLocaleDateString("es-PY", { timeZone: "America/Asuncion" })}
              </p>
            )}
          </div>
          {q.isLoading || !d ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : d.top.length === 0 ? (
            <p className="mt-8 rounded-xl border border-border/60 bg-card p-6 text-center text-muted-foreground">
              Todavía nadie sumó puntos esta semana. ¡Hacé una lección y aparecé primero!
            </p>
          ) : (
            <>
              <ol className="mt-8 space-y-2">
                {d.top.map((r) => (
                  <Row key={r.rank} r={r} />
                ))}
              </ol>
              {d.me && (
                <>
                  <p className="my-2 text-center text-muted-foreground">…</p>
                  <ol>
                    <Row r={d.me} />
                  </ol>
                </>
              )}
            </>
          )}
          {d && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Esta semana sumaste <span className="font-semibold text-foreground">{d.myXp} XP</span>. El ranking se
              reinicia cada lunes. Solo se muestra el nombre de pila.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="cta">
              <Link to="/curso/$lang" params={{ lang: "guarani" }}>
                Sumar puntos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/juegos">Juegos</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
