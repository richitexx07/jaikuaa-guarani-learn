import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getCorpusAlertas } from "@/lib/corpus-alertas.functions";

export const Route = createFileRoute("/_authenticated/admin/cuidado-corpus")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Cuidado del corpus" },
      { name: "description", content: "Avisos de pedidos de más a las palabras y voces de Jaikuaa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CuidadoCorpusPage,
});

function CuidadoCorpusPage() {
  const fn = useServerFn(getCorpusAlertas);
  const { data, isLoading, error } = useQuery({ queryKey: ["corpus-alertas"], queryFn: () => fn(), retry: false });

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
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Cuidado del corpus</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quién pidió palabras o voces de más en los últimos 30 días. Un alumno que juega normal nunca aparece acá:
            aparecer seguido es señal de alguien que intenta copiar el corpus.
          </p>

          {isLoading && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </p>
          )}
          {error && (
            <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message === "Forbidden" ? "Esta pantalla es solo para administradores." : "No se pudo cargar la lista."}
            </p>
          )}

          {data && data.alertas.length === 0 && (
            <p className="mt-8 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Sin avisos. Nadie pidió de más.
            </p>
          )}

          {data && data.alertas.length > 0 && (
            <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
              {data.alertas.map((a, i) => (
                <li key={i} className="px-4 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-foreground">{a.quien}</p>
                    <p className="shrink-0 text-xs font-semibold tabular-nums text-destructive">
                      {a.veces} {a.veces === 1 ? "aviso" : "avisos"}
                    </p>
                  </div>
                  {a.detalle && <p className="text-xs text-muted-foreground">{a.detalle}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pidió de más: {a.tipos.join(", ")}. Último:{" "}
                    {new Date(a.ultima).toLocaleString("es-PY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
