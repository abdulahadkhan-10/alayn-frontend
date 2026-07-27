"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";
import { Assemble, useMagnetic, springSnappy } from "../motion/primitives";

function MagneticLink({ href, className, id, children }: { href: string; className: string; id: string; children: React.ReactNode }) {
  const { ref, x, y } = useMagnetic(0.25);
  return (
    <motion.div style={{ x, y }} transition={springSnappy}>
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} id={id} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

export default function WaitingScene() {
  return (
    <FieldScene
      id="waiting"
      domId="scene-waiting"
      chaos={0.02}
      sync={0.35}
      presence={0.45}
      className="landing-section section-dark noise-overlay py-16 sm:py-24"
      style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}
      ariaLabel="Get started"
    >
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center w-full">
        <Assemble
          as="h2"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 6vw, 4rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "var(--cream-light)",
            marginBottom: "20px",
          }}
        >
          The AI Operating System for
          <br />
          <em style={{ fontStyle: "italic", color: "var(--thread)" }}>Modern Business.</em>
        </Assemble>

        <Assemble
          as="p"
          delay={0.1}
          className="text-xs sm:text-lg"
          style={{
            color: "rgba(255, 255, 255, 0.64)",
            lineHeight: 1.65,
            maxWidth: "440px",
            margin: "0 auto 36px",
          }}
        >
          Unify your teams, automate workflows, and accelerate growth—all in one platform.
        </Assemble>

        <Assemble as="div" delay={0.2} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <MagneticLink href="/signup" id="cta-start" className="btn-primary-light w-full sm:w-auto text-center justify-center min-h-[44px]">
            Get Started
          </MagneticLink>
          <Link href="/login" id="cta-login" className="btn-ghost-dark w-full sm:w-auto text-center justify-center min-h-[44px] flex items-center">
            I have an account
          </Link>
        </Assemble>
      </div>
    </FieldScene>
  );
}
