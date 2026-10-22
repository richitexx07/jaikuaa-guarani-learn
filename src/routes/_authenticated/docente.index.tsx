import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Copy, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffRequestCard } from "@/components/pilot/staff-request-card";
import {
  decideStaffRequest,
  getMyStaffStatus,
  getTeacherHome,
  listPracticeStudents,
  listStaffRequests,
} from "@/lib/teacher.functions";
import { FOUR_QUESTIONS, weeklyReminderText } from "@/lib/validation-checklist";
import { withOfflineCache } from "@/lib/offline-data";
import { PanelTools } from "@/components/pilot/panel-tools";
import { warmPages } from "@/lib/offline-pack";
import { listValidationQueue } from "@/lib/teacher.functions";
import { staffStatusRefreshInterval } from "@/lib/staff-status-refresh";

export const Route = createFileRoute("/_authenticated/docente/")({
  head: () => ({
    meta: [
      { title: "Jaikuaa — Panel del docente" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherPanelPage,
});

function firstName(s: string) {
  return s.trim().split(/\s+/)[0] ?? "";
}

function TeacherPanelPage() {
  const statusFn = useServerFn(getMyStaffStatus);
  const status = useQuery({
    queryKey: ["my-staff-status"],
    queryFn: () => withOfflineCache("my-staff-status", () => statusFn()),
    refetchInterval: (query) => staffStatusRefreshInterval(query.state.data),
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    retry: false,
    networkMode: "always",
  });

  if (status.isLoading) return <Spinner />;
  const s = status.data;
  if (!s) {
    return (
      <Shell>
        <p className="mt-6 text-sm text-muted-foreground">No se pudo cargar. Revisá la conexión y volvé a abrir esta pantalla.</p>
      </Shell>
    );
  }
  if (!s.isTeacher) {
    return (
      <Shell>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Panel del docente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acá cada docente del piloto tiene todo en una sola pantalla: palabras para validar, avisos de error y el avance
          de su grupo.
        </p>
        <div className="mt-6">
          <StaffRequestCard request={s.request} defaultName={s.fullName} only="docente" />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Sos estudiante del Ateneo en práctica?{" "}
          <Link to="/practica" className="font-semibold text-primary underline-offset-4 hover:underline">
            Entrá al Panel de práctica
          </Link>
        </p>
      </Shell>
    );
  }
  return <TeacherHome />;
}

/**
 * Con señal, deja guardado en el celular lo necesario para validar después sin conexión:
 * las pantallas del docente y la lista de palabras para validar.
 */
function useWarmOffline() {
  const qc = useQueryClient();
  const listFn = useServerFn(listValidationQueue);
  useEffect(() => {
    if (!navigator.onLine) return;
    const t = setTimeout(() => {
      void warmPages(["/docente", "/validar", "/docente/constancia", "/cuaderno"]);
      void qc.prefetchQuery({
        queryKey: ["quick-validate"],
        queryFn: () => withOfflineCache("validation-queue", () => listFn()),
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [qc, listFn]);
}

function TeacherHome() {
  useWarmOffline();
  const fn = useServerFn(getTeacherHome);
  const q = useQuery({
    queryKey: ["teacher-home"],
    queryFn: () => withOfflineCache("teacher-home", () => fn()),
    refetchOnWindowFocus: true,
    networkMode: "always",
  });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) {
    return (
      <Shell>
        <p className="mt-6 text-sm text-muted-foreground">No se pudo cargar el panel. Revisá la conexión.</p>
      </Shell>
    );
  }
  const d = q.data;
  const name = firstName(d.fullName);

  return (
    <Shell>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Panel del docente</h1>
      <p className="mt-1 text-muted-foreground">
        {name ? `Hola, ${name}. ` : ""}Todo lo del piloto en una sola pantalla.
      </p>
      <PanelTools />

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-primary">Para hoy</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Tile
          to="/validar"
          emoji="⚡"
          title="Validar palabras"
          main={d.pending.words}
          unit={d.pending.words === 1 ? "palabra esperando" : "palabras esperando"}
          sub={d.pending.wordsInLessons ? `${d.pending.wordsInLessons} son de las lecciones` : "Una por pantalla, con audio"}
          strong
        />
        <Tile
          to="/validacion"
          search={{ tab: "errores" }}
          emoji="⚠️"
          title="Avisos de error"
          main={d.pending.reports}
          unit={d.pending.reports === 1 ? "aviso abierto" : "avisos abiertos"}
          sub="Lo que señalaron alumnos y docentes"
        />
        <Tile
          to="/validacion"
          search={{ tab: d.pending.toValidate ? "validar" : "revisar" }}
          emoji="🔁"
          title="Propuestas nuevas"
          main={d.pending.toValidate + d.pending.toReview}
          unit="en el circuito"
          sub={`${d.pending.toReview} para revisar · ${d.pending.toValidate} para validar`}
        />
        <Tile
          to="/cuaderno"
          emoji="📒"
          title="Mi grupo"
          main={d.cohort ? d.groupSize : null}
          unit={d.cohort ? (d.groupSize === 1 ? "alumno" : "alumnos") : ""}
          sub={d.cohort ? `Grupo «${d.cohort}» · quién necesita una mano` : "Todavía no tenés un grupo asignado"}
        />
      </div>

      {d.isAdmin && <StaffRequestsInbox count={d.pending.staffRequests} />}

      <section className="mt-8 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">🏅 Mi aporte</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/docente/constancia">Ver mi constancia</Link>
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Num n={d.mine.words} label="palabras validadas" />
          <Num n={d.mine.wordsWeek} label="esta semana" />
          <Num n={d.mine.reviews} label="propuestas revisadas" />
          <Num n={d.mine.validations} label="propuestas validadas" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Cada palabra que aprobás queda publicada con tu nombre como validador.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="font-display text-lg font-bold text-foreground">Las cuatro preguntas antes de aprobar</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {FOUR_QUESTIONS.map((x, i) => (
            <li key={x.id} className="flex gap-3 rounded-xl bg-card p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-foreground">{x.q}</span>
                <span className="block text-xs text-muted-foreground">{x.hint}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-foreground">
          Si la respuesta a las cuatro es sí, aprobá. <strong>Si dudás, no apruebes:</strong> tocá «Error» y contá qué
          viste. Es mejor esperar que publicar algo dudoso.
        </p>
      </section>

      {d.practiceCount > 0 && <PracticeStudents />}

      {d.isAdmin && <WeeklyReminder pending={d.pending.words} inLessons={d.pending.wordsInLessons} reports={d.pending.reports} />}
    </Shell>
  );
}

/* ------------------------------ Pedidos de acceso (admin) ------------------------------ */

function StaffRequestsInbox({ count }: { count: number }) {
  const listFn = useServerFn(listStaffRequests);
  const decideFn = useServerFn(decideStaffRequest);
  const qc = useQueryClient();
  const [cohort, setCohort] = useState("Piloto Ateneo");
  const q = useQuery({ queryKey: ["staff-requests"], queryFn: () => listFn() });
  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "aprobar" | "rechazar" }) =>
      decideFn({ data: { ...v, cohort: v.decision === "aprobar" && cohort.trim() ? cohort.trim() : null } }),
    onSuccess: (_r, v) => {
      toast.success(v.decision === "aprobar" ? "Aprobado. Ya puede entrar a su panel." : "Pedido no aprobado.");
      void qc.invalidateQueries({ queryKey: ["staff-requests"] });
      void qc.invalidateQueries({ queryKey: ["teacher-home"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo guardar."),
  });
  const pending = q.data?.pending ?? [];

  return (
    <section className="mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-5">
      <h2 className="font-display text-lg font-bold text-foreground">
        🙋 Pedidos de acceso {count > 0 && <span className="text-accent">({count})</span>}
      </h2>
      {q.isLoading ? (
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-primary" />
      ) : pending.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No hay pedidos nuevos. Para sumar a alguien, mandale el enlace <strong>www.jaikuaa.com/docente</strong> (docentes) o{" "}
          <strong>www.jaikuaa.com/practica</strong> (estudiantes en práctica).
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="cohort" className="text-muted-foreground">
              Al aprobar, sumar al grupo:
            </label>
            <Input id="cohort" value={cohort} onChange={(e) => setCohort(e.target.value)} className="h-9 w-48" maxLength={60} />
          </div>
          <ul className="mt-3 space-y-2">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.kind === "docente" ? "Docente validador" : "Estudiante en práctica"} · {r.institution || "Sin institución"}
                    {r.email && <> · {r.email}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: r.id, decision: "rechazar" })}
                    aria-label={`No aprobar a ${r.full_name}`}
                  >
                    <X aria-hidden /> No
                  </Button>
                  <Button
                    size="sm"
                    variant="cta"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: r.id, decision: "aprobar" })}
                    aria-label={`Aprobar a ${r.full_name}`}
                  >
                    <Check aria-hidden /> Aprobar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* --------------------------------- Estudiantes en práctica --------------------------------- */

function PracticeStudents() {
  const fn = useServerFn(listPracticeStudents);
  const q = useQuery({ queryKey: ["practice-students"], queryFn: () => fn() });
  const list = q.data?.students ?? [];
  return (
    <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
      <h2 className="font-display text-lg font-bold text-foreground">🎓 Estudiantes en práctica</h2>
      {q.isLoading ? (
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-primary" />
      ) : list.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Todavía no hay estudiantes en práctica.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/60">
          {list.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  Esta semana: {s.proposedWeek} propuestas · {s.reviewsWeek} revisiones — en total {s.published} publicadas
                </p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link to="/practica/registro" search={{ u: s.id }}>
                  Ver registro
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------ Recordatorio semanal ------------------------------------ */

function WeeklyReminder({ pending, inLessons, reports }: { pending: number; inLessons: number; reports: number }) {
  const text = weeklyReminderText(pending, inLessons, reports);
  const [copied, setCopied] = useState(false);
  return (
    <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
      <h2 className="font-display text-lg font-bold text-foreground">📲 Recordatorio para los docentes</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Texto listo con los números de hoy. Copialo y mandalo vos por WhatsApp al grupo de docentes (la plataforma no
        envía mensajes sola).
      </p>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/60 p-3 font-sans text-sm text-foreground">{text}</pre>
      <Button
        className="mt-3"
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            toast.error("No se pudo copiar. Mantené apretado el texto para copiarlo.");
          }
        }}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />} {copied ? "Copiado" : "Copiar texto"}
      </Button>
    </section>
  );
}

/* ------------------------------------------ Piezas ------------------------------------------ */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-5">
      <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
        ← Lecciones y juegos
      </Link>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function Num({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3 text-center">
      <div className="font-display text-2xl font-bold text-primary">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Tile({
  to,
  search,
  emoji,
  title,
  main,
  unit,
  sub,
  strong = false,
}: {
  to: "/validar" | "/validacion" | "/cuaderno";
  search?: { tab: "errores" | "validar" | "revisar" };
  emoji: string;
  title: string;
  main: number | null;
  unit: string;
  sub: string;
  strong?: boolean;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className={`group block rounded-2xl border p-5 shadow-elegant transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
        strong ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-card"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
        <span className={`font-display text-lg font-bold ${strong ? "" : "text-foreground"}`}>{title}</span>
      </div>
      {main !== null && (
        <p className="mt-2">
          <span className="font-display text-3xl font-bold">{main}</span>{" "}
          <span className={`text-sm ${strong ? "opacity-90" : "text-muted-foreground"}`}>{unit}</span>
        </p>
      )}
      <p className={`mt-1 text-sm ${strong ? "opacity-90" : "text-muted-foreground"}`}>{sub}</p>
    </Link>
  );
}
