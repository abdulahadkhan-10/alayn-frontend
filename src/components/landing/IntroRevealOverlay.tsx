"use client";

import { useLayoutEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __alaynIntro?: "play";
  }
}

// The animation itself is CSS (src/styles/intro.css). This component only
// removes the overlay: hides it before paint when the inline script in
// IntroReveal didn't ask for it (a client-side navigation to the homepage),
// and drops it from the DOM once the fade-out has finished.
export default function IntroRevealOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    if (window.__alaynIntro !== "play") {
      if (ref.current) ref.current.style.display = "none";
      return;
    }
    delete window.__alaynIntro;
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="alayn-intro"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setVisible(false);
      }}
    >
      <div className="alayn-intro__lockup">
        <div className="alayn-intro__mark">
          <span className="alayn-intro__wipe alayn-intro__wipe--red">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size layers positioned by CSS percentages; next/image adds nothing here */}
            <img src="/brand/loader/stroke-red.png" alt="" draggable={false} />
          </span>
          <span className="alayn-intro__wipe alayn-intro__wipe--navy">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/loader/stroke-navy.png" alt="" draggable={false} />
          </span>
        </div>
        <div className="alayn-intro__word">
          {/* A, L, A, Y, N */}
          {[0, 1, 2, 3, 4].map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={`/brand/loader/letter-${i}.png`} alt="" draggable={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
