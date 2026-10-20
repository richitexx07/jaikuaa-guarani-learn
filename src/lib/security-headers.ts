/**
 * Impide que www.jaikuaa.com se muestre dentro de una página ajena (engaños de «clickjacking»).
 * Solo en el dominio de producción: la vista previa de Lovable sí se muestra dentro del editor
 * de Lovable y no se toca. Jaikuaa Studio (/studio) maneja sus propias cabeceras.
 */
const PRODUCTION_HOSTS = new Set(["jaikuaa.com", "www.jaikuaa.com"]);

export function shouldProtectFrame(url: URL, contentType: string | null): boolean {
  if (!PRODUCTION_HOSTS.has(url.hostname)) return false;
  if (url.pathname === "/studio" || url.pathname.startsWith("/studio/")) return false;
  return (contentType ?? "").includes("text/html");
}

export function withFrameProtection(request: Request, response: Response): Response {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return response;
  }
  if (!shouldProtectFrame(url, response.headers.get("content-type"))) return response;
  if (response.headers.has("x-frame-options")) return response;
  const headers = new Headers(response.headers);
  headers.set("x-frame-options", "SAMEORIGIN");
  const csp = headers.get("content-security-policy");
  if (!csp) headers.set("content-security-policy", "frame-ancestors 'self'");
  else if (!/frame-ancestors/i.test(csp)) headers.set("content-security-policy", `${csp}; frame-ancestors 'self'`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
