// The public pages render without the Redux provider so anonymous visitors
// don't download the store, RTK Query and the API slices. The landing nav
// only needs to know who is signed in and how to sign out, so it reads the
// same localStorage entry the auth slice starts from, and loads the store
// only when someone actually logs out.

export interface LandingUser {
  name?: string;
  email?: string;
  role?: string;
}

// Mirrors getInitialUser in src/redux/slices/authSlice.ts.
export function readStoredUser(): LandingUser | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem("auth_user");
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (parsed?.role === "SUPER_ADMIN") return null;
    return parsed;
  } catch {
    return null;
  }
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
  }
}
