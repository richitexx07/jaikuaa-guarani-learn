// Todo lo que se hizo sin señal y espera para llegar al servidor: avances de lecciones y juegos
// (cola de gamification.ts), Palabras del día y el pedido del certificado.

import { answerWordOfDayFor } from "./games.functions";
import { issueCertificate } from "./certificates.functions";
import { PENDING_EVENT, pendingCount, syncStats } from "./gamification";
import { isNetworkError, isOffline } from "./offline-data";
import { flushAnswers } from "./answer-log";

const WOTD_KEY = "jaikuaa:pending-wotd";
const WOTD_PLAYED = "jaikuaa:wotd-played";
const CERT_KEY = "jaikuaa:pending-certificate";

export type WotdPlay = { day: string; choice: string; correct: boolean; answer: string };

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(PENDING_EVENT));
  } catch {}
}

/* ------------------------------ Palabra del día ------------------------------ */

/** Jugadas hechas en este teléfono (para mostrar el resultado aunque no haya señal). */
export function localWotdPlay(day: string): WotdPlay | null {
  return readJson<Record<string, WotdPlay>>(WOTD_PLAYED, {})[day] ?? null;
}

export function rememberWotdPlay(play: WotdPlay) {
  const all = readJson<Record<string, WotdPlay>>(WOTD_PLAYED, {});
  all[play.day] = play;
  // Se guardan solo las últimas 60 jugadas.
  const keep = Object.keys(all).sort().slice(-60);
  writeJson(WOTD_PLAYED, Object.fromEntries(keep.map((k) => [k, all[k]])));
}

export function queueWotdAnswer(day: string, choice: string) {
  const list = readJson<{ day: string; choice: string }[]>(WOTD_KEY, []);
  if (!list.some((x) => x.day === day)) writeJson(WOTD_KEY, [...list, { day, choice }]);
}

async function flushWotd() {
  const list = readJson<{ day: string; choice: string }[]>(WOTD_KEY, []);
  if (!list.length) return;
  const left: typeof list = [];
  for (const item of list) {
    try {
      await answerWordOfDayFor({ data: item });
    } catch (e) {
      // Sin señal se reintenta; si el servidor la rechaza (por ejemplo, de hace más de 14 días) se descarta.
      if (isNetworkError(e) || /unauthori|jwt|token/i.test(String((e as Error)?.message))) left.push(item);
    }
  }
  writeJson(WOTD_KEY, left.length ? left : null);
}

/* -------------------------------- Certificado -------------------------------- */

/** Nombre pedido para el certificado mientras no había señal; se emite al volver la conexión. */
export function pendingCertificateName(): string | null {
  return readJson<{ name: string } | null>(CERT_KEY, null)?.name ?? null;
}

export function queueCertificate(name: string) {
  writeJson(CERT_KEY, { name });
}

async function flushCertificate() {
  const name = pendingCertificateName();
  if (!name) return;
  try {
    await issueCertificate({ data: { name } });
    writeJson(CERT_KEY, null);
  } catch (e) {
    if (!isNetworkError(e) && !/unauthori|jwt|token/i.test(String((e as Error)?.message))) {
      // Por ejemplo, todavía faltan lecciones según el servidor: se deja de intentar.
      writeJson(CERT_KEY, null);
    }
  }
}

/* ---------------------------------- Todo junto ---------------------------------- */

export function totalPending(): number {
  return (
    pendingCount() +
    readJson<unknown[]>(WOTD_KEY, []).length +
    (pendingCertificateName() ? 1 : 0)
  );
}

let running: Promise<void> | null = null;

/** Envía todo lo pendiente, en orden: primero los avances (el certificado depende de ellos). */
export function syncAllPending(): Promise<void> {
  if (isOffline()) return Promise.resolve();
  if (running) return running;
  running = (async () => {
    await syncStats();
    await flushWotd();
    await flushCertificate();
    await flushAnswers();
  })()
    .catch(() => {})
    .finally(() => {
      running = null;
    });
  return running;
}
