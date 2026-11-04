import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Printer } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getSponsorReport } from "@/lib/sponsors.functions";
import { SPONSOR_SLOTS, type SponsorSlot } from "@/lib/sponsor-slots";
import { SUPPORT_WHATSAPP } from "@/lib/contact";

// Sin zod a propósito: esta validación viaja en el arranque de la app y zod pesa mucho.
function parseSearch(s: Record<string, unknown>): { sponsor?: string; days?: 7 | 30 | 90 } {
  const out: { sponsor?: string; days?: 7 | 30 | 90 } = {};
  if (typeof s.sponsor === "string" && s.sponsor.length <= 120) out.sponsor = s.sponsor;
  const d = Number(s.days);
  if (d === 7 || d === 30 || d === 90) out.days = d;
  return out;
}

export const Route = createFileRoute("/_authenticated/admin/informe-auspiciante")({
  validateSearch: (s: Record<string, unknown>) => parseSearch(s),
  head: () => ({ meta: [{ title: "Jaikuaa — Informe para auspiciante" },
      { name: "description", content: "Consultá el informe de presencia de auspiciantes en Jaikuaa y prepará su versión imprimible." },
      { property: "og:title", content: "Jaikuaa — Informe para auspiciante" },
      { property: "og:description", content: "Consultá el informe de presencia de auspiciantes en Jaikuaa y prepará su versión imprimible." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: InformeAuspiciantePage,
});

const PERIODS = [7, 30, 90] as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Asuncion",
  });
}

function fmtNum(n: number) {
  return n.toLocaleString("es-PY");
}

function fmtPhone(n: string) {
  // 595982418732 → +595 982 418 732
  return n.startsWith("595") ? `+595 ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}` : n;
}

function InformeAuspiciantePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const days = search.days ?? 30;
  const fn = useServerFn(getSponsorReport);
  const q = useQuery({
    queryKey: ["sponsor-report", search.sponsor ?? "", days],
    queryFn: () => fn({ data: { sponsor: search.sponsor, days } }),
  });
  const d = q.data;
  const total = d ? d.rows.reduce((s, r) => s + r.impressions, 0) : 0;

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 14mm; } html, body { background: #fff !important; } }`}</style>

      {/* Controles (no se imprimen) */}
      <header className="border-b border-border/50 print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/corpus">← Volver al panel admin</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {d && d.sponsors.length > 1 && (
              <select
                aria-label="Auspiciante"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={d.sponsor}
                onChange={(e) => navigate({ search: (s) => ({ ...s, sponsor: e.target.value }) })}
              >
                {d.sponsors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Período"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={days}
              onChange={(e) =>
                navigate({ search: (s) => ({ ...s, days: Number(e.target.value) as 7 | 30 | 90 }) })
              }
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  Últimos {p} días
                </option>
              ))}
            </select>
            <Button size="sm" onClick={() => window.print()} disabled={!d?.sponsor}>
              <Printer className="mr-1 h-4 w-4" /> Imprimir / Guardar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 print:p-0">
        <div className="mx-auto max-w-3xl">
          {q.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : q.isError ? (
            <p className="py-16 text-center text-sm text-destructive">
              No se pudo cargar el informe. Esta página es solo para administradores.
            </p>
          ) : !d?.sponsor ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Todavía no hay impresiones registradas en los últimos {days} días.
            </p>
          ) : (
            <article className="rounded-2xl border border-border/60 bg-card p-8 shadow-elegant print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-5 print:border-gray-300">
                <BrandLogo size={44} />
                <div className="text-right text-xs text-muted-foreground print:text-gray-600">
                  <div>Informe de auspicio</div>
                  <div>Emitido el {fmtDate(d.to)}</div>
                </div>
              </div>

              <h1 className="mt-6 font-display text-2xl font-bold text-foreground print:text-black">
                {d.sponsor}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground print:text-gray-700">
                Período: del {fmtDate(d.from)} al {fmtDate(d.to)} ({d.days} días)
              </p>

              <div className="mt-6 rounded-xl bg-muted/50 p-5 print:border print:border-gray-300 print:bg-white">
                <div className="text-xs uppercase tracking-wide text-muted-foreground print:text-gray-600">
                  Impresiones en el período
                </div>
                <div className="mt-1 font-display text-4xl font-bold tabular-nums text-primary print:text-black">
                  {fmtNum(total)}
                </div>
              </div>

              <table className="mt-6 w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground print:border-gray-300 print:text-gray-600">
                    <th className="py-2 pr-3 font-medium">Espacio</th>
                    <th className="py-2 pr-3 text-right font-medium">Impresiones</th>
                    <th className="py-2 text-right font-medium">Usuarios distintos</th>
                  </tr>
                </thead>
                <tbody>
                  {d.rows.map((r) => (
                    <tr key={r.slot} className="border-b border-border/60 print:border-gray-200">
                      <td className="py-2 pr-3">{SPONSOR_SLOTS[r.slot as SponsorSlot]?.label ?? r.slot}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(r.impressions)}</td>
                      <td className="py-2 text-right tabular-nums">{fmtNum(r.uniqueUsers)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 space-y-1 text-xs text-muted-foreground print:text-gray-600">
                <p>
                  <strong>Impresión:</strong> un usuario registrado de Jaikuaa vio la leyenda «Presentado por{" "}
                  {d.sponsor}» en ese espacio. Se cuenta como máximo una vez por día, por usuario y por espacio.
                </p>
                <p>
                  <strong>Usuarios distintos:</strong> personas diferentes que vieron ese espacio en el período. No se
                  suman entre espacios porque una misma persona puede haber visto varios.
                </p>
                <p>Datos tomados directamente del registro de la plataforma, sin estimaciones.</p>
              </div>

              <footer className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground print:border-gray-300 print:text-gray-600">
                Guaraní Global Tech E.A.S. · RUC 80174299-4 · www.jaikuaa.com · WhatsApp {fmtPhone(SUPPORT_WHATSAPP)}
              </footer>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
