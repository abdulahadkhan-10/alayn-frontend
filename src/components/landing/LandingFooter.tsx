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
              className="group mb-8 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-xl"
            >
              {/* The trademarked logo is only used in its registered colours, so it sits on a white panel on dark backgrounds */}
              <div className="inline-flex items-center rounded-xl bg-white px-5 py-3.5 ring-1 ring-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]">
                <Image
                  src="/alayn-logo-tm.png"
                  alt="Alayn"
                  sizes="180px"
                  width={960}
                  height={188}
                  className="h-7 sm:h-8 w-auto object-contain transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] origin-left"
                />
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm tracking-wide">
              GST billing software, POS, stock, staff and kitchen display for restaurants, cafés and cloud kitchens, on one screen.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <Link
                href="https://www.instagram.com/alayn.si/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Alayn on Instagram"
                title="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10 text-white/70 hover:text-white hover:bg-white/[0.12] hover:ring-white/25 transition-all duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Navigation Links (Platform) */}
          <div className="md:col-span-4 lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-1">Platform</h3>
            <Link href="/billing-software" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Billing Software
            </Link>
            <Link href="/features" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Features
            </Link>
            {/* <Link href="/pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Pricing
            </Link> */}
            <Link href="/about" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              About Us
            </Link>
            <Link href="/contact#demo" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Book a Demo
            </Link>
            <Link href="/api-docs" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              API Reference
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
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-1">Connect</h3>
            <Link href="/contact" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Contact Sales
            </Link>
            <a href="mailto:info@alaynai.com" className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              info@alaynai.com
            </a>
          </div>

          {/* Navigation Links (Legal & Trust) */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-1">Legal &amp; Trust</h3>
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
            <Link href="/legal/refund" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Refund Policy
            </Link>
            <Link href="/legal/support" className="text-xs font-medium text-white/70 hover:text-white transition-colors duration-300 w-fit">
              Support & Grievances
            </Link>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/[0.04]">
          <p className="text-xs text-white/40 tracking-wide text-center md:text-left">
            &copy; {new Date().getFullYear()} Alayn AI (BRAHM Global Holdings). All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <Link href="/billing-software" className="hover:text-white transition-colors">Billing Software</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
