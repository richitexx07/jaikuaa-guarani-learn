import { CloudOff, RefreshCw } from "lucide-react";
import { useConnection } from "./use-connection";

/** Aviso fino arriba: sin señal, o enviando lo que se hizo sin señal. */
export function OfflineStatusBar() {
  const { online, pending } = useConnection();
  if (online && pending === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 z-50 flex items-center justify-center gap-2 px-3 py-1.5 text-center text-xs font-medium shadow-sm print:hidden ${
        online ? "bg-primary text-primary-foreground" : "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-50"
      }`}
    >
      {online ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden />
          Enviando {pending === 1 ? "1 avance hecho" : `${pending} avances hechos`} sin conexión…
        </>
      ) : (
        <>
          <CloudOff className="h-3.5 w-3.5" aria-hidden />
          Sin conexión. Seguí aprendiendo: {pending > 0 ? `${pending} ${pending === 1 ? "avance guardado" : "avances guardados"}` : "tus avances se guardan"} y se envían cuando vuelva la señal.
        </>
      )}
    </div>
  );
}
