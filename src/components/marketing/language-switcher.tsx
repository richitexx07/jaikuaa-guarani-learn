import { Link } from "@tanstack/react-router";
import { Check, ChevronDown } from "lucide-react";
import { isAppLang, setAppLang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANG_FLAGS } from "@/lib/lang-flags";

const LANGS = [
  { code: "es", label: "ES", name: "Español", to: "/" },
  { code: "pt", label: "PT", name: "Português", to: "/pt" },
  { code: "en", label: "EN", name: "English", to: "/en" },
  { code: "de", label: "DE", name: "Deutsch", to: "/de" },
  { code: "fr", label: "FR", name: "Français", to: "/fr" },
  { code: "zh", label: "中文", name: "繁體中文", to: "/zh" },
  { code: "ja", label: "日本語", name: "日本語", to: "/ja" },
  { code: "ru", label: "RU", name: "Русский", to: "/ru" },
  { code: "ko", label: "한국어", name: "한국어", to: "/ko" },
  { code: "ar", label: "عربي", name: "العربية", to: "/ar" },
  { code: "it", label: "IT", name: "Italiano", to: "/it" },
  { code: "qu", label: "QU", name: "Runasimi", to: "/qu" },
  { code: "hi", label: "हिन्दी", name: "हिन्दी", to: "/hi" },
] as const;

export function LanguageSwitcher({ current }: { current: "es" | "pt" | "en" | "zh" | "de" | "fr" | "ja" | "ru" | "ko" | "ar" | "it" | "qu" | "hi" }) {
  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Idioma / Language"
        className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs font-semibold"
      >
        <span aria-hidden>{LANG_FLAGS[active.code]}</span>
        {active.label}
        <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.code} asChild>
            <Link
              to={l.to}
              onClick={() => { if (isAppLang(l.code)) setAppLang(l.code); }}
              aria-current={l.code === current ? "page" : undefined}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2"><span aria-hidden>{LANG_FLAGS[l.code]}</span>{l.name}</span>
              {l.code === current && <Check className="h-4 w-4 text-primary" aria-hidden />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
