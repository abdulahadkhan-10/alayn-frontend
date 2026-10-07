"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
} from "@/redux/slices/holidayApiSlice";
import {
  useGetOutletsQuery,
  useUpdateTaxRatesMutation,
  useUpdateReceiptDetailsMutation,
  useUpdateLocationMutation,
  useResolveMapLinkMutation,
  useUpdateKitchenModeMutation,
  useUpdateAttendanceRulesMutation,
} from "@/redux/slices/outletApiSlice";
import {
  Palmtree,
  Calendar,
  Plus,
  Trash2,
  Building2,
  Clock,
  Printer,
  Monitor,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Settings as SettingsIcon,
  Store,
  ShieldCheck,
  Percent,
  Receipt,
  FileText,
  Phone,
  QrCode,
  MapPin,
} from "lucide-react";

export default function SettingsPage() {
  const { activeBranch } = useBranch();
  const outletId = activeBranch?.id === "all" ? undefined : activeBranch?.id;
  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<"HOLIDAYS" | "GENERAL">("HOLIDAYS");
  // Attendance rules are stored on the outlet in the backend so they apply to every employee's device
  const [earlyBufferMins, setEarlyBufferMins] = useState<number>(30);
  const [lateGraceMins, setLateGraceMins] = useState<number>(30);
  const [updateAttendanceRules, { isLoading: isUpdatingAttendanceRules }] = useUpdateAttendanceRulesMutation();
  const { data: holidaysData, isLoading } = useGetHolidaysQuery(outletId ? { outletId } : undefined);
  const [createHoliday, { isLoading: isCreatingHoliday }] = useCreateHolidayMutation();

  const { data: outletsData = [] } = useGetOutletsQuery();
  const currentOutlet = outletsData.find((o) => o.id === activeBranch?.id) || outletsData[0];

  const [cgstInput, setCgstInput] = useState<string>("2.5");
  const [sgstInput, setSgstInput] = useState<string>("2.5");
  const [serviceTaxInput, setServiceTaxInput] = useState<string>("0.0");
  const [updateTaxRates, { isLoading: isUpdatingTax }] = useUpdateTaxRatesMutation();

  // Receipt Details State
  const [gstinInput, setGstinInput] = useState<string>("");
  const [outletPhoneInput, setOutletPhoneInput] = useState<string>("");
  const [taglineInput, setTaglineInput] = useState<string>("");
  const [footerInput, setFooterInput] = useState<string>("");
  const [upiIdInput, setUpiIdInput] = useState<string>("");
  const [updateReceiptDetails, { isLoading: isUpdatingReceipt }] = useUpdateReceiptDetailsMutation();

  // Kitchen Operating Mode State
  const [kitchenModeInput, setKitchenModeInput] = useState<"KOT" | "KDS" | "HYBRID">("HYBRID");
  const [updateKitchenMode, { isLoading: isUpdatingKitchenMode }] = useUpdateKitchenModeMutation();

  // Geofence State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(100);
  const [updateLocation, { isLoading: isUpdatingLocation }] = useUpdateLocationMutation();
  const [resolveMapLink] = useResolveMapLinkMutation();

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      setLocationName("Resolving address...");
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`);
      const data = await res.json();
      if (data && data.display_name) {
        setLocationName(data.display_name);
      } else {
        setLocationName("Address not found");
      }
    } catch (err) {
      setLocationName("Could not resolve address");
    }
  };

  useEffect(() => {
    if (!addressSearchQuery.trim()) {
      setAddressSearchResults([]);
      setIsSearchingAddress(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        if (addressSearchQuery.includes('google.com') || addressSearchQuery.includes('goo.gl')) {
          const res = await resolveMapLink({ url: addressSearchQuery, outletId: currentOutlet?.id }).unwrap();
          if (res && res.lat && res.lng) {
            setLatitude(res.lat);
            setLongitude(res.lng);
            setLocationName(res.name || "Location from Google Maps");
            setAddressSearchResults([]);
            setAddressSearchQuery("");
            setFeedbackMsg("Location extracted from Google Maps!");
          } else {
            setFeedbackMsg("Could not extract coordinates from link.");
          }
        } else {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearchQuery)}&limit=5&addressdetails=1&accept-language=en`);
          const data = await res.json();
          if (data && data.length > 0) {
            setAddressSearchResults(data);
          } else {
            setAddressSearchResults([]);
          }
        }
      } catch (err) {
        setAddressSearchResults([]);
        if (addressSearchQuery.includes('google.com') || addressSearchQuery.includes('goo.gl')) {
          setFeedbackMsg("Failed to resolve Google Maps link.");
        }
      } finally {
        setIsSearchingAddress(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [addressSearchQuery]);

  useEffect(() => {
    if (currentOutlet) {
      setCgstInput(String(currentOutlet.cgstRateDecimal ?? 2.5));
      setSgstInput(String(currentOutlet.sgstRateDecimal ?? 2.5));
      setServiceTaxInput(String(currentOutlet.serviceTaxRateDecimal ?? 0.0));
      setGstinInput(currentOutlet.gstin || "");
      setOutletPhoneInput(currentOutlet.phone || "");
      setTaglineInput(currentOutlet.receiptTagline || "Serving joy every day.");
      setFooterInput(currentOutlet.receiptFooter || "Thanks for stopping by!\nWe hope to see you again soon!");
      setUpiIdInput(currentOutlet.upiId || "");
      setKitchenModeInput((currentOutlet as any).kitchenMode || "HYBRID");
      setEarlyBufferMins(currentOutlet.earlyBufferMinutes ?? 30);
      setLateGraceMins(currentOutlet.lateGraceMinutes ?? 30);
      if (currentOutlet.latitude && currentOutlet.longitude) {
        setLatitude(Number(currentOutlet.latitude));
        setLongitude(Number(currentOutlet.longitude));
        fetchLocationName(Number(currentOutlet.latitude), Number(currentOutlet.longitude));
      }
      if (currentOutlet.geofenceRadius) setGeofenceRadius(Number(currentOutlet.geofenceRadius));
    }
  }, [currentOutlet]);

  const holidays = holidaysData?.data || [];
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Holiday Form State
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    type: "FESTIVAL", // FESTIVAL | WEEKLY_CLOSED | MAINTENANCE
    description: "",
  });

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHoliday(holidayForm).unwrap();
      setFeedbackMsg("Outlet Holiday / Closure saved successfully!");
      setHolidayForm({
        name: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        type: "FESTIVAL",
        description: "",
      });
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to add outlet holiday");
    }
  };

  const handleSaveTaxRates = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOutletId = activeBranch?.id || "all";
    const cgst = parseFloat(cgstInput);
    const sgst = parseFloat(sgstInput);
    const serviceTax = parseFloat(serviceTaxInput) || 0;
    if (isNaN(cgst) || isNaN(sgst) || cgst < 0 || sgst < 0 || serviceTax < 0) {
      setFeedbackMsg("Please enter valid positive tax percentage values.");
      return;
    }
    try {
      await updateTaxRates({ outletId: targetOutletId, cgstRate: cgst, sgstRate: sgst, serviceTaxRate: serviceTax }).unwrap();
      const scopeLabel = targetOutletId === "all" ? "ALL Outlets" : (currentOutlet?.name || "selected branch");
      const totalCombined = (cgst + sgst + serviceTax).toFixed(2);
      setFeedbackMsg(`Tax Rates updated successfully for ${scopeLabel}! (${cgst}% CGST + ${sgst}% SGST + ${serviceTax}% Service Tax = ${totalCombined}% Total Tax)`);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to update tax rates.");
    }
  };

  const handleSaveReceiptDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOutletId = activeBranch?.id || "all";
    try {
      await updateReceiptDetails({
        outletId: targetOutletId,
        gstin: gstinInput.trim() || undefined,
        phone: outletPhoneInput.trim() || undefined,
        receiptTagline: taglineInput.trim() || undefined,
        receiptFooter: footerInput.trim() || undefined,
        upiId: upiIdInput.trim() || undefined,
      }).unwrap();
      const scopeLabel = targetOutletId === "all" ? "ALL Outlets" : (currentOutlet?.name || "selected branch");
      setFeedbackMsg(`AlaynAI Receipt & GST Configuration updated successfully for ${scopeLabel}!`);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to update receipt details.");
    }
  };

  const handleSaveKitchenMode = async (mode: "KOT" | "KDS" | "HYBRID") => {
    setKitchenModeInput(mode);
    const targetOutletId = activeBranch?.id || "all";
    try {
      await updateKitchenMode({ outletId: targetOutletId, kitchenMode: mode }).unwrap();
      const modeLabel =
        mode === "KOT"
          ? "KOT Thermal Print Mode"
          : mode === "KDS"
          ? "KDS Screen Mode"
          : "Hybrid Mode (Both KOT + KDS)";
      setFeedbackMsg(`Kitchen Operating Mode updated to ${modeLabel}!`);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to update kitchen operating mode.");
    }
  };

  const handleSaveAttendanceRules = async (next: { earlyBufferMinutes: number; lateGraceMinutes: number }) => {
    const previous = { early: earlyBufferMins, grace: lateGraceMins };
    setEarlyBufferMins(next.earlyBufferMinutes);
    setLateGraceMins(next.lateGraceMinutes);
    const targetOutletId = activeBranch?.id || "all";
    try {
      await updateAttendanceRules({ outletId: targetOutletId, ...next }).unwrap();
      const scopeLabel = targetOutletId === "all" ? "ALL Outlets" : (currentOutlet?.name || "selected branch");
      setFeedbackMsg(
        `Attendance rules updated for ${scopeLabel}: early clock-in ${next.earlyBufferMinutes} mins, late grace ${next.lateGraceMinutes} mins.`
      );
    } catch (err: any) {
      setEarlyBufferMins(previous.early);
      setLateGraceMins(previous.grace);
      setFeedbackMsg(err?.data?.message || "Failed to update attendance rules.");
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          fetchLocationName(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setFeedbackMsg("Location access denied or unavailable.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setFeedbackMsg("Geolocation is not supported by your browser.");
    }
  };

  const handleSaveLocation = async () => {
    const targetOutletId = activeBranch?.id || "all";
    if (latitude === null || longitude === null) {
      setFeedbackMsg("Please capture location first.");
      return;
    }
    try {
      await updateLocation({
        outletId: targetOutletId,
        latitude,
        longitude,
        geofenceRadius,
      }).unwrap();
      const scopeLabel = targetOutletId === "all" ? "ALL Outlets" : (currentOutlet?.name || "selected branch");
      setFeedbackMsg(`Geofence Location updated successfully for ${scopeLabel}!`);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to update location details.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-[#D3232A]" />
              Store Settings & Configuration
            </h1>
            <p className="text-sm text-gray-500">
              Manage store holidays, operating schedules, policies, and branch configuration.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab("HOLIDAYS")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "HOLIDAYS"
                  ? "bg-white text-[#D3232A] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Palmtree className="h-4 w-4" />
              Outlet Holidays & Closures
            </button>
            <button
              onClick={() => setActiveTab("GENERAL")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "GENERAL"
                  ? "bg-white text-[#D3232A] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Store className="h-4 w-4" />
              General Preferences
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm font-medium">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)}>
              <X className="h-4 w-4 text-blue-600 hover:text-blue-900" />
            </button>
          </div>
        )}

        {activeTab === "HOLIDAYS" ? (
          /* Outlet Holidays & Store Closures View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Holiday Form Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Palmtree className="h-5 w-5 text-amber-600" />
                  Add Store Holiday / Closure
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Configure festival closures, maintenance, or cafe off-days for {activeBranch?.name || "all branches"}.
                </p>
              </div>

              <form onSubmit={handleCreateHoliday} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Holiday Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                    placeholder="e.g. Diwali Festival / Store Maintenance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={holidayForm.startDate}
                      onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={holidayForm.startDate}
                      value={holidayForm.endDate}
                      onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Closure Category
                  </label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A] bg-white"
                  >
                    <option value="FESTIVAL">Festival Holiday</option>
                    <option value="WEEKLY_CLOSED">Weekly Closed Day</option>
                    <option value="MAINTENANCE">Store Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Notes / Description
                  </label>
                  <textarea
                    rows={2}
                    value={holidayForm.description}
                    onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                    placeholder="Optional details for staff..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingHoliday}
                  className="w-full flex items-center justify-center gap-2 bg-[#D3232A] hover:bg-[#b01e23] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingHoliday ? "Saving..." : "Save Store Holiday"}
                </button>
              </form>
            </div>

            {/* Configured Holidays List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      Configured Outlet Holidays
                    </h3>
                    <p className="text-xs text-gray-500">
                      Active holiday calendar for {activeBranch?.name || "All Branches"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-200/60 px-3 py-1 rounded-full">
                    {holidays.length} Total Holiday(s)
                  </span>
                </div>

                <div className="divide-y divide-gray-200">
                  {holidays.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 space-y-2">
                      <Palmtree className="h-10 w-10 text-amber-500 mx-auto opacity-40" />
                      <p className="text-sm font-medium text-gray-900">No Store Holidays Configured Yet</p>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Use the form on the left to add festival closures, public holidays, or weekly off days for your cafe branch.
                      </p>
                    </div>
                  ) : (
                    holidays.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                            <Palmtree className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                                {item.type || "FESTIVAL"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                {new Date(item.date).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {item.outlet?.name && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                  {item.outlet.name}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* General Store Preferences View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kitchen Operating Setup (KOT vs KDS) Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Printer className="h-5 w-5 text-[#1B2A4A]" />
                    Kitchen Dispatch & Order Setup (KOT vs KDS)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Select how line cooks and kitchen staff receive order tickets at{" "}
                    <span className="font-bold text-gray-800">
                      {activeBranch?.id === "all" ? "All Outlets" : (currentOutlet?.name || activeBranch?.name || "selected branch")}
                    </span>. Changes take effect immediately.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-gray-500">Active Mode:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                    kitchenModeInput === "KOT"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : kitchenModeInput === "KDS"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}>
                    {kitchenModeInput === "KOT" ? "KOT Thermal Only" : kitchenModeInput === "KDS" ? "KDS Screen Only" : "Hybrid (KOT + KDS)"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* KOT Mode */}
                <div
                  onClick={() => handleSaveKitchenMode("KOT")}
                  className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    kitchenModeInput === "KOT"
                      ? "border-[#1B2A4A] bg-[#1B2A4A]/5 shadow-sm ring-1 ring-[#1B2A4A]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-2 rounded-xl ${kitchenModeInput === "KOT" ? "bg-[#1B2A4A] text-white" : "bg-gray-100 text-gray-700"}`}>
                        <Printer className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Paper Thermal
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#1B2A4A]">KOT Thermal Print</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Orders trigger physical 80mm/58mm printed kitchen tickets. Cooks work off physical paper. Zero screen interaction needed in hot kitchens.
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">Standard Indian Kitchens</span>
                    {kitchenModeInput === "KOT" && <CheckCircle2 className="w-4 h-4 text-[#1B2A4A]" />}
                  </div>
                </div>

                {/* KDS Mode */}
                <div
                  onClick={() => handleSaveKitchenMode("KDS")}
                  className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    kitchenModeInput === "KDS"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-2 rounded-xl ${kitchenModeInput === "KDS" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Digital Screen
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-900">KDS Digital Display</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Real-time interactive touchscreen Kanban board (Prep &rarr; Ready &rarr; Served) with 3-minute cancellation retention & countdown auto-dismiss.
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">Paperless Operations</span>
                    {kitchenModeInput === "KDS" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                </div>

                {/* HYBRID Mode */}
                <div
                  onClick={() => handleSaveKitchenMode("HYBRID")}
                  className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    kitchenModeInput === "HYBRID"
                      ? "border-[#D3232A] bg-red-50/40 shadow-sm ring-1 ring-[#D3232A]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-2 rounded-xl ${kitchenModeInput === "HYBRID" ? "bg-[#D3232A] text-white" : "bg-gray-100 text-gray-700"}`}>
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Recommended
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-900">Hybrid (Both KOT + KDS)</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Instantly prints physical thermal slips for cooking station cooks while manager/expediter tracks ticket statuses on digital KDS screen.
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">Full Dual Dispatch</span>
                    {kitchenModeInput === "HYBRID" && <CheckCircle2 className="w-4 h-4 text-[#D3232A]" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Tax & GST Configuration Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 h-fit">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-[#D3232A]" />
                  GST & Tax Rate Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Configure CGST & SGST percentages applied to POS orders, billing receipts, and QR ordering for{" "}
                  <span className="font-bold text-gray-800">{activeBranch?.id === "all" ? "All Outlets (Business-wide)" : (currentOutlet?.name || activeBranch?.name || "selected branch")}</span>.
                </p>
              </div>

              <form onSubmit={handleSaveTaxRates} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      CGST (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        value={cgstInput}
                        onChange={(e) => setCgstInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        placeholder="2.5"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      SGST (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        value={sgstInput}
                        onChange={(e) => setSgstInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        placeholder="2.5"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Service Tax (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        value={serviceTaxInput}
                        onChange={(e) => setServiceTaxInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        placeholder="0.0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Total Combined Tax:</span>
                  <span className="text-sm font-black text-[#D3232A]">
                    {((parseFloat(cgstInput) || 0) + (parseFloat(sgstInput) || 0) + (parseFloat(serviceTaxInput) || 0)).toFixed(2)}% Total Tax
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingTax}
                  className="w-full flex items-center justify-center gap-2 bg-[#D3232A] hover:bg-[#b01e23] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-sm"
                >
                  <Percent className="h-4 w-4" />
                  {isUpdatingTax ? "Saving Tax Rates..." : "Save Tax Rates"}
                </button>
              </form>

              {/* ── AlaynAI Thermal Receipt & GST Details Card ── */}
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-600" />
                    AlaynAI Receipt & GST Branding
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure GSTIN, outlet phone number, custom header tagline, footer message, and UPI payment QR ID printed on thermal bills.
                  </p>
                </div>

                <form onSubmit={handleSaveReceiptDetails} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        GSTIN Number
                      </label>
                      <input
                        type="text"
                        value={gstinInput}
                        onChange={(e) => setGstinInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        placeholder="27AAZFN6174F1ZL"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Outlet Contact Phone
                      </label>
                      <input
                        type="text"
                        value={outletPhoneInput}
                        onChange={(e) => setOutletPhoneInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        placeholder="8104484386"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        UPI VPA / QR ID
                      </label>
                      <input
                        type="text"
                        value={upiIdInput}
                        onChange={(e) => setUpiIdInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        placeholder="merchant@upi"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Receipt Header Tagline
                      </label>
                      <input
                        type="text"
                        value={taglineInput}
                        onChange={(e) => setTaglineInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        placeholder="Serving joy every day."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Receipt Footer Note / Greeting
                    </label>
                    <textarea
                      rows={2}
                      value={footerInput}
                      onChange={(e) => setFooterInput(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                      placeholder="Thanks for stopping by! We hope to see you again soon!"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingReceipt}
                    className="w-full flex items-center justify-center gap-2 bg-[#D3232A] hover:bg-[#b01e23] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-sm"
                  >
                    <Receipt className="h-4 w-4" />
                    {isUpdatingReceipt ? "Saving Receipt Details..." : "Save Thermal Receipt Details"}
                  </button>
                </form>
              </div>
            </div>

            {/* General Policy Parameters */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 h-fit">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Store className="h-5 w-5 text-indigo-600" />
                  Branch Configuration & Policies
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">General store operating parameters and attendance rules.</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Current Branch Context</div>
                    <div className="text-xs text-gray-500 mt-0.5">{activeBranch?.name || "All Branches Selected"}</div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    ACTIVE
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Early Clock-in Window (Prior to Shift)</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Maximum allowed early punch-in window before scheduled shift start time.
                    </div>
                  </div>
                  <select
                    value={earlyBufferMins}
                    disabled={!isManagerOrOwner || isUpdatingAttendanceRules}
                    onChange={(e) =>
                      handleSaveAttendanceRules({
                        earlyBufferMinutes: Number(e.target.value),
                        lateGraceMinutes: lateGraceMins,
                      })
                    }
                    className="text-xs font-bold text-gray-800 bg-white border border-gray-300 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value={15}>15 Mins Prior</option>
                    <option value={20}>20 Mins Prior</option>
                    <option value={25}>25 Mins Prior</option>
                    <option value={30}>30 Mins Prior (Default)</option>
                    <option value={45}>45 Mins Prior</option>
                    <option value={60}>60 Mins Prior</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Late Arrival Grace Period</div>
                    <div className="text-xs text-gray-500 mt-0.5">Automatic LATE status tag if employee punches in after grace period</div>
                  </div>
                  <select
                    value={lateGraceMins}
                    disabled={!isManagerOrOwner || isUpdatingAttendanceRules}
                    onChange={(e) =>
                      handleSaveAttendanceRules({
                        earlyBufferMinutes: earlyBufferMins,
                        lateGraceMinutes: Number(e.target.value),
                      })
                    }
                    className="text-xs font-bold text-gray-800 bg-white border border-gray-300 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value={5}>5 Mins Grace</option>
                    <option value={10}>10 Mins Grace</option>
                    <option value={15}>15 Mins Grace</option>
                    <option value={20}>20 Mins Grace</option>
                    <option value={30}>30 Mins Grace (Default)</option>
                  </select>
                </div>

                {/* Geofence Configuration */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#D3232A]" />
                        Geofenced Clock-In Area
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">Employees can only clock in if their device is within this radius of the outlet.</div>
                    </div>
                    <select
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                      className="text-xs font-bold text-gray-800 bg-white border border-gray-300 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value={50}>50 Meters</option>
                      <option value={100}>100 Meters (Standard)</option>
                      <option value={200}>200 Meters</option>
                      <option value={500}>500 Meters</option>
                    </select>
                  </div>
                  {/* Manual Address Search */}
                  <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 space-y-1">
                    <p className="font-semibold">Choose <span className="underline decoration-blue-300 decoration-2 underline-offset-2">one</span> of these ways to set your location:</p>
                    <ul className="list-disc pl-4 space-y-0.5 mt-1">
                      <li><strong>Type an address</strong> to search for nearby places, <span className="font-bold text-blue-900 ml-1">OR</span></li>
                      <li><strong>Paste a Google Maps link</strong> (e.g. maps.app.goo.gl/...) for exact pinpoint accuracy, <span className="font-bold text-blue-900 ml-1">OR</span></li>
                      <li><strong>Click "Capture My Location"</strong> if you are physically present at the outlet.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search address remotely (e.g. Veena Beena, Bandra)"
                          value={addressSearchQuery}
                          onChange={(e) => setAddressSearchQuery(e.target.value)}
                          className="w-full text-sm bg-white border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        />
                        {isSearchingAddress && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#D3232A] rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    {addressSearchResults.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                        {addressSearchResults.map((result: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setLatitude(Number(result.lat));
                              setLongitude(Number(result.lon));
                              setLocationName(result.display_name);
                              setAddressSearchResults([]);
                              setAddressSearchQuery("");
                              setFeedbackMsg("Address selected! Coordinates updated.");
                            }}
                            className="px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 border-b last:border-b-0 border-gray-100 cursor-pointer transition-colors"
                          >
                            <div className="font-semibold">{result.name || "Location"}</div>
                            <div className="text-gray-500 truncate" title={result.display_name}>{result.display_name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-700 font-mono overflow-hidden">
                      {latitude && longitude ? (
                        <div className="flex flex-col">
                          <span>Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}</span>
                          {locationName && <span className="text-gray-500 mt-1 truncate max-w-[300px]" title={locationName}>{locationName}</span>}
                        </div>
                      ) : (
                        <span className="text-gray-400">Location not captured</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleGetLocation}
                        className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        Capture My Location
                      </button>
                      <button
                        onClick={handleSaveLocation}
                        disabled={isUpdatingLocation || !latitude}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-md transition-colors disabled:opacity-50"
                      >
                        {isUpdatingLocation ? "Saving..." : "Save Config"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Workforce Security & Role Access</div>
                    <div className="text-xs text-gray-500 mt-0.5">Staff & Kitchen restricted to personal shift calendars & leaves</div>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
