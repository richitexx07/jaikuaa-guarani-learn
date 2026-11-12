/**
 * Los textos en castellano de los juegos, en el idioma de la persona.
 * Solo se usa lo que aprobó un docente; si un texto no tiene traducción aprobada, se muestra en castellano.
 * El guaraní no pasa por acá: solo se le dan textos en castellano (preguntas, historias, explicaciones).
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo } from "react";
import { useAppLang } from "@/lib/i18n";
import { traduccionesJuegos } from "@/lib/textos-traducidos.functions";

export function useTraducir(): (es: string) => string {
  const lang = useAppLang();
  const fn = useServerFn(traduccionesJuegos);
  const q = useQuery({
    queryKey: ["textos-traducidos", lang],
    queryFn: () => fn({ data: { lang } }),
    enabled: lang !== "es",
    staleTime: 10 * 60_000,
    retry: false,
  });
  const mapa = useMemo(() => new Map(q.data ?? []), [q.data]);
  return useCallback((es: string) => (lang === "es" ? es : mapa.get(es.trim()) ?? es), [lang, mapa]);
}
