import { useEffect, useState } from "react";
import { Download, Share, Smartphone, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readDisplayPrefs, saveDisplayPrefs } from "@/lib/display-prefs";
import { canPromptInstall, isIos, isStandalone, onInstallChange, promptInstall } from "@/lib/install-prompt";

/**
 * Arriba de cada panel del piloto: letra grande con un toque y «Poner Jaikuaa en mi celular».
 * Pensado para docentes que leen con dificultad en el celular o no saben instalar una app.
 */
export function PanelTools() {
  const [large, setLarge] = useState<boolean | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setLarge(readDisplayPrefs().largeText);
    setIos(isIos());
    const update = () => {
      setStandalone(isStandalone());
      setCanInstall(canPromptInstall());
    };
    update();
    return onInstallChange(update);
  }, []);

  if (large === null) return null;

  const toggleLarge = () => {
    const p = readDisplayPrefs();
    const next = { ...p, largeText: !p.largeText };
    saveDisplayPrefs(next);
    setLarge(next.largeText);
  };

  const install = async () => {
    if (canInstall) {
      const ok = await promptInstall();
      if (ok) setStandalone(true);
    } else setHelp((h) => !h);
  };

  return (
    <div className="mt-4 print:hidden">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={large ? "secondary" : "outline"}
          className="h-11"
          aria-pressed={large}
          onClick={toggleLarge}
        >
          <Type aria-hidden /> {large ? "Letra normal" : "Letra más grande"}
        </Button>
        {!standalone && (
          <Button variant="outline" className="h-11" onClick={() => void install()}>
            {canInstall ? <Download aria-hidden /> : <Smartphone aria-hidden />} Poner Jaikuaa en mi celular
          </Button>
        )}
      </div>
      {help && !standalone && (
        <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
          {ios ? (
            <>
              En el iPhone: tocá <Share className="inline h-4 w-4 align-text-bottom" aria-label="Compartir" /> (abajo, en
              Safari) y después <strong>«Agregar a inicio»</strong>. Aparece el ícono de Jaikuaa como cualquier app.
            </>
          ) : (
            <>
              En Android: tocá los <strong>tres puntitos ⋮</strong> arriba a la derecha de Chrome y después{" "}
              <strong>«Agregar a la pantalla principal»</strong> o <strong>«Instalar aplicación»</strong>. Aparece el ícono
              de Jaikuaa como cualquier app.
            </>
          )}
        </div>
      )}
    </div>
  );
}
