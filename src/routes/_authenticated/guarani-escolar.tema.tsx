import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/guarani-escolar/tema")({
  head: () => ({ meta: [{ title: "Jaikuaa — Temas de Guaraní Escolar" },
      { name: "description", content: "Accedé al espacio de práctica por temas de Guaraní Escolar en Jaikuaa." },
      { property: "og:title", content: "Jaikuaa — Temas de Guaraní Escolar" },
      { property: "og:description", content: "Accedé al espacio de práctica por temas de Guaraní Escolar en Jaikuaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ] }),
  component: () => <Outlet />,
});
