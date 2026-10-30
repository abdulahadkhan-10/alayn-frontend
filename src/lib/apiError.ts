/**
 * The message to show for a failed API call. The backend answers `{ error: { code, message } }`;
 * a request that never reached it is reported as a connection problem instead of `fallback`.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { status?: unknown; data?: { error?: unknown; message?: unknown } } | null;
  if (e?.status === "FETCH_ERROR") {
    return "Can't reach the server. Check your connection and try again.";
  }
  const error = e?.data?.error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (typeof error === "string" && error) return error;
  if (typeof e?.data?.message === "string" && e.data.message) return e.data.message;
  return fallback;
}
