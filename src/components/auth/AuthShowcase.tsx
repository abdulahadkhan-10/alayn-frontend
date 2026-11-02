import React from "react";

export default function AuthShowcase() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 lg:p-16 text-white overflow-hidden bg-[var(--espresso)] border-l border-white/[0.05]">
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col justify-center h-full pl-4 lg:pl-12">
        <div className="mb-12 relative">
          <div className="absolute -left-8 top-4 w-px h-24 bg-[var(--amber)] hidden lg:block" />
          <h2 className="hero-headline text-5xl lg:text-7xl !text-white mb-10 text-balance">
            The AI Operating System for{" "}
            <span className="italic font-normal text-[var(--amber-on-dark)]">hospitality.</span>
          </h2>
          <div className="h-px w-16 bg-white/20 mb-8" />
          <p className="text-[var(--muted-on-dark)] text-lg max-w-md leading-relaxed">
            GST billing, kitchen display, stock and staff rosters for your outlets, all from the same live data.
          </p>
        </div>
      </div>
    </div>
  );
}
