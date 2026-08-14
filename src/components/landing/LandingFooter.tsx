"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer
      style={{
        background: "var(--espresso)",
        borderTop: "1px solid rgba(249, 246, 241, 0.06)",
        padding: "40px 0 32px",
      }}
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 flex-wrap">
        {/* Logo + tagline */}
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start mb-2 overflow-hidden">
            <Image
              src="/whitelogo.png"
              alt="Alayn — AI Operating System for Hospitality"
              width={1280}
              height={297}
              style={{ 
                height: "48px", 
                width: "auto",
                transform: "scale(1.4)",
                transformOrigin: "left center"
              }}
              className="w-auto object-contain sm:h-16"
            />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "rgba(249, 246, 241, 0.6)",
              lineHeight: 1.5,
            }}
          >
            Alayn — The All-in-One Operating System for Modern Businesses
          </p>
        </div>

        {/* Nav links */}
        <nav
          className="flex items-center justify-center gap-6 flex-wrap py-2"
          aria-label="Footer navigation"
        >
          {[
            { href: "/login", label: "Log in" },
            { href: "/signup", label: "Sign up" },
            { href: "#how-it-works", label: "How it works" },
            { href: "/legal/privacy", label: "Privacy Policy" },
            { href: "/legal/terms", label: "Terms of Service" },
          ].map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="footer-link min-h-[44px] flex items-center"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p
          style={{
            margin: 0,
            fontSize: "0.8125rem",
            color: "rgba(249, 246, 241, 0.5)",
            width: "100%",
            borderTop: "1px solid rgba(249, 246, 241, 0.06)",
            paddingTop: "24px",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} Alayn. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
