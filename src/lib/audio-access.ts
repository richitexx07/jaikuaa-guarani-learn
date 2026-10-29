/**
 * Quién puede escuchar qué grabación.
 *
 * Regla: el público (con o sin sesión) solo recibe las palabras YA PUBLICADAS del corpus.
 * Los borradores suenan únicamente para la cadena de validación — admin, editor o
 * practicante habilitado (tabla content_reviewers) —, que es quien necesita oírlos
 * antes de dar su visto bueno.
 *
 * Así una grabación sin publicar no se puede descargar aunque alguien adivine o
 * fabrique el nombre del archivo: el servidor lo niega, no la interfaz.
 */

/** Audios que se escuchan sin sesión: los de /comenzar y las seis palabras de muestra de la portada. */
export const PUBLIC_SLUGS = new Set([
  "mbaeichapa",
  "ipora",
  "aguyje",
  "jaguarete",
  "kuarahy",
  "yvoty",
  "che-vya",
]);

export type AudioAccess = {
  /** admin, editor o practicante de la cadena de validación */
  isStaff: boolean;
  /** slugs whose corpus word is already published */
  published: ReadonlySet<string>;
};

/**
 * Devuelve los slugs que se pueden firmar. El personal de validación conserva
 * acceso a los borradores; cualquier otra persona solo ve publicados o muestras.
 */
export function filterPlayableSlugs(
  slugs: readonly string[],
  access: AudioAccess,
): string[] {
  if (access.isStaff) return [...slugs];
  return slugs.filter((s) => PUBLIC_SLUGS.has(s) || access.published.has(s));
}
