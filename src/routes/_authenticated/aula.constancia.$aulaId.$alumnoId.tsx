import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Loader2, Printer } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getConstancia } from "@/lib/aula.functions";
import { fechaCorta } from "@/lib/aula";

export const Route = createFileRoute("/_authenticated/aula/constancia/$aulaId/$alumnoId")({
  head: () => ({ meta: [{ title: "Jaikuaa — Constancia de participación" }, { name: "robots", content: "noindex" }] }),
  component: Constancia,
});

/** Al imprimir solo sale la constancia (sin menús ni avisos de la app). */
const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  #constancia, #constancia * { visibility: visible !important; }
  #constancia { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: 0; }
}`;

function Constancia() {
  const { aulaId, alumnoId } = Route.useParams();
  const fn = useServerFn(getConstancia);
  const { data, isLoading, error } = useQuery({
    queryKey: ["constancia", aulaId, alumnoId],
    queryFn: () => fn({ data: { aulaId, userId: alumnoId } }),
  });

  if (isLoading) return <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin text-muted-foreground" />;
  if (error || !data) return <p className="p-8 text-center text-destructive">{(error as Error)?.message ?? "No disponible."}</p>;

  const hechas = data.tareas.filter((t) => t.hecha);

  return (
    <div className="min-h-screen bg-muted/30 px-4 pb-28 pt-6">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto mb-4 flex max-w-2xl justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/aula/$id" params={{ id: aulaId }}>
            ← Volver al aula
          </Link>
        </Button>
        <Button size="sm" variant="cta" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir o guardar PDF
        </Button>
      </div>

      <article id="constancia" className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-slate-900 shadow-elegant sm:p-12">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <span className="text-xs text-slate-500">{fechaCorta(data.hoy)}</span>
        </div>
        <h1 className="mt-10 text-center font-display text-2xl font-bold uppercase tracking-wide">
          Constancia de participación
        </h1>
        <p className="mt-8 leading-relaxed">
          Se deja constancia de que <strong>{data.alumno}</strong> participa del aula <strong>«{data.aula}»</strong>
          {data.institucion && (
            <>
              {" "}
              de <strong>{data.institucion}</strong>
            </>
          )}
          , a cargo de <strong>{data.docente}</strong>, desde el {fechaCorta(data.desde)}, y completó{" "}
          <strong>
            {hechas.length} de {data.tareas.length}
          </strong>{" "}
          tareas de lengua guaraní asignadas en la plataforma Jaikuaa.
        </p>

        {data.tareas.length > 0 && (
          <ul className="mt-6 space-y-1.5 text-sm">
            {data.tareas.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                {t.hecha ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                )}
                <span className={t.hecha ? "" : "text-slate-400"}>{t.titulo}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-20 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <div className="border-t border-slate-400 pt-2">{data.docente}</div>
            <div className="text-xs text-slate-500">Docente a cargo</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2">Sello de la institución</div>
            <div className="text-xs text-slate-500">(opcional)</div>
          </div>
        </div>

        <p className="mt-12 text-center text-[11px] leading-relaxed text-slate-500">
          Constancia emitida por el docente a cargo con los datos registrados en Jaikuaa (www.jaikuaa.com). No es un
          certificado oficial de estudios.
        </p>
      </article>
    </div>
  );
}
