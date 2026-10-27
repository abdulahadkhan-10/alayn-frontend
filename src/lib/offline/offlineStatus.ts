"use client";

import { useSyncExternalStore } from "react";
import { API_BASE_DOMAIN } from "@/lib/apiBase";
import { kvGet, kvSet } from "./db";

/** How long the POS may keep billing offline before it insists on reconnecting. */
export const MAX_OFFLINE_DAYS = 7;
export const MAX_OFFLINE_MS = MAX_OFFLINE_DAYS * 24 * 60 * 60 * 1000;
/** From this point the badge starts counting down the days left. */
const WARN_AFTER_MS = 5 * 24 * 60 * 60 * 1000;

export interface OfflineStatus {
  /** The API answered recently. "Wi-Fi connected" alone doesn't count: captive or dead Wi-Fi lies. */
  online: boolean;
  /** When this device lost the API (persisted, so a reload while offline keeps the original time). */
  offlineSince: number | null;
  /** Bills saved on this device and not yet on the server. */
  pending: number;
  /** Bills the server refused; they stay on the device until someone looks at them. */
  attention: number;
  syncing: boolean;
}

let state: OfflineStatus = { online: true, offlineSince: null, pending: 0, attention: 0, syncing: false };
const listeners = new Set<() => void>();

function setState(patch: Partial<OfflineStatus>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getOfflineStatus(): OfflineStatus {
  return state;
}

export function subscribeOfflineStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_SNAPSHOT: OfflineStatus = { online: true, offlineSince: null, pending: 0, attention: 0, syncing: false };

export function useOfflineStatus(): OfflineStatus {
  return useSyncExternalStore(subscribeOfflineStatus, getOfflineStatus, () => SERVER_SNAPSHOT);
}

export function setQueueCounts(pending: number, attention: number) {
  setState({ pending, attention });
}

export function setSyncing(syncing: boolean) {
  setState({ syncing });
}

async function markOffline() {
  if (!state.online) return;
  const offlineSince = state.offlineSince ?? (await kvGet<number>("offlineSince")) ?? Date.now();
  await kvSet("offlineSince", offlineSince);
  setState({ online: false, offlineSince });
}

async function markOnline() {
  if (state.online && state.offlineSince === null) return;
  // offlineSince is kept until the queue has synced, so the owner's notice can say when it started
  setState({ online: true });
}

/** Called after the queue is empty again: the outage is over. */
export async function clearOfflineSince() {
  await kvSet("offlineSince", null);
  setState({ offlineSince: null });
}

/** A request just failed with no answer from the server: treat the POS as offline straight away. */
export function reportNetworkFailure() {
  void markOffline();
  scheduleCheck(OFFLINE_CHECK_MS);
}

const ONLINE_CHECK_MS = 60_000;
const OFFLINE_CHECK_MS = 10_000;
const PING_TIMEOUT_MS = 5_000;
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
const onlineListeners = new Set<() => void>();

/** Runs when the API becomes reachable again (the sync queue uses this). */
export function onBackOnline(listener: () => void): () => void {
  onlineListeners.add(listener);
  return () => onlineListeners.delete(listener);
}

async function ping(): Promise<boolean> {
  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_DOMAIN}/`, { cache: "no-store", credentials: "omit", signal: controller.signal });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(abort);
  }
}

export async function checkConnectivity(): Promise<boolean> {
  const wasOnline = state.online;
  const ok = typeof navigator !== "undefined" && navigator.onLine === false ? false : await ping();
  if (ok) {
    await markOnline();
    if (!wasOnline) onlineListeners.forEach((l) => l());
  } else {
    await markOffline();
  }
  scheduleCheck(ok ? ONLINE_CHECK_MS : OFFLINE_CHECK_MS);
  return ok;
}

function scheduleCheck(ms: number) {
  if (!started) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void checkConnectivity(), ms);
}

/** Starts watching the connection (idempotent). The POS calls this once when it mounts. */
export function startConnectivityMonitor() {
  if (started || typeof window === "undefined") return;
  started = true;
  void kvGet<number>("offlineSince").then((saved) => {
    if (saved && state.offlineSince === null) setState({ offlineSince: saved });
  });
  window.addEventListener("online", () => void checkConnectivity());
  window.addEventListener("offline", () => void markOffline());
  void checkConnectivity();
}

/** Days of offline billing left, or null while the device has been offline for less than 5 days. */
export function offlineDaysLeft(status: OfflineStatus, now = Date.now()): number | null {
  if (status.online || status.offlineSince === null) return null;
  const elapsed = now - status.offlineSince;
  if (elapsed < WARN_AFTER_MS) return null;
  return Math.max(0, Math.ceil((MAX_OFFLINE_MS - elapsed) / (24 * 60 * 60 * 1000)));
}

/** Offline billing stops once the device has been cut off for the full allowance. */
export function offlineBillingExpired(status: OfflineStatus, now = Date.now()): boolean {
  return !status.online && status.offlineSince !== null && now - status.offlineSince >= MAX_OFFLINE_MS;
}
