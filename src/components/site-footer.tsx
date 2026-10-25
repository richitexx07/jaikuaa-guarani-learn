import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

/** Bandera del Paraguay en SVG: se ve igual en cualquier celular o computadora. */
export function FlagParaguay({ className = "h-3.5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={`${className} shrink-0 rounded-[2px]`} role="img" aria-label="Bandera del Paraguay">
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="4.67" fill="#D52B1E" />
      <rect y="9.33" width="20" height="4.67" fill="#0038A8" />
    </svg>
  );
}


export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 font-display text-lg font-bold text-primary sm:justify-start">
              <BrandLogo />
            </div>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
              Hecho en Paraguay <FlagParaguay /> con amor por nuestra lengua.
            </p>

          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link to="/sobre" className="text-muted-foreground transition-colors hover:text-foreground">
              Sobre Jaikuaa
            </Link>
            <Link to="/respaldos" className="text-muted-foreground transition-colors hover:text-foreground">
              Respaldos
            </Link>
            <Link to="/instituciones" className="text-muted-foreground transition-colors hover:text-foreground">
              Instituciones
            </Link>
            <Link to="/auspiciantes" className="text-muted-foreground transition-colors hover:text-foreground">
              Auspiciantes
            </Link>
            <Link to="/privacidad" className="text-muted-foreground transition-colors hover:text-foreground">
              Política de Privacidad
            </Link>
            <Link to="/terminos" className="text-muted-foreground transition-colors hover:text-foreground">
              Términos y Condiciones
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border/50 pt-6 sm:flex-row sm:justify-between">
          <p className="font-display text-xs font-medium tracking-wide text-muted-foreground">
            Aprendé · Hablá · Ñane Ñe'ẽ
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Jaikuaa. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <span aria-hidden>🔒</span> Tus datos están protegidos
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <FlagParaguay className="h-3 w-4" /> Hecho en Paraguay
      </span>
    </div>
  );
}
