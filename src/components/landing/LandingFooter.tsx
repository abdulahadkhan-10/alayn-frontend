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
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-24">
          {/* Brand & Mission */}
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
              The Intelligent Operating System for Hospitality. Built for scale, designed for clarity.
            </p>
          </div>

          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Navigation Links (Platform) */}
          <div className="md:col-span-4 lg:col-span-2 flex flex-col gap-4">
            <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-1">Platform</h4>
            <Link href="/about" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              About Us
            </Link>
            <Link href="/contact" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Book a Demo
            </Link>
            <Link href="/api-docs" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Developer APIs
            </Link>
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Sign up
            </Link>
          </div>

          {/* Navigation Links (Connect) */}
          <div className="md:col-span-4 lg:col-span-2 flex flex-col gap-4">
            <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-1">Connect</h4>
            <Link href="/contact" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Contact Sales
            </Link>
            <a href="mailto:info@alaynai.com" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              info@alaynai.com
            </a>
            <Link href="/llms.txt" className="text-sm font-medium text-amber-400 hover:underline transition-colors duration-300 w-fit mt-1">
              llms.txt
            </Link>
            <Link href="https://www.instagram.com/alayn.ai/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Instagram
            </Link>
          </div>

          {/* Navigation Links (Legal & Trust) */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-1">Legal &amp; Trust</h4>
            <Link href="/legal/privacy" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Terms of Service
            </Link>
            <Link href="/legal/cookie" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Cookie Policy
            </Link>
            <Link href="/legal/security" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Security &amp; Data Protection
            </Link>
            <Link href="/legal/responsible-ai" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Responsible AI
            </Link>
            <Link href="/legal/corporate" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Corporate Information
            </Link>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/[0.04]">
          <p className="text-xs text-white/40 tracking-wide text-center md:text-left">
            &copy; {new Date().getFullYear()} Alayn AI (BRAHM Global Holdings). All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/api-docs" className="hover:text-white transition-colors">APIs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
