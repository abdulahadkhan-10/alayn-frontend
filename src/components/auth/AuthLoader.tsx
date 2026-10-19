"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * The brand loader shown on the home page and the sign-in page (logo emblem on a light screen).
 * AuthGuard, GuestGuard and the route loader all render THIS, so there is no jump between a
 * skeleton and a splash while the session is being checked.
 */
export function BrandSplash({
  label = "Loading",
  pulse = true,
  children,
}: {
  /** Read out by screen readers; not drawn. */
  label?: string;
  pulse?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={pulse}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#F4F6F9] select-none"
    >
      {/* Top spacer for vertical balance */}
      <div className="h-12 w-full" />

      {/* Center Brand Emblem */}
      <div className="flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className={pulse ? "animate-pulse" : ""}>
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-md shadow-slate-200/70 border border-slate-100 p-3">
            <Image
              src="/justlogo.png"
              alt="Alayn Emblem"
              width={72}
              height={72}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
        </div>
        {children}
      </div>

      {/* Bottom Branding */}
      <div className="pb-10 flex flex-col items-center gap-0.5 text-center font-sans">
        <span className="text-[11px] font-medium text-slate-400 tracking-wider">from</span>
        <span className="text-xs font-extrabold tracking-widest text-[#D3232A] uppercase">ALAYN AI</span>
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}

interface AuthLoaderProps {
  /** Screen-reader text, e.g. "Checking your session". */
  label?: string;
  /** Shown instead of the pulse when the server could not be reached. */
  unreachable?: { onRetry: () => void; retrying?: boolean } | null;
}

/** Full-screen loader used while a page is waiting for the server to confirm the session. */
export default function AuthLoader({ label = "Checking your session", unreachable = null }: AuthLoaderProps) {
  if (!unreachable) return <BrandSplash label={label} />;

  return (
    <BrandSplash label="We could not confirm your session" pulse={false}>
      <div className="max-w-xs font-sans">
        <p className="text-sm font-bold text-[#1B2A4A]">We can&apos;t reach Alayn right now</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
          Your connection or our server is having a moment. You are still signed in; we&apos;ll keep trying.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={unreachable.onRetry}
            disabled={unreachable.retrying}
            className="rounded-xl bg-[#C41E2A] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#b01e23] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {unreachable.retrying ? "Trying…" : "Try again"}
          </button>
          <Link href="/login" className="text-xs font-semibold text-[#C41E2A] hover:text-[#b01e23]">
            Sign in again
          </Link>
        </div>
      </div>
    </BrandSplash>
  );
}
