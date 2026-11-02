import { useCallback, useRef } from "react";

/**
 * One-time keys for "create" requests, so a double-click, an Enter pressed twice, or a click while
 * the form is closing can't create the same thing twice: the backend sees the same key again and
 * returns what it already created.
 *
 * The same payload gets the same key for as long as the form is open. Change the payload (another
 * supplier, a different quantity) and it gets a new key, so a genuinely different order is never
 * mistaken for a repeat. Closing and reopening the form starts fresh.
 *
 *   const keyFor = useRequestKeys();
 *   await createPO({ ...payload, clientRequestId: keyFor(payload) });
 */
export function useRequestKeys() {
  const keys = useRef(new Map<string, string>());
  return useCallback((payload: unknown): string => {
    const signature = JSON.stringify(payload);
    let key = keys.current.get(signature);
    if (!key) {
      key = crypto.randomUUID();
      keys.current.set(signature, key);
    }
    return key;
  }, []);
}
