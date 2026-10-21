import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStats, migrateLocalProgress, recordActivity } from "@/lib/progress.functions";
import { getStoredUser, isNetworkError, isOffline } from "@/lib/offline-data";

export type BadgeId =
  | "primer-paso"
  | "guaranihablante"
  | "estudiante-estrella"
  | "racha-fuego";

export type BadgeDef = {
  id: BadgeId;
  name: string;
  emoji: string;
  description: string;
};

export const BADGES: BadgeDef[] = [
  {
    id: "primer-paso",
    name: "Primer paso",
    emoji: "👣",
    description: "Completaste tu primera lección.",
  },
  {
    id: "guaranihablante",
    name: "Guaranihablante",
    emoji: "🗣️",
    description: "Completaste 5 lecciones de Guaraní.",
  },
  {
    id: "estudiante-estrella",
    name: "Estudiante estrella",
    emoji: "⭐",
    description: "Sacaste 5/5 en una prueba de Guaraní Escolar.",
  },
  {
    id: "racha-fuego",
    name: "Racha de fuego",
    emoji: "🔥",
    description: "Mantuviste una racha de 7 días seguidos.",
  },
];

export type Stats = {
  xp: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD or ""
  badges: BadgeId[];
  guaraniLessonsCompleted: number;
  /** Usuario dueño de esta caché. Vacío = progreso viejo, solo local (pre-sincronización). */
  ownerId?: string;
};

export type ActivitySource = "lesson" | "exam" | "trivia" | "weekly" | "onboarding" | "game";

/*
 * La fuente de verdad es la base de datos (user_stats + xp_transactions).
 * localStorage es solo caché para que la interfaz no parpadee.
 */
const STORAGE_KEY = "aranduka:stats";
const PENDING_KEY = "aranduka:pending-activity";
const EVENT_NAME = "aranduka:stats-changed";
/** Aviso cuando cambia la cantidad de avances guardados en el teléfono esperando señal. */
export const PENDING_EVENT = "jaikuaa:pending-changed";
/** Tope de avances en espera: alcanza para meses de uso sin señal. */
const MAX_PENDING = 2000;
/** Un avance que el servidor rechaza por un motivo que no es la red se descarta tras estos intentos. */
const MAX_REJECTIONS = 8;

function emptyStats(): Stats {
  return { xp: 0, streak: 0, lastActiveDate: "", badges: [], guaraniLessonsCompleted: 0 };
}

function read(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    return { ...emptyStats(), ...(JSON.parse(raw) as Partial<Stats>) };
  } catch {
    return emptyStats();
  }
}

function write(s: Stats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {}
}

export function getStats(): Stats {
  return read();
}

function fromServer(s: {
  userId: string;
  xp: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
  guaraniLessonsCompleted: number;
}): Stats {
  return {
    xp: s.xp,
    streak: s.streak,
    lastActiveDate: s.lastActiveDate,
    badges: s.badges.filter((b): b is BadgeId => BADGES.some((x) => x.id === b)),
    guaraniLessonsCompleted: s.guaraniLessonsCompleted,
    ownerId: s.userId,
  };
}

type PendingEvent = {
  source: ActivitySource | "visit";
  sourceRef: string;
  xp: number;
  syncId: string;
  isGuaraniLesson: boolean;
  perfectExam: boolean;
  /** Cuándo se hizo de verdad (puede ser días antes de enviarse). */
  at?: number;
  /** Rechazos del servidor que no fueron por falta de señal. */
  rejected?: number;
};

function readPending(): PendingEvent[] {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY) || "[]") as PendingEvent[];
  } catch {
    return [];
  }
}
function writePending(list: PendingEvent[]) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-MAX_PENDING)));
    window.dispatchEvent(new CustomEvent(PENDING_EVENT));
  } catch {}
}

/** Cantidad de avances guardados en el teléfono que todavía no llegaron al servidor. */
export function pendingCount(): number {
  if (typeof window === "undefined") return 0;
  return readPending().filter((e) => e.source !== "visit").length;
}

/** Lecciones terminadas en este teléfono que el servidor todavía no recibió (p. ej. "guarani:3"). */
export function pendingLessonRefs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return new Set(readPending().filter((e) => e.source === "lesson").map((e) => e.sourceRef));
}

async function hasSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

/** Hay alguien con sesión en este teléfono, aunque su permiso venció y no hay señal para renovarlo. */
async function hasUser(): Promise<boolean> {
  return (await hasSession()) || !!getStoredUser();
}

function newSyncId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

type SendResult = "ok" | "network" | "rejected";
type ServerStats = Parameters<typeof fromServer>[0];

/** Números del servidor más lo que todavía espera señal en el teléfono (para no «perder» XP en pantalla). */
function withPending(server: ServerStats): Stats {
  const base = fromServer(server);
  const pend = readPending();
  return {
    ...base,
    xp: base.xp + pend.reduce((a, e) => a + e.xp, 0),
    guaraniLessonsCompleted:
      base.guaraniLessonsCompleted + pend.filter((e) => e.isGuaraniLesson).length,
  };
}

let lastServer: ServerStats | null = null;

/** Envía al servidor. El sync_id hace que repetir un envío nunca sume dos veces. */
async function send(ev: PendingEvent): Promise<SendResult> {
  if (isOffline()) return "network";
  try {
    const { at: _at, rejected: _r, ...data } = ev;
    lastServer = await recordActivity({ data });
    return "ok";
  } catch (e) {
    if (isNetworkError(e)) return "network";
    // Sesión vencida: se reintenta cuando se renueve, sin contarlo como rechazo.
    if (/unauthori|jwt|token|session/i.test(String((e as Error)?.message ?? ""))) return "network";
    return "rejected";
  }
}

let flushing: Promise<void> | null = null;

/** Envía en orden los avances guardados; se frena al primer corte de señal. */
function flushPending(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    const list = readPending();
    if (list.length === 0 || isOffline()) return;
    const sent = new Set<string>();
    const bumped = new Map<string, number>();
    for (const ev of list) {
      const r = await send(ev);
      if (r === "network") break;
      if (r === "ok") sent.add(ev.syncId);
      else bumped.set(ev.syncId, (ev.rejected ?? 0) + 1);
    }
    // Se relee la cola: mientras se enviaba pudieron agregarse avances nuevos.
    const now = readPending()
      .filter((e) => !sent.has(e.syncId))
      .map((e) => (bumped.has(e.syncId) ? { ...e, rejected: bumped.get(e.syncId) } : e))
      .filter((e) => (e.rejected ?? 0) < MAX_REJECTIONS);
    writePending(now);
    if (lastServer) write(withPending(lastServer));
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

let syncPromise: Promise<void> | null = null;

/** Sincroniza con el servidor: cola pendiente, migración única del progreso local y lectura. */
export function syncStats(): Promise<void> {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    if (isOffline() || !(await hasSession())) return;
    await flushPending();
    const local = read();
    let server = await getMyStats();
    if (!local.ownerId && local.xp > 0 && server.xp === 0) {
      try {
        server = await migrateLocalProgress({
          data: {
            xp: Math.min(local.xp, 5000),
            streak: Math.min(local.streak, 365),
            lastActiveDate: /^\d{4}-\d{2}-\d{2}$/.test(local.lastActiveDate)
              ? local.lastActiveDate
              : null,
            badges: local.badges.filter((b) => BADGES.some((x) => x.id === b)),
            guaraniLessonsCompleted: Math.min(local.guaraniLessonsCompleted, 500),
          },
        });
      } catch {}
    }
    write(withPending(server));
  })()
    .catch(() => {})
    .finally(() => {
      syncPromise = null;
    });
  return syncPromise;
}

type CompleteOpts = {
  xp: number;
  source: ActivitySource;
  sourceRef?: string;
  isGuaraniLesson?: boolean;
  perfectExam?: boolean;
};

/** Registra una actividad completada en el servidor (y actualiza la caché local). */
export function recordCompletion(opts: CompleteOpts): void {
  const ev: PendingEvent = {
    source: opts.source,
    sourceRef: opts.sourceRef ?? "",
    xp: Math.max(0, Math.round(opts.xp)),
    syncId: newSyncId(),
    isGuaraniLesson: !!opts.isGuaraniLesson,
    perfectExam: !!opts.perfectExam,
  };
  // Primero se guarda en el teléfono y recién después se intenta enviar: si se corta la señal
  // o se cierra la app al instante, el avance no se pierde.
  void (async () => {
    if (!(await hasUser())) {
      // Sin sesión (p. ej. onboarding): se guarda solo en el dispositivo y
      // se sube una única vez como "local-migration" al iniciar sesión.
      const s = read();
      if (!s.ownerId) {
        write({
          ...s,
          xp: s.xp + ev.xp,
          guaraniLessonsCompleted: s.guaraniLessonsCompleted + (ev.isGuaraniLesson ? 1 : 0),
        });
      }
      return;
    }
    writePending([...readPending(), { ...ev, at: Date.now() }]);
    bumpLocal(ev);
    await flushPending();
  })();
}

/** Muestra el avance al instante en la pantalla; el servidor manda los números finales al sincronizar. */
function bumpLocal(ev: PendingEvent) {
  const s = read();
  write({
    ...s,
    xp: s.xp + ev.xp,
    guaraniLessonsCompleted: s.guaraniLessonsCompleted + (ev.isGuaraniLesson ? 1 : 0),
  });
}

/** Marca al usuario como activo hoy (máximo una visita por día, la controla el servidor). */
export function recordVisit(sourceRef: string): void {
  void (async () => {
    if (isOffline() || !(await hasSession())) return;
    lastServer = null;
    const r = await send({
      source: "visit",
      sourceRef,
      xp: 0,
      syncId: newSyncId(),
      isGuaraniLesson: false,
      perfectExam: false,
    });
    if (r === "ok" && lastServer) write(withPending(lastServer));
  })();
}

export function useRecordVisit(sourceRef: string) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recordVisit(sourceRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useStats(): Stats {
  // Caché local primero para no mostrar ceros; luego se reemplaza con user_stats.
  // Safe here because consumers live under the ssr:false _authenticated layout.
  const [stats, setStats] = useState<Stats>(() => read());
  useEffect(() => {
    const handler = () => setStats(read());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    void syncStats();
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return stats;
}

/**
 * Run a completion side-effect exactly once when a component mounts.
 * Useful inside the "done" screen of lessons/quizzes.
 */
export function useRecordOnMount(opts: CompleteOpts) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    recordCompletion(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
