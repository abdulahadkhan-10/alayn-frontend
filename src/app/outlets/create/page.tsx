"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Store, MapPin, Landmark, Map, Globe, Loader2, ArrowRight, ShieldCheck, ArrowLeft, ShieldAlert } from "lucide-react";
import { useBranch } from "@/lib/BranchContext";
import { useCreateOutletMutation } from "@/redux/slices/outletApiSlice";
import { useAppSelector } from "@/redux/store/hooks";
import Link from "next/link";

export default function CreateOutletPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isOwner = user?.role === "BUSINESS_OWNER" || user?.role === "SUPER_ADMIN";

  const { refreshBranches, branches } = useBranch();
  const [createOutlet, { isLoading: loading }] = useCreateOutletMutation();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India"
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  if (!isOwner) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A] mb-6 shadow-xs">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif mb-3">
                Access Restricted
              </h1>
              <p className="text-sm text-zinc-500 max-w-md font-medium leading-relaxed mb-8">
                Adding or registering new restaurant outlets is strictly reserved for <strong>Business Owners</strong> and <strong>Super Admins</strong>.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#b01e23] transition-all"
              >
                Return to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Outlet name is required.";
    if (!formData.address.trim()) errs.address = "Address is required.";
    if (!formData.city.trim()) errs.city = "City is required.";
    if (!formData.state.trim()) errs.state = "State is required.";
    if (!formData.country.trim()) errs.country = "Country is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    try {
      await createOutlet(formData).unwrap();
      await refreshBranches();
      window.location.href = "/dashboard";
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error || err?.message || "An error occurred while creating the outlet.";
      setSubmitError(msg);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-6 sm:py-10">
        {branches.length > 0 && (
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        )}

        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100/90 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A] shadow-sm">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#D3232A]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Physical Branch Registration
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif">
                Register Your Restaurant Outlet
              </h1>
            </div>
          </div>

          <p className="text-sm text-zinc-500 mb-8 font-medium leading-relaxed">
            Enter the location details of your physical restaurant branch. Once registered, this outlet will be immediately linked to your inventory, POS billing counter, and analytics telemetry.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-[#D3232A] border border-red-100">
                {submitError}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                Outlet / Branch Name
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange("name")}
                  placeholder="e.g. Alayn Cafe — Soho Branch"
                  className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                Street Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute top-3.5 left-0 flex items-start pl-3.5">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange("address")}
                  placeholder="12 Wardour St, Soho"
                  className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200 resize-none"
                />
              </div>
              {errors.address && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="city" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  City
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Landmark className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange("city")}
                    placeholder="London / Mumbai"
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                  />
                </div>
                {errors.city && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="state" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  State / Region
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Map className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange("state")}
                    placeholder="Greater London / Maharashtra"
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                  />
                </div>
                {errors.state && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.state}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                Country
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange("country")}
                  placeholder="India"
                  className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                />
              </div>
              {errors.country && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.country}</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed hover:-translate-y-[1px] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Registering Outlet...
                  </>
                ) : (
                  <>
                    Complete Setup & Launch Dashboard
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
