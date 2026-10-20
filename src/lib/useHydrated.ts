import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False while rendering on the server and during the browser's first (hydration) render, true after.
 * Lets a form keep its submit button disabled until React has attached its handlers.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
