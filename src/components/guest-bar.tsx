import { Link } from "@tanstack/react-router";
import { useAppLang, type AppLang } from "@/lib/i18n";
import { rememberAfterLogin } from "@/lib/after-login";

/** Aviso fino para quien juega sin cuenta: los puntos quedan en el celular hasta crear la cuenta. */
const TXT: Record<"msg" | "cta", Record<AppLang, string>> = {
  msg: {
    es: "Jugás sin cuenta: tus puntos quedan en este celular.",
    pt: "Você está jogando sem conta: seus pontos ficam neste celular.",
    en: "You're playing without an account: your points stay on this phone.",
    de: "Du spielst ohne Konto: deine Punkte bleiben auf diesem Handy.",
    fr: "Vous jouez sans compte : vos points restent sur ce téléphone.",
    zh: "你正在以訪客身分遊玩：分數只存在這支手機。",
  },
  cta: {
    es: "Guardalos gratis",
    pt: "Salve grátis",
    en: "Save them free",
    de: "Kostenlos sichern",
    fr: "Les garder gratuitement",
    zh: "免費儲存",
  },
};

export function GuestBar() {
  const lang = useAppLang();
  const l = (TXT.msg as Record<string, string>)[lang] ? lang : "es";
  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-[#1E3A5F] px-3 py-1.5 text-left text-[11px] leading-tight text-white sm:text-center sm:text-sm">
      <span className="min-w-0">{TXT.msg[l]}</span>
      <Link
        to="/auth"
        search={{ mode: "signup" }}
        onClick={() => rememberAfterLogin(window.location.pathname + window.location.search)}
        className="shrink-0 rounded-full bg-white px-3 py-1 font-bold text-[#1E3A5F]"
      >
        {TXT.cta[l]}
      </Link>
    </div>
  );
}
