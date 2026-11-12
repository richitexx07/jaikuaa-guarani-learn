// Botón «Volver» global: dónde se oculta y a dónde lleva si no hay historial.
// /embajadores ya tiene «Volver al panel» arriba; el flotante tapaba las reglas.
// /ficha-auspiciantes es una hoja que se imprime: el flotante tapaba las tarjetas.
const HIDDEN = new Set(["/", "/dashboard", "/auth", "/embajadores", "/ficha-auspiciantes", "/bienvenida"]);

export function showsBackButton(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p.startsWith("/studio")) return false;
  // Pantallas de trabajo del piloto: ya tienen su enlace arriba y los botones de acción abajo.
  if (["/validar", "/docente", "/practica"].some((x) => p === x || p.startsWith(x + "/"))) return false;
  // Juegos: ya tienen «← Juegos» arriba; el flotante tapaba botones del juego en el celular.
  if (p === "/juegos" || p.startsWith("/juegos/")) return false;
  // Trivia, teclado y «Pronunciá» ya tienen su «Volver»/«Salir» arriba, y abajo sus botones de acción.
  if (p.startsWith("/trivia/") || p === "/teclado" || p === "/pronunciar") return false;
  // El lector de libros tiene «←» arriba y sus botones de página abajo.
  if (p.startsWith("/leer/")) return false;
  // El visor de letras de Purahéi tiene su propia flecha y su botón abajo.
  if (p.startsWith("/purahei/obra/")) return false;
  // La constancia del convenio se imprime y tiene su «Volver» arriba.
  if (p.startsWith("/constancia-convenio/")) return false;
  return !HIDDEN.has(p);
}

/** Destino seguro cuando la persona llegó directo (sin página anterior): la sección superior. */
export function fallbackBackPath(pathname: string): string {
  const parts = (pathname.replace(/\/+$/, "") || "/").split("/").filter(Boolean);
  if (parts.length <= 1) return "/";
  return "/" + parts.slice(0, -1).join("/");
}
