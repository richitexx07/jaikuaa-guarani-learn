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
    return blob.size ? URL.createObjectURL(blob) : null;
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

let current: HTMLAudioElement | null = null;

/** Hace sonar una frase: primero la copia del teléfono, si no el enlace del servidor. */
export async function playFrase(id: string, remoteUrl: string | undefined): Promise<boolean> {
  current?.pause();
  const local = await offlineUrl(id);
  const src = local ?? remoteUrl;
  if (!src) return false;
  const audio = new Audio(src);
  current = audio;
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  } finally {
    if (local) audio.addEventListener("ended", () => URL.revokeObjectURL(local), { once: true });
  }
}

export function stopFrase() {
  current?.pause();
  current = null;
}
