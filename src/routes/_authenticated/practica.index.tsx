import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GuaraniCharBar } from "@/components/guarani-char-bar";
import { StaffRequestCard } from "@/components/pilot/staff-request-card";
import { getMyStaffStatus, getPracticeHome } from "@/lib/teacher.functions";
import { getVerificationQueue, proposeContent, type VerificationWord } from "@/lib/validation-circuit.functions";

export const Route = createFileRoute("/_authenticated/practica/")({
  head: () => ({ meta: [{ title: "Jaikuaa — Panel de práctica" }, { name: "robots", content: "noindex" }] }),
  component: PracticePage,
});

const SOURCE: Record<VerificationWord["fuente"], { short: string; cite: string }> = {
  "common-voice": { short: "Common Voice", cite: "Mozilla Common Voice, guaraní (CC0)" },
  jojajovai: { short: "Jojajovai", cite: "Corpus Jojajovai (Grupo PLN, Universidad de la República, 2022)" },
  vikipeta: { short: "Vikipetã", cite: "Vikipetã, Wikipedia en guaraní (colaboradores de gn.wikipedia.org, CC BY-SA 4.0)" },
};

const SKIP_KEY = "jaikuaa:practica-saltadas";

function PracticePage() {
  const statusFn = useServerFn(getMyStaffStatus);
  const status = useQuery({ queryKey: ["my-staff-status"], queryFn: () => statusFn(), retry: false });
  if (status.isLoading) return <Spinner />;
  const s = status.data;
  if (!s) return <Shell><p className="mt-6 text-sm text-muted-foreground">No se pudo cargar. Revisá la conexión.</p></Shell>;
  if (!s.isPractice && !s.isTeacher) {
    return (
      <Shell>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Panel de práctica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Para estudiantes del Ateneo que hacen su práctica supervisada en Jaikuaa: verificar palabras, revisar propuestas
          y llevar el registro de lo hecho, todo en una sola pantalla.
        </p>
        <div className="mt-6">
          <StaffRequestCard request={s.request} defaultName={s.fullName} only="practicante" />
        </div>
      </Shell>
    );
  }
  return <PracticeHome />;
}

function PracticeHome() {
  const fn = useServerFn(getPracticeHome);
  const q = useQuery({ queryKey: ["practice-home"], queryFn: () => fn() });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <Shell><p className="mt-6 text-sm text-muted-foreground">No se pudo cargar el panel.</p></Shell>;
  const d = q.data;
  const name = d.fullName.trim().split(/\s+/)[0] ?? "";
  const left = Math.max(0, d.dailyLimit - d.today);

  return (
    <Shell>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Panel de práctica</h1>
      <p className="mt-1 text-muted-foreground">
        {name ? `Hola, ${name}. ` : ""}Tu práctica supervisada en una sola pantalla.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Num n={d.today} label={`hoy (máximo ${d.dailyLimit})`} />
        <Num n={d.mine.waiting} label="esperando revisión" />
        <Num n={d.mine.published} label="publicadas" />
        <Num n={d.mine.reviews} label="revisiones hechas" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {d.mine.returned > 0 && (
          <Button asChild variant="outline" className="h-auto justify-start whitespace-normal border-amber-300 bg-amber-50 p-4 text-left text-amber-900">
            <Link to="/validacion" search={{ tab: "mias" }}>
              ↩️ {d.mine.returned} {d.mine.returned === 1 ? "propuesta devuelta" : "propuestas devueltas"} para corregir
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" className="h-auto justify-start whitespace-normal p-4 text-left">
          <Link to="/validacion" search={{ tab: "revisar" }}>
            🔁 Revisar propuestas de otros ({d.toReview})
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start whitespace-normal p-4 text-left">
          <Link to="/practica/registro">📋 Mi registro de práctica</Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start whitespace-normal p-4 text-left">
          <Link to="/docente/constancia">🏅 Mi constancia</Link>
        </Button>
      </div>

      <h2 className="mt-8 font-display text-xl font-bold text-foreground">Verificar palabras</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Palabras que aparecen mucho en textos reales en guaraní y todavía no están en Jaikuaa. Si está bien escrita, escribí
        qué significa <strong>con tus palabras</strong>. Después la revisa otra persona y la valida un docente.
      </p>
      {left === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="text-4xl" aria-hidden>🌙</div>
          <p className="mt-2 font-semibold text-foreground">Llegaste a las {d.dailyLimit} de hoy. ¡Muy bien!</p>
          <p className="text-sm text-muted-foreground">Mañana podés seguir. Mientras, podés revisar propuestas de otros.</p>
        </div>
      ) : (
        <VerifyCards left={left} />
      )}

      <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-sm">
        <h2 className="font-display text-lg font-bold text-foreground">Tres reglas de oro</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
          <li>Escribí con tus palabras: no copies de traductores automáticos ni de inteligencia artificial.</li>
          <li>Si dudás, saltala. Es mejor esperar que enviar algo dudoso.</li>
          <li>Las variantes regionales van en «Notas».</li>
        </ul>
      </section>
    </Shell>
  );
}

function VerifyCards({ left }: { left: number }) {
  const fn = useServerFn(getVerificationQueue);
  const proposeFn = useServerFn(proposeContent);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["verification-queue"], queryFn: () => fn() });
  const [skipped, setSkipped] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [es, setEs] = useState("");
  const [gnEdit, setGnEdit] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    if (!q.data) return [];
    return q.data.palabras.filter((p) => (q.data.state[p.gn] ?? "pendiente") === "pendiente" && !sent.has(p.gn) && !skipped.has(p.gn));
  }, [q.data, sent, skipped]);
  const word = list[0];

  const reset = () => {
    setEs("");
    setNotes("");
    setGnEdit(null);
    setOpen(false);
  };

  const send = useMutation({
    mutationFn: (w: VerificationWord) =>
      proposeFn({
        data: {
          kind: "nueva",
          targetWordId: null,
          gn: (gnEdit ?? w.gn).trim(),
          es: es.trim(),
          notes: notes.trim(),
          source: `${SOURCE[w.fuente].cite}; verificada en práctica supervisada`,
        },
      }),
    onSuccess: (r, w) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Enviada. Ahora la revisa otra persona.");
      setSent((s) => new Set(s).add(w.gn));
      reset();
      void qc.invalidateQueries({ queryKey: ["practice-home"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo enviar."),
  });

  const skip = () => {
    if (!word) return;
    const next = new Set(skipped).add(word.gn);
    setSkipped(next);
    try {
      sessionStorage.setItem(SKIP_KEY, JSON.stringify([...next]));
    } catch {}
    reset();
  };

  if (q.isLoading) return <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-primary" />;
  if (q.isError) return <p className="mt-4 text-sm text-muted-foreground">No se pudo cargar la lista.</p>;
  if (!word) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
        <div className="text-4xl" aria-hidden>🎉</div>
        <p className="mt-2 font-semibold text-foreground">No quedan palabras para verificar.</p>
      </div>
    );
  }

  return (
    <article className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-elegant">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Aparece {word.veces} veces · {SOURCE[word.fuente].short}
        </span>
        <span>Te quedan {left} hoy</span>
      </div>
      <p className="mt-4 break-words font-display text-4xl font-bold text-primary">{word.gn}</p>
      {word.ejemplo && <p className="mt-2 text-sm italic text-muted-foreground">Ejemplo real: «{word.ejemplo}»</p>}

      {!open ? (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-14" onClick={skip}>
            <SkipForward aria-hidden /> No estoy seguro
          </Button>
          <Button variant="cta" className="h-14" onClick={() => setOpen(true)}>
            <Check aria-hidden /> Está bien escrita
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="p-es">
              ¿Qué significa? (en castellano, con tus palabras)
            </label>
            <Input id="p-es" value={es} onChange={(e) => setEs(e.target.value)} maxLength={300} autoFocus />
          </div>
          <details className="rounded-xl bg-muted/40 p-3 text-sm">
            <summary className="cursor-pointer text-muted-foreground">La escritura necesita un ajuste</summary>
            <div className="mt-2">
              <Input
                aria-label="Escritura corregida"
                value={gnEdit ?? word.gn}
                onChange={(e) => setGnEdit(e.target.value)}
                maxLength={200}
              />
              <div className="mt-2">
                <GuaraniCharBar />
              </div>
            </div>
          </details>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="p-notes">
              Notas (opcional: uso, región, si es una forma conjugada)
            </label>
            <Textarea id="p-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12" onClick={reset} disabled={send.isPending}>
              Volver
            </Button>
            <Button
              variant="cta"
              className="h-12"
              disabled={!es.trim() || !(gnEdit ?? word.gn).trim() || send.isPending}
              onClick={() => send.mutate(word)}
            >
              {send.isPending && <Loader2 className="animate-spin" aria-hidden />} Enviar
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-5">
      <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
        ← Inicio
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
    <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
      <div className="font-display text-2xl font-bold text-primary">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
