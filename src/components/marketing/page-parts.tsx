import { useState, type ReactNode } from "react";
import { usePubTx } from "@/lib/i18n-public";
import { AppLanguageToggle } from "@/components/app-language-toggle";
import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import type { LucideIcon } from "lucide-react";
import { NandutiDisc } from "@/components/nanduti-disc";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { DisplayToggles } from "@/components/display-toggles";

const NAV_LINKS = [
  { to: "/juegos", label: "navJuegos" },
  { to: "/libreria", label: "navLibreria" },
  { to: "/purahei", label: "navPurahei" },
  { to: "/tembiapo", label: "navTembiapo" },
  { to: "/teclado", label: "navTeclado" },
  { to: "/turismo", label: "navTurismo" },
  { to: "/instituciones", label: "navInst" },
  { to: "/auspiciantes", label: "navAusp" },
] as const;

/**
 * El encabezado de todas las páginas públicas (el mismo en todas, así Jaikuaa se siente una sola app):
 * logo, «Jugar», idioma y «Menú». En la computadora los enlaces se ven en línea.
 * En el celular angosto queda solo el ícono del logo, para que nada se encime (también con letra grande).
 * `idioma`: otro selector de idioma (la portada usa el que cambia de página por idioma).
 * `accion`: el botón principal de esa página, en lugar de «Jugar» (p. ej. «Postular mi obra» en la Librería).
 */
export function MarketingHeader({ idioma, accion }: { idioma?: ReactNode; accion?: ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const t = usePubTx();
  return (
    <header className="relative w-full border-b border-border/50 bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-1.5 px-3 sm:gap-3 sm:px-6">
        <Link to="/" aria-label="Jaikuaa, inicio" className="flex shrink-0 items-center gap-2 font-display text-xl font-bold text-primary">
          <BrandLogo wordmarkFromSm />
        </Link>
        <nav className="hidden items-center gap-4 text-sm xl:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={l.to === "/purahei" || l.to === "/tembiapo" ? "font-semibold text-primary hover:text-foreground" : "text-muted-foreground hover:text-foreground"}>
              {t(l.label)}
            </Link>
          ))}
        </nav>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {accion ?? (
            <Link to="/juegos" className="shrink-0 whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground shadow-sm xl:hidden">
              {t("navJugar")}
            </Link>
          )}
          {idioma ?? <AppLanguageToggle />}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("menuClose") : t("menuOpen")}
            aria-expanded={open}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-semibold text-foreground"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            <span className="hidden min-[400px]:inline">{open ? t("navCerrar") : t("navMenu")}</span>
          </button>
        </div>
      </div>
      {open && (
        <nav className="absolute inset-x-0 top-16 z-50 border-b border-border bg-background shadow-lg">
          <ul className="mx-auto flex max-w-5xl flex-col px-4 py-2">
            {[...NAV_LINKS, { to: "/sobre", label: "navSobre" } as const].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  {t(l.label)}
                  {(l.to === "/purahei" || l.to === "/tembiapo") && (
                    <span className="ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-bold" style={{ background: "#F6C445", color: "#0F2038" }}>
                      {t("navNuevo")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 border-t border-border px-3 py-3">
              <span className="text-sm text-muted-foreground">Aa</span>
              <DisplayToggles />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function WhatsAppCta({ message, children }: { message: string; children: ReactNode }) {
  const href = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-md transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      {children}
    </a>
  );
}

export function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
        {intro && <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{intro}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function InfoCard({ emoji, img, icon: Icon, title, children, tag }: { emoji?: string; img?: string; icon?: LucideIcon; title: string; children: ReactNode; tag?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-6 shadow-elegant">
      <div className="flex items-center justify-between">
        {img ? (
          <img src={img} alt="" className="h-16 w-16 object-contain" loading="lazy" />
        ) : Icon ? (
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary" aria-hidden>
            <Icon className="h-6 w-6" />
          </span>
        ) : (
          <span className="text-2xl" aria-hidden>
            {emoji}
          </span>
        )}
        {tag && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
            {tag}
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

// Solo respaldos públicos vigentes. El Ateneo se suma cuando sus docentes validen el contenido
// (por ahora figura solo en la ficha de auspiciantes, con la frase del plan piloto).
export function BackingList() {
  const t = usePubTx();
  const items = [
    [t("bkSenado"), t("bkSenadoD")],
    [t("bkDip"), t("bkDipD")],
    [t("bkSpl"), t("bkSplD")],
  ];
  return (
    <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
      {items.map(([who, what]) => (
        <li key={who} className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="font-display font-bold text-foreground">{who}</div>
          <div className="mt-1 text-sm text-muted-foreground">{what}</div>
        </li>
      ))}
    </ul>
  );
}

/** Jai sobre el disco de ñandutí, para las cabeceras de las páginas públicas. */
export function HeroJai({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto mb-5 h-36 w-36 sm:h-44 sm:w-44">
      <NandutiDisc className="absolute inset-0 h-full w-full text-primary" />
      <img src={src} alt={alt} className="relative h-full w-full object-contain drop-shadow-xl" />
    </div>
  );
}
