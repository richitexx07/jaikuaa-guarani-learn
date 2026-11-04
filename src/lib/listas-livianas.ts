/**
 * Listas chiquitas que se usan al decidir a qué pantalla ir (antes de cargarla).
 * Viven aparte para que el arranque de la app no traiga todas las preguntas de trivia
 * ni los textos de los juegos. La prueba listas-livianas.test.ts verifica que coincidan con las originales.
 */
export const TRIVIA_CATEGORIAS: readonly string[] = ["gastronomia", "mitos", "deportes", "musica", "historia", "naturaleza", "cultura", "vocabulario"];
export const JUEGO_IDS = ["trivia", "tekojoja", "karaoke", "tembiu", "taanga", "chacra"] as const;
