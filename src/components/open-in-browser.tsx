import { useEffect, useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { chromeIntentUrl, inAppBrowser, isAndroid, type InAppBrowser } from "@/lib/in-app-browser";

const TX = {
  title: {
    es: "Estás adentro de {app}",
    pt: "Você está dentro do {app}",
    en: "You're inside {app}",
  },
  body: {
    es: "Desde acá Google no deja entrar con «Continuar con Google». Abrí Jaikuaa en el navegador de tu celular y entrás con un toque. O registrate con tu correo, más abajo.",
    pt: "Daqui o Google não deixa entrar com «Continuar com Google». Abra o Jaikuaa no navegador do celular e entre com um toque. Ou cadastre-se com seu e-mail, mais abaixo.",
    en: "Google doesn't allow «Continue with Google» from here. Open Jaikuaa in your phone's browser and sign in with one tap. Or sign up with your email below.",
  },
  open: { es: "Abrir en Chrome", pt: "Abrir no Chrome", en: "Open in Chrome" },
  iosHow: {
    es: "En iPhone: tocá los tres puntitos (···) de arriba y elegí «Abrir en el navegador».",
    pt: "No iPhone: toque nos três pontinhos (···) no alto e escolha «Abrir no navegador».",
    en: "On iPhone: tap the three dots (···) at the top and choose «Open in browser».",
  },
  copy: { es: "Copiar el enlace", pt: "Copiar o link", en: "Copy the link" },
  copied: { es: "Enlace copiado: pegalo en Chrome o Safari", pt: "Link copiado: cole no Chrome ou Safari", en: "Link copied: paste it in Chrome or Safari" },
};
const APP: Record<Exclude<InAppBrowser, null>, string> = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", otra: "otra app" };

/** Aviso para quien abrió Jaikuaa desde Facebook, Instagram o TikTok. No se muestra en un navegador normal. */
export function OpenInBrowser({ lang, className = "" }: { lang: string; className?: string }) {
  const l = (lang === "pt" || lang === "en" ? lang : "es") as "es" | "pt" | "en";
  const [app, setApp] = useState<InAppBrowser>(null);
  const [android, setAndroid] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setApp(inAppBrowser());
    setAndroid(isAndroid());
  }, []);
  if (!app) return null;
  const href = typeof window === "undefined" ? "" : window.location.href;
  return (
    <div className={`rounded-2xl border-2 border-[#E0A800] bg-[#FFF8E1] p-4 text-left text-[#4A3500] ${className}`} role="note">
      <p className="font-display text-base font-bold">{TX.title[l].replace("{app}", APP[app])}</p>
      <p className="mt-1 text-sm leading-snug">{TX.body[l]}</p>
      {android ? (
        <a href={chromeIntentUrl(href)} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E3A5F] px-4 text-base font-bold text-white">
          <ExternalLink className="h-5 w-5" aria-hidden /> {TX.open[l]}
        </a>
      ) : (
        <p className="mt-2 text-sm font-semibold">{TX.iosHow[l]}</p>
      )}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(href);
            setCopied(true);
          } catch {
            /* sin portapapeles: queda el aviso de arriba */
          }
        }}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1E3A5F]/30 bg-white px-4 text-sm font-bold text-[#1E3A5F]"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? TX.copied[l] : TX.copy[l]}
      </button>
    </div>
  );
}
