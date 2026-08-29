"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";
import { useCountUp } from "../motion/primitives";

const BRIEFING_LINES = [
  {
    label: "REVENUE INTELLIGENCE",
    text: "Revenue is trending ahead of forecast, with AI identifying the products and customer behaviours driving growth.",
    color: "#C41E2A", // Brand Crimson
    action: "Promote cold brews on self-checkout screen"
  },
  {
    label: "INVENTORY INTELLIGENCE",
    text: "Predictive inventory monitoring ensures critical stock is replenished before shortages affect service.",
    color: "#E11D48", // Rose Accent
    action: "Approve restocking order (1-click)"
  },
  {
    label: "WORKFORCE INTELLIGENCE",
    text: "AI continuously monitors staffing levels and recommends schedule adjustments to maintain operational efficiency.",
    color: "#38BDF8", // Sky Blue Accent
    action: "Send automated availability invite"
  },
  {
    label: "OPERATIONAL INTELLIGENCE",
    text: "Identify inefficiencies, reduce waste and improve profitability through continuous AI-powered operational analysis.",
    color: "#10B981", // Emerald Green Accent
    action: "Adjust kitchen prep metrics"
  },
];

export default function RunningScene() {
  const [activeLine, setActiveLine] = useState(0);
  const [signalsProcessed, setSignalsProcessed] = useState(148209);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveLine((p) => (p + 1) % BRIEFING_LINES.length);
    }, 4500);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSelectLine = (index: number) => {
    setActiveLine(index);
    startTimer(); // Reset auto-advance countdown on user click
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSignalsProcessed((p) => p + Math.floor(2 + Math.random() * 8));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const displaySignals = useCountUp(signalsProcessed);

  // Read via ref inside the draw loop instead of closing over `activeLine`
  const activeLineRef = useRef(0);
  useEffect(() => {
    activeLineRef.current = activeLine;
  }, [activeLine]);

  // Background visualizer canvas inside card
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = canvas.clientWidth || 300;
    let height = 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let animationFrameId: number = 0;

    const particles = Array.from({ length: 15 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
    }));

    let isIntersecting = false;

    const draw = () => {
      if (!isIntersecting) {
        animationFrameId = 0;
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Draw active line color coordinate connection
      const activeColor = BRIEFING_LINES[activeLineRef.current].color;

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 100) {
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
          }
        }
      }
      ctx.stroke();

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? activeColor : "rgba(255,255,255,0.2)";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting) {
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(draw);
        }
      } else {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      }
    }, { threshold: 0 });

    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <FieldScene
      id="running"
      domId="scene-running"
      chaos={0.03}
      sync={0.5}
      presence={0.55}
      className="landing-section section-dark noise-overlay py-16 sm:py-28"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      ariaLabel="The system runs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Context & Global Pulse */}
          <div className="lg:col-span-6">
            <span style={{
              display: "inline-block",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--amber)",
              marginBottom: "16px",
            }}>
              INTELLIGENT OPERATIONS
            </span>

            <h2 style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 5.5vw, 3.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--cream-light)",
              marginBottom: "20px",
            }}>
              Run your business
              <br />
              <span style={{ fontStyle: "italic", color: "var(--amber)", fontWeight: "400" }}>with confidence.</span>
            </h2>
            <p className="text-xs sm:text-base text-slate-300/80 leading-relaxed max-w-lg mb-8">
              Replace fragmented reports and manual analysis with real-time insights, proactive recommendations and AI-powered decision support—all from a single intelligent platform.
            </p>

            {/* Glowing Tracker Box */}
            <div className="w-full max-w-md p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-xl">
              <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", fontWeight: 700, marginBottom: "4px" }}>
                ACTIVE OPERATIONS
              </span>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)" }}>
                Processing operational insights in real time.
              </p>
              <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-mono), monospace" }}>
                  {displaySignals}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--amber)", fontWeight: 500 }}>
                  AI insights processed every minute
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Briefing Stream */}
          <div className="lg:col-span-6 relative">

            {/* Visualizer Canvas overlaying card container */}
            <div style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "220px",
              height: "220px",
              pointerEvents: "none",
              zIndex: 0,
              opacity: 0.35,
            }}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", zIndex: 1 }}>
              {BRIEFING_LINES.map((line, i) => {
                const isActive = activeLine === i;
                return (
                  <div
                    key={line.label}
                    onClick={() => handleSelectLine(i)}
                    style={{
                      borderRadius: "16px",
                      border: `1px solid ${isActive ? line.color : "rgba(255, 255, 255, 0.08)"}`,
                      backgroundColor: isActive ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.02)",
                      boxShadow: isActive ? `0 12px 32px -8px ${line.color}35` : "0 4px 12px rgba(0,0,0,0.1)",
                      padding: "24px",
                      cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      transition: "border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
                      willChange: "background-color, border-color",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: line.color, margin: 0 }}>
                        {line.label}
                      </h3>
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: line.color,
                          boxShadow: isActive ? `0 0 12px ${line.color}` : "none",
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? "scale(1)" : "scale(0.5)",
                          transition: "opacity 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease",
                        }}
                      />
                    </div>
                    <p style={{ margin: 0, fontSize: "1rem", color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)", lineHeight: 1.5, transition: "color 0.3s ease" }}>
                      {line.text}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: isActive ? "1fr" : "0fr",
                        transition: "grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      <div style={{ overflow: "hidden" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          background: "rgba(255,255,255,0.08)",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "#FFFFFF",
                          border: `1px solid ${line.color}50`,
                          boxShadow: `0 4px 14px ${line.color}20`,
                          marginTop: "16px",
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? "translateY(0)" : "translateY(6px)",
                          transition: "opacity 0.25s ease 0.05s, transform 0.25s ease 0.05s",
                        }}>
                          {line.action}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </FieldScene>
  );
}
