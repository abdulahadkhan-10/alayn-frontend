import type { Middleware, UnknownAction } from "@reduxjs/toolkit";
import { baseApi } from "../store/baseApi";
import type { AuthState } from "../slices/authSlice";
import { announceAuth } from "@/lib/authSession";
import { writeUserHint, clearUserHint } from "@/components/landing/landingSession";
import { clearOfflinePack } from "@/lib/offline/offlinePack";

type StateWithAuth = { auth: AuthState };

/**
 * Everything that must happen OUTSIDE the reducers when the sign-in state changes:
 *   - signed out  -> wipe cached API data (so the next person on this device never sees it), forget
 *                    the active branch, and tell the other tabs
 *   - signed in   -> tell the other tabs
 * Reducers stay pure; this is the only place that touches storage or other tabs for auth.
 */
export const authEffectsMiddleware: Middleware<object, StateWithAuth> = (storeApi) => (next) => (action) => {
    const before = storeApi.getState().auth;
    const result = next(action);
    const after = storeApi.getState().auth;

    const type = (action as UnknownAction)?.type;
    if (typeof type !== "string" || !type.startsWith("auth/")) return result;

    const wasIn = before.status === "authenticated";
    const isIn = after.status === "authenticated";

    if (isIn) {
        if (wasIn && before.user?.id && after.user?.id && before.user.id !== after.user.id) {
            try {
                localStorage.removeItem("alayn_active_branch_id");
                localStorage.removeItem("alayn_cached_branches");
            } catch {
                /* storage unavailable */
            }
            void clearOfflinePack();
            storeApi.dispatch(baseApi.util.resetApiState());
        }
        writeUserHint(after.user);
        if ((!wasIn || before.user?.id !== after.user?.id) && type === "auth/setCredentials") announceAuth("login");
    } else if (wasIn) {
        clearUserHint();
        void clearOfflinePack();
        try {
            localStorage.removeItem("alayn_active_branch_id");
            localStorage.removeItem("alayn_cached_branches");
        } catch {
            /* storage unavailable */
        }
        storeApi.dispatch(baseApi.util.resetApiState());
        // Only the tab that ended the session announces it (a sign-out heard from another tab is
        // "auth/sessionEnded" and must not be echoed back).
        if (type === "auth/logout") announceAuth("logout");
    } else if (type === "auth/logout" && before.status !== "unauthenticated") {
        clearUserHint();
    }

    return result;
};
