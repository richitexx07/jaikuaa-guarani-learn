import OVERLAY from "./i18n-overlay.json";

/**
 * Japonés, ruso y coreano para las pantallas internas y los juegos.
 * Las traducciones salen del texto en inglés (clave) y son preliminares, en validación.
 * Nunca contiene guaraní: los nombres en guaraní quedan tal cual.
 */
export const OVERLAY_LANGS = ["ja", "ru", "ko", "ar", "it", "qu", "hi"] as const;
export type OverlayLang = (typeof OVERLAY_LANGS)[number];
const OV = OVERLAY as Record<OverlayLang, Record<string, string>>;

/** Textos en inglés vistos (para el script que genera las traducciones). */
export const SEEN = new Set<string>();

function tr(l: OverlayLang, en: unknown): unknown {
  if (typeof en === "string") {
    if (en) SEEN.add(en);
    return OV[l]?.[en] ?? en;
  }
  if (Array.isArray(en)) return en.map((x) => tr(l, x));
  return en;
}

function isTuple(a: unknown[]): boolean {
  return a.length === 6 && a.every((x) => typeof x === "string");
}

/** Agrega ja/ru/ko a cada entrada {es, en, ...} o fila [es, pt, en, de, fr, zh]. */
export function withOverlay<T>(obj: T): T {
  walk(obj);
  return obj;
}

function walk(v: unknown) {
  if (!v || typeof v !== "object") return;
  if (Array.isArray(v)) {
    if (isTuple(v)) {
      for (const l of OVERLAY_LANGS) v.push(tr(l, v[2]));
      return;
    }
    v.forEach(walk);
    return;
  }
  const o = v as Record<string, unknown>;
  if ("es" in o && "en" in o && (typeof o.en === "string" || Array.isArray(o.en))) {
    for (const l of OVERLAY_LANGS) if (!(l in o)) o[l] = tr(l, o.en);
    return;
  }
  Object.values(o).forEach(walk);
}

/** Orden de columnas de las filas, con los tres idiomas agregados al final. */
export const ROW_ORDER = ["es", "pt", "en", "de", "fr", "zh", "ja", "ru", "ko", "ar", "it", "qu", "hi"] as const;

/** Traduce un texto en inglés a ja/ru/ko (o lo deja en inglés si falta). */
export function ovText(l: OverlayLang, en: string): string {
  return tr(l, en) as string;
}
