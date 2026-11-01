/**
 * Japonés, ruso, coreano, árabe, italiano, hindi, hebreo, turco (y quechua/suajili en pausa)
 * para las pantallas internas y los juegos.
 * Las traducciones salen del texto en inglés (clave) y son preliminares, en validación.
 * Nunca contiene guaraní: los nombres en guaraní quedan tal cual.
 *
 * Velocidad: el archivo con los 10 idiomas pesa casi 1 MB. Antes viajaba en el arranque de TODOS
 * (también de quien usa la app en castellano). Ahora se descarga solo cuando alguien elige uno de
 * esos idiomas; mientras tanto, esos idiomas muestran el inglés.
 */
export const OVERLAY_LANGS = ["ja", "ru", "ko", "ar", "it", "qu", "hi", "he", "tr", "sw"] as const;
export type OverlayLang = (typeof OVERLAY_LANGS)[number];
let OV: Partial<Record<OverlayLang, Record<string, string>>> = {};

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

const BASE = 6;
function isTuple(a: unknown[]): boolean {
  return a.length === BASE && a.every((x) => typeof x === "string");
}

const registered: unknown[] = [];
/** Lo que se completó automáticamente (para reemplazarlo cuando llegan las traducciones). */
const autoRows = new WeakSet<unknown[]>();
const autoKeys = new WeakMap<object, Set<OverlayLang>>();

/** Agrega los idiomas extra a cada entrada {es, en, ...} o fila [es, pt, en, de, fr, zh]. */
export function withOverlay<T>(obj: T): T {
  registered.push(obj);
  walk(obj);
  return obj;
}

function walk(v: unknown) {
  if (!v || typeof v !== "object") return;
  if (Array.isArray(v)) {
    if (autoRows.has(v)) {
      OVERLAY_LANGS.forEach((l, i) => { v[BASE + i] = tr(l, v[2]); });
      return;
    }
    if (isTuple(v)) {
      for (const l of OVERLAY_LANGS) v.push(tr(l, v[2]));
      autoRows.add(v);
      return;
    }
    v.forEach(walk);
    return;
  }
  const o = v as Record<string, unknown>;
  if ("es" in o && "en" in o && (typeof o.en === "string" || Array.isArray(o.en))) {
    let auto = autoKeys.get(o);
    if (!auto) {
      auto = new Set<OverlayLang>();
      for (const l of OVERLAY_LANGS) if (!(l in o)) auto.add(l);
      autoKeys.set(o, auto);
    }
    // Solo se tocan los idiomas que se completaron solos; los escritos a mano quedan.
    for (const l of auto) o[l] = tr(l, o.en);
    return;
  }
  Object.values(o).forEach(walk);
}

/** Orden de columnas de las filas, con los idiomas agregados al final. */
export const ROW_ORDER = ["es", "pt", "en", "de", "fr", "zh", "ja", "ru", "ko", "ar", "it", "qu", "hi", "he", "tr", "sw"] as const;

/** Traduce un texto en inglés a un idioma extra (o lo deja en inglés si todavía no se descargó). */
export function ovText(l: OverlayLang, en: string): string {
  return tr(l, en) as string;
}

/* ------------------------- descarga bajo pedido ------------------------- */

let loading: Promise<void> | null = null;
let version = 0;
const listeners = new Set<() => void>();

export function isOverlayLang(l: string): l is OverlayLang {
  return (OVERLAY_LANGS as readonly string[]).includes(l);
}

/** Descarga las traducciones extra (una sola vez) y vuelve a pintar la pantalla. */
export function ensureOverlay(lang: string): Promise<void> {
  if (!isOverlayLang(lang)) return Promise.resolve();
  if (loading) return loading;
  loading = import("./i18n-overlay.json")
    .then((m) => {
      OV = ((m as { default?: unknown }).default ?? m) as typeof OV;
      // Solo se reescriben los idiomas extra (que tenían el inglés provisorio); el resto queda igual.
      registered.forEach((x) => walk(x));
      version++;
      listeners.forEach((f) => f());
    })
    .catch(() => {
      loading = null; // sin señal: se intenta de nuevo la próxima vez
    });
  return loading;
}

export function subscribeOverlay(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function overlayVersion() {
  return version;
}
