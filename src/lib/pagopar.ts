/**
 * Pagopar (pasarela de pagos de Paraguay): cálculos puros, sin claves.
 * - Token al iniciar: sha1(clave_privada + id_pedido_comercio + monto).
 * - Token del aviso de pago: sha1(clave_privada + hash_pedido).
 * - El cliente paga en https://www.pagopar.com/pagos/{hash}.
 */
export const PAGOPAR_API = "https://api.pagopar.com/api/comercios/2.0/iniciar-transaccion";
export const urlPagoPagopar = (hash: string) => `https://www.pagopar.com/pagos/${encodeURIComponent(hash)}`;

export async function sha1(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Pagopar arma el monto como texto sin decimales para montos enteros (50000 → "50000"). */
export const montoTexto = (gs: number) => String(Math.round(gs));

export const tokenInicio = (privada: string, idPedido: string, montoGs: number) => sha1(privada + idPedido + montoTexto(montoGs));
export const tokenAviso = (privada: string, hashPedido: string) => sha1(privada + hashPedido);

/** Comparación en tiempo constante para no filtrar el token por demoras. */
export function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const formatoGs = (gs: number) => `Gs. ${Math.round(gs).toLocaleString("es-PY").replace(/,/g, ".")}`;
