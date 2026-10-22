import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyConstancia } from "@/lib/teacher.functions";
import { withOfflineCache } from "@/lib/offline-data";

export const Route = createFileRoute("/_authenticated/docente/constancia")({
  head: () => ({ meta: [{ title: "Jaikuaa — Mi constancia" }, { name: "robots", content: "noindex" }] }),
  component: ConstanciaPage,
});

const longDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Asuncion" }) : "";

/**
 * Constancia de participación con el nombre y lo que la persona aportó.
 * Mientras el Ateneo no apruebe el texto (ajuste «constancia_aprobada»), se muestra como MODELO.
 */
function ConstanciaPage() {
  const fn = useServerFn(getMyConstancia);
  const q = useQuery({
    queryKey: ["my-constancia"],
    queryFn: () => withOfflineCache("my-constancia", () => fn()),
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
        <p className="text-muted-foreground">La constancia es para docentes y estudiantes en práctica del piloto.</p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    );
  }
  const d = q.data;
  const isTeacher = d.role === "docente";
  const back = isTeacher ? "/docente" : "/practica";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-5 print:max-w-none print:p-0">
      <style>{"@media print { @page { size: A4 landscape; margin: 10mm; } }"}</style>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to={back} className="text-sm font-medium text-muted-foreground hover:text-primary">
          ← {isTeacher ? "Panel del docente" : "Panel de práctica"}
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer aria-hidden /> Imprimir o guardar PDF
        </Button>
      </div>
      {!d.approved && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 print:hidden">
          Este es un <strong>modelo</strong>: el texto final de la constancia lo aprueba el Ateneo. Tus números se actualizan
          solos a medida que validás.
        </p>
      )}

      <article className="relative mx-auto mt-6 w-full overflow-hidden rounded-2xl border-[6px] border-double border-primary/60 bg-white p-6 sm:aspect-[1.414] sm:p-[6%] print:aspect-[1.414] text-neutral-900 shadow-elegant print:mt-0 print:rounded-none print:shadow-none">
        {!d.approved && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[18vw] font-black tracking-widest text-neutral-900/[0.06] print:text-[160px]"
            style={{ transform: "rotate(-24deg)" }}
            aria-hidden
          >
            MODELO
          </div>
        )}
        <div className="relative flex h-full flex-col text-center">
          <p className="text-[clamp(9px,1.4vw,13px)] uppercase tracking-[0.2em] text-neutral-500">
            Guaraní Global Tech E.A.S. · Jaikuaa
          </p>
          <h1 className="mt-[3%] font-display text-[clamp(22px,5vw,48px)] font-bold tracking-wide text-primary">CONSTANCIA</h1>
          <p className="mt-[3%] text-[clamp(11px,1.8vw,17px)] leading-relaxed">Se deja constancia de que</p>
          <p className="mt-[1.5%] border-b border-neutral-400 pb-1 font-display text-[clamp(18px,3.6vw,34px)] font-semibold">
            {d.name || "—"}
          </p>
          <p className="mx-auto mt-[3%] max-w-[85%] text-[clamp(11px,1.8vw,17px)] leading-relaxed">
            participó como {isTeacher ? <strong>docente validador</strong> : <strong>estudiante en práctica supervisada</strong>} en
            el plan piloto que Jaikuaa desarrolla con el Ateneo de Lengua y Cultura Guaraní
            {d.from && d.to ? (
              <>
                , entre el {longDate(d.from)} y el {longDate(d.to)}
              </>
            ) : null}
            , aportando su conocimiento a la revisión del vocabulario de la plataforma:
          </p>
          <div className="mx-auto mt-[3%] grid grid-cols-3 gap-[3%] text-[clamp(10px,1.5vw,14px)]">
            {isTeacher ? (
              <>
                <Fig n={d.words} label="palabras validadas" />
                <Fig n={d.reviews} label="propuestas revisadas" />
                <Fig n={d.validations} label="propuestas validadas" />
              </>
            ) : (
              <>
                <Fig n={d.proposals} label="palabras verificadas" />
                <Fig n={d.reviews} label="propuestas revisadas" />
                <Fig n={d.words} label="palabras validadas" />
              </>
            )}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-[10%] px-[6%] text-[clamp(9px,1.3vw,12px)] sm:mt-auto">
            <div className="border-t border-neutral-500 pt-1">
              Por el Ateneo de Lengua y Cultura Guaraní
            </div>
            <div className="border-t border-neutral-500 pt-1">
              Richard Ávalos Arriola
              <br />
              Presidente · Guaraní Global Tech E.A.S.
            </div>
          </div>
          <p className="mt-[2%] text-[clamp(8px,1.1vw,11px)] text-neutral-500">
            Asunción, {longDate(new Date().toISOString())} · www.jaikuaa.com
          </p>
        </div>
      </article>
    </div>
  );
}

function Fig({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-display text-[clamp(18px,3.4vw,32px)] font-bold text-primary">{n}</div>
      <div className="text-neutral-600">{label}</div>
    </div>
  );
}
