/** Ayudas puras de la Librería (sin servidor), para poder probarlas. */

const DEPOSITOS = new Set(["libros", "guarani-audio"]);

/** «libros/abc/p1.webp» → { bucket: "libros", path: "abc/p1.webp" }. Rechaza cualquier otra cosa. */
export function partirRuta(ruta: string | null | undefined): { bucket: string; path: string } | null {
  if (!ruta) return null;
  const i = ruta.indexOf("/");
  if (i <= 0) return null;
  const bucket = ruta.slice(0, i);
  const path = ruta.slice(i + 1);
  if (!DEPOSITOS.has(bucket) || !path || path.includes("..") || path.startsWith("/")) return null;
  return { bucket, path };
}

/** «Ejemplar de Ana Benítez · an***@gmail.com»: identifica al comprador sin mostrar el correo entero. */
export function marcaDeAgua(nombre: string, correo: string): string {
  let mail = "";
  const at = correo.indexOf("@");
  if (at > 0) mail = `${correo.slice(0, Math.min(2, at))}***${correo.slice(at)}`;
  const quien = [nombre, mail].filter(Boolean).join(" · ");
  return quien ? `Ejemplar de ${quien}` : "Ejemplar personal";
}
