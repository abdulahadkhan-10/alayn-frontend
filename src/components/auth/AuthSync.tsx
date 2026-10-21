"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { SESSION_FRESH_MS, sessionEnded, sessionStale, verifySession } from "@/redux/slices/authSlice";
import { onAuthBroadcast, onSessionExpired } from "@/lib/authSession";
import { clearUserHint } from "@/components/landing/landingSession";

// While the app is open and in view, confirm the session this often.
const BACKGROUND_CHECK_MS = 5 * 60 * 1000;

/**
 * Keeps the sign-in state honest after a page has loaded. Renders nothing.
 *
 *   - Another tab signed out  -> this tab signs out too, immediately.
 *   - Another tab signed in   -> this tab re-asks the server.
 *   - A fetch helper outside Redux hit a dead session -> sign out here.
 *   - Tab comes back into view / network returns / every few minutes -> re-confirm if the last
 *     confirmation is old, so a session revoked elsewhere (password changed, "sign out everywhere",
 *     account disabled) is noticed without a click.
 */
export default function AuthSync() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const lastVerifiedAt = useAppSelector((s) => s.auth.lastVerifiedAt);

  // Latest values for the event handlers below, without re-subscribing on every change
  const latest = useRef({ status, lastVerifiedAt });
  useEffect(() => {
    latest.current = { status, lastVerifiedAt };
  }, [status, lastVerifiedAt]);

  // One-time tidy-up of what older versions left behind (the full user object lived in storage)
  useEffect(() => {
    try {
      for (const k of ["auth_user", "alayn_access_token", "alayn_refresh_token"]) localStorage.removeItem(k);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const offBroadcast = onAuthBroadcast((message) => {
      if (message.type === "logout") {
        dispatch(sessionEnded("other-tab"));
        clearUserHint();
      } else if (message.type === "login") {
        dispatch(sessionStale());
        if (latest.current.status !== "authenticated") void dispatch(verifySession());
      }
    });
    const offExpired = onSessionExpired(() => dispatch(sessionEnded("expired")));
    return () => {
      offBroadcast();
      offExpired();
    };
  }, [dispatch]);

  useEffect(() => {
    const recheckIfStale = () => {
      if (document.visibilityState !== "visible") return;
      const { status: s, lastVerifiedAt: at } = latest.current;
      if (s !== "authenticated") return;
      if (at === null || Date.now() - at > SESSION_FRESH_MS) void dispatch(verifySession());
    };

    document.addEventListener("visibilitychange", recheckIfStale);
    window.addEventListener("online", recheckIfStale);
    const timer = setInterval(recheckIfStale, BACKGROUND_CHECK_MS);
    return () => {
      document.removeEventListener("visibilitychange", recheckIfStale);
      window.removeEventListener("online", recheckIfStale);
      clearInterval(timer);
    };
  }, [dispatch]);

  return null;
}
