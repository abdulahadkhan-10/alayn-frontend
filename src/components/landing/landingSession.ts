// The public pages render without the Redux provider so anonymous visitors don't download the
// store, RTK Query and the API slices. The landing nav only needs to know who is signed in and how
// to sign out.
//
// It keeps a small DISPLAY HINT (name, email, role: nothing secret, no tokens) so the nav can draw
// the signed-in menu instantly. The hint never grants access to anything: it is re-checked against
// the server as soon as the page loads (see verifyStoredUser), and protected pages ignore it and
// ask the server themselves.

import { checkSession } from "@/lib/authSession";

export interface LandingUser {
  name?: string;
  email?: string;
  role?: string;
}

const HINT_KEY = "alayn_user_hint";
// Keys written by older versions of the app. They held the whole user object and are removed.
const LEGACY_KEYS = ["auth_user", "alayn_access_token", "alayn_refresh_token"];

export function writeUserHint(user: LandingUser | null | undefined): void {
  if (typeof window === "undefined" || !user) return;
  try {
    const hint: LandingUser = { name: user.name, email: user.email, role: user.role };
    localStorage.setItem(HINT_KEY, JSON.stringify(hint));
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
  } catch {
    /* storage unavailable */
  }
}

export function clearUserHint(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HINT_KEY);
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
  } catch {
    /* storage unavailable */
  }
}

export function readStoredUser(): LandingUser | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(HINT_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (!parsed || parsed.role === "SUPER_ADMIN") return null;
    return { name: parsed.name, email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

/**
 * Confirms the hint with the server. Returns the confirmed user, or null (and forgets the hint)
 * if the session is gone. A network hiccup leaves the hint alone.
 */
export async function verifyStoredUser(): Promise<LandingUser | null | "unknown"> {
  const result = await checkSession();
  if (result.kind === "ok") {
    if (result.user?.role === "SUPER_ADMIN") {
      clearUserHint();
      return null;
    }
    writeUserHint(result.user);
    return { name: result.user?.name, email: result.user?.email, role: result.user?.role };
  }
  if (result.kind === "unauthenticated") {
    clearUserHint();
    return null;
  }
  return "unknown";
}

export async function logoutFromLanding(): Promise<void> {
  const [{ store }, { baseApi }, { logout }, { authApi }] = await Promise.all([
    import("@/redux/store/store"),
    import("@/redux/store/baseApi"),
    import("@/redux/slices/authSlice"),
    import("@/redux/slices/authApiSlice"),
  ]);
  try {
    await store.dispatch(authApi.endpoints.logout.initiate(undefined)).unwrap();
  } catch {
    // Clear the local session even if the server call fails.
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    store.dispatch(logout());
    clearUserHint();
  }
}
