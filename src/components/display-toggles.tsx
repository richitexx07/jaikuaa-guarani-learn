import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readDisplayPrefs, saveDisplayPrefs, type DisplayPrefs } from "@/lib/display-prefs";

/** Botones de modo oscuro y letra grande. */
export function DisplayToggles() {
  const [prefs, setPrefs] = useState<DisplayPrefs | null>(null);
  useEffect(() => setPrefs(readDisplayPrefs()), []);
  if (!prefs) return null;
  const update = (p: DisplayPrefs) => {
    setPrefs(p);
    saveDisplayPrefs(p);
  };
  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-label={prefs.dark ? "Usar modo claro" : "Usar modo oscuro"}
        title={prefs.dark ? "Modo claro" : "Modo oscuro"}
        onClick={() => update({ ...prefs, dark: !prefs.dark })}
        className="px-2 sm:px-3"
      >
        {prefs.dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
        {/* En el celular, solo el ícono: con la palabra el encabezado no entraba y se encimaba. */}
        <span className="hidden text-xs sm:inline">{prefs.dark ? "Claro" : "Oscuro"}</span>
      </Button>
      <Button
        variant={prefs.largeText ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={prefs.largeText}
        aria-label="Letra grande"
        title="Letra grande"
        onClick={() => update({ ...prefs, largeText: !prefs.largeText })}
        className="px-2 font-bold sm:px-3"
      >
        A+
      </Button>
    </div>
  );
}
