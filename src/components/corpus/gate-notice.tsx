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
  const fuente = q.data && q.data.accepted ? (q.data.fuente ?? null) : null;
  const reason = q.isLoading
    ? "Consultando al motor determinista…"
    : q.isError
      ? "No se pudo consultar al motor determinista."
      : q.data && !q.data.accepted
        ? q.data.reason
        : null;
  return { accepted, reason, loading: q.isLoading, fuente };
}

/**
 * El motor de Alan está en desarrollo: opina, pero nunca bloquea. «La plataforma enseña,
 * el motor estudia la lengua y los docentes deciden.»
 */
const NOMBRE_FUENTE: Record<string, string> = {
  "vocabulario-jaikuaa": "el vocabulario de Jaikuaa",
  "diccionario-academia": "el Diccionario de la Academia",
  "gramatica-alg-2020": "la Gramática de la Academia",
};

function describirFuente(f: string | null | undefined): string {
  if (!f) return "";
  const partes = f.split(", ").map((x) => {
    const raiz = x.startsWith("raiz:");
    const n = NOMBRE_FUENTE[raiz ? x.slice(5) : x] ?? x;
    return raiz ? `su raíz está en ${n}` : `está en ${n}`;
  });
  return ` (${[...new Set(partes)].join("; ")})`;
}

export function GateNotice({ accepted, reason, loading, fuente }: { accepted: boolean; reason: string | null; loading?: boolean; fuente?: string | null }) {
  if (loading) return null;
  const text = accepted
    ? `El motor (en prueba) reconoce esta palabra${describirFuente(fuente)}.`
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
