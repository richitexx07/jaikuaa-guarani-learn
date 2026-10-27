import { TRIVIA_ORDER, type TriviaCategoryId } from "./trivia";

/**
 * Sendero de Jai: las categorías de Preguntados son paradas de un camino.
 * Se guarda en este teléfono qué paradas ya terminó la persona. No hay azar:
 * la próxima parada es siempre la primera que falta.
 */
const KEY = "jaikuaa:sendero-trivia";

export function readSendero(): TriviaCategoryId[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((id): id is TriviaCategoryId => TRIVIA_ORDER.includes(id)) : [];
  } catch {
    return [];
  }
}

export function markSendero(id: TriviaCategoryId) {
  try {
    const done = new Set(readSendero());
    done.add(id);
    localStorage.setItem(KEY, JSON.stringify([...done]));
  } catch {
    // Sin almacenamiento disponible: el sendero simplemente no recuerda el avance.
  }
}

export function nextStop(done: TriviaCategoryId[]): TriviaCategoryId | null {
  return TRIVIA_ORDER.find((id) => !done.includes(id)) ?? null;
}
