// Seconds until the logo reveal (IntroReveal) starts fading out, or 0 when it
// isn't playing. Entrance animations add this to their delay so they play as
// the overlay lifts instead of underneath it.
//
// Read from the overlay's own CSS animation rather than a fixed estimate: on a
// slow first load the animation starts later than the HTML arrives, and its
// clock is the one the visitor sees.
export function introHoldSeconds(): number {
  if (typeof document === "undefined") return 0;
  const overlay = document.querySelector<HTMLElement>(".alayn-intro");
  if (!overlay || getComputedStyle(overlay).display === "none") return 0;
  const fadeOut = overlay
    .getAnimations()
    .find((a): a is CSSAnimation => (a as CSSAnimation).animationName === "alayn-intro-out");
  if (!fadeOut) return 0;
  const delay = Number(fadeOut.effect?.getTiming().delay ?? 0);
  const elapsed = Number(fadeOut.currentTime ?? 0);
  return Math.max(0, (delay - elapsed) / 1000);
}
