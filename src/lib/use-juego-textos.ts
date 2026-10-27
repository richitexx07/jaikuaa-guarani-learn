import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listJuegoTextos } from "@/lib/juego-textos.functions";
import { indexTextos } from "@/lib/juego-textos";
import { withOfflineCache } from "@/lib/offline-data";

export const JUEGO_TEXTOS_KEY = ["juego-textos"] as const;

/**
 * Lo que escribieron los docentes para los juegos. Si no hay conexión usa lo último guardado;
 * si no hay nada, los juegos siguen con su contenido de siempre.
 */
export function useJuegoTextos() {
  const fn = useServerFn(listJuegoTextos);
  const q = useQuery({
    queryKey: JUEGO_TEXTOS_KEY,
    queryFn: () => withOfflineCache("juego-textos", () => fn(), { label: "El guaraní de los juegos" }),
    staleTime: 2 * 60_000,
    retry: 1,
  });
  const idx = useMemo(() => indexTextos(q.data?.textos), [q.data]);
  return { idx, isStaff: q.data?.isStaff ?? false, textos: q.data?.textos ?? [], loading: q.isLoading, query: q };
}
