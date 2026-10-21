import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Printer } from "lucide-react";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeacherNotebook } from "@/lib/notebook.functions";

export const Route = createFileRoute("/_authenticated/cuaderno")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Cuaderno digital del docente" },
      { name: "description", content: "Seguimiento semanal del avance de cada alumno del grupo." },
      { property: "og:title", content: "Jaikuaa — Cuaderno digital del docente" },
      { property: "og:description", content: "Avance de alumnos por grupo para docentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotebookPage,
});

const STATUS = {
  verde: { label: "Hizo lecciones esta semana", cls: "bg-primary" },
  amarillo: { label: "Entró, sin lecciones", cls: "bg-accent" },
  gris: { label: "Sin actividad en 7 días", cls: "bg-muted-foreground/40" },
} as const;

function NotebookPage() {
  const fn = useServerFn(getTeacherNotebook);
  const [cohort, setCohort] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["notebook", cohort],
    queryFn: () => fn({ data: { cohort } }),
  });
  // En el informe impreso se abre el detalle de cada alumno.
  useEffect(() => {
    const openAll = () => document.querySelectorAll("details").forEach((el) => (el.open = true));
    window.addEventListener("beforeprint", openAll);
    return () => window.removeEventListener("beforeprint", openAll);
  }, []);

  if (q.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Acceso restringido</h1>
        <p className="mt-2 text-muted-foreground">El cuaderno es solo para docentes de Jaikuaa.</p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }
  const d = q.data!;
  const s = d.students;
  const counts = {
    verde: s.filter((x) => x.status === "verde").length,
    amarillo: s.filter((x) => x.status === "amarillo").length,
    gris: s.filter((x) => x.status === "gris").length,
  };
  const needHelp = s.filter((x) => x.needsHelp);
  const today = new Date().toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Asuncion" });

  const exportCsv = () => {
    const rows = [
      ["Alumno", "Estado", "Lecciones completadas", "Va por", "Aciertos 30 días (%)", "Respuestas 30 días", "Palabras que más le cuestan", "XP semana", "Actividades semana", "XP total", "Racha", "Última actividad"],
      ...s.map((x) => [
        x.name,
        STATUS[x.status].label,
        x.lessonsDone,
        x.nextLesson ? `Lección ${x.nextLesson.n}` : "Terminó el curso",
        x.accuracy30 ?? "",
        x.answers30,
        x.struggles.map((w) => w.gn).join(" · "),
        x.weekXp,
        x.weekActivities,
        x.totalXp,
        x.streak,
        x.lastActive ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = `cuaderno-${d.cohort ?? "grupo"}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-6 print:max-w-none print:p-0">
      <style>{`@media print { @page { size: A4; margin: 14mm; } body { background: #fff !important; } }`}</style>
      <div className="print:hidden">
        <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
          ← Volver al panel
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Cuaderno digital</h1>
        <p className="mt-1 text-muted-foreground">
          Mirá de un vistazo cómo avanza cada alumno de tu grupo, quién necesita una mano y qué palabras cuestan más.
        </p>
      </div>

      {d.cohorts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Todavía no tenés un grupo asignado. Pedile al administrador de Jaikuaa que te asigne uno.
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            {d.isAdmin && d.cohorts.length > 1 ? (
              <Select value={d.cohort ?? undefined} onValueChange={setCohort}>
                <SelectTrigger className="h-11 sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {d.cohorts.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-display text-lg font-semibold text-foreground">Grupo: {d.cohort}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="h-11" onClick={exportCsv} disabled={s.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Planilla
              </Button>
              <Button variant="cta" className="h-11" onClick={() => window.print()} disabled={s.length === 0}>
                <Printer className="mr-2 h-4 w-4" /> Informe del grupo
              </Button>
            </div>
          </div>

          {/* Encabezado que solo sale en el informe impreso o en PDF */}
          <header className="hidden print:block">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-500">Jaikuaa · Informe del grupo</p>
                <h1 className="mt-1 text-2xl font-bold text-[#1E3A5F]">{d.cohort}</h1>
              </div>
              <p className="text-sm text-neutral-600">{today}</p>
            </div>
          </header>

          {d.summary && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Alumnos" value={d.summary.students} />
              <Stat label="Activos esta semana" value={d.summary.activeWeek} />
              <Stat label="Lecciones completadas" value={d.summary.lessonsCompleted} />
              <Stat
                label="Aciertos (30 días)"
                value={d.summary.accuracy30 === null ? "—" : `${d.summary.accuracy30} %`}
                hint={d.summary.answers30 ? `${d.summary.answers30} respuestas` : "sin respuestas aún"}
              />
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-3">
            {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => (
              <div key={k} className="rounded-xl border border-border/60 bg-card p-3 text-center print:border-neutral-300">
                <span className={`mx-auto mb-1 block h-3 w-3 rounded-full ${STATUS[k].cls}`} />
                <div className="font-display text-2xl font-bold text-foreground">{counts[k]}</div>
                <div className="text-xs text-muted-foreground">{STATUS[k].label}</div>
              </div>
            ))}
          </div>

          {needHelp.length > 0 && (
            <section className="mt-6 rounded-2xl border border-accent/40 bg-accent/5 p-4 print:break-inside-avoid">
              <h2 className="font-display text-lg font-bold text-foreground">🆘 Necesitan una mano</h2>
              <p className="text-sm text-muted-foreground">
                Entraron en las últimas dos semanas, pero hace 7 días que no terminan una lección.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {needHelp.map((x) => (
                  <li key={x.id} className="text-foreground">
                    <strong>{x.name}</strong> — va por la Lección {x.nextLesson?.n}
                    {x.nextLesson?.title ? ` («${x.nextLesson.title}»)` : ""}
                    {x.struggles.length > 0 && <> · le cuesta: {x.struggles.map((w) => w.gn).join(", ")}</>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {d.hardWords.length > 0 && (
            <section className="mt-6 print:break-inside-avoid">
              <h2 className="font-display text-lg font-bold text-foreground">Palabras que más le cuestan al grupo</h2>
              <p className="text-sm text-muted-foreground">Últimos 30 días. Sirve para repasarlas en clase.</p>
              <ul className="mt-3 space-y-2">
                {d.hardWords.map((w) => (
                  <li key={w.gn} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 print:border-neutral-300">
                    <span className="print:hidden">
                      <SpeakerButton gn={w.gn} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display font-semibold text-foreground">{w.gn}</span>
                        <span className="text-sm font-semibold tabular-nums text-accent">{w.wrongPct} % de errores</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.max(4, w.wrongPct)}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {w.attempts} respuestas · {w.students} {w.students === 1 ? "alumno se equivocó" : "alumnos se equivocaron"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {s.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Este grupo todavía no tiene alumnos. Se suman al canjear el código de invitación.
            </div>
          ) : (
            <section className="mt-6">
              <h2 className="font-display text-lg font-bold text-foreground">Alumnos</h2>
              <ul className="mt-3 space-y-2">
                {s.map((x) => (
                  <li key={x.id} className="rounded-xl border border-border/60 bg-card print:break-inside-avoid print:border-neutral-300">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                        <span className={`h-3 w-3 shrink-0 rounded-full ${STATUS[x.status].cls}`} aria-label={STATUS[x.status].label} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-foreground">{x.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {x.lessonsDone}/{d.totalLessons} lecciones
                            {x.accuracy30 !== null ? ` · ${x.accuracy30} % de aciertos` : ""} · racha {x.streak}
                            {x.lastActive ? ` · última vez ${x.lastActive}` : " · sin actividad"}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground group-open:rotate-180 print:hidden" aria-hidden>▾</span>
                      </summary>
                      <div className="border-t border-border/60 px-3 pb-3 pt-2 text-sm text-foreground">
                        <p>
                          {x.nextLesson
                            ? `Va por la Lección ${x.nextLesson.n}${x.nextLesson.title ? ` («${x.nextLesson.title}»)` : ""}.`
                            : "Terminó todas las lecciones del curso. 🎉"}
                        </p>
                        <p className="mt-1">
                          {x.struggles.length
                            ? `Le cuestan: ${x.struggles.map((w) => `${w.gn} (${w.wrong} ${w.wrong === 1 ? "error" : "errores"})`).join(", ")}.`
                            : x.answers30
                              ? "No tuvo errores repetidos en los últimos 30 días."
                              : "Todavía no hay respuestas registradas."}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {x.weekXp} XP y {x.weekActivities} actividades esta semana · {x.totalXp} XP en total.
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-6 hidden text-xs text-neutral-500 print:block">
            Informe generado por la plataforma Jaikuaa el {today}. «Aciertos» cuenta las respuestas de las lecciones y la
            Palabra del día de los últimos 30 días. Las respuestas hechas sin conexión se suman cuando el teléfono vuelve
            a tener señal.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 text-center print:border-neutral-300">
      <div className="font-display text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}
