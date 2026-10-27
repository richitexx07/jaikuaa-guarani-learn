// «Descargar para usar sin internet»: baja de una vez todo lo que un alumno necesita para
// estudiar sin señal. Solo contenido publicado; nunca el diccionario de uso interno.

import { listCourseLessons, getCourseLesson } from "./lessons.functions";
import { getGameWords, getWordOfDayPack, type GameWord, type WordOfDayPackItem } from "./games.functions";
import { listGlossary } from "./glossary.functions";
import { getCertificateStatus } from "./community.functions";
import { getAudioSignedUrls } from "./audio.functions";
import { slugify } from "./slug";
import { offlineGet, offlineSet } from "./offline-store";
import { isOffline } from "./offline-data";
import { archivosDeLaPagina, guardarArchivos } from "./pwa";

/* Claves del almacén del teléfono (las usan también las pantallas). */
export const K = {
  lessons: "course-lessons",
  lesson: (n: number) => `lesson:${n}`,
  gameWords: (lesson: number | null) => `game-words:${lesson ?? "all"}`,
  glossary: "glossary",
  wotd: "wotd-pack",
  certificate: "certificate-status",
  meta: "pack-meta",
} as const;

export const AUDIO_CACHE = "jaikuaa-audio-v2";
export const PAGES_CACHE = "jaikuaa-pages";

/** Pantallas que se guardan para poder abrirlas sin señal. */
export const GAME_PATHS = [
  "/juegos",
  "/juegos/palabra-del-dia",
  "/juegos/ahorcado",
  "/juegos/memoria",
  "/juegos/sopa-de-letras",
  "/juegos/duelo",
  "/juegos/taanga",
  "/juegos/tekojoja",
  "/juegos/tembiu",
  "/juegos/trivia-duelo",
  "/juegos/karaoke",
  "/juegos/nee-rape",
  "/juegos/penales",
];
const BASE_PATHS = ["/dashboard", "/curso/guarani", "/glosario", "/logros", "/certificado", "/teclado", "/offline.html"];

export type PackMeta = {
  savedAt: number;
  lessons: number;
  words: number;
  audios: number;
  audiosMissing: number;
  pages: number;
  wotdUntil: string | null;
  version: 1;
};

export type PackProgress = { step: string; done: number; total: number };

type LessonRow = { n: number; title: string; theme: string; publishedWords: number; completed: boolean };

async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift()!);
  });
  await Promise.all(workers);
}

/** Pide al navegador que no borre lo descargado cuando le falte lugar (importante en iPhone). */
export async function askPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** Guarda las pantallas (el armazón de la app) para que se puedan abrir sin señal. */
async function cachePages(paths: string[], onStep: () => void): Promise<number> {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(PAGES_CACHE);
  let ok = 0;
  await pool(paths, 3, async (path) => {
    try {
      const url = new URL(path, window.location.origin).toString();
      const res = await fetch(url, { credentials: "same-origin", headers: { Accept: "text/html" } });
      if (res.ok && (res.headers.get("content-type") ?? "").includes("text/html")) {
        // También se guardan el código y los estilos que esa página necesita para abrir sin señal.
        const html = await res.clone().text();
        await cache.put(url, res);
        await guardarArchivos(archivosDeLaPagina(html, url));
        ok++;
      }
    } catch {}
    onStep();
  });
  return ok;
}

/** Guarda en silencio algunas pantallas para abrirlas después sin señal (por ejemplo, las del docente). */
export async function warmPages(paths: string[]): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;
  return cachePages(paths, () => {});
}

/** Baja los audios humanos y los deja en el mismo lugar donde el reproductor los busca sin señal. */
async function cacheAudios(gns: string[], onStep: () => void): Promise<{ ok: number; missing: number }> {
  if (!("caches" in window)) return { ok: 0, missing: gns.length };
  const cache = await caches.open(AUDIO_CACHE);
  const have = new Set(
    (await cache.keys()).map((r) => new URL(r.url).pathname.split("/").pop()?.replace(/\.mp3$/, "")),
  );
  const slugs = [...new Set(gns.map(slugify).filter(Boolean))];
  const todo = slugs.filter((s) => !have.has(s));
  let ok = slugs.length - todo.length;
  let missing = 0;
  for (let i = 0; i < slugs.length - todo.length; i++) onStep();
  for (let i = 0; i < todo.length; i += 60) {
    const chunk = todo.slice(i, i + 60);
    let urls: Record<string, string | null> = {};
    try {
      urls = (await getAudioSignedUrls({ data: { gns: chunk } })).urls;
    } catch {}
    await pool(chunk, 4, async (slug) => {
      const url = urls[slug];
      if (!url) {
        missing++;
        onStep();
        return;
      }
      try {
        const res = await fetch(url, { mode: "cors", credentials: "omit" });
        if (res.ok) {
          await cache.put(new Request(url), res);
          ok++;
        } else missing++;
      } catch {
        missing++;
      }
      onStep();
    });
  }
  return { ok, missing };
}

/**
 * Descarga completa. Se puede repetir: los audios ya bajados no se vuelven a bajar.
 * Lanza error solo si no hay señal o si no se pudo traer ni siquiera la lista de lecciones.
 */
export async function downloadPack(onProgress: (p: PackProgress) => void = () => {}): Promise<PackMeta> {
  if (isOffline()) throw new Error("Necesitás conexión para descargar.");
  await askPersistentStorage();

  onProgress({ step: "Lecciones", done: 0, total: 1 });
  const { lessons } = (await listCourseLessons()) as { lessons: LessonRow[] };
  await offlineSet(K.lessons, { lessons });
  const usable = lessons.filter((l) => l.publishedWords > 0);

  let done = 0;
  const lessonTotal = usable.length * 2 + 3;
  const tick = (step: string) => onProgress({ step, done: ++done, total: lessonTotal });

  await pool(usable, 3, async (l) => {
    try {
      const r = await getCourseLesson({ data: { n: l.n } });
      await offlineSet(K.lesson(l.n), r);
    } catch {}
    tick("Lecciones");
    try {
      const r = await getGameWords({ data: { lesson: l.n } });
      await offlineSet(K.gameWords(l.n), r);
    } catch {}
    tick("Juegos");
  });

  const all = (await getGameWords({ data: { lesson: null } })) as { words: GameWord[] };
  await offlineSet(K.gameWords(null), all);
  tick("Juegos");

  try {
    await offlineSet(K.glossary, await listGlossary());
  } catch {}
  tick("Glosario");

  let wotdUntil: string | null = null;
  try {
    const pack = (await getWordOfDayPack({ data: { days: 28 } })) as { items: WordOfDayPackItem[] };
    await offlineSet(K.wotd, pack);
    wotdUntil = pack.items.at(-1)?.day ?? null;
  } catch {}
  try {
    await offlineSet(K.certificate, await getCertificateStatus());
  } catch {}
  tick("Palabra del día");

  const paths = [...BASE_PATHS, ...GAME_PATHS, ...usable.map((l) => `/curso/guarani/leccion/${l.n}`)];
  let pageDone = 0;
  const pages = await cachePages(paths, () =>
    onProgress({ step: "Pantallas", done: ++pageDone, total: paths.length }),
  );

  const audioWords = all.words.filter((w) => w.hasAudio).map((w) => w.gn);
  let audioDone = 0;
  const audio = await cacheAudios(audioWords, () =>
    onProgress({ step: "Audios", done: ++audioDone, total: new Set(audioWords.map(slugify)).size }),
  );

  const meta: PackMeta = {
    savedAt: Date.now(),
    lessons: usable.length,
    words: all.words.length,
    audios: audio.ok,
    audiosMissing: audio.missing,
    pages,
    wotdUntil,
    version: 1,
  };
  await offlineSet(K.meta, meta);
  return meta;
}

export async function getPackMeta(): Promise<PackMeta | null> {
  return (await offlineGet<PackMeta>(K.meta))?.value ?? null;
}

/** Con señal y un paquete de más de 12 horas, se actualiza solo en segundo plano. */
export async function refreshPackIfStale(): Promise<void> {
  if (isOffline()) return;
  const meta = await getPackMeta();
  if (!meta || Date.now() - meta.savedAt < 12 * 3600 * 1000) return;
  try {
    await downloadPack();
  } catch {}
}
