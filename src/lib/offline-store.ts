// Almacén del teléfono para usar Jaikuaa sin conexión (IndexedDB).
// Guarda copias de lo que viene del servidor: lecciones, palabras, glosario, Palabra del día.
// Si el navegador no permite IndexedDB (modo privado viejo), funciona en memoria mientras la
// pestaña esté abierta: nada se rompe, solo no queda guardado.

const DB_NAME = "jaikuaa-offline";
const STORE = "kv";
const VERSION = 1;

export type Saved<T> = { value: T; savedAt: number };

const memory = new Map<string, Saved<unknown>>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<R>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<R>): Promise<R | undefined> {
  return openDb().then(
    (db) =>
      new Promise<R | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const tx = db.transaction(STORE, mode);
          const req = fn(tx.objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      }),
  );
}

export async function offlineGet<T>(key: string): Promise<Saved<T> | undefined> {
  const hit = await run<Saved<T>>("readonly", (s) => s.get(key) as IDBRequest<Saved<T>>);
  return hit ?? (memory.get(key) as Saved<T> | undefined);
}

export async function offlineSet<T>(key: string, value: T): Promise<void> {
  const entry: Saved<T> = { value, savedAt: Date.now() };
  memory.set(key, entry);
  await run("readwrite", (s) => s.put(entry, key));
}

export async function offlineDel(key: string): Promise<void> {
  memory.delete(key);
  await run("readwrite", (s) => s.delete(key));
}

export async function offlineKeys(): Promise<string[]> {
  const keys = await run<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
  return [...new Set([...(keys ?? []).map(String), ...memory.keys()])];
}

/** Solo para pruebas: olvida la conexión abierta y la memoria. */
export function __resetOfflineStore() {
  memory.clear();
  dbPromise = null;
}
