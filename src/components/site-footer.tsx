import { Link } from "@tanstack/react-router";
import { usePubTx } from "@/lib/i18n-public";
import { Lock } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

/** Bandera del Paraguay en SVG: se ve igual en cualquier celular o computadora. */
export function FlagParaguay({ className = "h-3.5 w-5" }: { className?: string }) {
  const t = usePubTx();
  return (
    <svg viewBox="0 0 20 14" className={`${className} shrink-0 rounded-[2px]`} role="img" aria-label={t("flagLabel")}>
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="4.67" fill="#D52B1E" />
      <rect y="9.33" width="20" height="4.67" fill="#0038A8" />
    </svg>
  );
}


export function SiteFooter() {
  const t = usePubTx();
  return (
    <footer className="border-t border-border/50 bg-background py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 font-display text-lg font-bold text-primary sm:justify-start">
              <BrandLogo />
            </div>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
              {t("ftMade")} <FlagParaguay /> {t("ftLove")}
            </p>

          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link to="/sobre" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("soTitle")}
            </Link>
            <Link to="/respaldos" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("ftBacking")}
            </Link>
            <Link to="/libreria" className="font-semibold text-primary transition-colors hover:text-foreground">
              Librería
            </Link>
            <Link to="/purahei" className="font-semibold text-primary transition-colors hover:text-foreground">
              Purahéi: artistas
            </Link>
            <Link to="/tembiapo" className="font-semibold text-primary transition-colors hover:text-foreground">
              Tembiapo: artesanos
            </Link>
            <Link to="/expertos" className="font-semibold text-primary transition-colors hover:text-foreground">
              Expertos
            </Link>
            <Link to="/atendemos" className="font-semibold text-primary transition-colors hover:text-foreground">
              Atendemos en guaraní
            </Link>
            <Link to="/instituciones" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("navInst")}
            </Link>
            <Link to="/teclado" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("navTeclado")}
            </Link>
            <Link to="/turismo" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("navTurismo")}
            </Link>
            <Link to="/auspiciantes" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("navAusp")}
            </Link>
            <Link to="/privacidad" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("ftPriv")}
            </Link>
            <Link to="/terminos" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("ftTerms")}
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border/50 pt-6 sm:flex-row sm:justify-between">
          <p className="font-display text-xs font-medium tracking-wide text-muted-foreground">
            {t("ftSlogan")}
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Jaikuaa. {t("ftRights")}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function TrustBadges({ className = "" }: { className?: string }) {
  const t = usePubTx();
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <Lock className="h-3 w-3" aria-hidden /> {t("ftSafe")}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <FlagParaguay className="h-3 w-4" /> {t("ftMade")}
      </span>
    </div>
  );
}
