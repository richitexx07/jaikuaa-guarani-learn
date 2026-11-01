import { ShieldCheck } from "lucide-react";
import { PRELIMINARY_LANGS, useT } from "@/lib/i18n";

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
  const { t, lang } = useT();
  return (
    <>
      <div
        role="note"
        className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-1.5 text-center text-xs font-medium text-primary sm:py-2 sm:text-sm"
      >
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
        {/* En el celular, una sola línea corta: el aviso largo comía media pantalla. */}
        <span className="sm:hidden">
          <strong>{t("pl.strong")}</strong> {t("pl.short")}
        </span>
        <span className="hidden sm:inline">
          <strong>{t("pl.strong")}</strong> {t("pl.rest")}
        </span>
      </div>
      {PRELIMINARY_LANGS.includes(lang) && <PreliminaryLangBanner />}
    </>
  );
}

/**
 * Aviso claro cuando la interfaz está en un idioma con traducción preliminar:
 * dice que está en revisión e invita a un hablante nativo a ayudar.
 */
export function PreliminaryLangBanner() {
  const { t, lang } = useT();
  const href = `mailto:contacto@jaikuaa.com?subject=${encodeURIComponent(`Revisión de traducción (${lang})`)}`;
  return (
    <div
      role="note"
      className="border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950 sm:text-sm"
    >
      {t("lang.preliminary")}
      {" · "}
      <a href={href} className="font-semibold underline underline-offset-2">
        {t("lang.help")}
      </a>
    </div>
  );
}

export function ValidationBadge() {
  const { t } = useT();
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      {t("val.badge")}
    </span>
  );
}
