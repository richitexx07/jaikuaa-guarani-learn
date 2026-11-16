/**
 * Las tres opciones de un penal: la palabra que suena y dos distractores.
 * Un distractor no puede significar lo mismo que la palabra que suena: si un docente tradujo
 * dos palabras distintas con la misma palabra («Cabeza» y «Testa» → «Cabeça»), las dos
 * serían respuestas correctas y la pregunta queda mal.
 */
import { orderedBy, shufflerFor } from "@/lib/reto";
import type { GameWord } from "@/lib/games.functions";

/** El significado que ve la persona, en minúscula y sin espacios de más. */
function visible(w: GameWord) {
  return w.es.trim().toLowerCase();
}

export function opcionesPenal(word: GameWord, words: GameWord[], seed: number, turn: number): GameWord[] {
  const mezclar = shufflerFor(seed, turn + 1);
  const otras = words.filter((w) => w.gn !== word.gn && visible(w) !== visible(word));
  return mezclar([word, ...mezclar(orderedBy(otras, (w) => w.gn)).slice(0, 2)]);
}
