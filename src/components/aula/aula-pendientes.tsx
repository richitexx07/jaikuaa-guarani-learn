import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { School } from "lucide-react";
import { getMisAulas } from "@/lib/aula.functions";

/** Aviso en el panel cuando el alumno tiene tareas sin hacer en alguna de sus aulas. */
export function AulaPendientes() {
  const fn = useServerFn(getMisAulas);
  const { data } = useQuery({
    queryKey: ["mis-aulas"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const pendientes = (data?.aulas ?? []).reduce((n, a) => n + a.tareas.filter((t) => !t.hecha).length, 0);
  if (!pendientes) return null;
  return (
    <Link
      to="/aula"
      className="mt-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-4 shadow-sm transition hover:border-accent"
    >
      <School className="h-6 w-6 shrink-0 text-accent" aria-hidden />
      <span className="flex-1 text-sm font-semibold text-foreground">
        {pendientes === 1 ? "Tenés 1 tarea de tu aula" : `Tenés ${pendientes} tareas de tu aula`}
      </span>
      <span className="text-sm font-semibold text-accent">Ver →</span>
    </Link>
  );
}
