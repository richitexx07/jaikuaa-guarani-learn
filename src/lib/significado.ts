/**
 * El significado de una palabra en el idioma de la persona.
 * Solo se usa lo que ya revisó un docente (corpus_words.significados); si falta, se muestra el castellano.
 * El guaraní nunca se traduce ni se cambia acá.
 */
import type { AppLang } from "@/lib/i18n";

type ConSignificado = { es: string; sig?: Partial<Record<Exclude<AppLang, "es">, string>> | null };

export function significado(v: ConSignificado, lang: AppLang): string {
  if (lang === "es") return v.es;
  const t = v.sig?.[lang]?.trim();
  return t || v.es;
}

/** La lección con los significados en el idioma de la persona; `orig` guarda el castellano (para reportar errores). */
export function localizarVocab<T extends ConSignificado>(vocab: T[], lang: AppLang): (T & { orig: string })[] {
  return vocab.map((v) => ({ ...v, orig: v.es, es: significado(v, lang) }));
}
