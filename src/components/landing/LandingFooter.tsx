"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer
      className="relative w-full overflow-hidden text-white pt-32 pb-12"
      style={{ background: "var(--espresso, #1a1e2e)" }}
      aria-label="Site footer"
    >
      {/* Subtle top ambient glow for depth */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-24">
          
          {/* Brand & Mission (Left side) */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col items-start md:mb-8 lg:mb-0">
            <Link 
              href="/" 
              className="group mb-8 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm"
            >
              <div className="relative overflow-hidden flex items-center">
                <Image
                  src="/whitelogo.png"
                  alt="Alayn"
                  width={800}
                  height={186}
                  className="h-16 sm:h-20 w-auto object-contain transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 origin-left"
                />
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm tracking-wide">
              The All-in-One Operating System for Modern Businesses. Built for scale, designed for clarity.
            </p>
          </div>

          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Navigation Links (Platform) */}
          <div className="md:col-span-4 lg:col-span-2 flex flex-col gap-5">
            <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-2">Platform</h4>
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Sign up
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              How it works
            </Link>
          </div>

          {/* Navigation Links (Connect) */}
          <div className="md:col-span-4 lg:col-span-2 flex flex-col gap-5">
            <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-2">Connect</h4>
            <Link href="https://www.instagram.com/alayn.ai/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Instagram
            </Link>
            <a href="mailto:info@alaynai.com" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit mt-2">
              info@alaynai.com
            </a>
          </div>

          {/* Navigation Links (Legal & Trust) */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-5">
            <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-2">Legal & Trust</h4>
            <Link href="/legal/privacy" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Terms of Service
            </Link>
            <Link href="/legal/cookie" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Cookie Policy
            </Link>
            <Link href="/legal/refund" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Refund Policy
            </Link>
            <Link href="/legal/security" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Security & Data Protection
            </Link>
            <Link href="/legal/responsible-ai" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Responsible AI
            </Link>
            <Link href="/legal/corporate" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Corporate Information
            </Link>
            <Link href="/legal/support" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Support & Grievance
            </Link>
          </div>
        </div>

        {/* Bottom Strip: Copyright & Legal */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/[0.04]">
          <div className="flex-1 pl-12 md:pl-0 flex justify-center md:justify-start">
            <p className="text-xs text-white/40 tracking-wide text-center md:text-left pl-2 sm:pl-10 lg:pl-0">
              © {new Date().getFullYear()} Alayn. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
