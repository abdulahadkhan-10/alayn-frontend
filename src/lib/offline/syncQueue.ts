import { API_BASE_URL } from "@/lib/apiBase";
import { refreshSession } from "@/lib/authSession";
import { queueDelete, queueGetAll, queuePut } from "./db";
import { getDeviceCode } from "./offlinePack";
import {
  clearOfflineSince,
  getOfflineStatus,
  onBackOnline,
  reportNetworkFailure,
  setQueueCounts,
  setSyncing,
} from "./offlineStatus";
import type { QueuedOrder } from "./offlineOrders";

const BATCH_SIZE = 50; // the server's limit per request
const RETRY_MS = 30_000;

type SyncResult =
  | { clientOrderId: string; status: "synced" | "duplicate"; orderId: string; orderNumber: string | null; settled: boolean; priceMismatch: boolean; warning?: string }
  | { clientOrderId: string; status: "rejected"; error: { code: string; message: string } };

export interface SyncOutcome {
  synced: number;
  rejected: number;
  /** Bills saved but left open on the server (their payment was refused): settle from the Orders screen. */
  warnings: string[];
}

export async function refreshQueueCounts(): Promise<QueuedOrder[]> {
  const all = await queueGetAll<QueuedOrder>();
  setQueueCounts(all.filter((q) => q.status === "pending").length, all.filter((q) => q.status === "attention").length);
  return all;
}

async function post(outletId: string, body: unknown): Promise<Response> {
  const send = () =>
    fetch(`${API_BASE_URL}/orders/sync`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-portal": "tenant", "x-outlet-id": outletId },
      body: JSON.stringify(body),
    });
  let res = await send();
  if (res.status === 401) {
    // The short-lived login cookie expired while offline; the refresh cookie lasts longer than 7 days
    const refreshed = await refreshSession();
    if (refreshed.ok) res = await send();
  }
  return res;
}

let running: Promise<SyncOutcome> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const outcomeListeners = new Set<(o: SyncOutcome) => void>();

/** Tells the POS what a background sync did, so it can say so on screen. */
export function onSyncOutcome(listener: (o: SyncOutcome) => void): () => void {
  outcomeListeners.add(listener);
  return () => outcomeListeners.delete(listener);
}

/**
 * Sends waiting bills to the server, oldest first, one outlet at a time. Safe to call often: only one
 * sync runs at a time, and a bill the server already has is simply confirmed and removed.
 */
export function syncNow(): Promise<SyncOutcome> {
  if (!running) {
    running = doSync().finally(() => {
      running = null;
    });
  }
  return running;
}

async function doSync(): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { synced: 0, rejected: 0, warnings: [] };
  const pending = (await refreshQueueCounts())
    .filter((q) => q.status === "pending")
    .sort((a, b) => a.payload.createdAt.localeCompare(b.payload.createdAt));
  if (pending.length === 0) return outcome;

  setSyncing(true);
  let stopped = false;
  try {
    const deviceCode = await getDeviceCode();
    const offlineSince = getOfflineStatus().offlineSince;
    const byOutlet = new Map<string, QueuedOrder[]>();
    pending.forEach((q) => byOutlet.set(q.outletId, [...(byOutlet.get(q.outletId) || []), q]));

    for (const [outletId, records] of byOutlet) {
      for (let i = 0; i < records.length && !stopped; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        let res: Response;
        try {
          res = await post(outletId, {
            deviceCode,
            ...(offlineSince ? { offlineSince: new Date(offlineSince).toISOString() } : {}),
            orders: batch.map((q) => q.payload),
          });
        } catch {
          reportNetworkFailure();
          stopped = true;
          break;
        }
        if (!res.ok) {
          // 401 after a refresh, or the server is down: keep every bill and try again later
          stopped = true;
          break;
        }
        const json = await res.json().catch(() => null);
        const results: SyncResult[] = json?.data?.results || [];
        for (const result of results) {
          const record = batch.find((q) => q.clientOrderId === result.clientOrderId);
          if (!record) continue;
          if (result.status === "rejected") {
            outcome.rejected += 1;
            await queuePut({ ...record, status: "attention", attempts: record.attempts + 1, lastError: result.error.message });
          } else {
            outcome.synced += 1;
            if (result.warning) outcome.warnings.push(`${record.payload.orderNumber}: ${result.warning}`);
            await queueDelete(record.clientOrderId);
          }
        }
      }
      if (stopped) break;
    }
  } finally {
    setSyncing(false);
  }

  const left = await refreshQueueCounts();
  if (left.every((q) => q.status !== "pending") && !stopped) {
    await clearOfflineSince();
  } else {
    scheduleRetry();
  }
  if (outcome.synced > 0 || outcome.rejected > 0) outcomeListeners.forEach((l) => l(outcome));
  return outcome;
}

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (getOfflineStatus().online) void syncNow();
  }, RETRY_MS);
}

let started = false;

/** Syncs on start-up and every time the connection comes back (idempotent). */
export function startSyncWorker() {
  if (started || typeof window === "undefined") return;
  started = true;
  onBackOnline(() => void syncNow());
  void syncNow();
}

/** Puts a refused bill back in line after someone has looked at it (e.g. fixed the device clock). */
export async function retryRefused(clientOrderId: string) {
  const all = await queueGetAll<QueuedOrder>();
  const record = all.find((q) => q.clientOrderId === clientOrderId);
  if (record) await queuePut({ ...record, status: "pending", lastError: undefined });
  await syncNow();
}

/** Removes a refused bill from this device for good (after it has been entered by hand). */
export async function discardRefused(clientOrderId: string) {
  await queueDelete(clientOrderId);
  await refreshQueueCounts();
}
