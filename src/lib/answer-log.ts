// Registro de cada respuesta de práctica (palabra + si acertó) para el cuaderno del docente.
// Se guarda primero en el teléfono y se envía en tandas; funciona igual sin señal.

import { recordAnswers } from "./answers.functions";
import { isNetworkError, isOffline } from "./offline-data";

const KEY = "jaikuaa:pending-answers";
const MAX = 3000;

type PendingAnswer = {
  id: string;
  gn: string;
  correct: boolean;
  source: "lesson" | "wotd" | "game";
  sourceRef: string | null;
  at: number;
};

function read(): PendingAnswer[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as PendingAnswer[];
  } catch {
    return [];
  }
}
function write(list: PendingAnswer[]) {
  try {
    if (list.length) window.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
    else window.localStorage.removeItem(KEY);
  } catch {}
}

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Respaldo para navegadores viejos: mismo formato que un UUID v4.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Anota una respuesta. Se envía junto con otras unos segundos después (o cuando vuelva la señal). */
export function logAnswer(gn: string, correct: boolean, source: PendingAnswer["source"], sourceRef?: string) {
  if (typeof window === "undefined" || !gn) return;
  write([...read(), { id: uuid(), gn, correct, source, sourceRef: sourceRef ?? null, at: Date.now() }]);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flushAnswers(), 5000);
}

export function pendingAnswersCount(): number {
  if (typeof window === "undefined") return 0;
  return read().length;
}

let running: Promise<void> | null = null;

export function flushAnswers(): Promise<void> {
  if (typeof window === "undefined" || isOffline()) return Promise.resolve();
  if (running) return running;
  running = (async () => {
    for (let guard = 0; guard < 20; guard++) {
      const list = read();
      if (!list.length) return;
      const batch = list.slice(0, 200);
      try {
        await recordAnswers({ data: { answers: batch } });
        const sent = new Set(batch.map((a) => a.id));
        write(read().filter((a) => !sent.has(a.id)));
      } catch (e) {
        // Sin señal, sesión vencida o límite: se reintenta más tarde sin perder nada.
        if (isNetworkError(e) || /unauthori|jwt|token|demasiados/i.test(String((e as Error)?.message))) return;
        // Un rechazo por datos inválidos no debe trabar la cola para siempre.
        const sent = new Set(batch.map((a) => a.id));
        write(read().filter((a) => !sent.has(a.id)));
      }
    }
  })().finally(() => {
    running = null;
  });
  return running;
}
