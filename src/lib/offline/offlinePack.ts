import { kvGet, kvSet } from "./db";
import { MAX_OFFLINE_MS } from "./offlineStatus";

/**
 * Everything the POS needs to keep billing with no server: refreshed every time the POS loads these
 * online, read back only when a reload happens while offline (an open tab keeps its data in memory).
 */
export interface OfflinePack {
  savedAt: number;
  // Typed loosely: these are the server's own response shapes, stored as the POS received them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  outletId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outlets: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menuItems: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tables: any[];
}

const PACK_KEY = "pack";

export function saveOfflinePack(pack: Omit<OfflinePack, "savedAt">): Promise<boolean> {
  return kvSet(PACK_KEY, { ...pack, savedAt: Date.now() });
}

export function clearOfflinePack(): Promise<boolean> {
  return kvSet(PACK_KEY, null);
}

/** The saved pack, or null when there is none or it is older than the offline allowance. */
export async function loadOfflinePack(): Promise<OfflinePack | null> {
  const pack = await kvGet<OfflinePack>(PACK_KEY);
  if (!pack || !pack.user || Date.now() - pack.savedAt > MAX_OFFLINE_MS) return null;
  return pack;
}

/**
 * This device's short code (e.g. "K7Q"). It goes into every offline order number, so two tills
 * billing offline at the same outlet never hand out the same number.
 */
export async function getDeviceCode(): Promise<string> {
  const saved = await kvGet<string>("deviceCode");
  if (saved) return saved;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I: the code is read off paper
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  await kvSet("deviceCode", code);
  return code;
}

/** Next number in this device's daily offline series (restarts each day). */
export async function nextOfflineSequence(dateKey: string): Promise<number> {
  const counter = (await kvGet<{ date: string; seq: number }>("offlineSeq")) || { date: dateKey, seq: 0 };
  const seq = counter.date === dateKey ? counter.seq + 1 : 1;
  await kvSet("offlineSeq", { date: dateKey, seq });
  return seq;
}
