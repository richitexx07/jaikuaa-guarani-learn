import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Clock, Loader2, LogIn, School } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMisAulas, salirAula, unirseAula } from "@/lib/aula.functions";
import { PageHero } from "@/components/page-hero";
import jaiProfe from "@/assets/jai-profe.webp";
import { estadoTarea, fechaCorta, normalizarCodigo } from "@/lib/aula";

export const Route = createFileRoute("/_authenticated/aula/")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Mi aula" },
      { name: "description", content: "Entrá al aula de tu docente con su código y mirá las tareas de guaraní." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { codigo?: string } =>
    typeof s.codigo === "string" ? { codigo: normalizarCodigo(s.codigo) } : {},
  component: AulaAlumno,
});

/** A dónde lleva cada tarea. */
function destino(tipo: string, ref: string): { to: string; params?: Record<string, string> } {
  if (tipo === "leccion") {
    const n = ref.split(":")[1] ?? "1";
    return { to: "/curso/$lang/leccion/$n", params: { lang: "guarani", n } };
  }
  return { to: `/juegos/${ref}` };
}

function AulaAlumno() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const misFn = useServerFn(getMisAulas);
  const unirseFn = useServerFn(unirseAula);
  const salirFn = useServerFn(salirAula);
  const { data, isLoading, error } = useQuery({ queryKey: ["mis-aulas"], queryFn: () => misFn() });
  const [codigo, setCodigo] = useState(search.codigo ?? "");
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (search.codigo) setCodigo(search.codigo);
  }, [search.codigo]);

  async function entrar() {
    setEntrando(true);
    try {
      const r = await unirseFn({ data: { codigo } });
      toast.success(`Listo: ya estás en «${r.nombre}».`);
      setCodigo("");
      void qc.invalidateQueries({ queryKey: ["mis-aulas"] });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo entrar al aula.");
    } finally {
      setEntrando(false);
    }
  }

  async function salir(aulaId: string, nombre: string) {
    if (!window.confirm(`¿Salir del aula «${nombre}»? Tu docente deja de ver tu avance.`)) return;
    await salirFn({ data: { aulaId } });
    void qc.invalidateQueries({ queryKey: ["mis-aulas"] });
  }

  const aulas = data?.aulas ?? [];

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

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <PageHero img={jaiProfe} imgAlt="Jai, el profe" eyebrow="Aula" title="Mi aula">
            Entrá con el código de tu docente y mirá tus tareas.
          </PageHero>
          <p className="mt-3 text-xs text-muted-foreground">
            Tu docente solo ve tu nombre y lo que completaste.
          </p>

          <div className="mt-5 rounded-2xl border border-primary/30 bg-card p-4 shadow-sm">
            <label htmlFor="codigo" className="text-sm font-semibold text-foreground">
              Código del aula
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
                placeholder="Ej.: K7M2QX"
                className={`h-12 text-lg ${codigo ? "font-mono tracking-[0.3em]" : ""}`}
                autoCapitalize="characters"
                autoComplete="off"
              />
              <Button className="h-12" variant="cta" onClick={entrar} disabled={entrando || codigo.length < 6}>
                {entrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Entrar
              </Button>
            </div>
          </div>

          {isLoading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />}
          {error && <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>}

          <div className="mt-8 space-y-6">
            {aulas.map((a) => {
              const hechas = a.tareas.filter((t) => t.hecha).length;
              return (
                <section key={a.id} className="rounded-2xl border bg-card p-5 shadow-elegant">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">{a.nombre}</h2>
                      <p className="text-sm text-muted-foreground">
                        {[a.docente && `Docente: ${a.docente}`, a.institucion].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {a.tareas.length > 0 && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {hechas} de {a.tareas.length} tareas
                      </span>
                    )}
                  </div>
                  {a.tareas.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">Tu docente todavía no asignó tareas.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {a.tareas.map((t) => {
                        const est = estadoTarea(t.hecha, t.fechaLimite, data?.hoy ?? "");
                        const d = destino(t.tipo, t.ref);
                        return (
                          <li key={t.id} className="flex items-center gap-3 rounded-xl border p-3">
                            {est === "hecha" ? (
                              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-label="Hecha" />
                            ) : est === "vencida" ? (
                              <Clock className="h-6 w-6 shrink-0 text-destructive" aria-label="Vencida" />
                            ) : (
                              <Circle className="h-6 w-6 shrink-0 text-muted-foreground" aria-label="Pendiente" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{t.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                {est === "hecha"
                                  ? "Hecha"
                                  : t.fechaLimite
                                    ? `${est === "vencida" ? "Venció" : "Para"} el ${fechaCorta(t.fechaLimite)}`
                                    : "Sin fecha límite"}
                                {t.nota && ` · ${t.nota}`}
                              </p>
                            </div>
                            {est !== "hecha" && (
                              <Button asChild size="sm" variant="cta">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Link {...(d as any)}>Hacer</Link>
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => void salir(a.id, a.nombre)}
                    className="mt-4 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Salir de esta aula
                  </button>
                </section>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-dashed p-5 text-center">
            <School className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <p className="mt-2 font-display text-lg font-bold text-foreground">¿Sos docente?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Armá tu aula, asigná lecciones y juegos, seguí el avance de tus alumnos y entregá constancias.
            </p>
            <Button asChild className="mt-4" variant={data?.esDocente ? "cta" : "outline"}>
              <Link to="/aula/docente">{data?.esDocente ? "Mis aulas como docente" : "Quiero usar Jaikuaa con mis alumnos"}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
