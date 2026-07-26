import React from "react";

export default function AuthShowcase() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 lg:p-16 text-white overflow-hidden bg-[#1B2A4A] border-l border-white/[0.05]">
      {/* Morphing Liquid Glass Auroras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#C41E2A]/20 blur-[120px] animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute bottom-[10%] right-[0%] w-[60%] h-[60%] rounded-full bg-[#243556]/50 blur-[100px] animate-pulse" style={{ animationDuration: "7s" }} />
        
        {/* Central Morphing Glass Orb */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[700px] aspect-square border border-white/[0.03] bg-white/[0.01] backdrop-blur-3xl shadow-[inset_0_0_80px_rgba(255,255,255,0.01)]" 
          style={{ 
            borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%", 
            animation: "morph 15s ease-in-out infinite both alternate" 
          }} 
        />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col justify-center h-full pl-4 lg:pl-12">
        <div className="mb-12 relative">
          <div className="absolute -left-8 top-4 w-px h-24 bg-gradient-to-b from-[#C41E2A]/70 to-transparent hidden lg:block" />
          <h2 className="font-serif text-5xl lg:text-[5.5rem] font-medium tracking-tight text-white/90 leading-[1.05] mb-10 drop-shadow-sm">
            The AI Operating System for<br/>
            <span className="italic text-white/40">hospitality</span><br/>
          </h2>
          <div className="h-px w-16 bg-white/20 mb-8" />
          <p className="text-white/40 font-light text-lg tracking-wide max-w-md leading-relaxed">
          Unify operations, empower every team and transform every guest experience through one intelligent platform
          </p>
        </div>
      </div>
      
      {/* Global style for the morph animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes morph {
          0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
          100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        }
      `}} />
    </div>
  );
}
