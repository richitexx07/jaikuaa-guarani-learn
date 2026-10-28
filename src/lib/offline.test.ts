import { beforeEach, describe, expect, it, vi } from "vitest";

// Entorno mínimo de navegador (sin jsdom). IndexedDB no existe acá: el almacén usa su respaldo en memoria.
function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}
const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = memoryStorage();
g.window = globalThis;
if (typeof g.CustomEvent === "undefined") {
  g.CustomEvent = class extends Event {
    constructor(type: string) {
      super(type);
    }
  };
}
const nav = { onLine: true };
Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true, writable: true });
const setOnline = (v: boolean) => {
  nav.onLine = v;
};

/* ------------------------- servidor simulado ------------------------- */
const server = {
  calls: [] as Record<string, unknown>[],
  fail: null as null | "network" | "reject" | "unauthorized" | "ratelimit",
  xp: 0,
};
function serverError() {
  if (server.fail === "network") throw new TypeError("Failed to fetch");
  if (server.fail === "reject") throw new Error("Juego no válido");
  if (server.fail === "unauthorized") throw new Error("Unauthorized: No authorization header provided");
  if (server.fail === "ratelimit") throw new Error("Demasiadas actividades seguidas. Esperá unos minutos.");
}
const stats = () => ({
  userId: "u1",
  xp: server.xp,
  streak: 1,
  lastActiveDate: "2026-10-21",
  badges: [],
  guaraniLessonsCompleted: 0,
});
vi.mock("./progress.functions", () => ({
  recordActivity: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    serverError();
    server.calls.push(data);
    server.xp += Number(data.xp ?? 0);
    return stats();
  }),
  getMyStats: vi.fn(async () => {
    serverError();
    return stats();
  }),
  migrateLocalProgress: vi.fn(),
}));
const session = { current: null as null | { user: { id: string } } };
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: session.current } }) } },
}));
const wotdCalls: { day: string; choice: string }[] = [];
vi.mock("./games.functions", () => ({
  answerWordOfDayFor: vi.fn(async ({ data }: { data: { day: string; choice: string } }) => {
    serverError();
    if (data.day < "2026-10-01") throw new Error("Fecha fuera de rango");
    wotdCalls.push(data);
    return { correct: true, answer: "x", duplicate: false };
  }),
}));
vi.mock("./certificates.functions", () => ({ issueCertificate: vi.fn(async () => ({ code: "ABC" })) }));
const answerBatches: number[] = [];
vi.mock("./answers.functions", () => ({
  recordAnswers: vi.fn(async ({ data }: { data: { answers: unknown[] } }) => {
    serverError();
    answerBatches.push(data.answers.length);
    return { saved: data.answers.length };
  }),
}));

const flush = () => new Promise((r) => setTimeout(r, 0));
async function settle() {
  for (let i = 0; i < 20; i++) await flush();
}
function loginStored() {
  (g.localStorage as Storage).setItem(
    "sb-proyecto-auth-token",
    JSON.stringify({ access_token: "vencido", user: { id: "u1", email: "alumno@test.py" } }),
  );
}

beforeEach(async () => {
  vi.resetModules();
  (g.localStorage as { clear: () => void }).clear();
  server.calls = [];
  server.fail = null;
  server.xp = 0;
  wotdCalls.length = 0;
  answerBatches.length = 0;
  session.current = null;
  setOnline(true);
  const store = await import("./offline-store");
  store.__resetOfflineStore();
});

describe("Copia guardada para usar sin señal", () => {
  it("con señal trae del servidor y guarda; sin señal usa la copia", async () => {
    const { withOfflineCache } = await import("./offline-data");
    const fetcher = vi.fn(async () => ({ n: 1 }));
    expect(await withOfflineCache("lesson:1", fetcher)).toEqual({ n: 1 });
    setOnline(false);
    expect(await withOfflineCache("lesson:1", fetcher)).toEqual({ n: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("sin señal y sin copia avisa que no está descargado", async () => {
    const { withOfflineCache, OfflineMissingError } = await import("./offline-data");
    setOnline(false);
    await expect(withOfflineCache("lesson:9", async () => 1)).rejects.toBeInstanceOf(OfflineMissingError);
  });

  it("si la red falla aunque el teléfono diga que hay señal, usa la copia", async () => {
    const { withOfflineCache } = await import("./offline-data");
    await withOfflineCache("glossary", async () => ["a"]);
    const v = await withOfflineCache("glossary", async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(v).toEqual(["a"]);
  });

  it("un error que no es de red (por ejemplo, sesión inválida) no se tapa con la copia", async () => {
    const { withOfflineCache } = await import("./offline-data");
    await withOfflineCache("glossary", async () => ["a"]);
    await expect(
      withOfflineCache("glossary", async () => {
        throw new Error("Unauthorized");
      }),
    ).rejects.toThrow("Unauthorized");
  });

  it("reconoce la sesión guardada en el teléfono aunque esté vencida", async () => {
    const { getStoredUser } = await import("./offline-data");
    expect(getStoredUser()).toBeNull();
    loginStored();
    expect(getStoredUser()).toEqual({ id: "u1", email: "alumno@test.py" });
  });
});

describe("Avances hechos sin señal", () => {
  it("se guardan aunque el permiso de la sesión venció y se envían al volver la señal", async () => {
    loginStored();
    setOnline(false);
    const gam = await import("./gamification");
    gam.recordCompletion({ xp: 20, source: "lesson", sourceRef: "guarani:3", isGuaraniLesson: true });
    await settle();
    expect(gam.pendingCount()).toBe(1);
    expect(gam.pendingLessonRefs().has("guarani:3")).toBe(true);
    expect(gam.getStats().xp).toBe(20); // se ve al instante en pantalla
    expect(server.calls).toHaveLength(0);

    setOnline(true);
    session.current = { user: { id: "u1" } };
    await gam.syncStats();
    expect(server.calls).toHaveLength(1);
    expect(server.calls[0]).not.toHaveProperty("at"); // el servidor no recibe campos internos
    expect(gam.pendingCount()).toBe(0);
    expect(gam.getStats().xp).toBe(20);
  });

  it("guarda mucho más que 50 actividades y las envía todas, en orden", async () => {
    loginStored();
    setOnline(false);
    const gam = await import("./gamification");
    for (let i = 1; i <= 120; i++) gam.recordCompletion({ xp: 1, source: "game", sourceRef: "memoria" });
    await settle();
    expect(gam.pendingCount()).toBe(120);
    setOnline(true);
    session.current = { user: { id: "u1" } };
    await gam.syncStats();
    expect(server.calls).toHaveLength(120);
    expect(gam.pendingCount()).toBe(0);
  });

  it("si la señal se corta a mitad del envío, lo que falta queda guardado", async () => {
    loginStored();
    setOnline(false);
    const gam = await import("./gamification");
    gam.recordCompletion({ xp: 5, source: "game", sourceRef: "memoria" });
    gam.recordCompletion({ xp: 5, source: "game", sourceRef: "ahorcado" });
    await settle();
    setOnline(true);
    session.current = { user: { id: "u1" } };
    server.fail = "network";
    await gam.syncStats();
    expect(gam.pendingCount()).toBe(2);
    server.fail = null;
    await gam.syncStats();
    expect(gam.pendingCount()).toBe(0);
  });

  it("con sesión vencida no se descarta nada; un rechazo real se descarta tras varios intentos", async () => {
    loginStored();
    session.current = { user: { id: "u1" } };
    const gam = await import("./gamification");
    server.fail = "unauthorized";
    gam.recordCompletion({ xp: 5, source: "game", sourceRef: "memoria" });
    await settle();
    for (let i = 0; i < 10; i++) {
      await gam.syncStats();
      await settle();
    }
    expect(gam.pendingCount()).toBe(1);
    server.fail = "reject";
    for (let i = 0; i < 10; i++) {
      await gam.syncStats();
      await settle();
    }
    expect(gam.pendingCount()).toBe(0);
  });

  it("el freno del servidor por muchas actividades no borra nada: se envía cuando pasa la ventana", async () => {
    loginStored();
    session.current = { user: { id: "u1" } };
    const gam = await import("./gamification");
    server.fail = "ratelimit";
    gam.recordCompletion({ xp: 5, source: "game", sourceRef: "memoria" });
    await settle();
    // Muchos reintentos seguidos (más que el tope de rechazos): nada se descarta.
    for (let i = 0; i < 12; i++) {
      await gam.syncStats();
      await settle();
    }
    expect(gam.pendingCount()).toBe(1);
    // Cuando pasa la ventana del freno, el avance llega al servidor.
    server.fail = null;
    await gam.syncStats();
    await settle();
    expect(gam.pendingCount()).toBe(0);
    expect(server.calls).toHaveLength(1);
  });

  it("con señal, se guarda primero y se envía enseguida", async () => {
    loginStored();
    session.current = { user: { id: "u1" } };
    const gam = await import("./gamification");
    gam.recordCompletion({ xp: 7, source: "game", sourceRef: "memoria" });
    await settle();
    expect(server.calls).toHaveLength(1);
    expect(gam.pendingCount()).toBe(0);
  });
});

describe("Palabra del día y certificado sin señal", () => {
  it("una jugada por día, enviada al volver la señal; las muy viejas se descartan", async () => {
    loginStored();
    session.current = { user: { id: "u1" } };
    const sync = await import("./offline-sync");
    sync.queueWotdAnswer("2026-10-20", "Gracias");
    sync.queueWotdAnswer("2026-10-20", "Otra"); // el mismo día no se juega dos veces
    sync.queueWotdAnswer("2026-09-01", "Vieja");
    expect(sync.totalPending()).toBe(2);
    await sync.syncAllPending();
    expect(wotdCalls).toEqual([{ day: "2026-10-20", choice: "Gracias" }]);
    expect(sync.totalPending()).toBe(0);
  });

  it("recuerda la jugada para mostrarla sin señal", async () => {
    const sync = await import("./offline-sync");
    sync.rememberWotdPlay({ day: "2026-10-21", choice: "Sol", correct: true, answer: "Sol" });
    expect(sync.localWotdPlay("2026-10-21")?.correct).toBe(true);
  });

  it("el certificado pedido sin señal se emite al volver la conexión", async () => {
    loginStored();
    session.current = { user: { id: "u1" } };
    const sync = await import("./offline-sync");
    sync.queueCertificate("María González");
    expect(sync.pendingCertificateName()).toBe("María González");
    await sync.syncAllPending();
    expect(sync.pendingCertificateName()).toBeNull();
  });
});

describe("Lección a medias", () => {
  it("se guarda, se lee y se borra; vence a los 30 días", async () => {
    const d = await import("./lesson-draft");
    d.saveLessonDraft("guarani", 2, {
      phase: "choice",
      choice: { questions: [{ gn: "kuarahy", options: ["Sol", "Luna"] }], i: 1, correct: 1, picked: null },
    });
    expect(d.readLessonDraft("guarani", 2)?.choice?.i).toBe(1);
    const raw = JSON.parse((g.localStorage as Storage).getItem("jaikuaa:lesson-draft:guarani:2")!);
    raw.savedAt = Date.now() - 31 * 24 * 3600 * 1000;
    (g.localStorage as Storage).setItem("jaikuaa:lesson-draft:guarani:2", JSON.stringify(raw));
    expect(d.readLessonDraft("guarani", 2)).toBeNull();
    d.saveLessonDraft("guarani", 2, { phase: "match" });
    d.clearLessonDraft("guarani", 2);
    expect(d.readLessonDraft("guarani", 2)).toBeNull();
  });

  it("si la lección cambió (palabras nuevas o quitadas), no se usa el borrador viejo", async () => {
    const d = await import("./lesson-draft");
    const draft = {
      phase: "choice" as const,
      choice: { questions: [{ gn: "kuarahy", options: ["Sol", "Luna"] }], i: 0, correct: 0, picked: null },
      savedAt: Date.now(),
    };
    const vocab = [
      { gn: "kuarahy", es: "Sol" },
      { gn: "jasy", es: "Luna" },
    ];
    expect(d.draftFitsLesson(draft, vocab)).toBe(true);
    expect(d.draftFitsLesson(draft, [{ gn: "jasy", es: "Luna" }])).toBe(false);
  });
});

describe("Respuestas para el cuaderno del docente", () => {
  it("se guardan sin señal y se envían en tandas de hasta 200 al volver", async () => {
    setOnline(false);
    const log = await import("./answer-log");
    for (let i = 0; i < 450; i++) log.logAnswer("Kuarahy", i % 3 !== 0, "lesson", "guarani:2");
    expect(log.pendingAnswersCount()).toBe(450);
    await log.flushAnswers();
    expect(answerBatches).toEqual([]);
    setOnline(true);
    await log.flushAnswers();
    expect(answerBatches).toEqual([200, 200, 50]);
    expect(log.pendingAnswersCount()).toBe(0);
  });

  it("si se corta la señal al enviar, no se pierde ninguna respuesta", async () => {
    const log = await import("./answer-log");
    log.logAnswer("Aguyje", true, "wotd", "2026-10-21");
    server.fail = "network";
    await log.flushAnswers();
    expect(log.pendingAnswersCount()).toBe(1);
    server.fail = null;
    await log.flushAnswers();
    expect(log.pendingAnswersCount()).toBe(0);
  });
});
