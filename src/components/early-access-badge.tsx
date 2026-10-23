/** Sello de pre-lanzamiento: invita a sumarse como pionero, sin cifras ni promesas concretas. */
export function EarlyAccessBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto w-fit max-w-full overflow-hidden rounded-2xl border border-primary/20 bg-card text-center shadow-sm ${className}`}>
      <div className="flex h-1">
        <span className="flex-1 bg-accent" />
        <span className="flex-1 bg-background" />
        <span className="flex-1 bg-primary" />
      </div>
      <div className="px-4 py-2.5">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-primary">
          Acceso anticipado · Comunidad pionera
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Probá Jaikuaa antes del lanzamiento oficial, aprendé gratis y acumulá tus XP para los primeros premios.
        </p>
      </div>
    </div>
  );
}
