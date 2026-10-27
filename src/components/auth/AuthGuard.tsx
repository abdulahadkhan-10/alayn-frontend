"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { SESSION_FRESH_MS, offlineSessionResumed, verifySession } from "@/redux/slices/authSlice";
import { loadOfflinePack } from "@/lib/offline/offlinePack";
import { loginUrlFor } from "@/lib/authRedirect";
import AuthLoader from "@/components/auth/AuthLoader";

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * Billing pages only: if the server can't be reached, open as the person last signed in on this
   * device (saved for offline billing, at most 7 days old) instead of waiting on the loader.
   */
  allowOffline?: boolean;
}

// If the server cannot be reached, keep trying with a growing pause instead of signing anyone out.
const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000];

/**
 * Protects a page. It renders the page ONLY when the server has confirmed, in this page load, that
 * there is a live session. Until then it shows the brand loader:
 *
 *   - Every full page load / refresh starts "unknown", so the server is always asked first.
 *   - Moving between pages inside the app reuses a confirmation younger than a minute and quietly
 *     re-checks in the background when it is older.
 *   - A definite "no" (no cookie, expired, revoked, account disabled, signed out in another tab)
 *     sends the person to /login, remembering where they were.
 *   - A network error or server hiccup is NOT a "no": the page stays on the loader, retries, and
 *     never throws a signed-in person out.
 *
 * The saved/cached user is never used to decide anything, so a stale browser can't show protected
 * pages, and a valid session can't be bounced to /login by leftover local data. The one exception
 * is `allowOffline` (the POS): with no server at all, it may resume from the offline-billing copy
 * so a till reopened during an outage can keep billing, and the server's answer still wins later.
 */
export default function AuthGuard({ children, allowOffline = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const status = useAppSelector((s) => s.auth.status);
  const verifying = useAppSelector((s) => s.auth.verifying);
  const verifyFailed = useAppSelector((s) => s.auth.verifyFailed);
  const lastVerifiedAt = useAppSelector((s) => s.auth.lastVerifiedAt);
  const retryCount = useRef(0);

  // 1. Ask the server on mount, and again whenever the last confirmation has gone stale
  useEffect(() => {
    if (status === "unauthenticated") return;
    const stale = lastVerifiedAt === null || Date.now() - lastVerifiedAt > SESSION_FRESH_MS;
    if (stale) void dispatch(verifySession());
  }, [status, lastVerifiedAt, dispatch]);

  // 2. A definite "signed out": go to /login and come back here afterwards
  useEffect(() => {
    if (status !== "unauthenticated") return;
    const here = typeof window !== "undefined" ? `${pathname}${window.location.search}` : pathname;
    router.replace(loginUrlFor(here));
  }, [status, pathname, router]);

  // 3. Server unreachable: retry quietly, backing off
  useEffect(() => {
    if (status === "unauthenticated") return;
    if (!verifyFailed || verifying) return;
    const delay = RETRY_DELAYS_MS[Math.min(retryCount.current, RETRY_DELAYS_MS.length - 1)];
    const timer = setTimeout(() => {
      retryCount.current += 1;
      void dispatch(verifySession());
    }, delay);
    return () => clearTimeout(timer);
  }, [status, verifyFailed, verifying, dispatch]);

  useEffect(() => {
    if (lastVerifiedAt !== null) retryCount.current = 0;
  }, [lastVerifiedAt]);

  // 4. Offline-capable page and no server: resume from the saved offline copy, if this device has one
  useEffect(() => {
    if (!allowOffline || status !== "unknown" || !verifyFailed) return;
    let cancelled = false;
    void loadOfflinePack().then((pack) => {
      if (!cancelled && pack?.user) dispatch(offlineSessionResumed(pack.user));
    });
    return () => {
      cancelled = true;
    };
  }, [allowOffline, status, verifyFailed, dispatch]);

  const retryNow = useCallback(() => {
    retryCount.current = 0;
    void dispatch(verifySession());
  }, [dispatch]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  if (status === "unauthenticated") {
    return <AuthLoader label="Redirecting you to sign in" />;
  }

  // "unknown": still waiting on the server (or it could not be reached)
  if (verifyFailed && !verifying) {
    return <AuthLoader unreachable={{ onRetry: retryNow }} />;
  }
  if (verifyFailed && verifying) {
    return <AuthLoader unreachable={{ onRetry: retryNow, retrying: true }} />;
  }
  return <AuthLoader label="Checking your session" />;
}
