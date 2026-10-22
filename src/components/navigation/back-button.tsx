import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { fallbackBackPath, showsBackButton } from "@/lib/back-nav";
import { showsBottomNav } from "@/lib/bottom-nav";

export function BackButton() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!showsBackButton(pathname)) return null;
  const aboveNav = showsBottomNav(pathname);

  const goBack = () => {
    const idx = (window.history.state as { __TSR_index?: number } | null)?.__TSR_index ?? 0;
    if (idx > 0) router.history.back();
    else void router.navigate({ to: fallbackBackPath(pathname) });
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Volver a la pantalla anterior"
      className={`fixed left-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-4 py-2.5 text-sm font-semibold text-primary shadow-lg transition active:scale-95 hover:bg-accent print:hidden ${
        aboveNav ? "bottom-20 md:bottom-4" : "bottom-4"
      }`}
    >
      <ArrowLeft className="h-4 w-4" /> Volver
    </button>
  );
}
