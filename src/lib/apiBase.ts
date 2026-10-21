// One place that decides where the API lives, shared by the Redux client, the fetch helpers and
// the session code (so none of them can drift apart).

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const API_VERSION = "v1";
export const API_BASE_DOMAIN = RAW_URL.replace(/\/$/, "").replace(/\/api\/v\d+$/, "");
export const API_BASE_URL = `${API_BASE_DOMAIN}/api/${API_VERSION}`;

/** The outlet the person is working in (what every request sends as x-outlet-id), or null. */
export function activeOutletId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("alayn_active_branch_id") || null;
  } catch {
    return null;
  }
}
