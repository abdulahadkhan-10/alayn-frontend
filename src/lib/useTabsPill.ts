"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Writes the selected tab's box onto the bar's `.t-tabs-pill` (transitions.dev tabs sliding). */
function movePill(bar: HTMLElement, animate: boolean) {
  const pill = bar.querySelector<HTMLElement>(".t-tabs-pill");
  const tab = bar.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
  if (!pill || !tab) return;

  const apply = () => {
    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.style.width = `${tab.offsetWidth}px`;
    pill.style.top = `${tab.offsetTop}px`;
    pill.style.height = `${tab.offsetHeight}px`;
    pill.style.borderRadius = getComputedStyle(tab).borderRadius;
  };

  if (animate) {
    apply();
    return;
  }
  // Snap without a transition (first paint, resize), then restore it.
  const prev = pill.style.transition;
  pill.style.transition = "none";
  apply();
  void pill.offsetWidth;
  pill.style.transition = prev;
}

/**
 * Slides a `.t-tabs-pill` under the active tab. Put the returned callback ref on
 * the (position: relative) tab bar, mark tabs with role="tab" + aria-selected,
 * and pass the active tab's key so the pill moves when it changes.
 */
export function useTabsPill(activeKey: string) {
  const [bar, setBar] = useState<HTMLElement | null>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    if (!bar) {
      placed.current = false;
      return;
    }
    movePill(bar, placed.current);
    placed.current = true;
  }, [bar, activeKey]);

  useEffect(() => {
    if (!bar) return;
    const observer = new ResizeObserver(() => movePill(bar, false));
    observer.observe(bar);
    return () => observer.disconnect();
  }, [bar]);

  return setBar;
}
