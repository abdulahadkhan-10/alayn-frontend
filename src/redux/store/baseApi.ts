import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const API_VERSION = "v1";
const BASE_DOMAIN = RAW_URL.replace(/\/$/, "").replace(/\/api\/v\d+$/, "");
export const BASE_URL = `${BASE_DOMAIN}/api/${API_VERSION}`;

/** Action creators defined locally to prevent circular dependencies with authSlice */
const setCredentialsAction = (payload: { user: any }) => ({ type: "auth/setCredentials", payload });
const logoutAction = () => ({ type: "auth/logout" });

/** Normalizes endpoint paths by stripping any redundant leading /api/vX or /api/v1 */
const normalizePath = (url: string): string => {
    const cleaned = url.replace(/^\/?(api\/v\d+\/)+/, "").replace(/^\/+/, "");
    return `/${cleaned}`;
};

const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
        if (typeof window !== "undefined") {
            const outletId = localStorage.getItem("alayn_active_branch_id");
            if (outletId && !headers.has("x-outlet-id")) {
                headers.set("x-outlet-id", outletId);
            }
        }
        return headers;
    },
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const subscribeTokenRefresh = (cb: () => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = () => {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
};

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

    let result = await baseQuery(normalizedArgs, api, extraOptions);

    if (result.error && result.error.status === 401) {
        const urlStr = typeof normalizedArgs === "string" ? normalizedArgs : normalizedArgs.url;
        // Don't loop refresh if refresh or login itself returned 401
        if (urlStr.includes("auth/refresh") || urlStr.includes("auth/login")) {
            return result;
        }

        console.info(`[AUTH REFRESH FRONTEND] 401 received for endpoint: ${urlStr}. Triggering token refresh via cookie...`);

        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeTokenRefresh(async () => {
                    resolve(await baseQuery(normalizedArgs, api, extraOptions));
                });
            });
        }

        isRefreshing = true;

        try {
            // Try to get a new access token via HTTP-Only cookie refresh endpoint
            const refreshResult = await baseQuery(
                {
                    url: "/auth/refresh",
                    method: "POST",
                },
                api,
                extraOptions
            );

            if (refreshResult.data) {
                const refreshData = (refreshResult.data as any)?.data || refreshResult.data;
                const user = refreshData?.user;

                console.info(`[AUTH REFRESH FRONTEND SUCCESS] Token refresh succeeded for user: "${user?.name || user?.email || 'Authenticated User'}"`);

                if (user) {
                    api.dispatch(setCredentialsAction({ user }));
                }

                isRefreshing = false;
                onRefreshed();

                // Retry original query with normalized args
                result = await baseQuery(normalizedArgs, api, extraOptions);
            } else {
                console.warn('[AUTH REFRESH FRONTEND FAILED] Token refresh endpoint failed:', refreshResult.error);
                isRefreshing = false;
                refreshSubscribers = [];
                // Refresh failed - log out user
                api.dispatch(logoutAction());
            }
        } catch (err) {
            console.error('[AUTH REFRESH FRONTEND ERROR] Unexpected error during refresh:', err);
            isRefreshing = false;
            refreshSubscribers = [];
            api.dispatch(logoutAction());
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: "api",

    baseQuery: baseQueryWithReauth,

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
    ],

    endpoints: () => ({}),
});