"use client";

import React from "react";
import Image from "next/image";
import { FieldScene } from "../motion/GlobalField";
import { Assemble } from "../motion/primitives";
import { motion } from "framer-motion";

const CLIENTS = [
  { name: "Al Baik", logo: "/albaik.png", subtitle: "QSR Chain" },
  { name: "Mezbaan", logo: "/mezbaan.png", subtitle: "Fine Dining" },
];

export default function TrustedByScene() {
  return (
    <FieldScene
      id="trusted-by"
      domId="scene-trusted-by"
      chaos={0}
      sync={0}
      presence={1}
      className="py-16 sm:py-24 border-b border-slate-200/50"
      style={{
        background: "linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
      ariaLabel="Trusted by Leading Brands"
    >
      {/* Subtle background flare */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] rounded-[100%] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <Assemble
          as="div"
          delay={0.1}
          style={{
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--amber)",
              marginBottom: "16px",
            }}
          >
            The Vanguard
          </span>
          <h2
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              lineHeight: 1.1,
              fontWeight: 800,
              color: "var(--espresso)",
              letterSpacing: "-0.02em",
            }}
          >
            Trusted by operators who refuse
            <br />
            <em style={{ fontStyle: "italic", color: "var(--amber)", fontWeight: 400 }}>
              to compromise.
            </em>
          </h2>
        </Assemble>

        <Assemble delay={0.2} as="div" className="w-full flex justify-center items-stretch gap-6 sm:gap-8 flex-col sm:flex-row">
          {CLIENTS.map((client, idx) => (
            <motion.div 
              key={`client-${idx}`} 
              whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
              className="relative flex-1 max-w-[320px] mx-auto w-full group"
            >
              {/* Double bezel container effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60" />
              <div className="absolute inset-[1px] rounded-[15px] border border-white" />
              
              <div className="relative px-8 py-6 sm:px-10 sm:py-8 h-full flex flex-col items-center justify-center text-center">
                <h3 className="text-sm font-semibold text-slate-700 tracking-tight block mt-2">{client.name} — {client.subtitle}</h3>
                
                <div className="relative w-44 h-28 sm:w-52 sm:h-32 transition-transform duration-500 ease-out group-hover:scale-105">
                  <Image
                    src={client.logo}
                    alt={`${client.name} logo`}
                    fill
                    sizes="(max-width: 640px) 160px, 192px"
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </Assemble>
      </div>
    </FieldScene>
  );
}
