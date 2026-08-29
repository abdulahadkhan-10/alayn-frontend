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
        <h2 className="sr-only">Predictable Hospitality Operations</h2>
        <Assemble
          as="p"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
            lineHeight: 1.4,
            color: "var(--espresso)",
            opacity: 0.85,
          }}
        >
          Predictable operations.
          <br />
          Confident decisions.
        </Assemble>
        <div className="sr-only">
          <h3>Zero Manual Reconciliation</h3>
          <h3>Automated Nightly Closeouts</h3>
        </div>
      </div>
    </FieldScene>
  );
}
