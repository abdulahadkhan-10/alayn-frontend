declare global {
  interface Window {
    /** performance.now() at which the logo reveal starts fading out; set by
        the inline script in IntroReveal when the intro plays. */
    __alaynIntroEnd?: number;
  }
}

// Seconds until the logo reveal (IntroReveal) starts fading out, or 0 when it
// isn't playing. Entrance animations add this to their delay so they play as
// the overlay lifts instead of underneath it.
export function introHoldSeconds(): number {
  if (typeof window === "undefined" || !window.__alaynIntroEnd) return 0;
  return Math.max(0, (window.__alaynIntroEnd - performance.now()) / 1000);
}
