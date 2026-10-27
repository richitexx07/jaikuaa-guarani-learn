import { Check, ChevronDown, Globe } from "lucide-react";
import { APP_LANGS, PRELIMINARY_LANGS, setAppLang, useT, type AppLang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LANG_NAMES: Record<AppLang, string> = {
  es: "Español",
  pt: "Português",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  zh: "繁體中文",
};

export const langShort = (l: AppLang) => (l === "zh" ? "中文" : l.toUpperCase());

/** Selector compacto: un solo botón que despliega los idiomas; recuerda la elección. */
export function AppLanguageToggle({ className = "" }: { className?: string }) {
  const { lang, t } = useT();
  return (
    <div className="flex flex-col items-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("lang.label")}
          className={`flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs font-semibold ${className}`}
        >
          <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          {langShort(lang)}
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[11rem]">
          {APP_LANGS.map((l) => (
            <DropdownMenuItem key={l} onSelect={() => setAppLang(l)} className="flex items-center justify-between gap-3">
              <span>{LANG_NAMES[l]}</span>
              {l === lang && <Check className="h-4 w-4 text-primary" aria-hidden />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {PRELIMINARY_LANGS.includes(lang) && (
        <span role="note" className="mt-0.5 text-[10px] font-medium text-muted-foreground">{t("lang.preliminary")}</span>
      )}
    </div>
  );
}
