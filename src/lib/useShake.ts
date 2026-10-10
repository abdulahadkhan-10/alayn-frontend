"use client";

import { useEffect, useRef } from "react";

/**
 * Replays the transitions.dev error shake (`.t-input.is-shaking`) on the
 * returned ref's element every time `trigger` changes to a truthy value.
 * Keep the element's className static so React never strips `.is-shaking`.
 */
export function useShake<T extends HTMLElement>(trigger: unknown) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !trigger) return;
    el.classList.remove("is-shaking");
    void el.offsetWidth; // force reflow so the animation restarts
    el.classList.add("is-shaking");
    const done = () => el.classList.remove("is-shaking");
    el.addEventListener("animationend", done, { once: true });
    return () => el.removeEventListener("animationend", done);
  }, [trigger]);

  return ref;
}
