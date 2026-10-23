import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getJaiReport } from "@/lib/jai.functions";
import { getFaq } from "@/lib/jai-faq";

export const Route = createFileRoute("/_authenticated/admin/jai")({
  head: () => ({ meta: [{ title: "Jaikuaa — Qué le preguntan a Jai" }] }),
  component: AdminJaiPage,
});

const RESULTADO: Record<string, string> = {
  opciones: "Jai ofreció opciones",
  derivada: "Pasó a WhatsApp",
};

function AdminJaiPage() {
  const report = useServerFn(getJaiReport);
  const { data, isLoading, error } = useQuery({ queryKey: ["jai-report"], queryFn: () => report(), retry: false });
  const answered = data ? data.masUsadas.reduce((a, [, n]) => a + n, 0) : 0;

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
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Qué le preguntan a Jai 🐆</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Últimos 30 días. Las consultas se guardan sin nombres: los correos y teléfonos se borran antes de guardar.
            Lo que Jai no supo responder es la lista de preguntas nuevas para agregar.
          </p>

          {isLoading && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </p>
          )}
          {error && (
            <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message === "Forbidden" ? "Esta pantalla es solo para administradores." : "No se pudo cargar el informe."}
            </p>
          )}

          {data && (
            <>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <Stat label="Consultas" value={data.total} />
                <Stat label="Respondidas al instante" value={answered} />
                <Stat label="Sin respuesta" value={data.sinRespuesta.length} />
              </div>

              <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Buzón de sugerencias</h2>
              {data.sugerencias.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Todavía no llegaron sugerencias.</p>
              ) : (
                <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                  {data.sugerencias.map((r, i) => (
                    <li key={i} className="px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">«{r.texto}»</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        en {r.ruta} · {new Date(r.created_at).toLocaleDateString("es-PY", { day: "numeric", month: "short" })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Lo que Jai no supo responder</h2>
              {data.sinRespuesta.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nada todavía. 🎉</p>
              ) : (
                <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                  {data.sinRespuesta.map((r, i) => (
                    <li key={i} className="px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">«{r.texto}»</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {RESULTADO[r.resultado] ?? r.resultado} · en {r.ruta} ·{" "}
                        {new Date(r.created_at).toLocaleDateString("es-PY", { day: "numeric", month: "short" })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Preguntas más consultadas</h2>
              <FaqCounts rows={data.masUsadas} empty="Todavía no hay consultas." />

              <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Respuestas marcadas «no me sirvió» 👎</h2>
              <p className="mt-1 text-xs text-muted-foreground">Conviene revisar y mejorar estas respuestas.</p>
              <FaqCounts rows={data.noUtil} empty="Ninguna. 👍" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-elegant">
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FaqCounts({ rows, empty }: { rows: [string, number][]; empty: string }) {
  if (!rows.length) return <p className="mt-2 text-sm text-muted-foreground">{empty}</p>;
  const max = rows[0][1];
  return (
    <ul className="mt-3 space-y-2">
      {rows.map(([id, n]) => (
        <li key={id} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-foreground">{getFaq(id)?.question ?? id}</span>
            <span className="font-semibold tabular-nums text-primary">{n}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(6, (n / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
