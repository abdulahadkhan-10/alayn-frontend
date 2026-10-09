"use client";

import { FieldScene } from "../motion/GlobalField";
import { Assemble } from "../motion/primitives";

export default function CalmScene() {
  return (
    <FieldScene
      id="calm"
      domId="scene-calm"
      chaos={0}
      sync={0.15}
      presence={0.12}
      className="landing-section"
      style={{ background: "var(--cream)", paddingTop: "40px", paddingBottom: "120px", display: "flex", alignItems: "center" }}
      ariaLabel="Calm"
    >
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)", lineHeight: 1.4, color: "var(--espresso)", opacity: 0.85, marginBottom: "20px" }}>
          See the day&apos;s orders and revenue before you lock up.
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px 32px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--muted)", margin: 0 }}>
            Completed orders and revenue for each outlet
          </p>
          <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--muted)", margin: 0 }}>
            Stock, staff and waste on the same login
          </p>
        </div>
      </div>
    </FieldScene>
  );
}
