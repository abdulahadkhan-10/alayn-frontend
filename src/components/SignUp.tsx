"use client";

import { useShake } from "@/lib/useShake";
import React, { createContext, useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    User,
    Mail,
    Phone,
    Lock,
    Store,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
} from "lucide-react";
import { useRegisterMutation } from "@/redux/slices/authApiSlice";
import AuthShowcase from "@/components/auth/AuthShowcase";

interface SignupFormState {
    // Step 1 — Account
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    // Step 2 — Business
    businessName: string;
    locationsCount: string;
    businessType: string;
    contactDetail: string;
}

type FormErrors = Partial<Record<keyof SignupFormState, string>>;

const INITIAL_FORM_STATE: SignupFormState = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    locationsCount: "",
    businessType: "",
    contactDetail: "",
};

const STEPS = [
    { id: 1, label: "Account" },
    { id: 2, label: "Business" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Bumped on every failed validation so fields that are still invalid shake again.
const ShakeContext = createContext(0);

function Field({
    id,
    label,
    icon,
    error,
    children,
}: {
    id: string;
    label: string;
    icon: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}) {
    const shakeKey = useContext(ShakeContext);
    const shakeRef = useShake<HTMLDivElement>(error ? shakeKey : 0);

    return (
        <div>
            <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1">
                {label}
            </label>
            <div ref={shakeRef} className="t-input relative mt-1 group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                    {icon}
                </div>
                {children}
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1 text-xs font-medium text-[#C41E2A]">
                    {error}
                </p>
            )}
        </div>
    );
}

export default function SignupComponent() {
    const [step, setStep] = useState<StepId>(1);
    const [formData, setFormData] = useState<SignupFormState>(INITIAL_FORM_STATE);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [shakeKey, setShakeKey] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [register, { isLoading }] = useRegisterMutation();

    const handleChange = (field: keyof SignupFormState) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validateStep1 = (): boolean => {
        const errors: FormErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9+\-\s()]{7,15}$/;

        if (!formData.fullName.trim()) errors.fullName = "Full name is required.";

        if (!formData.email.trim()) {
            errors.email = "Email address is required.";
        } else if (!emailRegex.test(formData.email)) {
            errors.email = "Enter a valid email address.";
        }

        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required.";
        } else if (!phoneRegex.test(formData.phone)) {
            errors.phone = "Enter a valid phone number.";
        }

        if (!formData.password) {
            errors.password = "Password is required.";
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters.";
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password.";
        } else if (formData.confirmPassword !== formData.password) {
            errors.confirmPassword = "Passwords do not match.";
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) setShakeKey((k) => k + 1);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errors: FormErrors = {};

        if (!formData.businessName.trim()) errors.businessName = "Business name is required.";
        if (!formData.locationsCount.trim()) errors.locationsCount = "Number of locations is required.";
        if (!formData.businessType.trim()) errors.businessType = "Business type is required.";
        if (!formData.contactDetail.trim()) {
            errors.contactDetail = "Contact detail is required.";
        } else if (formData.contactDetail.length < 10) {
            errors.contactDetail = "Contact detail must be at least 10 characters.";
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) setShakeKey((k) => k + 1);
        return Object.keys(errors).length === 0;
    };

    const goNext = () => {
        setSubmitError("");
        if (step === 1 && validateStep1()) setStep(2);
    };

    const goBack = () => {
        setSubmitError("");
        setFieldErrors({});
        if (step === 2) setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitSuccess(false);

        if (!validateStep2()) return;

        try {
            await register({
                user: {
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    phoneNo: formData.phone,
                },
                business: {
                    name: formData.businessName,
                    locationsCount: formData.locationsCount,
                    businessType: formData.businessType,
                    contactDetail: formData.contactDetail,
                },
            }).unwrap();

            setSubmitSuccess(true);
            setTimeout(() => {
                window.location.href = "/login";
            }, 1500);
        } catch (err: any) {
            setSubmitError(
                err?.data?.error?.message ||
                err?.data?.message ||
                (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
                err?.message ||
                "Something went wrong. Please try again."
            );
        }
    };

    const inputClasses =
        "block w-full border-b border-[#1B2A4A]/20 py-2 pl-9 pr-3 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-xs sm:text-sm [&>option]:text-[#1B2A4A]";

    const errorInputClasses =
        "block w-full border-b border-[#C41E2A]/50 py-2 pl-9 pr-3 text-[#1B2A4A] placeholder:text-[#6B7A90] bg-transparent transition-all duration-300 focus:border-[#C41E2A] focus:shadow-[0_4px_12px_rgba(196,30,42,0.08)] focus:outline-none focus:ring-0 text-xs sm:text-sm [&>option]:text-[#1B2A4A]";

    const iconClasses = "h-4 w-4 text-[#1B2A4A]/40 group-focus-within:text-[#1B2A4A] transition-colors";

    return (
        <div className="relative flex flex-col lg:flex-row h-screen max-h-screen bg-white font-sans overflow-hidden">
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
                <div className="w-full max-w-sm mx-auto relative z-10 my-auto">
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

                    <div className="text-center lg:text-left mb-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A] font-serif">
                            Create your restaurant
                        </h2>
                        <p className="mt-1 text-xs text-[#6B7A90] font-medium leading-normal">
                            {step === 1 && "Let's start with your admin account details."}
                            {step === 2 && "Now, set up your first outlet."}
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="mb-5 flex gap-3 w-full" aria-label="Signup progress">
                        {STEPS.map((s) => {
                            const isComplete = step > s.id;
                            const isActive = step === s.id;
                            return (
                                <div key={s.id} className="flex-1 flex flex-col gap-1">
                                    <div className={`h-1 rounded-full transition-all duration-500 ${
                                        isComplete || isActive ? "bg-[#C41E2A]" : "bg-[#1B2A4A]/10"
                                    }`} />
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                        isComplete || isActive ? "text-[#C41E2A]" : "text-[#1B2A4A]/30"
                                    }`}>
                                        Step {s.id}: {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <ShakeContext.Provider value={shakeKey}>
                    <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
                        {submitError && (
                            <div role="alert" className="rounded-lg bg-[#C41E2A]/10 p-2.5 text-xs text-[#C41E2A] border border-[#C41E2A]/20 font-medium">
                                {submitError}
                            </div>
                        )}

                        {submitSuccess && (
                            <div role="status" className="rounded-xl bg-emerald-50/90 p-3 text-xs text-emerald-900 border border-emerald-200/90 font-medium space-y-1 animate-in fade-in-50 duration-200">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    Restaurant created successfully!
                                </div>
                                <p className="text-[11px] text-emerald-700 leading-relaxed">
                                    Redirecting to sign in...
                                </p>
                            </div>
                        )}

                        {/* STEP 1 — Account */}
                        {step === 1 && (
                            <div className="space-y-3">
                                <Field id="fullName" label="Full Name" icon={<User className={iconClasses} />} error={fieldErrors.fullName}>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange("fullName")}
                                        placeholder="Jordan Rivera"
                                        aria-invalid={!!fieldErrors.fullName}
                                        aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                                        className={fieldErrors.fullName ? errorInputClasses : inputClasses}
                                    />
                                </Field>

                                <Field id="email" label="Email Address" icon={<Mail className={iconClasses} />} error={fieldErrors.email}>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange("email")}
                                        placeholder="name@alayn.com"
                                        aria-invalid={!!fieldErrors.email}
                                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                                        className={fieldErrors.email ? errorInputClasses : inputClasses}
                                    />
                                </Field>

                                <Field id="phone" label="Phone Number" icon={<Phone className={iconClasses} />} error={fieldErrors.phone}>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange("phone")}
                                        placeholder="+91 98765 43210"
                                        aria-invalid={!!fieldErrors.phone}
                                        aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                                        className={fieldErrors.phone ? errorInputClasses : inputClasses}
                                    />
                                </Field>

                                <div>
                                    <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                                            <Lock className={iconClasses} />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange("password")}
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.password}
                                            aria-describedby={fieldErrors.password ? "password-error" : undefined}
                                            className={(fieldErrors.password ? errorInputClasses : inputClasses).replace("pr-3", "pr-8")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.password && (
                                        <p id="password-error" className="mt-1 text-xs font-medium text-[#C41E2A]">
                                            {fieldErrors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7A90] mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
                                            <Lock className={iconClasses} />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange("confirmPassword")}
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.confirmPassword}
                                            aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                                            className={(fieldErrors.confirmPassword ? errorInputClasses : inputClasses).replace("pr-3", "pr-8")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.confirmPassword && (
                                        <p id="confirmPassword-error" className="mt-1 text-xs font-medium text-[#C41E2A]">
                                            {fieldErrors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C41E2A] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold leading-5 text-white shadow-xs hover:bg-[#b01e23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C41E2A] transition-all duration-300 hover:-translate-y-[1px] mt-1 cursor-pointer"
                                    >
                                        Continue
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 — First Outlet */}
                        {step === 2 && (
                            <div className="space-y-3">
                                <Field id="businessName" label="Business / Restaurant Name" icon={<Store className={iconClasses} />} error={fieldErrors.businessName}>
                                    <input
                                        id="businessName"
                                        name="businessName"
                                        type="text"
                                        autoComplete="off"
                                        required
                                        value={formData.businessName}
                                        onChange={handleChange("businessName")}
                                        placeholder="Microsoft Cafe"
                                        aria-invalid={!!fieldErrors.businessName}
                                        aria-describedby={fieldErrors.businessName ? "businessName-error" : undefined}
                                        className={fieldErrors.businessName ? errorInputClasses : inputClasses}
                                    />
                                </Field>

                                <Field id="locationsCount" label="Number of Locations" icon={<Store className={iconClasses} />} error={fieldErrors.locationsCount}>
                                    <select
                                        id="locationsCount"
                                        name="locationsCount"
                                        required
                                        value={formData.locationsCount}
                                        onChange={handleChange("locationsCount")}
                                        className={fieldErrors.locationsCount ? errorInputClasses : inputClasses}
                                    >
                                        <option value="">Select location range</option>
                                        <option value="1">1 Location</option>
                                        <option value="2-5">2-5 Locations</option>
                                        <option value="6-10">6-10 Locations</option>
                                        <option value="10+">10+ Locations</option>
                                    </select>
                                </Field>

                                <Field id="businessType" label="Business Type" icon={<Store className={iconClasses} />} error={fieldErrors.businessType}>
                                    <select
                                        id="businessType"
                                        name="businessType"
                                        required
                                        value={formData.businessType}
                                        onChange={handleChange("businessType")}
                                        className={fieldErrors.businessType ? errorInputClasses : inputClasses}
                                    >
                                        <option value="">Select business type</option>
                                        <option value="restaurant">Restaurant</option>
                                        <option value="cafe">Café</option>
                                        <option value="bar">Bar</option>
                                        <option value="qsr">QSR (Quick Service Restaurant)</option>
                                        <option value="other">Other</option>
                                    </select>
                                </Field>

                                <Field id="contactDetail" label="Company Contact Detail (Email / Phone)" icon={<Phone className={iconClasses} />} error={fieldErrors.contactDetail}>
                                    <input
                                        id="contactDetail"
                                        name="contactDetail"
                                        type="text"
                                        required
                                        value={formData.contactDetail}
                                        onChange={handleChange("contactDetail")}
                                        placeholder="contact@company.com or +91 98765 43210"
                                        aria-invalid={!!fieldErrors.contactDetail}
                                        aria-describedby={fieldErrors.contactDetail ? "contactDetail-error" : undefined}
                                        className={fieldErrors.contactDetail ? errorInputClasses : inputClasses}
                                    />
                                </Field>

                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold leading-5 text-[#1B2A4A] border border-[#1B2A4A]/20 hover:bg-[#F4F5F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2A4A]/20 transition-all duration-300 cursor-pointer"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C41E2A] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold leading-5 text-white shadow-xs hover:bg-[#b01e23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C41E2A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-[1px] cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            <>
                                                Create Business
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-center lg:text-left text-xs text-[#6B7A90] font-medium mt-4">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-[#C41E2A] hover:text-[#b01e23] transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </form>
                    </ShakeContext.Provider>
                </div>

                {/* Footer */}
                <div className="w-full max-w-sm mx-auto mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#6B7A90] font-medium border-t border-[#1B2A4A]/10 pt-4">
                    <span>© 2026 Alayn. All rights reserved.</span>
                    <div className="flex gap-3">
                        <Link href="/legal/privacy" className="hover:text-[#1B2A4A] transition-colors">Privacy</Link>
                        <Link href="/legal/terms" className="hover:text-[#1B2A4A] transition-colors">Terms</Link>
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