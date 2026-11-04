import { useRouter, useRouterState } from "@tanstack/react-router";
import { useAppLang } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react";
import { fallbackBackPath, showsBackButton } from "@/lib/back-nav";
import { showsBottomNav } from "@/lib/bottom-nav";

// Textos propios: antes este botón traía al arranque todos los textos de las páginas públicas.
const TX = {
  bbBack: { es: "Volver", pt: "Voltar", en: "Back", de: "Zurück", fr: "Retour", zh: "返回" },
  bbBackAria: { es: "Volver a la pantalla anterior", pt: "Voltar à tela anterior", en: "Back to the previous screen", de: "Zurück zum vorherigen Bildschirm", fr: "Retour à l'écran précédent", zh: "返回上一個畫面" },
} as const;

export function BackButton() {
  const lang = useAppLang();
  const t = (k: keyof typeof TX) => TX[k][lang] ?? TX[k].es;
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
    <>
    {/* Espacio al final de la página para que el botón flotante no tape el último botón (p. ej. «Empezar gratis»). */}
    <div aria-hidden className="h-20 print:hidden" />
    <button
      type="button"
      onClick={goBack}
      aria-label={t("bbBackAria")}
      className={`fixed left-3 z-40 inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-border bg-background/95 px-4 text-sm sm:h-auto sm:py-2.5 font-semibold text-primary shadow-lg transition active:scale-95 hover:bg-accent print:hidden ${
        aboveNav ? "bottom-20 md:bottom-4" : "bottom-4"
      }`}
    >
      <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" /> <span>{t("bbBack")}</span>
    </button>
    </>
  );
}
