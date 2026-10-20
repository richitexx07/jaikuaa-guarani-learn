// Guaraní audio playback. Only human recordings from the `guarani-audio`
// bucket are ever played. If a word has no recording we stay silent —
// NEVER fall back to window.speechSynthesis or any TTS engine.
//
// Para que el audio suene al instante:
//  1. Los enlaces firmados se piden en TANDAS: todas las palabras que aparecen en una pantalla
//     viajan juntas en un solo pedido al servidor (antes era un pedido de ~1 s por palabra).
//  2. Los enlaces se guardan en el navegador (localStorage) mientras siguen vigentes.
//  3. El audio de las palabras visibles se baja ANTES de que la persona toque, y se reproduce
//     desde la memoria. El service worker además guarda una copia para usar sin conexión.

import { useEffect } from "react";
import { getAudioSignedUrls } from "./audio.functions";
import { slugify } from "./slug";

export { slugify };

// Los enlaces firmados vencen a la hora en el servidor; se usan como máximo 50 minutos.
const URL_TTL_MS = 50 * 60 * 1000;
// «Sin grabación» se recuerda poco tiempo: si fue una falla pasajera, se vuelve a intentar pronto.
const NULL_TTL_MS = 2 * 60 * 1000;
const urlCache = new Map<string, { url: string | null; exp: number }>();

const LS_KEY = "jaikuaa:audio-urls:v3";
function loadPersistedUrls() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, { url: string | null; exp: number }>;
    const now = Date.now();
    for (const [k, v] of Object.entries(obj)) if (v?.url && v.exp > now) urlCache.set(k, v);
  } catch {}
}
let persistTimer: number | null = null;
function persistUrls() {
  if (typeof window === "undefined" || persistTimer !== null) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    try {
      const now = Date.now();
      const obj: Record<string, { url: string | null; exp: number }> = {};
      urlCache.forEach((v, k) => {
        if (v.url && v.exp > now) obj[k] = v;
      });
      window.localStorage.setItem(LS_KEY, JSON.stringify(obj));
    } catch {}
  }, 300);
}

// Caché de audios del service worker. La versión vieja («jaikuaa-audio») guardaba copias
// opacas que el reproductor no puede usar: se borra una vez para no ocupar lugar.
const AUDIO_CACHE = "jaikuaa-audio-v2";
let loaded = false;
function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  loadPersistedUrls();
  try {
    window.sessionStorage.removeItem("aranduka:audio-urls:v2");
  } catch {}
  if ("caches" in window) void caches.delete("jaikuaa-audio").catch(() => {});
}

function cachedUrl(slug: string): string | null | undefined {
  const hit = urlCache.get(slug);
  return hit && hit.exp > Date.now() ? hit.url : undefined;
}

/* ------------------------- Pedidos en tanda al servidor ------------------------- */

const BATCH_MAX = 60;
const BATCH_WAIT_MS = 25;
type Waiter = (url: string | null) => void;
let queue = new Map<string, { gn: string; waiters: Waiter[] }>();
let flushTimer: number | null = null;
const inflight = new Map<string, Promise<string | null>>();

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, BATCH_WAIT_MS);
}

async function flush() {
  const batch = queue;
  queue = new Map();
  const slugs = [...batch.keys()];
  for (let i = 0; i < slugs.length; i += BATCH_MAX) {
    const chunk = slugs.slice(i, i + BATCH_MAX);
    const done = (slug: string, url: string | null) => {
      for (const w of batch.get(slug)?.waiters ?? []) w(url);
    };
    try {
      const res = await getAudioSignedUrls({ data: { gns: chunk.map((s) => batch.get(s)!.gn) } });
      const denied = new Set(res.denied);
      const now = Date.now();
      for (const slug of chunk) {
        let url = res.urls[slug] ?? null;
        // Sin sesión o con el límite alcanzado no se guarda: se reintenta más tarde.
        if (!denied.has(slug)) urlCache.set(slug, { url, exp: now + (url ? URL_TTL_MS : NULL_TTL_MS) });
        if (!url) url = await findOfflineAudio(slug);
        done(slug, url);
      }
      persistUrls();
    } catch {
      // Sin señal: buscar el audio guardado en el teléfono por nombre de archivo.
      for (const slug of chunk) done(slug, await findOfflineAudio(slug));
    }
  }
}

export function getHumanAudioUrl(gn: string): Promise<string | null> {
  ensureLoaded();
  const slug = slugify(gn);
  const hit = cachedUrl(slug);
  if (hit !== undefined) return Promise.resolve(hit);
  if (typeof window === "undefined" || !slug) return Promise.resolve(null);
  const running = inflight.get(slug);
  if (running) return running;
  const p = new Promise<string | null>((resolve) => {
    const entry = queue.get(slug) ?? { gn, waiters: [] };
    entry.waiters.push(resolve);
    queue.set(slug, entry);
    scheduleFlush();
  }).finally(() => inflight.delete(slug));
  inflight.set(slug, p);
  return p;
}

async function findOfflineAudio(slug: string): Promise<string | null> {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const keys = await cache.keys();
    const hit = keys.find((r) => new URL(r.url).pathname.endsWith(`/${slug}.mp3`));
    return hit?.url ?? null;
  } catch {
    return null;
  }
}

/* ------------------------- Audio bajado de antemano ------------------------- */

// slug → enlace local (blob:) con el audio ya bajado. LRU con tope.
const MAX_BLOBS = 150;
const blobCache = new Map<string, string>();
const blobInflight = new Map<string, Promise<string | null>>();

function rememberBlob(slug: string, objectUrl: string) {
  blobCache.delete(slug);
  blobCache.set(slug, objectUrl);
  while (blobCache.size > MAX_BLOBS) {
    const oldest = blobCache.keys().next().value;
    if (oldest === undefined) break;
    const u = blobCache.get(oldest);
    blobCache.delete(oldest);
    if (u) URL.revokeObjectURL(u);
  }
}

function preloadBytes(slug: string, url: string): Promise<string | null> {
  const have = blobCache.get(slug);
  if (have) return Promise.resolve(have);
  const running = blobInflight.get(slug);
  if (running) return running;
  const p = fetch(url, { mode: "cors", credentials: "omit" })
    .then(async (r) => {
      if (!r.ok) return null;
      const blob = await r.blob();
      if (!blob.size) return null;
      const objectUrl = URL.createObjectURL(blob);
      rememberBlob(slug, objectUrl);
      return objectUrl;
    })
    .catch(() => null)
    .finally(() => blobInflight.delete(slug));
  blobInflight.set(slug, p);
  return p;
}

/** Prefetch: consigue el enlace (en tanda) y baja el audio a memoria para que suene al instante.
 *  Se puede llamar muchas veces sin costo. Devuelve el enlace si hay grabación. */
export async function prefetchAudio(gn: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const slug = slugify(gn);
  const url = await getHumanAudioUrl(gn);
  if (!url) return null;
  if (!url.startsWith("blob:")) void preloadBytes(slug, url);
  return url;
}

/** React hook: deja listos los audios de una pantalla al abrirla (en una sola tanda). */
export function usePrefetchAudios(gns: string[], max = 24) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const gn of gns.slice(0, max)) void prefetchAudio(gn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gns.join("|"), max]);
}

/** Si una reproducción falla, se olvida lo guardado de esa palabra para reintentar limpio. */
function forget(slug: string) {
  urlCache.delete(slug);
  const blob = blobCache.get(slug);
  if (blob) {
    blobCache.delete(slug);
    URL.revokeObjectURL(blob);
  }
  persistUrls();
}

function playSrc(src: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      const player = new Audio(src);
      player.onended = () => resolve(true);
      player.onerror = () => resolve(false);
      const p = player.play();
      if (p && typeof p.then === "function") p.catch(() => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

export async function playGuarani(gn: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  ensureLoaded();
  const slug = slugify(gn);
  // Camino rápido y sin esperas: así el toque del usuario habilita el sonido también en iPhone.
  const ready = blobCache.get(slug);
  const known = ready ? undefined : cachedUrl(slug);
  let ok: boolean;
  if (ready) {
    ok = await playSrc(ready);
  } else if (known) {
    void preloadBytes(slug, known);
    ok = await playSrc(known);
  } else {
    const url = await getHumanAudioUrl(gn);
    if (!url) return false; // sin grabación: silencio intencional — nunca TTS
    void preloadBytes(slug, url);
    ok = await playSrc(url);
  }
  if (!ok) forget(slug);
  return ok;
}
