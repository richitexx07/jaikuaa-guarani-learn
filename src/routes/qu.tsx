import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Portada en quechua en pausa: la traducción automática no se publica hasta que la
 * revise un hablante nativo. El texto anterior queda en el historial de Git.
 * Los enlaces viejos llevan a la portada en castellano.
 */
export const Route = createFileRoute("/qu")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
