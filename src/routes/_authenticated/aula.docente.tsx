import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronRight, Loader2, Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { crearAula, decidirDocente, getPanelDocente, pedirAccesoDocente } from "@/lib/aula.functions";

export const Route = createFileRoute("/_authenticated/aula/docente")({
  head: () => ({ meta: [{ title: "Jaikuaa — Mis aulas" }, { name: "robots", content: "noindex" }] }),
  component: PanelDocente,
});

function PanelDocente() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const panelFn = useServerFn(getPanelDocente);
  const crearFn = useServerFn(crearAula);
  const { data, isLoading, error } = useQuery({ queryKey: ["panel-docente"], queryFn: () => panelFn() });
  const [nombre, setNombre] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [creando, setCreando] = useState(false);

  async function crear() {
    setCreando(true);
    try {
      const r = await crearFn({ data: { nombre: nombre.trim(), institucion: institucion.trim() } });
      toast.success(`Aula creada. Código: ${r.codigo}`);
      void qc.invalidateQueries({ queryKey: ["panel-docente"] });
      void navigate({ to: "/aula/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo crear el aula.");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandLogo withWordmark={false} />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/aula">← Mi aula</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Aula · Docentes</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">Mis aulas</h1>

          {isLoading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />}
          {error && <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>}

          {data && !data.esDocente && <PedirAcceso estado={data.solicitud} />}

          {data?.esDocente && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Creá un aula por grupo o curso. Cada aula tiene un código: lo compartís con tus alumnos y entran solos.
              </p>

              <div className="mt-6 space-y-3">
                {data.aulas.map((a) => (
                  <Link
                    key={a.id}
                    to="/aula/$id"
                    params={{ id: a.id }}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-lg font-bold text-foreground">{a.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.institucion && `${a.institucion} · `}
                        <span className="font-mono font-semibold tracking-wider text-primary">{a.codigo}</span>
                      </p>
                      <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {a.alumnos} alumnos
                        </span>
                        <span>{a.tareas} tareas</span>
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                {data.aulas.length === 0 && (
                  <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                    Todavía no tenés aulas. Creá la primera acá abajo.
                  </p>
                )}
              </div>

              <section className="mt-8 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant">
                <h2 className="font-display text-lg font-bold text-foreground">Crear un aula</h2>
                <div className="mt-3 grid gap-2">
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre del aula (ej.: 2.º Media – Guaraní)"
                    maxLength={80}
                  />
                  <Input
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                    placeholder="Institución (opcional)"
                    maxLength={120}
                  />
                  <Button variant="cta" className="h-11" onClick={crear} disabled={creando || nombre.trim().length < 2}>
                    {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear aula
                  </Button>
                </div>
              </section>
            </>
          )}

          {data?.isAdmin && <PedidosDocentes pedidos={data.pedidos} />}
        </div>
      </main>
    </div>
  );
}

function PedirAcceso({ estado }: { estado: string | null }) {
  const qc = useQueryClient();
  const pedirFn = useServerFn(pedirAccesoDocente);
  const [institucion, setInstitucion] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (estado === "pendiente") {
    return (
      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <p className="font-display text-lg font-bold text-foreground">Tu pedido está en revisión</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Apenas el equipo de Jaikuaa lo apruebe, vas a poder crear tus aulas desde esta pantalla.
        </p>
      </div>
    );
  }

  async function enviar() {
    setEnviando(true);
    try {
      await pedirFn({ data: { institucion: institucion.trim(), nota: nota.trim() } });
      toast.success("Pedido enviado. Te avisamos apenas esté aprobado.");
      void qc.invalidateQueries({ queryKey: ["panel-docente"] });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant">
      <h2 className="font-display text-lg font-bold text-foreground">Usá Jaikuaa con tus alumnos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Armás aulas con código, asignás lecciones y juegos con fecha, ves quién hizo cada tarea y entregás constancias.
        Es gratis. Como en las aulas hay alumnos, el equipo de Jaikuaa confirma primero que sos docente.
      </p>
      {estado === "rechazado" && (
        <p className="mt-3 text-sm text-destructive">Tu pedido anterior no se aprobó. Si fue un error, envialo de nuevo.</p>
      )}
      <div className="mt-4 grid gap-2">
        <Input
          value={institucion}
          onChange={(e) => setInstitucion(e.target.value)}
          placeholder="¿Dónde enseñás? (colegio, instituto, sede del Ateneo…)"
          maxLength={120}
        />
        <Textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Contanos en una línea qué enseñás (opcional)"
          maxLength={300}
          rows={2}
        />
        <Button variant="cta" className="h-11" onClick={enviar} disabled={enviando || institucion.trim().length < 2}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Pedir acceso como docente
        </Button>
      </div>
    </section>
  );
}

function PedidosDocentes({
  pedidos,
}: {
  pedidos: { userId: string; nombre: string; email: string; institucion: string; nota: string; fecha: string }[];
}) {
  const qc = useQueryClient();
  const decidirFn = useServerFn(decidirDocente);
  const [busy, setBusy] = useState<string | null>(null);

  async function decidir(userId: string, aprobar: boolean) {
    setBusy(userId);
    try {
      await decidirFn({ data: { userId, aprobar } });
      toast.success(aprobar ? "Docente habilitado." : "Pedido rechazado.");
      void qc.invalidateQueries({ queryKey: ["panel-docente"] });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-dashed p-5">
      <h2 className="font-display text-lg font-bold text-foreground">Pedidos de docentes (administrador)</h2>
      {pedidos.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No hay pedidos pendientes.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pedidos.map((p) => (
            <li key={p.userId} className="rounded-xl border bg-card p-3">
              <p className="font-medium text-foreground">{p.nombre || p.email}</p>
              <p className="text-xs text-muted-foreground">
                {p.email} · {p.institucion}
              </p>
              {p.nota && <p className="mt-1 text-sm text-foreground">{p.nota}</p>}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="cta" disabled={busy === p.userId} onClick={() => decidir(p.userId, true)}>
                  <Check className="h-4 w-4" /> Habilitar
                </Button>
                <Button size="sm" variant="outline" disabled={busy === p.userId} onClick={() => decidir(p.userId, false)}>
                  <X className="h-4 w-4" /> Rechazar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
