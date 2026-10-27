// Único punto de registro del modo sin conexión. Nunca se activa en la vista previa ni en desarrollo.

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  const blocked = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  if (blocked.some((d) => h === d || h.endsWith(`.${d}`))) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSw() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => (r.active || r.waiting || r.installing)?.scriptURL.endsWith("/sw.js"))
        .map((r) => r.unregister()),
    );
  } catch {}
}

export async function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterAppSw();
    return;
  }
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    // Lo que esta pantalla ya cargó antes de que existiera el modo sin conexión también se guarda.
    void navigator.serviceWorker.ready.then(() => guardarArchivosDeEstaPantalla());
  } catch {}
}

export const APP_CACHE = "jaikuaa-app";
const IMG_CACHE = "jaikuaa-imagenes";

/** Archivos de la app que usa la pantalla actual (código, estilos e imágenes de /assets/). */
function archivosDeEstaPantalla(): string[] {
  const urls = new Set<string>();
  try {
    for (const e of performance.getEntriesByType("resource")) {
      const u = new URL(e.name);
      if (u.origin === location.origin && (u.pathname.startsWith("/assets/") || u.pathname.startsWith("/__l5e/assets-v1/"))) urls.add(u.href);
    }
    document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[href]").forEach((el) => {
      const raw = el instanceof HTMLScriptElement ? el.src : el.href;
      const u = new URL(raw, location.href);
      if (u.origin === location.origin && u.pathname.startsWith("/assets/")) urls.add(u.href);
    });
  } catch {}
  return [...urls];
}

/** Guarda en el teléfono los archivos que faltan (los que ya estaban, no se vuelven a bajar). */
export async function guardarArchivos(urls: string[]): Promise<void> {
  if (!("caches" in window) || !urls.length) return;
  try {
    const app = await caches.open(APP_CACHE);
    const img = await caches.open(IMG_CACHE);
    for (const url of urls) {
      try {
        const cache = new URL(url).pathname.startsWith("/__l5e/") ? img : app;
        if (await cache.match(url)) continue;
        const res = await fetch(url, { credentials: "same-origin" });
        if (res.ok) await cache.put(url, res);
      } catch {}
    }
  } catch {}
}

async function guardarArchivosDeEstaPantalla() {
  await guardarArchivos(archivosDeEstaPantalla());
}

/** Los archivos de la app que pide una página guardada (para que abra sin señal). */
export function archivosDeLaPagina(html: string, base: string): string[] {
  const out = new Set<string>();
  const re = /(?:src|href)=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const u = new URL(m[1]!, base);
      if (u.origin === new URL(base).origin && u.pathname.startsWith("/assets/") && /\.(js|css|woff2|webp|png|svg)$/.test(u.pathname)) out.add(u.href);
    } catch {}
  }
  return [...out];
}
