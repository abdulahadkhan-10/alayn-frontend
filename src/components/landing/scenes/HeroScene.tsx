"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";
import { Assemble, useMagnetic, springSnappy } from "../motion/primitives";

/**
 * Hero for independent restaurants, cafés and cloud kitchens running on
 * notebooks, WhatsApp and memory — matches the vertical scope in
 * VerticalsScene further down the page (restaurants/cafés/QSR/cloud
 * kitchens/bakeries/hotel dining), not narrowed to cafés specifically. Not
 * a shipped screenshot yet, so the product surface below is a single,
 * clearly-scoped mock: swap it for a real screenshot once the pilot build
 * exists. Background is a CSS-only aurora (see .hero-aurora in
 * globals.css) — transform-only animation, no canvas, no WebGL, no
 * per-pixel cost.
 */

const SNAPSHOT = [
  { label: "Orders", value: "128", detail: "synced today", state: "ok" as const },
  { label: "Stock", value: "Low", detail: "1 item flagged before it runs out", state: "attention" as const },
  { label: "Staff", value: "6", detail: "on shift now", state: "ok" as const },
  { label: "Waste", value: "₹340", detail: "tracked this week", state: "ok" as const },
];

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
  // The syncing row rotates so the panel reads as live without any element
  // actually moving — cheapest possible sense of activity.
  const [syncing, setSyncing] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSyncing((p) => (p + 1) % SNAPSHOT.length), 2400);
    return () => clearInterval(t);
  }, []);

  // The alert card appears a beat after the panel, then stays — it's the
  // proof of the "you always know what needs you" claim.
  const [showAlert, setShowAlert] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowAlert(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <FieldScene
      id="boot"
      domId="scene-boot"
      chaos={0}
      sync={0.25}
      presence={0.25}
      className="hero-section py-20 sm:py-32 px-4 sm:px-6"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left — the pitch */}
          <div className="lg:col-span-6">
            <Assemble
              as="span"
              style={{
                display: "inline-block",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--amber)",
                marginBottom: "18px",
              }}
            >
              For Restaurants, Cafés &amp; Cloud Kitchens
            </Assemble>

            <Assemble
              as="h1"
              delay={0.06}
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontSize: "clamp(2rem, 6.5vw, 4.2rem)",
                lineHeight: 1.08,
                fontWeight: 800,
                color: "var(--espresso)",
                letterSpacing: "-0.03em",
                marginBottom: "24px",
              }}
            >
              <span className="sr-only">Alayn AI — </span>
              The Intelligent Operating System
              <br />
              <em style={{ fontStyle: "italic", color: "var(--amber)", fontWeight: 400 }}>
                for Hospitality.
              </em>
            </Assemble>

            <Assemble
              as="p"
              delay={0.12}
              style={{
                fontSize: "clamp(1rem, 2vw, 1.1875rem)",
                lineHeight: 1.65,
                color: "var(--muted)",
                maxWidth: "520px",
                marginBottom: "40px",
              }}
            >
              Orders, inventory, staffing and operations—unified in one intelligent platform with real-time visibility across every location. Built for the standards of modern hospitality, wherever your business grows.
            </Assemble>

            <Assemble
              as="div"
              delay={0.18}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 mb-10 sm:mb-8"
            >
              <MagneticLink href="/signup" id="cta-hero" className="btn-primary w-full sm:w-auto text-center justify-center">
                Book a Demonstration
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticLink>

              <a
                href="#how-it-works"
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
                Explore the Platform
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Assemble>

            <Assemble as="p" delay={0.24} className="hidden sm:block" style={{ fontSize: "0.8125rem", color: "var(--muted)", opacity: 0.75, margin: 0 }}>
              We&apos;re introducing Alayn AI to a select group of forward-thinking organisations. Arrange a demonstration to discover how intelligent automation can transform your operations.
            </Assemble>
          </div>

          {/* Right — Product Showcase with Laptop and Overlapping Mobile Phone Mockup Containers */}
          <Assemble as="div" delay={0.16} className="lg:col-span-6 flex justify-center w-full mt-6 lg:mt-0">
            <div style={{ position: "relative", width: "100%", maxWidth: "720px", paddingBottom: "36px", paddingTop: "12px" }}>
              
              {/* LAPTOP / BROWSER CONTAINER MOCKUP */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#0f172a",
                  border: "1px solid rgba(15, 23, 42, 0.12)",
                  boxShadow: "0 25px 65px -12px rgba(15, 23, 42, 0.25), 0 4px 16px rgba(15, 23, 42, 0.12)",
                  width: "100%",
                }}
              >
                {/* Laptop / Browser Chrome Header */}
                <div
                  style={{
                    height: "36px",
                    background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    gap: "8px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  {/* Window action dots */}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
                  </div>

                  {/* Browser address bar pill */}
                  <div
                    style={{
                      margin: "0 auto",
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "6px",
                      padding: "3px 16px",
                      fontSize: "0.6875rem",
                      color: "rgba(255, 255, 255, 0.65)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    alayn.com/dashboard
                  </div>
                </div>

                {/* Laptop Screen Content (Website Preview Image) */}
                <div style={{ position: "relative", width: "100%", backgroundColor: "#f8fafc", overflow: "hidden" }}>
                  <Image
                    src="/websitepreview.png"
                    alt="Alayn Web Dashboard Interface"
                    width={1440}
                    height={900}
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 720px"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      objectFit: "cover",
                      objectPosition: "top",
                    }}
                  />
                </div>
              </motion.div>

              {/* MOBILE PHONE MOCKUP (IMAGE ALREADY INCLUDES PHONE FRAME) */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.3 },
                  scale: { duration: 0.8, delay: 0.3 },
                  y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }
                }}
                className="hero-phone-mockup"
                style={{
                  position: "absolute",
                  bottom: "-50px",
                  left: "-15px",
                  width: "clamp(160px, 32%, 225px)",
                  zIndex: 20,
                  filter: "drop-shadow(0 20px 35px rgba(15, 23, 42, 0.35))",
                }}
              >
                <Image
                  src="/screencapture.png"
                  alt="Alayn Mobile App Interface"
                  width={393}
                  height={799}
                  priority
                  sizes="(max-width: 768px) 160px, 225px"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </motion.div>

              {/* Floating Alert / Live Sync Badge */}
              {/* <AnimatePresence>
                {showAlert && (
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 160, damping: 18 }}
                    style={{
                      position: "absolute",
                      top: "-14px",
                      right: "-12px",
                      background: "rgba(15, 23, 42, 0.92)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      boxShadow: "0 16px 36px rgba(0,0,0,0.25)",
                      zIndex: 25,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#10b981",
                        boxShadow: "0 0 10px #10b981",
                      }}
                    />
                    <div>
                      <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.03em" }}>
                        Live POS &amp; Inventory Sync
                      </div>
                      <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.7)" }}>
                        Multi-outlet telemetry active
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence> */}

            </div>
          </Assemble>

          {/* Mobile-only paragraph below the fold */}
          <div className="sm:hidden mt-8 px-2 text-center w-full max-w-[320px] mx-auto">
            <Assemble as="p" delay={0.4} style={{ fontSize: "0.8125rem", color: "var(--muted)", opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
              We&apos;re introducing Alayn AI to a select group of forward-thinking organisations. Arrange a demonstration to discover how intelligent automation can transform your operations.
            </Assemble>
          </div>
        </div>
      </div>
    </FieldScene>
  );
}
