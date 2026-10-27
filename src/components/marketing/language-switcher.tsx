import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

const LANGS = [
  { code: "es", label: "ES", to: "/" },
  { code: "pt", label: "PT", to: "/pt" },
  { code: "en", label: "EN", to: "/en" },
] as const;

export function LanguageSwitcher({ current }: { current: "es" | "pt" | "en" }) {
  return (
    <nav aria-label="Idioma / Language" className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-1 text-xs font-semibold">
      <Globe className="mr-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {LANGS.map((l) => (
        <Link
          key={l.code}
          to={l.to}
          aria-current={l.code === current ? "page" : undefined}
          className={
            l.code === current
              ? "rounded-full bg-primary px-2 py-0.5 text-primary-foreground"
              : "rounded-full px-2 py-0.5 text-muted-foreground hover:text-foreground"
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
