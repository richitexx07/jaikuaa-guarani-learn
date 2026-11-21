/**
 * Grabación de voz en el navegador (para que el autor grabe cada página desde el celular).
 * Reglas puras: qué formato pedirle al navegador y cómo nombrarlo para el depósito «libros».
 */

/**
 * Formatos que el depósito acepta, en orden de preferencia. Primero mp4 (AAC): lo reproducen todos los celulares,
 * iPhone incluido, y guarda la duración. Si el navegador no sabe, webm (Chrome/Android más viejos).
 */
const PREFERIDOS = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"] as const;

/** El primer formato que el navegador sabe grabar, o «» para que elija él. */
export function elegirFormato(soporta: (tipo: string) => boolean): string {
  for (const t of PREFERIDOS) {
    try {
      if (soporta(t)) return t;
    } catch {
      /* navegador viejo: probamos el siguiente */
    }
  }
  return "";
}

/** «audio/webm;codecs=opus» → «audio/webm». Si no es un audio que aceptamos, null. */
export function mimeBase(tipo: string): "audio/webm" | "audio/mp4" | "audio/ogg" | null {
  const base = tipo.split(";")[0].trim().toLowerCase();
  if (base === "audio/webm" || base === "video/webm") return "audio/webm";
  if (base === "audio/mp4" || base === "video/mp4" || base === "audio/aac") return "audio/mp4";
  if (base === "audio/ogg") return "audio/ogg";
  return null;
}

/** 0:07, 1:32… */
export function duracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Tope de una grabación (una página no debería pasar de esto). */
export const MAX_SEGUNDOS = 10 * 60;
