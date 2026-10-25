import { ShieldCheck } from "lucide-react";

/**
 * Aviso para secciones cuyo contenido en guaraní todavía no fue validado.
 * Regla: solo los especialistas validan el guaraní. Por el protocolo con el Ateneo,
 * aquí no se nombra al Ateneo ni se usan palabras como "homologación" o "aval".
 */
/**
 * El aviso general ahora lo muestra PreLaunchBanner en todas las pantallas con sesión,
 * así que este queda vacío para no repetir el mismo mensaje dos veces en la misma pantalla.
 */
export function ValidationNotice() {
  return null;
}

/**
 * Aviso de pre-lanzamiento, arriba de todas las pantallas con sesión (lo monta el layout).
 * Deja claro que la plataforma no se lanzó y que el guaraní está en revisión por especialistas.
 */
export function PreLaunchBanner() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2 text-center text-xs font-medium text-primary sm:text-sm"
    >
      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong>Acceso anticipado:</strong> Jaikuaa todavía no se lanzó oficialmente. Las palabras están en
        revisión por docentes especialistas; si ves un error, avisanos.
      </span>
    </div>
  );
}

export function ValidationBadge() {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      En validación
    </span>
  );
}
