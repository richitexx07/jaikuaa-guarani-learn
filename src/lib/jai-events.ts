/** Abre a Jai desde cualquier parte de la app, opcionalmente respondiendo una pregunta frecuente. */
export const JAI_OPEN_EVENT = "jaikuaa:jai";

export function openJai(faqId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(JAI_OPEN_EVENT, { detail: { faqId } }));
}
