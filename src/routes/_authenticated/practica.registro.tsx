import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPracticeLog } from "@/lib/teacher.functions";
import { withOfflineCache } from "@/lib/offline-data";

export const Route = createFileRoute("/_authenticated/practica/registro")({
  head: () => ({ meta: [{ title: "Jaikuaa — Registro de práctica" }, { name: "robots", content: "noindex" },
      { name: "description", content: "Consultá e imprimí el registro de tu práctica supervisada en Jaikuaa." },
      { property: "og:title", content: "Jaikuaa — Registro de práctica" },
      { property: "og:description", content: "Consultá e imprimí el registro de tu práctica supervisada en Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  validateSearch: (s: Record<string, unknown>): { u?: string } =>
    typeof s.u === "string" && /^[0-9a-f-]{36}$/i.test(s.u) ? { u: s.u } : {},
  component: PracticeLogPage,
});

const ESTADO: Record<string, string> = {
  propuesta: "Esperando revisión",
  revisada: "Esperando validación",
  validada: "Publicada",
  devuelta: "Devuelta",
  rechazada: "No aceptada",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-PY", { dateStyle: "short", timeStyle: "short", timeZone: "America/Asuncion" });

/** Registro imprimible de la práctica supervisada: cada paso con fecha y hora. */
function PracticeLogPage() {
  const { u } = Route.useSearch();
  const fn = useServerFn(getPracticeLog);
  const q = useQuery({
    queryKey: ["practice-log", u ?? "me"],
    queryFn: () => withOfflineCache(`practice-log:${u ?? "me"}`, () => fn({ data: { userId: u ?? null } })),
    retry: false,
    networkMode: "always",
  });

  if (q.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-muted-foreground">El registro es para estudiantes en práctica y sus docentes.</p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    );
  }
  const d = q.data;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-5 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to={u ? "/docente" : "/practica"} className="text-sm font-medium text-muted-foreground hover:text-primary">
          ← {u ? "Panel del docente" : "Panel de práctica"}
        </Link>
        <Button variant="outline" onClick={() => window.print()} disabled={!d.rows.length}>
          <Printer aria-hidden /> Imprimir o guardar PDF
        </Button>
      </div>

      <header className="mt-4">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Jaikuaa · Guaraní Global Tech E.A.S.</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Registro de práctica supervisada</h1>
        <p className="mt-1 text-foreground">
          <strong>{d.name || "—"}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Plan piloto que Jaikuaa desarrolla con el Ateneo de Lengua y Cultura Guaraní. Generado el{" "}
          {when(new Date().toISOString())}
        </p>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Num n={d.days} label="días con actividad" />
        <Num n={d.proposed} label="palabras verificadas" />
        <Num n={d.reviewed} label="propuestas revisadas" />
        <Num n={d.published} label="ya publicadas" />
      </div>

      {d.rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Todavía no hay actividad registrada.</p>
      ) : (
        <div className="mt-6 overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[520px] border-collapse text-sm print:min-w-0">
          <thead>
            <tr className="border-b-2 border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-2">Fecha y hora</th>
              <th className="py-2 pr-2">Qué hizo</th>
              <th className="py-2 pr-2">Palabra</th>
              <th className="py-2 pr-2">Significado</th>
              <th className="py-2">Estado hoy</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r, i) => (
              <tr key={i} className="border-b border-border/60 align-top print:break-inside-avoid">
                <td className="whitespace-nowrap py-2 pr-2 text-muted-foreground">{when(r.en)}</td>
                <td className="py-2 pr-2">{r.accion}</td>
                <td className="py-2 pr-2 font-semibold">{r.gn}</td>
                <td className="py-2 pr-2">{r.es}</td>
                <td className="py-2">{ESTADO[r.estado] ?? r.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <div className="mt-16 hidden grid-cols-2 gap-16 text-xs print:grid">
        <div className="border-t border-neutral-500 pt-1">Firma del estudiante</div>
        <div className="border-t border-neutral-500 pt-1">Firma del docente supervisor</div>
      </div>
    </div>
  );
}

function Num({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 text-center print:border-neutral-300">
      <div className="font-display text-2xl font-bold text-primary">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
