import { useT } from "@/lib/i18n";

/**
 * Sello de pre-lanzamiento, en la portada y en Embajadores.
 * Invita a sumarse como pionero, sin cifras ni promesas concretas.
 */
export function EarlyAccessBadge({ className = "" }: { className?: string }) {
  const { t } = useT();
  return (
    <div className={`mx-auto w-fit max-w-full overflow-hidden rounded-2xl border border-primary/20 bg-card text-center shadow-sm ${className}`}>
      <div className="flex h-1">
        <span className="flex-1 bg-accent" />
        <span className="flex-1 bg-background" />
        <span className="flex-1 bg-primary" />
      </div>
      <div className="px-4 py-2.5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{t("ea.strong")}</span> {t("ea.rest")}
        </p>
      </div>
    </div>
  );
}
