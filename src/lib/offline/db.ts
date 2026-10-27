/**
 * The POS's own storage for offline billing (IndexedDB, so it survives reloads and browser restarts).
 *
 *   kv      small settings and the offline pack: menu, outlet, signed-in user (see offlinePack.ts)
 *   queue   bills made offline, waiting to reach the server (see syncQueue.ts)
 *
 * Every call fails soft: if the browser refuses storage (private window, blocked site data) the POS
 * keeps working online and simply can't bill offline.
 */

const DB_NAME = "alayn-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable"));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
        if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "clientOrderId" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

function run<T>(store: "kv" | "queue", mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = op(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  try {
    return await run<T | undefined>("kv", "readonly", (s) => s.get(key));
  } catch {
    return undefined;
  }
}

export async function kvSet(key: string, value: unknown): Promise<boolean> {
  try {
    await run("kv", "readwrite", (s) => s.put(value, key));
    return true;
  } catch {
    return false;
  }
}

export async function queuePut<T extends { clientOrderId: string }>(record: T): Promise<boolean> {
  try {
    await run("queue", "readwrite", (s) => s.put(record));
    return true;
  } catch {
    return false;
  }
}

export async function queueGetAll<T>(): Promise<T[]> {
  try {
    return (await run<T[]>("queue", "readonly", (s) => s.getAll())) || [];
  } catch {
    return [];
  }
}

export async function queueDelete(clientOrderId: string): Promise<void> {
  try {
    await run("queue", "readwrite", (s) => s.delete(clientOrderId));
  } catch {
    // Left in place; the next sync sees the server already has it and removes it then
  }
}
