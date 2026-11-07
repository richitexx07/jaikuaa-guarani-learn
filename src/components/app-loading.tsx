import logoUrl from "@/assets/jaikuaa-logo.webp";

/**
 * Pantalla de carga de las secciones que se arman en el celular (juegos, panel, lecciones).
 * Antes, quien abría un enlace directo veía una pantalla blanca varios segundos y creía que no andaba.
 * Se muestra apenas llega la página, antes de que cargue el resto: por eso no usa traducciones ni datos.
 */
export function AppLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center" role="status" aria-live="polite">
      <img src={logoUrl} alt="" width={96} height={96} className="h-24 w-24 rounded-3xl shadow-lg motion-safe:animate-pulse" />
      <p className="font-display text-lg font-bold text-primary">Jaikuaa</p>
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-[#D52B1E] motion-safe:animate-bounce" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 motion-safe:animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-[#0038A8] motion-safe:animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="text-sm text-muted-foreground">Cargando…</p>
    </div>
  );
}
