import { ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PRELIMINARY_LANGS, useT, type AppLang } from "@/lib/i18n";
import { rememberAfterLogin } from "@/lib/after-login";
import { authMode } from "@/lib/guest";

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
const GUARDAR: Record<AppLang, string> = {
  es: "Guardá tus puntos",
  pt: "Salve seus pontos",
  en: "Save your points",
  de: "Punkte sichern",
  fr: "Gardez vos points",
  zh: "儲存分數",
};

export function PreLaunchBanner({ invitado = false }: { invitado?: boolean }) {
  const { t, lang } = useT();
  // Sin cuenta: UNA sola franja fina (antes eran dos apiladas —«Jugás sin cuenta» y «Acceso anticipado»—
  // y en el celular se comían media pantalla antes del juego). El aviso de puntos lo da «¡Ganaste N puntos!».
  if (invitado) {
    return (
      <>
        <div role="note" className="print:hidden flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary sm:text-sm">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">
            <strong>{t("pl.strong")}</strong> <span className="hidden sm:inline">{t("pl.short")}</span>
            <span className="sm:hidden">{lang === "es" ? "en revisión docente." : t("pl.short")}</span>
          </span>
          <Link
            to="/auth"
            search={{ mode: authMode() }}
            onClick={() => rememberAfterLogin(window.location.pathname + window.location.search)}
            className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground sm:text-xs"
          >
            {GUARDAR[lang as AppLang] ?? GUARDAR.es}
          </Link>
        </div>
        {PRELIMINARY_LANGS.includes(lang) && <PreliminaryLangBanner />}
      </>
    );
  }
  return (
    <>
      <div
        role="note"
        className="print:hidden flex items-center justify-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-1.5 text-center text-xs font-medium text-primary sm:py-2 sm:text-sm"
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
