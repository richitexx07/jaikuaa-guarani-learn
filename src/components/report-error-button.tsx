import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reportContentError, type ReportType } from "@/lib/content-reports.functions";
import { cn } from "@/lib/utils";

const TIPOS: { value: ReportType; label: string }[] = [
  { value: "escritura", label: "La escritura" },
  { value: "significado", label: "El significado" },
  { value: "audio", label: "El audio" },
  { value: "otro", label: "Otra cosa" },
];

type Props = {
  gn: string;
  es?: string;
  /** Dónde se vio la palabra, por ejemplo «Lección 3» o «Glosario». */
  lugar: string;
  className?: string;
};

/**
 * Botón chico para avisar que una palabra, su significado o su audio parece estar mal.
 * El aviso no cambia nada: lo revisa el equipo docente en el Circuito de validación.
 */
export function ReportErrorButton({ gn, es = "", lugar, className }: Props) {
  const sendFn = useServerFn(reportContentError);
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<ReportType>("escritura");
  const [mensaje, setMensaje] = useState("");

  const send = useMutation({
    mutationFn: () => sendFn({ data: { gn, es, lugar, tipo, mensaje } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Gracias. El equipo docente lo va a revisar.");
      setOpen(false);
      setMensaje("");
      setTipo("escritura");
    },
    onError: () => toast.error("No se pudo enviar. Probá de nuevo."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            className,
          )}
          aria-label={`Señalar un error en «${gn}»`}
          title="Señalar un error"
        >
          <Flag className="h-4 w-4" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Señalar un error</DialogTitle>
          <DialogDescription>
            En «<strong className="text-foreground">{gn}</strong>»{es ? ` (${es})` : ""}. Tu aviso no cambia nada
            por sí solo: lo revisa el equipo docente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">¿Qué parece estar mal?</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Qué parece estar mal">
              {TIPOS.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={tipo === t.value ? "default" : "outline"}
                  role="radio"
                  aria-checked={tipo === t.value}
                  onClick={() => setTipo(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="report-msg" className="text-sm font-medium">
              Contanos qué viste
            </label>
            <Textarea
              id="report-msg"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              maxLength={500}
              rows={4}
              className="mt-1"
              placeholder="Por ejemplo: falta una tilde, el significado no corresponde, el audio no se escucha bien…"
            />
            <p className="mt-1 text-xs text-muted-foreground">{mensaje.length}/500</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="cta"
            onClick={() => send.mutate()}
            disabled={mensaje.trim().length < 3 || send.isPending}
          >
            {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar aviso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
