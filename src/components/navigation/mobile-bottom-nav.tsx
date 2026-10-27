import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Gamepad2, Trophy, Award } from "lucide-react";
import { showsBottomNav } from "@/lib/bottom-nav";
import { useT } from "@/lib/i18n";

const ITEMS = [
  { to: "/dashboard", label: "nav.learn", icon: BookOpen, match: ["/dashboard", "/curso", "/guarani-escolar", "/cuaderno"] },
  { to: "/juegos", label: "nav.games", icon: Gamepad2, match: ["/juegos", "/trivia"] },
  { to: "/ranking", label: "nav.ranking", icon: Trophy, match: ["/ranking"] },
  { to: "/logros", label: "nav.achievements", icon: Award, match: ["/logros"] },
] as const;

/** Barra inferior fija estilo app, solo en celulares. */
export function MobileBottomNav() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!showsBottomNav(pathname)) return null;
  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md print:hidden md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors active:scale-95 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-primary/10" : ""}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {t(label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
