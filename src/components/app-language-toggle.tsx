import { Globe } from "lucide-react";
import { APP_LANGS, PRELIMINARY_LANGS, setAppLang, useT } from "@/lib/i18n";

/** Selector ES/PT/EN para usar dentro de la app; recuerda la elección en el teléfono. */
export function AppLanguageToggle({ className = "" }: { className?: string }) {
  const { lang, t } = useT();
  return (
    <div className="flex flex-col items-end">
    <div
      role="group"
      aria-label={t("lang.label")}
      className={`flex items-center gap-0.5 rounded-full border border-border/60 bg-card px-1.5 py-1 text-xs font-semibold ${className}`}
    >
      <Globe className="mr-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {APP_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setAppLang(l)}
          aria-pressed={l === lang}
          className={
            l === lang
              ? "rounded-full bg-primary px-2 py-0.5 text-primary-foreground"
              : "rounded-full px-2 py-0.5 text-muted-foreground hover:text-foreground"
          }
        >
          {l === "zh" ? "中文" : l.toUpperCase()}
        </button>
      ))}
    </div>
    {PRELIMINARY_LANGS.includes(lang) && (
      <span role="note" className="mt-0.5 text-[10px] font-medium text-muted-foreground">{t("lang.preliminary")}</span>
    )}
    </div>
  );
}
