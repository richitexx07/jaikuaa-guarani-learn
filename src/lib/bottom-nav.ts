// Rutas donde se muestra la barra inferior móvil (solo pantallas de navegación, no juegos activos).
const NAV_PREFIXES = ["/dashboard", "/juegos", "/ranking", "/logros", "/curso", "/guarani-escolar", "/trivia", "/cuaderno"];

export function showsBottomNav(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  // Dentro de un juego la barra estorba: solo se muestra en el listado.
  if (p.startsWith("/juegos/")) return false;
  if (/^\/curso\/[^/]+\/leccion\//.test(p)) return false;
  if (/^\/trivia\/[^/]+$/.test(p)) return false;
  return NAV_PREFIXES.some((x) => p === x || p.startsWith(x + "/"));
}
