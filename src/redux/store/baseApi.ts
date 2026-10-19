import { createApi, fetchBaseQuery, BaseQueryFn, BaseQueryApi, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL, API_VERSION } from "@/lib/apiBase";
import { refreshSession } from "@/lib/authSession";
import { verifySession, type AuthState } from "../slices/authSlice";

export { API_VERSION };
export const BASE_URL = API_BASE_URL;

/** Plain action (no import of authSlice, which would be circular): "the login is definitely over". */
const sessionExpiredAction = () => ({ type: "auth/logout", payload: "expired" });

/** Normalizes endpoint paths by stripping any redundant leading /api/vX or /api/v1 */
const normalizePath = (url: string): string => {
    const cleaned = url.replace(/^\/?(api\/v\d+\/)+/, "").replace(/^\/+/, "");
    return `/${cleaned}`;
};

const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
        headers.set("x-portal", "tenant");
        if (typeof window !== "undefined") {
            const outletId = localStorage.getItem("alayn_active_branch_id");
            if (outletId && !headers.has("x-outlet-id")) {
                headers.set("x-outlet-id", outletId);
            }
        }
        return headers;
    },
});

/** Sign-in, sign-out and refresh calls manage the session themselves; a 401 there is not "expired". */
const isAuthEndpoint = (url: string) => /\/auth\/(login|logout|refresh|register|forgot-password|verify-reset-otp|reset-password)\b/.test(url);

type SessionDecision = "authenticated" | "unauthenticated" | "unavailable";

/**
 * Data requests must not leave the browser until the server has said who is signed in. Pages run
 * their data hooks in the same component that renders <AuthGuard>, so without this a page load
 * would fire requests (with nobody confirmed, even with placeholder demo outlets) before the guard
 * had decided anything.
 *
 *   unknown          wait for the session check (starting it if nobody has)
 *   authenticated    go
 *   unauthenticated  refuse right here: nothing is sent
 */
async function waitForSession(api: BaseQueryApi): Promise<SessionDecision> {
    const giveUpAt = Date.now() + 20_000;
    for (;;) {
        const auth = (api.getState() as { auth: AuthState }).auth;
        if (auth.status === "authenticated") return "authenticated";
        if (auth.status === "unauthenticated") return "unauthenticated";
        // Status is unknown. Make sure a check is running; if the server is unreachable the guard
        // keeps retrying, so just keep waiting (up to a limit).
        if (!auth.verifying && !auth.verifyFailed) void api.dispatch(verifySession());
        if (Date.now() > giveUpAt) return "unavailable";
        await new Promise((resolve) => setTimeout(resolve, 40));
    }
}

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    // Normalize string or FetchArgs URL to prevent double /api/v1
    let normalizedArgs: string | FetchArgs = args;
    if (typeof args === "string") {
        normalizedArgs = normalizePath(args);
    } else if (args && typeof args === "object" && args.url) {
        normalizedArgs = { ...args, url: normalizePath(args.url) };
    }

    const firstUrl = typeof normalizedArgs === "string" ? normalizedArgs : normalizedArgs.url;
    if (!isAuthEndpoint(firstUrl)) {
        const decision = await waitForSession(api);
        if (decision === "unauthenticated") {
            return { error: { status: 401, data: { success: false, error: { code: "NOT_SIGNED_IN", message: "Please sign in to continue." } } } };
        }
        if (decision === "unavailable") {
            return { error: { status: "FETCH_ERROR", error: "Could not confirm your session. Check your connection and try again." } };
        }
    }

    let result = await baseQuery(normalizedArgs, api, extraOptions);

    if (result.error?.status === 401) {
        const urlStr = typeof normalizedArgs === "string" ? normalizedArgs : normalizedArgs.url;
        if (isAuthEndpoint(urlStr)) return result;

        // The 15-minute access cookie lapsed. Renew it ONCE for everyone who is waiting (a single
        // shared refresh, so parallel requests never race each other), then repeat this request.
        const refreshed = await refreshSession();

        if (refreshed.ok) {
            result = await baseQuery(normalizedArgs, api, extraOptions);
            // Renewed but still refused (account disabled, session revoked): the login is over
            if (result.error?.status === 401) api.dispatch(sessionExpiredAction());
        } else if (refreshed.definitive) {
            api.dispatch(sessionExpiredAction());
        }
        // Not definitive (offline, server error, rate limited): hand back the original error and
        // leave the person signed in. They can retry; nothing is lost.
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: "api",

    baseQuery: baseQueryWithReauth,

    // Caching configuration: Keep cached data in Redux store for 5 minutes (300s)
    keepUnusedDataFor: 300,
    // Store-first caching: Serve cached Redux store data immediately (0ms) without refetching on mount/tab change
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,

    tagTypes: [
        "Auth",
        "Employee",
        "Outlet",
        "Inventory",
        "Attendance",
        "Dashboard",
        "Shift",
        "Leave",
        "PurchaseOrder",
        "Supplier",
        "Waste",
        "MenuItems",
        "MenuCategories",
        "Orders",
        "KitchenTickets",
        "Roster",
        "Holidays",
        "Tickets",
        "StaffQueries",
        "Notifications",
        "Subscription",
        "RestaurantCoupons",
        "ModifierGroups",
    ],

    endpoints: () => ({}),
});
