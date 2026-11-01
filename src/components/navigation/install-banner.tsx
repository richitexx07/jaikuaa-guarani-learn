import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStats } from "@/lib/gamification";
import { canPromptInstall, isIos, isStandalone, onInstallChange, promptInstall } from "@/lib/install-prompt";

const DISMISS_KEY = "jaikuaa:install-dismissed";
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  try {
    const v = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - v < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/** Aviso para instalar Jaikuaa en la pantalla de inicio del celular (solo en el panel). */
export function InstallBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [prompt, setPrompt] = useState(false);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const stats = useStats();

  useEffect(() => {
    if (isStandalone() || window.self !== window.top || recentlyDismissed()) return;
    if (isIos()) {
      setIos(true);
      setVisible(true);
    }
    const update = () => {
      if (isStandalone()) return setVisible(false);
      const can = canPromptInstall();
      setPrompt(can);
      if (can) setVisible(true);
    };
    update();
    return onInstallChange(update);
  }, []);

  // Momento justo: recién después de que la persona hizo algo (antes, el aviso molesta y se cierra sin leer).
  if (!visible || pathname !== "/dashboard" || stats.xp <= 0) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* sin almacenamiento: solo se oculta ahora */
    }
    setVisible(false);
  };

  const install = async () => {
    if (!prompt) return;
    const ok = await promptInstall();
    setPrompt(false);
    if (ok) setVisible(false);
    else dismiss();
  };

  return (
    <div
      role="region"
      aria-label="Instalar Jaikuaa"
      className="fixed inset-x-3 bottom-[5.5rem] z-50 rounded-2xl border border-primary/30 bg-card p-4 shadow-elegant print:hidden md:hidden"
    >
      <div className="flex items-start gap-3">
        <img src="/apple-touch-icon.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-foreground">Llevá Jaikuaa en tu celular</p>
          {ios ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Tocá <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-label="Compartir" /> y después
              «Agregar a inicio». Se abre como una app.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Abrilo con un toque desde la pantalla de inicio, sin buscarlo en el navegador.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="-m-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!ios && prompt && (
        <Button onClick={install} className="mt-3 h-11 w-full">
          <Download className="mr-2 h-4 w-4" /> Instalar Jaikuaa
        </Button>
      )}
    </div>
  );
}
