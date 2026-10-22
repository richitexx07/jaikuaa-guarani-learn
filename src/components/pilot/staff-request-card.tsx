import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestStaffRole, type StaffKind, type StaffRequestStatus } from "@/lib/teacher.functions";

type Req = { kind: StaffKind; status: StaffRequestStatus } | null;

const KIND_TEXT: Record<StaffKind, { title: string; desc: string; button: string }> = {
  docente: {
    title: "Soy docente del piloto",
    desc: "Para validar las palabras de Jaikuaa y ver el avance de tu grupo.",
    button: "Pedir acceso de docente",
  },
  practicante: {
    title: "Soy estudiante del Ateneo en práctica",
    desc: "Para hacer tu práctica supervisada: verificar y revisar palabras.",
    button: "Pedir acceso de práctica",
  },
};

/**
 * Pedido de habilitación en un toque. Si ya hay un pedido, muestra en qué está.
 * `only` limita a un tipo (por ejemplo, en /practica solo se pide práctica).
 */
export function StaffRequestCard({
  request,
  defaultName,
  only,
  compact = false,
}: {
  request: Req;
  defaultName: string;
  only?: StaffKind;
  compact?: boolean;
}) {
  const fn = useServerFn(requestStaffRole);
  const qc = useQueryClient();
  const [kind, setKind] = useState<StaffKind | null>(only ?? null);
  const [name, setName] = useState(defaultName);
  const [institution, setInstitution] = useState("Ateneo de Lengua y Cultura Guaraní");

  const send = useMutation({
    mutationFn: () => fn({ data: { kind: kind!, fullName: name, institution, note: "" } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success(r.already ? "Ya estás habilitado." : "¡Listo! Tu pedido llegó. Te avisamos cuando esté aprobado.");
      void qc.invalidateQueries({ queryKey: ["my-staff-status"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo enviar el pedido."),
  });

  if (request?.status === "pendiente") {
    return (
      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold text-foreground">Tu pedido de acceso está en revisión</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pediste acceso de {request.kind === "docente" ? "docente" : "práctica"}. Apenas el administrador lo apruebe,
              esta pantalla se convierte en tu panel. No hace falta hacer nada más.
            </p>
          </div>
        </div>
      </section>
    );
  }
  if (request?.status === "rechazado") {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Tu pedido de acceso no fue aprobado. Si creés que es un error, escribile a Richard por WhatsApp al 0982 418 732.
      </section>
    );
  }

  const kinds: StaffKind[] = only ? [only] : ["docente", "practicante"];
  return (
    <section className="rounded-2xl border border-primary/30 bg-card p-5 shadow-elegant">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Plan piloto</p>
      <h2 className="mt-1 font-display text-lg font-bold text-foreground">
        {only ? KIND_TEXT[only].title : "¿Participás del plan piloto?"}
      </h2>
      {!compact && !only && (
        <p className="mt-1 text-sm text-muted-foreground">Elegí tu caso y pedí acceso. Lo aprobamos en el día.</p>
      )}
      {!only && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-xl border p-3 text-left transition ${
                kind === k ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <span className="block font-semibold text-foreground">{KIND_TEXT[k].title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{KIND_TEXT[k].desc}</span>
            </button>
          ))}
        </div>
      )}
      {only && <p className="mt-1 text-sm text-muted-foreground">{KIND_TEXT[only].desc}</p>}
      {kind && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="staff-name">
              Nombre y apellido
            </label>
            <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="staff-inst">
              Institución
            </label>
            <Input id="staff-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={120} />
          </div>
          <Button
            variant="cta"
            className="h-12 w-full"
            disabled={name.trim().length < 3 || send.isPending}
            onClick={() => send.mutate()}
          >
            {send.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {KIND_TEXT[kind].button}
          </Button>
        </div>
      )}
    </section>
  );
}
