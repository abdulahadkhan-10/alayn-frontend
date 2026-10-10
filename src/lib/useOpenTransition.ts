"use client";

import { useEffect, useState } from "react";

type Phase = "closed" | "entering" | "open" | "settled" | "closing";

function readMs(name: string, fallback: number) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
}

/**
 * Drives the transitions.dev open/close pattern (styles/transitions.css):
 * keeps the element mounted while it animates out, so callers render on
 * `mounted` instead of `isOpen` and put `stateClass` on the animated element.
 * `is-settled` is added once the open transition has finished.
 */
export function useOpenTransition(
  isOpen: boolean,
  { openVar, closeVar }: { openVar: string; closeVar: string },
) {
  const [phase, setPhase] = useState<Phase>(isOpen ? "entering" : "closed");
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    setPhase(isOpen ? "entering" : phase === "closed" ? "closed" : "closing");
  }

  useEffect(() => {
    if (phase === "entering") {
      // Two frames so the pre-open scale is painted before .is-open lands.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setPhase("open"));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    if (phase === "open") {
      const t = setTimeout(() => setPhase("settled"), readMs(openVar, 250));
      return () => clearTimeout(t);
    }
    if (phase === "closing") {
      const t = setTimeout(() => setPhase("closed"), readMs(closeVar, 150));
      return () => clearTimeout(t);
    }
  }, [phase, openVar, closeVar]);

  const stateClass =
    phase === "open" ? "is-open"
    : phase === "settled" ? "is-open is-settled"
    : phase === "closing" ? "is-closing"
    : "";

  return { mounted: phase !== "closed", stateClass };
}
