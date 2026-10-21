import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Loader2, SkipForward, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpeakerButton } from "@/components/audio/speaker-button";
import { WordAudioRecorder } from "@/components/corpus/word-audio-recorder";
import { listCorpusWords, quickValidateWord } from "@/lib/corpus.functions";
import { reportContentError } from "@/lib/content-reports.functions";

export const Route = createFileRoute("/_authenticated/validar")({
  head: () => ({ meta: [{ title: "Jaikuaa — Validación rápida" }] }),
  component: QuickValidatePage,
});

type Word = {
  id: string;
  gn: string;
  es: string;
  audio_slug: string;
  has_audio: boolean;
  status: string;
  notes: string | null;
  category: string | null;
  validated_by: string | null;
};
type Done = { id: string; gn: string; prevStatus: "draft" | "published" };
type ReportKind = "escritura" | "significado" | "audio" | "otro";

const SKIP_KEY = "jaikuaa:validar-saltadas";
const COUNT_KEY = "jaikuaa:validar-hoy";

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}
function readCount(): number {
  try {
    const v = JSON.parse(localStorage.getItem(COUNT_KEY) || "null") as { day: string; n: number } | null;
    return v && v.day === today() ? v.n : 0;
  } catch {
    return 0;
  }
}
function saveCount(n: number) {
  try {
    localStorage.setItem(COUNT_KEY, JSON.stringify({ day: today(), n }));
  } catch {}
}

function QuickValidatePage() {
  const listFn = useServerFn(listCorpusWords);
  const validateFn = useServerFn(quickValidateWord);
  const reportFn = useServerFn(reportContentError);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["quick-validate"],
    queryFn: () => listFn({ data: { onlyPendingValidation: true, limit: 500 } }),
    retry: false,
  });

  const [skipped, setSkipped] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(SKIP_KEY) || "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Done[]>([]);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => setCount(readCount()), []);
  useEffect(() => {
    try {
      sessionStorage.setItem(SKIP_KEY, JSON.stringify([...skipped]));
    } catch {}
  }, [skipped]);

  // Primero las palabras con audio (se pueden escuchar y validar completas), después el resto.
  const queue = useMemo(() => {
    const words = ((q.data?.words ?? []) as Word[]).filter((w) => !w.validated_by && !handled.has(w.id));
    const fresh = words.filter((w) => !skipped.has(w.id));
    const later = words.filter((w) => skipped.has(w.id));
    const byAudio = (a: Word, b: Word) => Number(b.has_audio) - Number(a.has_audio);
    return [...fresh.sort(byAudio), ...later.sort(byAudio)];
  }, [q.data, handled, skipped]);
  const word = queue[0];
  const total = queue.length;

  const next = useCallback((id: string) => {
    setHandled((h) => new Set(h).add(id));
    setDrag(0);
  }, []);

  const approve = useCallback(async () => {
    if (!word || busy) return;
    setBusy(true);
    try {
      const r = await validateFn({ data: { id: word.id, action: "approve" } });
      setHistory((h) => [...h.slice(-19), { id: word.id, gn: word.gn, prevStatus: r.prevStatus }]);
      const n = count + 1;
      setCount(n);
      saveCount(n);
      next(word.id);
    } catch {
      toast.error("No se pudo validar. Revisá la conexión y probá de nuevo.");
      setDrag(0);
    } finally {
      setBusy(false);
    }
  }, [word, busy, validateFn, count, next]);

  const skip = useCallback(() => {
    if (!word) return;
    // La palabra saltada pasa al final de la fila (también si se vuelve a abrir la pantalla).
    setSkipped((s) => new Set(s).add(word.id));
    setDrag(0);
  }, [word]);

  const undo = useCallback(async () => {
    const last = history.at(-1);
    if (!last || busy) return;
    setBusy(true);
    try {
      await validateFn({ data: { id: last.id, action: "undo", prevStatus: last.prevStatus } });
      setHistory((h) => h.slice(0, -1));
      setHandled((h) => {
        const c = new Set(h);
        c.delete(last.id);
        return c;
      });
      setSkipped((s) => {
        const c = new Set(s);
        c.delete(last.id);
        return c;
      });
      const n = Math.max(0, count - 1);
      setCount(n);
      saveCount(n);
      void qc.invalidateQueries({ queryKey: ["quick-validate"] });
      toast.success(`Se deshizo la validación de «${last.gn}».`);
    } catch (e) {
      toast.error((e as Error)?.message || "No se pudo deshacer.");
    } finally {
      setBusy(false);
    }
  }, [history, busy, validateFn, count, qc]);

  // Atajos de teclado para validar rápido desde la computadora.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reporting) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "Enter") void approve();
      else if (e.key === "ArrowLeft") setReporting(true);
      else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") skip();
      else if (e.key.toLowerCase() === "z") void undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [approve, skip, undo, reporting]);

  if (q.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Solo para docentes validadores</h1>
        <p className="mt-2 text-muted-foreground">
          Esta pantalla es para los docentes que validan las palabras de Jaikuaa. Si sos docente, pedí al
          administrador que te habilite.
        </p>
        <Button asChild variant="cta" className="mt-6">
          <Link to="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  const tint = drag > 40 ? "ring-4 ring-primary/40" : drag < -40 ? "ring-4 ring-accent/40" : "";

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-lg flex-col px-4 pb-24 pt-5">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
          ← Panel
        </Link>
        <Button variant="ghost" size="sm" onClick={() => void undo()} disabled={!history.length || busy}>
          <Undo2 aria-hidden /> Deshacer
        </Button>
      </div>
      <h1 className="mt-2 font-display text-2xl font-bold text-foreground">⚡ Validación rápida</h1>
      <p className="text-sm text-muted-foreground">
        Escuchá, leé y decidí. Una palabra por pantalla: lo que apruebes queda publicado con tu nombre.
      </p>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-primary">Hoy validaste {count}</span>
        <span className="text-muted-foreground">Quedan {total}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${count + total ? Math.round((count / (count + total)) * 100) : 100}%` }}
        />
      </div>

      {!word ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center">
          <div className="text-5xl" aria-hidden>🎉</div>
          <h2 className="mt-3 font-display text-xl font-bold text-foreground">¡No queda nada por validar!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gracias. Cuando haya palabras nuevas van a aparecer acá.</p>
        </div>
      ) : (
        <>
          <article
            key={word.id}
            className={`mt-5 flex-1 touch-pan-y select-none rounded-3xl border border-border bg-card p-6 shadow-elegant transition-[box-shadow] ${tint}`}
            style={{ transform: `translateX(${drag}px) rotate(${drag / 30}deg)` }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("button, a, input, textarea, audio")) return;
              startX.current = e.clientX;
            }}
            onPointerMove={(e) => {
              if (startX.current !== null) setDrag(e.clientX - startX.current);
            }}
            onPointerUp={() => {
              if (startX.current === null) return;
              startX.current = null;
              if (drag > 90) void approve();
              else if (drag < -90) {
                setDrag(0);
                setReporting(true);
              } else setDrag(0);
            }}
            onPointerCancel={() => {
              startX.current = null;
              setDrag(0);
            }}
          >
            <div className="flex flex-wrap gap-2">
              {word.status === "draft" ? (
                <Badge variant="outline">En borrador: los alumnos todavía no la ven</Badge>
              ) : (
                <Badge variant="secondary">Publicada, falta tu validación</Badge>
              )}
              {word.category && <Badge variant="outline">{word.category}</Badge>}
            </div>
            <div className="mt-6 flex items-center gap-4">
              {word.has_audio ? <SpeakerButton gn={word.gn} size="md" className="h-14 w-14 [&_svg]:h-7 [&_svg]:w-7" /> : null}
              <div className="min-w-0">
                <div className="break-words font-display text-4xl font-bold text-primary">{word.gn}</div>
                <div className="mt-1 text-xl text-foreground">{word.es}</div>
              </div>
            </div>
            {word.notes && <p className="mt-4 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{word.notes}</p>}
            {!word.has_audio && (
              <div className="mt-5 rounded-xl border border-dashed border-border p-3">
                <p className="mb-2 text-sm text-muted-foreground">Todavía no tiene audio. Podés grabarlo ahora:</p>
                <WordAudioRecorder
                  wordId={word.id}
                  slug={word.audio_slug}
                  hasAudio={word.has_audio}
                  onSaved={() => void qc.invalidateQueries({ queryKey: ["quick-validate"] })}
                />
              </div>
            )}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Deslizá → si está bien · ← si tiene un error
            </p>
          </article>

          <div className="sticky bottom-20 mt-4 grid grid-cols-3 gap-2 md:bottom-4">
            <Button variant="outline" className="h-14 border-accent/50 text-accent" onClick={() => setReporting(true)} disabled={busy}>
              <X aria-hidden /> Error
            </Button>
            <Button variant="outline" className="h-14" onClick={skip} disabled={busy}>
              <SkipForward aria-hidden /> Saltar
            </Button>
            <Button variant="cta" className="h-14" onClick={() => void approve()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />} Está bien
            </Button>
          </div>
          <p className="mt-2 hidden text-center text-xs text-muted-foreground md:block">
            Teclado: → aprobar · ← error · S saltar · Z deshacer
          </p>
        </>
      )}

      {reporting && word && (
        <ReportSheet
          gn={word.gn}
          onCancel={() => setReporting(false)}
          onSend={async (tipo, mensaje) => {
            try {
              await reportFn({ data: { gn: word.gn, es: word.es, lugar: "Validación rápida", tipo, mensaje } });
              toast.success("Gracias. El aviso queda para el equipo docente.");
              setReporting(false);
              next(word.id);
            } catch {
              toast.error("No se pudo enviar el aviso.");
            }
          }}
        />
      )}
    </div>
  );
}

const KINDS: { id: ReportKind; label: string }[] = [
  { id: "escritura", label: "Está mal escrita" },
  { id: "significado", label: "El significado no es correcto" },
  { id: "audio", label: "El audio no está bien" },
  { id: "otro", label: "Otra cosa" },
];

function ReportSheet({
  gn,
  onCancel,
  onSend,
}: {
  gn: string;
  onCancel: () => void;
  onSend: (tipo: ReportKind, mensaje: string) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<ReportKind>("escritura");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" role="dialog" aria-label="Señalar un error">
      <div className="w-full max-w-lg rounded-t-3xl bg-card p-5 shadow-lift sm:rounded-3xl">
        <h2 className="font-display text-lg font-bold text-foreground">¿Qué tiene «{gn}»?</h2>
        <div className="mt-3 grid gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setTipo(k.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                tipo === k.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          maxLength={500}
          rows={3}
          autoFocus
          placeholder="Contá qué está mal y, si querés, cómo debería ser."
          className="mt-3 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12" onClick={onCancel} disabled={sending}>
            Cancelar
          </Button>
          <Button
            variant="cta"
            className="h-12"
            disabled={msg.trim().length < 3 || sending}
            onClick={async () => {
              setSending(true);
              await onSend(tipo, msg.trim());
              setSending(false);
            }}
          >
            Enviar aviso
          </Button>
        </div>
      </div>
    </div>
  );
}
