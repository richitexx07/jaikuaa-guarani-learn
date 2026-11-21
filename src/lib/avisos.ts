/**
 * Avisos automáticos de la Librería para un CRM u orquestador (Filora, Make, n8n…).
 * Apagados mientras no estén las variables CRM_WEBHOOK_URL y CRM_WEBHOOK_SECRET (las carga el administrador).
 * Cada aviso lleva un id único (para no procesarlo dos veces) y la firma HMAC-SHA256 del cuerpo en
 * la cabecera X-Jaikuaa-Firma, para que quien lo recibe sepa que viene de Jaikuaa.
 * Nunca frena una venta: si el CRM no responde, se registra el error y sigue.
 */

export const EVENTOS_AVISO = ["obra.en_revision", "pedido.creado", "pago.confirmado", "pago.revertido"] as const;
export type EventoAviso = (typeof EVENTOS_AVISO)[number];

export type Aviso = { id: string; evento: EventoAviso; fecha: string; datos: Record<string, string | number | boolean | null> };

export function armarAviso(evento: EventoAviso, datos: Aviso["datos"], id: string, fecha: string): Aviso {
  return { id, evento, fecha, datos };
}

export async function firmarAviso(secreto: string, cuerpo: string): Promise<string> {
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(cuerpo));
  return [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Solo se aceptan direcciones https públicas (nada de direcciones internas). */
export function urlAvisoValida(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(u.hostname) || u.hostname.endsWith(".internal")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Manda el aviso (solo en el servidor). Si no está configurado, no hace nada. */
export async function enviarAviso(evento: EventoAviso, datos: Aviso["datos"]): Promise<void> {
  const url = urlAvisoValida(process.env["CRM_WEBHOOK_URL"]);
  const secreto = process.env["CRM_WEBHOOK_SECRET"];
  if (!url || !secreto) return;
  const aviso = armarAviso(evento, datos, crypto.randomUUID(), new Date().toISOString());
  const cuerpo = JSON.stringify(aviso);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Jaikuaa-Evento": evento, "X-Jaikuaa-Firma": await firmarAviso(secreto, cuerpo) },
      body: cuerpo,
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) console.error("Aviso al CRM rechazado", evento, r.status);
  } catch (e) {
    console.error("Aviso al CRM sin respuesta", evento, e instanceof Error ? e.message : e);
  }
}
