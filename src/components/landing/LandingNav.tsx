"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useMagnetic, springSnappy } from "./motion/primitives";
import { useAppSelector, useAppDispatch } from "@/redux/store/hooks";
import { logout } from "@/redux/slices/authSlice";
import { useLogoutMutation } from "@/redux/slices/authApiSlice";
import { LayoutGrid, User, LogOut, ChevronDown, Menu, X } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { ref: signupRef, x, y } = useMagnetic(0.2);
  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutMutation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = mounted && user?.name ? user.name.charAt(0).toUpperCase() : "O";

  const handleLogout = async () => {
    try {
      await logoutApi(undefined).unwrap();
    } catch {
      // ignore
    } finally {
      dispatch(logout());
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      window.location.reload();
    }
  };

  return (
    <>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[45px] sm:hidden bg-zinc-900/20 backdrop-blur-sm z-[90]"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      <nav
        className={`landing-nav ${scrolled ? "scrolled" : ""}`}
        aria-label="Main navigation"
      >
      <div
        className="nav-inner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 16px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Brand logo */}
        <Link href="/" className="nav-brand flex items-center overflow-visible shrink-0">
          <Image
            src="/gptlogo.png"
            alt="Alayn — AI Operating System for Hospitality"
            width={480}
            height={111}
            sizes="(max-width: 640px) 160px, 360px"
            style={{ transformOrigin: "left center" }}
            className="w-[90px] sm:w-[115px] h-auto transform-gpu object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav Actions */}
        <div className="hidden sm:flex items-center gap-2">
          {!mounted ? (
            <Skeleton width={110} height={38} borderRadius={20} />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full bg-white/90 border border-zinc-200/80 px-3 py-1.5 shadow-sm hover:bg-zinc-50 transition-all duration-200 min-h-[44px]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D3232A] text-xs font-bold text-white shadow-sm" suppressHydrationWarning>
                  {initial}
                </div>
                <span className="text-xs font-semibold text-zinc-800" suppressHydrationWarning>
                  {user.name || "Owner"}
                </span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-xs font-bold text-zinc-900 truncate" suppressHydrationWarning>{user.name}</p>
                    <p className="text-[11px] text-zinc-400 font-medium truncate" suppressHydrationWarning>{user.email}</p>
                    <span className="inline-block mt-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#D3232A]">
                      {user.role || "BUSINESS_OWNER"}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    <LayoutGrid className="h-4 w-4 text-[#D3232A]" />
                    Go to Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    <User className="h-4 w-4 text-zinc-400" />
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                id="nav-login"
                className="nav-login-btn"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1A1D24",
                  textDecoration: "none",
                  padding: "10px 18px",
                  borderRadius: "20px",
                  transition: "background-color 0.15s ease",
                }}
              >
                Log in
              </Link>
              <motion.div
                ref={signupRef as any}
                animate={{ x, y } as any}
                transition={springSnappy}
                style={{ display: "inline-block" }}
              >
                <Link
                  href="/signup"
                  id="nav-get-started"
                  className="nav-signup-btn"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundColor: "#1A1D24",
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    display: "inline-block",
                    transition: "transform 0.15s ease, background-color 0.15s ease",
                  }}
                >
                  Get started
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="p-2.5 rounded-xl bg-white/90 border border-zinc-200/80 text-zinc-800 shadow-sm focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>

            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="sm:hidden relative z-10 bg-white border-b border-zinc-200/80 px-5 py-6 space-y-4 overflow-hidden"
            >
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D3232A] text-sm font-bold text-white shadow-sm">
                    {initial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-zinc-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-500 font-medium truncate">{user.email}</p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#D3232A] px-4 py-3 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 min-h-[44px]"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Go to Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3 text-xs font-bold text-red-600 transition-colors min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-[#C41E2A] px-4 py-3 text-[13px] font-bold text-white shadow-md transition-transform active:scale-95 min-h-[48px] mb-2"
                >
                  Book a Demonstration
                </Link>
                
                <div className="flex flex-col gap-1 py-2 border-y border-zinc-100 mb-2">
                  <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-3 py-3 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 rounded-lg transition-colors">
                    Platform
                  </Link>
                  <Link href="#modules" onClick={() => setMobileMenuOpen(false)} className="px-3 py-3 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 rounded-lg transition-colors">
                    Modules
                  </Link>
                  <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-3 py-3 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 rounded-lg transition-colors">
                    Pricing
                  </Link>
                </div>

                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200/80 px-4 py-3 text-xs font-bold text-zinc-900 transition-colors min-h-[44px]"
                >
                  Log in
                </Link>
              </div>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>
      </nav>
    </>
  );
}

