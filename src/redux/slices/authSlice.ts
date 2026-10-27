import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { checkSession, type AuthUser } from "@/lib/authSession";

/**
 * Who is signed in, as confirmed by the server.
 *
 *   unknown          fresh page load: nobody has asked the server yet. Protected pages show a loader.
 *   authenticated    the server confirmed a live session. Protected pages render.
 *   unauthenticated  the server said there is no session (or it ended). Protected pages redirect.
 *
 * Nothing here is trusted from localStorage: a page load always starts at "unknown" and only
 * becomes "authenticated" after /auth/me succeeds. The user object is kept in memory only.
 */
export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

export type SessionEndReason = "logout" | "expired" | "other-tab" | "admin-account";

export interface AuthState {
    status: AuthStatus;
    // Typed loosely on purpose: the app reads many optional profile fields off it (business,
    // subscription, ...) and the server owns that shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any | null;
    /** Mirrors status === "authenticated"; kept because much of the app reads it. */
    isAuthenticated: boolean;
    /** A check against the server is running right now. */
    verifying: boolean;
    /** The last check could not reach a working server. This is NOT a sign-out. */
    verifyFailed: boolean;
    lastVerifiedAt: number | null;
    endedReason: SessionEndReason | null;
}

const initialState: AuthState = {
    status: "unknown",
    user: null,
    isAuthenticated: false,
    verifying: false,
    verifyFailed: false,
    lastVerifiedAt: null,
    endedReason: null,
};

/** How long a confirmation stays fresh before pages quietly ask again. */
export const SESSION_FRESH_MS = 60_000;

/**
 * Asks the server whether the session is alive and updates the state. Only one check runs at a
 * time. A network error or 5xx never signs anyone out; only a definite "no" does.
 */
export const verifySession = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
    "auth/verifySession",
    async (_arg, { dispatch }) => {
        const result = await checkSession();
        if (result.kind === "ok") {
            dispatch(sessionVerified(result.user));
        } else if (result.kind === "unauthenticated") {
            dispatch(logout("expired"));
        } else {
            dispatch(sessionCheckFailed());
        }
    },
    {
        condition: (_arg, { getState }) => !getState().auth.verifying,
    }
);

function applyVerified(state: AuthState, user: AuthUser, at: number) {
    // The restaurant app is not for platform administrators: they use the admin console
    if (user?.role === "SUPER_ADMIN") {
        state.status = "unauthenticated";
        state.user = null;
        state.isAuthenticated = false;
        state.endedReason = "admin-account";
        state.lastVerifiedAt = null;
        return;
    }
    state.status = "authenticated";
    state.user = user;
    state.isAuthenticated = true;
    state.verifyFailed = false;
    state.endedReason = null;
    state.lastVerifiedAt = at;
}

function applyEnded(state: AuthState, reason: SessionEndReason) {
    state.status = "unauthenticated";
    state.user = null;
    state.isAuthenticated = false;
    state.lastVerifiedAt = null;
    state.verifyFailed = false;
    state.endedReason = reason;
}

const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers: {
        /** The server confirmed this user (from /auth/me). */
        sessionVerified: {
            reducer: (state, action: PayloadAction<{ user: AuthUser; at: number }>) => {
                applyVerified(state, action.payload.user, action.payload.at);
            },
            prepare: (user: AuthUser) => ({ payload: { user, at: Date.now() } }),
        },

        /** Sign-in succeeded, or the profile was updated. Accepts the user or { user }. */
        setCredentials: {
            reducer: (state, action: PayloadAction<{ user: AuthUser; at: number }>) => {
                applyVerified(state, action.payload.user, action.payload.at);
            },
            prepare: (payload: AuthUser | { user: AuthUser }) => ({
                payload: { user: ("user" in payload && payload.user ? payload.user : payload) as AuthUser, at: Date.now() },
            }),
        },

        /** The check could not reach the server. Keeps whatever we knew. */
        sessionCheckFailed: (state) => {
            state.verifyFailed = true;
        },

        /**
         * The POS was reopened with no internet: carry on as the person last signed in on this device
         * (from the offline copy, at most 7 days old) so billing can continue. lastVerifiedAt stays null,
         * so the guard keeps asking the server, and the real answer replaces this as soon as it arrives:
         * a definite "no" signs them out as usual.
         */
        offlineSessionResumed: (state, action: PayloadAction<AuthUser>) => {
            if (state.status !== "unknown") return;
            state.status = "authenticated";
            state.user = action.payload;
            state.isAuthenticated = true;
            state.endedReason = null;
        },

        /** This tab ends the session (sign-out or confirmed expiry). Also announced to other tabs. */
        logout: {
            reducer: (state, action: PayloadAction<SessionEndReason>) => {
                applyEnded(state, action.payload);
            },
            prepare: (reason: SessionEndReason = "logout") => ({ payload: reason }),
        },

        /** Another tab ended the session. Same result, but not announced again. */
        sessionEnded: (state, action: PayloadAction<SessionEndReason>) => {
            applyEnded(state, action.payload);
        },

        /** Another tab signed in: forget "signed out" so the guards ask the server again. */
        sessionStale: (state) => {
            if (state.status !== "authenticated") {
                state.status = "unknown";
                state.endedReason = null;
            }
            state.lastVerifiedAt = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(verifySession.pending, (state) => {
                state.verifying = true;
                state.verifyFailed = false;
            })
            .addCase(verifySession.fulfilled, (state) => {
                state.verifying = false;
            })
            .addCase(verifySession.rejected, (state) => {
                state.verifying = false;
            });
    },
});

export const { sessionVerified, setCredentials, sessionCheckFailed, offlineSessionResumed, logout, sessionEnded, sessionStale } = authSlice.actions;

export default authSlice.reducer;
