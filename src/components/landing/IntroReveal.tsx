import { preload } from "react-dom";
import "@/styles/intro.css";
import IntroRevealOverlay from "./IntroRevealOverlay";

// Plays the logo reveal over the landing page on the first full page load of
// a session. The overlay sits on top of the already-rendered page rather than
// standing in for it, so crawlers and text extractors still get the real
// content (see the note in src/app/(app)/loading.tsx about the old splash).
//
// This script runs while the HTML is parsed, before the overlay is painted.
// If the intro already played this session, or the visitor prefers reduced
// motion, it hides the overlay through a class on <html> (the root layout
// sets suppressHydrationWarning there). Otherwise it marks the session and
// tells the overlay to play. Client-side navigations never run it, so going
// back to the homepage from another page doesn't replay the intro.
const decideScript = `(function(){var d=document.documentElement,k="alayn-intro-seen";try{if(sessionStorage.getItem(k)||matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro-seen");return}sessionStorage.setItem(k,"1")}catch(e){}window.__alaynIntro="play"})();`;

export default function IntroReveal() {
  // The strokes start animating 80ms in, so fetch them with the HTML rather
  // than when the overlay's <img> tags are reached.
  preload("/brand/loader/stroke-red.png", { as: "image" });
  preload("/brand/loader/stroke-navy.png", { as: "image" });

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decideScript }} />
      <IntroRevealOverlay />
    </>
  );
}
