// Botón «Volver» global: dónde se oculta y a dónde lleva si no hay historial.
const HIDDEN = new Set(["/", "/dashboard", "/auth"]);

export function showsBackButton(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p.startsWith("/studio")) return false;
  // Pantallas de trabajo del piloto: ya tienen su enlace arriba y los botones de acción abajo.
  if (["/validar", "/docente", "/practica"].some((x) => p === x || p.startsWith(x + "/"))) return false;
  return !HIDDEN.has(p);
}

/** Destino seguro cuando la persona llegó directo (sin página anterior): la sección superior. */
export function fallbackBackPath(pathname: string): string {
  const parts = (pathname.replace(/\/+$/, "") || "/").split("/").filter(Boolean);
  if (parts.length <= 1) return "/";
  return "/" + parts.slice(0, -1).join("/");
}
