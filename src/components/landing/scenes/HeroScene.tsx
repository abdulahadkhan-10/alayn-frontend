"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";
import { Assemble, useMagnetic, springSnappy } from "../motion/primitives";
import { introHoldSeconds } from "../introTiming";
import { Phone, Tablet } from "../devices/DeviceFrames";

/**
 * Hero: the pitch on the left; on the right the live vector Overview dashboard
 * framed inside a precision-machined Space Black tablet and Black Titanium
 * phone (devices/DeviceFrames.tsx). Drawn in pure inline SVG with zero raster
 * bitmaps or 3D perspective skew so every glyph, hairline, and hardware bevel
 * stays razor-sharp at any zoom level.
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

/** Clears CSS transform once settled so trackpad pinch-zoom re-rasterizes SVG vectors natively */
const clearIdentityTransform = (_: unknown, generated: string) => {
  if (
    !generated ||
    generated === "none" ||
    generated === "translateY(0px)" ||
    generated === "translate3d(0px, 0px, 0px)"
  ) {
    return "none";
  }
  return generated;
};

export default function HeroScene() {
  const [introHold] = useState(introHoldSeconds);
  const reduceMotion = useReducedMotion();

  return (
    <FieldScene
      id="boot"
      domId="scene-boot"
      chaos={0}
      sync={0.25}
      presence={0.25}
      className="hero-section pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-32 lg:pb-20 px-4 sm:px-6 lg:px-8"
      ariaLabel="Alayn"
      style={{
        background: "#FFFFFF",
        minHeight: "100dvh",
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

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-10 items-center">
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

            <Assemble
              as="p"
              delay={0.12}
              visibleOnLoad
              style={{
                fontSize: "clamp(1rem, 2vw, 1.1875rem)",
                lineHeight: 1.65,
                color: "var(--muted)",
                maxWidth: "520px",
                marginBottom: "40px",
              }}
            >
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

          {/* Right — pure-vector Tablet + Phone studio lockup */}
          <div className="lg:col-span-7 w-full mt-6 lg:mt-0 xl:-mr-4 2xl:-mr-10">
            <div className="hero-stage">
              <motion.div
                className="hero-tablet-wrap"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transformTemplate={clearIdentityTransform}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 + introHold }}
              >
                <Tablet />
              </motion.div>

              <motion.div
                className="hero-phone-wrap"
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transformTemplate={clearIdentityTransform}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.24 + introHold }}
              >
                <Phone />
              </motion.div>
            </div>
          </div>

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
