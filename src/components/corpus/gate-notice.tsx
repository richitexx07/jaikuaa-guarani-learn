import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert } from "lucide-react";
import { checkGate } from "@/lib/deterministic-gate.functions";

/** Consulta la barrera determinista para una palabra. Solo `accepted === true` habilita aprobar. */
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

export function GateNotice({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return (
    <p className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
      {reason}
    </p>
  );
}
