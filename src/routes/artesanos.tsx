import { createFileRoute, redirect } from "@tanstack/react-router";

/** Atajo en castellano: /artesanos lleva a la vitrina Tembiapo Jaikuaa. */
export const Route = createFileRoute("/artesanos")({
  beforeLoad: () => {
    throw redirect({ to: "/tembiapo", replace: true });
  },
});
