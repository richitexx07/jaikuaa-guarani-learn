import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ExternalLink, Loader2, Undo2, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { monthYear } from "@/components/nhande-marandu";
import { listNewsAdmin, setNewsStatus, type NewsRow, type NewsStatus } from "@/lib/news.functions";

export const Route = createFileRoute("/_authenticated/admin/noticias")({
  head: () => ({ meta: [{ title: "Jaikuaa — Noticias para aprobar" }] }),
  component: AdminNoticiasPage,
});

function AdminNoticiasPage() {
  const list = useServerFn(listNewsAdmin);
  const setStatus = useServerFn(setNewsStatus);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["noticias-admin"], queryFn: () => list(), retry: false });
  const mutation = useMutation({
    mutationFn: (v: { id: string; estado: NewsStatus }) => setStatus({ data: v }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["noticias-admin"] });
      void qc.invalidateQueries({ queryKey: ["nhande-marandu"] });
    },
  });
  const busyId = mutation.isPending ? mutation.variables?.id : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Volver</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Noticias para aprobar 📰</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada mañana se cargan hasta 3 noticias verificadas. Ninguna sale en «Ñande Marandu» hasta que la publiques.
            Antes de publicar, abrí la nota original y confirmá que sea correcta.
          </p>

          {isLoading && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </p>
          )}
          {error && (
            <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message === "Forbidden" ? "Esta pantalla es solo para administradores." : "No se pudieron cargar las noticias."}
            </p>
          )}
          {mutation.error && (
            <p className="mt-4 text-sm text-destructive">No se pudo guardar el cambio. Probá de nuevo.</p>
          )}

          {data && (
            <>
              <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
                Pendientes ({data.pending.length})
              </h2>
              {data.pending.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No hay noticias pendientes.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {data.pending.map((n) => (
                    <NewsCard key={n.id} n={n} busy={busyId === n.id}>
                      <Button size="sm" onClick={() => mutation.mutate({ id: n.id, estado: "publicada" })} disabled={busyId === n.id}>
                        <Check /> Publicar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: n.id, estado: "descartada" })} disabled={busyId === n.id}>
                        <X /> Descartar
                      </Button>
                    </NewsCard>
                  ))}
                </div>
              )}

              <h2 className="mt-10 font-display text-lg font-semibold text-foreground">
                Publicadas ({data.published.length})
              </h2>
              <div className="mt-3 space-y-3">
                {data.published.map((n) => (
                  <NewsCard key={n.id} n={n} busy={busyId === n.id}>
                    <Button size="sm" variant="ghost" onClick={() => mutation.mutate({ id: n.id, estado: "pendiente" })} disabled={busyId === n.id}>
                      <Undo2 /> Quitar de la portada
                    </Button>
                  </NewsCard>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function NewsCard({ n, busy, children }: { n: NewsRow; busy: boolean; children: React.ReactNode }) {
  return (
    <article className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${busy ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>{n.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {n.categoria} · {monthYear(n.fecha_nota)} · {n.fuente}
          </p>
          <h3 className="mt-1 font-display font-bold leading-snug text-foreground">{n.titulo}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{n.resumen}</p>
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Abrir la nota original <ExternalLink className="h-3 w-3" />
          </a>
          <div className="mt-3 flex flex-wrap gap-2">{children}</div>
        </div>
      </div>
    </article>
  );
}
