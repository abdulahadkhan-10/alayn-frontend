"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
} from "@/redux/slices/authApiSlice";
import AuthShowcase from "@/components/auth/AuthShowcase";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordComponent() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>("email");

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Resend cooldown timer
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Redirect countdown on success
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // OTP Inputs refs for focus management
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mutations
  const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [verifyResetOtp, { isLoading: isVerifyingOtp }] = useVerifyResetOtpMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation();

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Success auto-redirect effect
  useEffect(() => {
    if (step !== "success") return;
    if (redirectCountdown <= 0) {
      router.replace("/login");
      return;
    }
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, redirectCountdown, router]);

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    try {
      const response = await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      const message = response?.data?.message || "Verification code sent to your email.";
      setInfoMsg(message);
      setCooldownSeconds(60);
      setStep("otp");
      // Focus first OTP field
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const message =
        err?.data?.error?.message ||
        err?.data?.message ||
        "Failed to send reset code. Please try again.";
      setErrorMsg(message);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, "");
    const newOtp = [...otp];

    if (!cleanVal) {
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    // Single digit input
    newOtp[index] = cleanVal[cleanVal.length - 1];
    setOtp(newOtp);

    // Auto-advance to next box if available
    if (index < 5 && cleanVal) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle KeyDown for Backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste event on OTP inputs
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const nextFocusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextFocusIndex]?.focus();
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      const response = await verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: fullCode,
      }).unwrap();

      const receivedToken = response?.data?.resetToken || response?.resetToken;
      if (!receivedToken) {
        setErrorMsg("Verification succeeded but no session token was received. Please try again.");
        return;
      }

      setResetToken(receivedToken);
      setStep("password");
    } catch (err: any) {
      const message =
        err?.data?.error?.message ||
        err?.data?.message ||
        "Invalid verification code. Please check and try again.";
      setErrorMsg(message);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500", text: "text-red-500" };
    if (score <= 2) return { score: 2, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500", text: "text-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  // Handle Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        resetToken,
        newPassword,
      }).unwrap();

      setStep("success");
    } catch (err: any) {
      const message =
        err?.data?.error?.message ||
        err?.data?.message ||
        "Failed to reset password. Your session may have expired.";
      setErrorMsg(message);
    }
  };

  const inputClasses =
    "block w-full border-b border-[#1B2A4A]/20 py-2.5 pl-9 pr-10 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-sm";

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen bg-white font-sans overflow-hidden">
      {/* Top Left Navigation Back */}
      <Link
        href="/login"
        className="absolute top-4 left-4 z-50 flex items-center gap-1.5 text-[#1B2A4A]/60 hover:text-[#1B2A4A] bg-[#F4F5F8] hover:bg-[#E8ECF1] px-3 py-1.5 rounded-lg border border-[#1B2A4A]/10 transition-all duration-300 group shadow-2xs"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-bold">Back to Login</span>
      </Link>

      {/* Left Pane: Interactive Flow */}
      <div className="flex-1 lg:flex-initial lg:w-[45%] xl:w-[40%] flex flex-col justify-between px-6 sm:px-10 py-8 lg:py-10 z-10 relative bg-white border-r border-[#1B2A4A]/10 overflow-y-auto no-scrollbar h-full">
        <div className="w-full max-w-md mx-auto relative z-10 my-auto pt-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/">
              <Image
                src="/gptlogo.png"
                alt="Alayn Logo"
                width={1280}
                height={297}
                style={{
                  height: "44px",
                  width: "auto",
                  transform: "scale(1.75)",
                  transformOrigin: "center center",
                }}
                className="w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {infoMsg && !errorMsg && (
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 flex items-start gap-2.5 text-xs text-blue-700 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{infoMsg}</div>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL */}
          {step === "email" && (
            <div className="animate-in fade-in duration-300">
              <div className="text-center lg:text-left mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-[#C41E2A] mb-3">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
                  Forgot Password?
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#6B7A90]">
                  No worries! Enter your registered email address and we'll send a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Mail className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="e.g. john.doe@restaurant.com"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#C41E2A] hover:bg-[#b01e23] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer group"
                >
                  {isSendingOtp ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Verification Code...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Send Verification Code
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === "otp" && (
            <div className="animate-in fade-in duration-300">
              <div className="text-center lg:text-left mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-[#C41E2A] mb-3">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
                  Check Your Email
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#6B7A90]">
                  We sent a 6-digit verification code to{" "}
                  <span className="font-semibold text-[#1B2A4A]">{email}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setErrorMsg(null);
                  }}
                  className="mt-1 text-xs text-[#C41E2A] hover:underline cursor-pointer font-medium"
                >
                  Wrong email? Change address
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 6 Digit Inputs */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] text-center mb-3">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-between gap-2 sm:gap-2.5 max-w-sm mx-auto">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-13 text-center text-xl font-mono font-bold text-[#1B2A4A] bg-[#F4F5F8] border-2 border-transparent focus:border-[#C41E2A] focus:bg-white rounded-xl focus:outline-none transition-all shadow-2xs"
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Cooldown */}
                <div className="text-center text-xs">
                  {cooldownSeconds > 0 ? (
                    <span className="text-[#6B7A90]">
                      Resend code in{" "}
                      <span className="font-bold text-[#1B2A4A]">{cooldownSeconds}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={() => handleSendOtp()}
                      className="inline-flex items-center gap-1.5 text-[#C41E2A] hover:text-[#b01e23] font-semibold transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSendingOtp ? "animate-spin" : ""}`} />
                      Didn't get a code? Resend
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otp.join("").length !== 6}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#C41E2A] hover:bg-[#b01e23] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer group"
                >
                  {isVerifyingOtp ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying Code...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Verify & Proceed
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: CREATE NEW PASSWORD */}
          {step === "password" && (
            <div className="animate-in fade-in duration-300">
              <div className="text-center lg:text-left mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-[#C41E2A] mb-3">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
                  Reset Password
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#6B7A90]">
                  Your code has been verified. Choose a strong new password for your account.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Lock className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Minimum 6 characters"
                      className={inputClasses}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors cursor-pointer"
                      tabIndex={-1}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Strength Bar */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-500">Password strength:</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden flex gap-1">
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= 1 ? strength.color : "bg-gray-200"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= 2 ? strength.color : "bg-gray-200"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= 3 ? strength.color : "bg-gray-200"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= 4 ? strength.color : "bg-gray-200"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative mt-1 group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                      <Lock className="h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Re-enter your new password"
                      className={inputClasses}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors cursor-pointer"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      isResettingPassword ||
                      newPassword.length < 6 ||
                      newPassword !== confirmPassword
                    }
                    className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#C41E2A] hover:bg-[#b01e23] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer group"
                  >
                    {isResettingPassword ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving New Password...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Reset Password
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === "success" && (
            <div className="animate-in zoom-in-95 duration-300 text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
                Password Reset!
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#6B7A90] max-w-sm mx-auto leading-relaxed">
                Your password has been securely updated. You can now use your new password to sign into your Alayn account.
              </p>

              <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
                Redirecting to login in{" "}
                <span className="font-bold text-[#1B2A4A]">{redirectCountdown}s</span>...
              </div>

              <div className="mt-6">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#C41E2A] hover:bg-[#b01e23] transition-all duration-300 shadow-md cursor-pointer"
                >
                  Back to Sign In Now
                </Link>
              </div>
            </div>
          )}

          {/* Bottom Footer Note */}
          <div className="mt-8 text-center text-xs text-[#6B7A90]">
            Remember your credentials?{" "}
            <Link
              href="/login"
              className="font-bold text-[#C41E2A] hover:text-[#b01e23] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center text-[10px] text-[#6B7A90]/60 pt-6">
          &copy; {new Date().getFullYear()} Alayn Inc. All rights reserved.
        </div>
      </div>

      {/* Right Pane: Branded Showcase */}
      <div className="hidden lg:block lg:w-[55%] xl:w-[60%] h-full relative">
        <AuthShowcase />
      </div>
    </div>
  );
}
