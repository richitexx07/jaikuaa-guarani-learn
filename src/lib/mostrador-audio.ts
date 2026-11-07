import { louderBlob } from "./audio-louder";
import { callarVoz, pedirTurno, sonarUnico } from "./voz-unica";

/**
 * Audio del Modo mostrador: enlaces firmados del servidor y copia en el teléfono para usar sin señal.
 * Nunca hay voz de máquina: si una frase no tiene grabación, no suena.
 */

const CACHE = "jaikuaa-mostrador-v1";

function key(id: string) {
  return `${window.location.origin}/__mostrador/${id}.mp3`;
}

function hasCaches() {
  return typeof window !== "undefined" && "caches" in window;
}

/** Enlace local (blob:) si la frase ya está guardada en el teléfono. */
export async function offlineUrl(id: string): Promise<string | null> {
  if (!hasCaches()) return null;
  try {
    const cache = await caches.open(CACHE);
    const res = await cache.match(key(id));
    if (!res) return null;
    const blob = await res.blob();
    return blob.size ? URL.createObjectURL(await louderBlob(blob)) : null;
  } catch {
    return null;
  }
}

/** Cuántas de estas frases ya están guardadas en el teléfono. */
export async function countOffline(ids: string[]): Promise<number> {
  if (!hasCaches() || ids.length === 0) return 0;
  try {
    const cache = await caches.open(CACHE);
    const hits = await Promise.all(ids.map((id) => cache.match(key(id))));
    return hits.filter(Boolean).length;
  } catch {
    return 0;
  }
}

/** Baja y guarda en el teléfono las grabaciones (id → enlace firmado). Devuelve cuántas quedaron. */
export async function saveOffline(urls: Record<string, string>): Promise<number> {
  if (!hasCaches()) return 0;
  const cache = await caches.open(CACHE);
  let ok = 0;
  await Promise.all(
    Object.entries(urls).map(async ([id, url]) => {
      try {
        const r = await fetch(url, { mode: "cors", credentials: "omit" });
        if (!r.ok) return;
        const blob = await r.blob();
        if (!blob.size) return;
        await cache.put(key(id), new Response(blob, { headers: { "Content-Type": "audio/mpeg" } }));
        ok++;
      } catch {
        /* sin señal o enlace vencido: se reintenta otro día */
      }
    }),
  );
  return ok;
}


// Frases ya subidas de volumen en esta sesión (id → enlace local).
const louder = new Map<string, string>();
async function louderRemote(id: string, url: string): Promise<string | null> {
  const have = louder.get(id);
  if (have) return have;
  try {
    const r = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!r.ok) return null;
    const blob = await r.blob();
    if (!blob.size) return null;
    const u = URL.createObjectURL(await louderBlob(blob));
    louder.set(id, u);
    return u;
  } catch {
    return null;
  }
}

/** Hace sonar una frase: primero la copia del teléfono, si no el enlace del servidor. */
export async function playFrase(id: string, remoteUrl: string | undefined): Promise<boolean> {
  const t = pedirTurno();
  const ready = louder.get(id);
  const local = ready ? null : await offlineUrl(id);
  const src = ready ?? local ?? remoteUrl;
  if (!src) return false;
  // Sin esperar la descarga (así el toque habilita el sonido en iPhone); la versión más fuerte
  // queda lista para la próxima vez.
  if (local) louder.set(id, local);
  else if (!ready && remoteUrl) void louderRemote(id, remoteUrl);
  // Una sola voz a la vez: corta la anterior; si mientras tanto se pidió otra frase, esta ya no suena.
  return sonarUnico(src, t, true);
}

export function stopFrase() {
  callarVoz();
}

/** Deja listas (y más fuertes) las frases de la pantalla, para que suenen bien desde el primer toque. */
export function prefetchFrases(urls: Record<string, string>, max = 30) {
  for (const [id, url] of Object.entries(urls).slice(0, max)) void louderRemote(id, url);
}
