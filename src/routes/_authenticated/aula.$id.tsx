import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Archive, Check, Copy, FileText, Loader2, Minus, Plus, Send, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agregarTarea, archivarAula, borrarTarea, getAula, quitarAlumno } from "@/lib/aula.functions";
import { estadoTarea, fechaCorta, linkAula, mensajeInvitacion } from "@/lib/aula";

export const Route = createFileRoute("/_authenticated/aula/$id")({
  head: () => ({ meta: [{ title: "Jaikuaa — Aula" }, { name: "robots", content: "noindex" }] }),
  component: AulaDocente,
});

function haceCuanto(iso: string | null, hoy: string): string {
  if (!iso) return "Sin actividad reciente";
  const d = new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
  const dias = Math.round((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${d}T12:00:00Z`)) / 86400000);
  if (dias <= 0) return "Activo hoy";
  if (dias === 1) return "Activo ayer";
  return `Activo hace ${dias} días`;
}

function AulaDocente() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const aulaFn = useServerFn(getAula);
  const borrarFn = useServerFn(borrarTarea);
  const quitarFn = useServerFn(quitarAlumno);
  const archivarFn = useServerFn(archivarAula);
  const { data, isLoading, error } = useQuery({ queryKey: ["aula", id], queryFn: () => aulaFn({ data: { aulaId: id } }) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["aula", id] });

  if (isLoading) return <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin text-muted-foreground" />;
  if (error || !data)
    return (
      <main className="p-8 text-center">
        <p className="text-destructive">{(error as Error)?.message ?? "No encontramos el aula."}</p>
        <Button asChild className="mt-4">
          <Link to="/aula/docente">Volver a mis aulas</Link>
        </Button>
      </main>
    );

  const { aula, tareas, alumnos, hoy } = data;
  const link = linkAula(aula.codigo);
  const wa = `https://wa.me/?text=${encodeURIComponent(mensajeInvitacion(aula.nombre, aula.codigo))}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar. Copialo a mano.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/aula/docente">← Mis aulas</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{aula.nombre}</h1>
          {aula.institucion && <p className="text-sm text-muted-foreground">{aula.institucion}</p>}

          <section className="mt-5 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant">
            <p className="text-sm font-semibold text-foreground">Invitá a tus alumnos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Entran en <span className="font-medium">jaikuaa.com/aula</span> con este código, o directo desde el enlace:
            </p>
            <p className="mt-3 font-mono text-4xl font-bold tracking-[0.35em] text-primary">{aula.codigo}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="cta">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <Send className="h-4 w-4" /> Mandar por WhatsApp
                </a>
              </Button>
              <Button variant="outline" onClick={copiar}>
                <Copy className="h-4 w-4" /> Copiar enlace
              </Button>
            </div>
          </section>

          <NuevaTarea aulaId={aula.id} lecciones={data.lecciones} juegos={data.juegos} onAdded={refresh} />

          <section className="mt-8">
            <h2 className="font-display text-lg font-bold text-foreground">
              Avance de los alumnos{" "}
              <span className="text-sm font-normal text-muted-foreground">({alumnos.length})</span>
            </h2>
            {alumnos.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                Todavía no entró nadie. Mandales el código por WhatsApp.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="sticky left-0 bg-muted/40 p-3 font-semibold">Alumno</th>
                      {tareas.map((t, i) => (
                        <th key={t.id} className="p-3 text-center font-semibold" title={t.titulo}>
                          T{i + 1}
                        </th>
                      ))}
                      <th className="p-3 text-center font-semibold">Hechas</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((al) => (
                      <tr key={al.id} className="border-b last:border-0">
                        <td className="sticky left-0 bg-card p-3">
                          <p className="font-medium text-foreground">{al.nombre}</p>
                          <p className="text-xs text-muted-foreground">{haceCuanto(al.ultima, hoy)}</p>
                        </td>
                        {tareas.map((t) => {
                          const est = estadoTarea(al.hechas.includes(t.id), t.fechaLimite, hoy);
                          return (
                            <td key={t.id} className="p-3 text-center">
                              {est === "hecha" ? (
                                <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label="Hecha" />
                              ) : (
                                <Minus
                                  className={`mx-auto h-5 w-5 ${est === "vencida" ? "text-destructive" : "text-muted-foreground/50"}`}
                                  aria-label={est === "vencida" ? "Vencida" : "Pendiente"}
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center font-semibold">
                          {al.hechas.length}/{tareas.length}
                        </td>
                        <td className="whitespace-nowrap p-3 text-right">
                          <Button asChild size="sm" variant="ghost" aria-label={`Constancia de ${al.nombre}`}>
                            <Link to="/aula/constancia/$aulaId/$alumnoId" params={{ aulaId: aula.id, alumnoId: al.id }}>
                              <FileText className="h-4 w-4" /> Constancia
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Quitar a ${al.nombre}`}
                            onClick={async () => {
                              if (!window.confirm(`¿Quitar a ${al.nombre} del aula?`)) return;
                              await quitarFn({ data: { aulaId: aula.id, userId: al.id } });
                              refresh();
                            }}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="font-display text-lg font-bold text-foreground">Tareas</h2>
            {tareas.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Asigná la primera tarea con el formulario de arriba.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {tareas.map((t, i) => {
                  const hechas = alumnos.filter((a) => a.hechas.includes(t.id)).length;
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <span className="w-8 shrink-0 text-center font-mono text-xs font-bold text-primary">T{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{t.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.fechaLimite ? `Para el ${fechaCorta(t.fechaLimite)}` : "Sin fecha límite"} · {hechas} de{" "}
                          {alumnos.length} la hicieron{t.nota && ` · ${t.nota}`}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Borrar la tarea ${t.titulo}`}
                        onClick={async () => {
                          if (!window.confirm("¿Borrar esta tarea?")) return;
                          await borrarFn({ data: { aulaId: aula.id, tareaId: t.id } });
                          refresh();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <div className="mt-10 border-t pt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!window.confirm("¿Cerrar esta aula? Los alumnos ya no la van a ver.")) return;
                await archivarFn({ data: { aulaId: aula.id } });
                void qc.invalidateQueries({ queryKey: ["panel-docente"] });
                void navigate({ to: "/aula/docente" });
              }}
            >
              <Archive className="h-4 w-4" /> Cerrar aula
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function NuevaTarea({
  aulaId,
  lecciones,
  juegos,
  onAdded,
}: {
  aulaId: string;
  lecciones: { n: number; titulo: string }[];
  juegos: { ref: string; titulo: string }[];
  onAdded: () => void;
}) {
  const addFn = useServerFn(agregarTarea);
  const [tipo, setTipo] = useState<"leccion" | "juego">("leccion");
  const [ref, setRef] = useState("");
  const [fecha, setFecha] = useState("");
  const [nota, setNota] = useState("");
  const [busy, setBusy] = useState(false);

  async function agregar() {
    setBusy(true);
    try {
      await addFn({ data: { aulaId, tipo, ref, fechaLimite: fecha || null, nota: nota.trim() } });
      toast.success("Tarea asignada. Tus alumnos ya la ven.");
      setRef("");
      setNota("");
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo asignar.");
    } finally {
      setBusy(false);
    }
  }

  const opciones = tipo === "leccion" ? lecciones.map((l) => ({ v: String(l.n), t: `Lección ${l.n}: ${l.titulo}` })) : juegos.map((j) => ({ v: j.ref, t: j.titulo }));

  return (
    <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-display text-lg font-bold text-foreground">Asignar una tarea</h2>
      <div className="mt-3 flex gap-2">
        <Button variant={tipo === "leccion" ? "default" : "outline"} onClick={() => { setTipo("leccion"); setRef(""); }}>
          Lección
        </Button>
        <Button variant={tipo === "juego" ? "default" : "outline"} onClick={() => { setTipo("juego"); setRef(""); }}>
          Juego
        </Button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="h-11 rounded-md border bg-background px-3 text-sm"
          aria-label={tipo === "leccion" ? "Elegí la lección" : "Elegí el juego"}
        >
          <option value="">{tipo === "leccion" ? "Elegí la lección…" : "Elegí el juego…"}</option>
          {opciones.map((o) => (
            <option key={o.v} value={o.v}>
              {o.t}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="h-11"
          aria-label="Fecha límite (opcional)"
        />
      </div>
      <Input
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Indicación para los alumnos (opcional)"
        maxLength={300}
        className="mt-2"
      />
      <Button variant="cta" className="mt-3 h-11" onClick={agregar} disabled={busy || !ref}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Asignar
      </Button>
      {tipo === "juego" && (
        <p className="mt-2 text-xs text-muted-foreground">El juego cuenta como hecho cuando el alumno lo juega después de asignarlo.</p>
      )}
    </section>
  );
}
