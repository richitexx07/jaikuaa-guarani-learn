import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert } from "lucide-react";
import { checkGate } from "@/lib/deterministic-gate.functions";

/** Opinión del motor sobre una palabra. Es solo informativa: la decisión es siempre del docente. */
export function useDeterministicGate(gn: string | undefined) {
  const fn = useServerFn(checkGate);
  const q = useQuery({
    queryKey: ["deterministic-gate", gn],
    queryFn: () => fn({ data: { gn: gn ?? "" } }),
    enabled: !!gn,
    staleTime: 60_000,
  });
  const accepted = q.data?.accepted === true;
  const reason = q.isLoading
    ? "Consultando al motor determinista…"
    : q.isError
      ? "No se pudo consultar al motor determinista."
      : q.data && !q.data.accepted
        ? q.data.reason
        : null;
  return { accepted, reason, loading: q.isLoading };
}

/**
 * El motor de Alan está en desarrollo: opina, pero nunca bloquea. «La plataforma enseña,
 * el motor estudia la lengua y los docentes deciden.»
 */
export function GateNotice({ accepted, reason, loading }: { accepted: boolean; reason: string | null; loading?: boolean }) {
  if (loading) return null;
  const text = accepted
    ? "El motor (en desarrollo) reconoce esta palabra."
    : `Opinión del motor (en desarrollo): ${reason ?? "sin respuesta"}`;
  return (
    <p className="mt-2 flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {text} La decisión es del docente.
      </span>
    </p>
  );
}
