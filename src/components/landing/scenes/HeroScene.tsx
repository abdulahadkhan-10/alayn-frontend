"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";
import { Assemble, useMagnetic, springSnappy } from "../motion/primitives";
import { introHoldSeconds } from "../introTiming";
import Image from "next/image";

/**
 * Hero: the pitch on the left; on the right the real dashboard on a tablet
 * and a phone. The devices are drawn in CSS (devices/DeviceFrames.tsx) and
 * baked into images at 4x (see app/dev/hero-devices), because a browser blurs
 * small text when it draws a screenshot at an angle. Background is a CSS-only
 * aurora (see .hero-aurora in globals.css).
 */

function MagneticLink({
  href,
  className,
  id,
  children,
}: {
  href: string;
  className: string;
  id: string;
  children: React.ReactNode;
}) {
  const { ref, x, y } = useMagnetic(0.2);
  return (
    <motion.div style={{ x, y, display: "inline-block" }} transition={springSnappy}>
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} id={id} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

export default function HeroScene() {
  // The mockups below animate on mount rather than through Assemble, so they
  // take the logo reveal's remaining time once, at mount.
  const [introHold] = useState(introHoldSeconds);
  const reduceMotion = useReducedMotion();

  return (
    <FieldScene
      id="boot"
      domId="scene-boot"
      chaos={0}
      sync={0.25}
      presence={0.25}
      className="hero-section pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6"
      ariaLabel="Alayn"
      style={{
        background: "#FFFFFF",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "clip",
      }}
    >
      {/* Aurora wash — three blurred blobs, transform-only animation */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <div className="hero-aurora hero-aurora-a" />
        <div className="hero-aurora hero-aurora-b" />
        <div className="hero-aurora hero-aurora-c" />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left — the pitch */}
          <div className="lg:col-span-5">

            <Assemble
              as="h1"
              delay={0.06}
              visibleOnLoad
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontSize: "clamp(2rem, 5.2vw, 3.7rem)",
                lineHeight: 1.08,
                fontWeight: 800,
                color: "var(--espresso)",
                letterSpacing: "-0.03em",
                marginBottom: "24px",
              }}
            >
              <span className="sr-only">Alayn AI Restaurant Billing Software &amp; POS —{" "}</span>
              The Intelligent Operating System{" "}
              <br />
              <em style={{ fontStyle: "italic", color: "var(--amber)", fontWeight: 400 }}>
                for Hospitality.
              </em>
            </Assemble>

            <Assemble as="p" delay={0.12} visibleOnLoad style={{ fontSize: "clamp(1rem, 2vw, 1.1875rem)", lineHeight: 1.65, color: "var(--muted)", maxWidth: "520px", marginBottom: "40px" }}>
              GST billing, counter &amp; table POS, instant KOTs, kitchen display, FEFO inventory, waste tracking and staff scheduling, in one platform with live visibility across every outlet.
            </Assemble>

            <Assemble
              as="div"
              delay={0.18}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 mb-6 sm:mb-8"
            >
              <MagneticLink href="/contact#demo" id="cta-hero" className="btn-primary w-full sm:w-auto text-center justify-center">
                Book a Demonstration
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticLink>

              <a
                href="/pricing"
                className="justify-center sm:justify-start bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 sm:bg-transparent sm:border-transparent sm:rounded-none sm:px-0 sm:py-0 hover:opacity-100 transition-opacity"
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: "var(--espresso)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: 0.7,
                }}
              >
                See pricing
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Assemble>

            <Assemble as="p" delay={0.24} className="hidden sm:block" style={{ fontSize: "0.8125rem", color: "var(--muted)", margin: 0 }}>
              Book a demonstration and we&apos;ll show you Alayn&apos;s{" "}
              <Link href="/billing-software" className="underline underline-offset-2 hover:text-slate-900">
                restaurant billing software
              </Link>{" "}
              running on your own menu.
            </Assemble>
          </div>

          {/* Right: the dashboard on a tablet, and on a phone standing in front of it.
              Both are real screenshots at real device sizes inside drawn frames
              (devices/DeviceFrames.tsx), tilted toward the headline. The phone
              covers only the tablet's side menu, never a figure. */}
          <Assemble as="div" delay={0.16} className="lg:col-span-7 w-full mt-6 lg:mt-0">
            {/* Both images cover the same box (the device column plus room for the
                shadows), so they stack exactly; the phone floats on its own. */}
            <div className="hero-devices-baked">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: introHold }}
              >
                <Image
                  src="/hero-tablet-3d.webp"
                  alt="Alayn dashboard on a tablet: net sales, orders, average order value, stock wasted and action items"
                  width={1852}
                  height={1416}
                  unoptimized
                  priority
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </motion.div>
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, y: 36 }}
                animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -7, 0] }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.3 + introHold },
                  y: reduceMotion
                    ? { duration: 0.8, delay: 0.3 + introHold }
                    : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.1 + introHold },
                }}
              >
                <Image
                  src="/hero-phone-3d.webp"
                  alt="Alayn dashboard on a phone"
                  width={1852}
                  height={1416}
                  unoptimized
                  priority
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </motion.div>
            </div>
          </Assemble>

          {/* Mobile-only paragraph below the fold */}
          <div className="sm:hidden mt-8 px-2 text-center w-full max-w-[320px] mx-auto">
            <Assemble as="p" delay={0.4} style={{ fontSize: "0.8125rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Book a demonstration and we&apos;ll show you Alayn&apos;s{" "}
              <Link href="/billing-software" className="underline underline-offset-2">
                billing software
              </Link>{" "}
              running on your own menu.
            </Assemble>
          </div>
        </div>
      </div>
    </FieldScene>
  );
}
