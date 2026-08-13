"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useLoginMutation } from "@/redux/slices/authApiSlice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/redux/slices/authSlice";
import AuthShowcase from "@/components/auth/AuthShowcase";
export default function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    try {
      const response = await login({
        email,
        password,
      }).unwrap();

      // console.log("Login response:", response);

      const payload = response?.data || response;
      dispatch(setCredentials(payload));

      const role = payload?.user?.role;
      if (role === "STAFF") {
        router.replace("/pos");
      } else if (role === "KITCHEN") {
        router.replace("/kitchen");
      } else if (role === "SUPPLIER") {
        router.replace("/supplier");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      setError(
        err?.data?.error?.message ||
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
        err?.message ||
        "Invalid email or password."
      );
    }
  };

  const inputClasses = "block w-full border-b border-[#1B2A4A]/20 py-2 pl-9 pr-3 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-xs sm:text-sm";

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen bg-white font-sans overflow-hidden">
      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-50 flex items-center gap-1.5 text-[#1B2A4A]/60 hover:text-[#1B2A4A] bg-[#F4F5F8] hover:bg-[#E8ECF1] px-3 py-1.5 rounded-lg border border-[#1B2A4A]/10 transition-all duration-300 group shadow-2xs"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-bold">Back</span>
      </Link>

      {/* Left Pane: Form */}
      <div className="flex-1 lg:flex-initial lg:w-[45%] xl:w-[40%] flex flex-col justify-between px-6 sm:px-10 py-6 lg:py-8 z-10 relative bg-white border-r border-[#1B2A4A]/10 overflow-y-auto no-scrollbar h-full">
        <div className="w-full max-w-md mx-auto relative z-10 my-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6 pt-2">
            <Link href="/">
              <Image
                src="/gptlogo.png"
                alt="Alayn — AI Operating System for Hospitality"
                width={1280}
                height={297}
                style={{ 
                  height: "46px", 
                  width: "auto",
                  transform: "scale(1.75)",
                  transformOrigin: "center center"
                }}
                className="w-auto object-contain"
                priority
              />
            </Link>
          </div>

          <div className="text-center lg:text-left mb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
              Welcome back
            </h2>
            <p className="mt-1 text-xs text-[#6B7A90] font-medium leading-normal">
              Please enter your details to sign in and manage your operations.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-[#C41E2A]/10 p-4 text-sm text-[#C41E2A] border border-[#C41E2A]/20 font-medium">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1">
                Email Address
              </label>
              <div className="relative mt-1 group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                  <Mail className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="name@alayn.com"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1">
                  Password
                </label>
                <div className="text-xs">
                  <Link href="#" className="font-semibold text-[#C41E2A] hover:text-[#b01e23] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="relative mt-1 group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                  <Lock className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="••••••••"
                  className={inputClasses.replace("pr-3", "pr-8")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C41E2A] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold leading-5 text-white shadow-xs hover:bg-[#b01e23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C41E2A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-[1px] cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center lg:text-left text-xs text-[#6B7A90] font-medium mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-[#C41E2A] hover:text-[#b01e23] transition-colors">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
        
        {/* Footer */}
        <div className="w-full max-w-md mx-auto mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#6B7A90] font-medium border-t border-[#1B2A4A]/10 pt-4">
          <span>© 2026 Alayn. All rights reserved.</span>
          <div className="flex gap-3">
            <Link href="#" className="hover:text-[#1B2A4A] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#1B2A4A] transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Pane: Interactive Bento Grid Showcase */}
      <div className="hidden lg:block lg:flex-1 relative">
        <AuthShowcase />
      </div>
    </div>
  );
}