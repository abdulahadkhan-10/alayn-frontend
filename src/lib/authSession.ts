// Session plumbing with no React or Redux in it, so every part of the app (Redux client, fetch
// helpers, the landing page nav) shares ONE behaviour:
//
//   - refreshSession(): one refresh at a time, no matter how many requests got a 401 together.
//   - checkSession(): asks the server "who am I?", renewing the login once if it has lapsed.
//   - announceAuth()/onAuthBroadcast(): tells other open tabs about a sign-in or sign-out.
//
// The browser never reads or stores the tokens: they live in httpOnly cookies the server sets.

import { API_BASE_URL } from "./apiBase";

export type RefreshOutcome =
  | { ok: true }
  // definitive = the server said the login is over (401/403). Otherwise it is only a hiccup
  // (offline, 5xx, rate limited) and the person must NOT be signed out for it.
  | { ok: false; definitive: boolean };

/** The signed-in person as the server describes them (the fields the app relies on). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phoneNo?: string | null;
  createdAt?: string;
  business?: unknown;
  businessOwner?: unknown;
  [key: string]: unknown;
}

export type SessionCheck =
  | { kind: "ok"; user: AuthUser }
  | { kind: "unauthenticated" }
  | { kind: "unavailable" };

const JSON_HEADERS = { "x-portal": "tenant" };

// ─── Refresh (single flight) ────────────────────────────────────────────────────

let inflightRefresh: Promise<RefreshOutcome> | null = null;
let lastRefreshOkAt = 0;
// A refresh that completed this recently already renewed the cookies for everyone waiting.
const REFRESH_REUSE_MS = 2000;

export function refreshSession(): Promise<RefreshOutcome> {
  if (inflightRefresh) return inflightRefresh;
  if (Date.now() - lastRefreshOkAt < REFRESH_REUSE_MS) return Promise.resolve({ ok: true });

  inflightRefresh = (async (): Promise<RefreshOutcome> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: JSON_HEADERS,
      });
      if (res.ok) {
        lastRefreshOkAt = Date.now();
        return { ok: true };
      }
      return { ok: false, definitive: res.status === 401 || res.status === 403 };
    } catch {
      return { ok: false, definitive: false };
    }
  })().finally(() => {
    inflightRefresh = null;
  });

  return inflightRefresh;
}

// ─── Session check (single flight) ──────────────────────────────────────────────

let inflightCheck: Promise<SessionCheck> | null = null;

async function fetchMe(): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
    cache: "no-store",
    headers: JSON_HEADERS,
  });
}

async function runCheck(): Promise<SessionCheck> {
  let res: Response;
  try {
    res = await fetchMe();
  } catch {
    return { kind: "unavailable" };
  }

  if (res.status === 401) {
    // The short-lived access cookie has lapsed: try to renew from the long-lived one, once
    const refreshed = await refreshSession();
    if (!refreshed.ok) return refreshed.definitive ? { kind: "unauthenticated" } : { kind: "unavailable" };
    try {
      res = await fetchMe();
    } catch {
      return { kind: "unavailable" };
    }
    if (res.status === 401) return { kind: "unauthenticated" };
  }

  if (res.ok) {
    try {
      const body = await res.json();
      const data = body?.data ?? body;
      const user = (data?.user ?? data) as AuthUser | undefined;
      if (user && user.id) return { kind: "ok", user };
    } catch {
      /* fall through */
    }
    return { kind: "unavailable" };
  }

  if (res.status === 403) return { kind: "unauthenticated" };
  // 5xx, 429, 503 (auth store down) ...: we do not know, so we must not sign anyone out
  return { kind: "unavailable" };
}

export function checkSession(): Promise<SessionCheck> {
  if (!inflightCheck) {
    inflightCheck = runCheck().finally(() => {
      inflightCheck = null;
    });
  }
  return inflightCheck;
}

// ─── Telling the rest of the app (and other tabs) ───────────────────────────────

const SESSION_EXPIRED_EVENT = "alayn:session-expired";

/** For code outside Redux (fetch helpers) to say "the login is definitely over". */
export function notifySessionExpired(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_EXPIRED_EVENT, cb);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, cb);
}

export type AuthBroadcast = { type: "login" | "logout"; at: number };

const CHANNEL_NAME = "alayn-auth";
const STORAGE_KEY = "alayn_auth_event";
let channel: BroadcastChannel | null | undefined;

function getChannel(): BroadcastChannel | null {
  if (channel !== undefined) return channel;
  try {
    channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
  } catch {
    channel = null;
  }
  return channel;
}

/** Other open tabs hear about a sign-in or sign-out straight away. */
export function announceAuth(type: AuthBroadcast["type"]): void {
  if (typeof window === "undefined") return;
  const message: AuthBroadcast = { type, at: Date.now() };
  const bc = getChannel();
  if (bc) {
    bc.postMessage(message);
    return;
  }
  // Older browsers: the storage event fires in the other tabs
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...message, n: Math.random() }));
  } catch {
    /* storage unavailable */
  }
}

export function onAuthBroadcast(cb: (message: AuthBroadcast) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const bc = getChannel();
  if (bc) {
    const handler = (e: MessageEvent) => {
      if (e.data && (e.data.type === "login" || e.data.type === "logout")) cb(e.data as AuthBroadcast);
    };
    bc.addEventListener("message", handler);
    return () => bc.removeEventListener("message", handler);
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const data = JSON.parse(e.newValue);
      if (data && (data.type === "login" || data.type === "logout")) cb(data as AuthBroadcast);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
