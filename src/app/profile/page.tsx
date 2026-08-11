"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAppSelector, useAppDispatch } from "@/redux/store/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "@/redux/slices/authApiSlice";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  Key,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
} from "lucide-react";

// Helper for initials avatar
function getInitials(name: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  // Form state
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNo: "",
    nickName: "",
    timeZone: "(GMT+05:30) India Standard Time",
    country: "India",
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Password section state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPw }] =
    useChangePasswordMutation();

  // Sync initial state
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.name || "",
      phoneNo: user?.phoneNo || "",
      nickName: user?.name ? user.name.split(" ")[0] : "",
    }));
  }, [user]);

  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      name: user?.name || "",
      phoneNo: user?.phoneNo || "",
      nickName: user?.name ? user.name.split(" ")[0] : "",
    }));
    setSaveErrorMsg(null);
    setEditMode(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    if (!formData.name.trim()) {
      setSaveErrorMsg("Full Name cannot be empty.");
      return;
    }

    try {
      const res = await updateProfile({
        name: formData.name,
        phoneNo: formData.phoneNo,
      }).unwrap();
      const updatedUser = res?.data || res;
      dispatch(setCredentials({ user: updatedUser }));
      setSaveSuccessMsg("Profile updated successfully!");
      setEditMode(false);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveErrorMsg(
        err?.data?.error?.message ||
          err?.data?.message ||
          err?.data?.error ||
          "Failed to update profile."
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccessMsg(null);
    setPwErrorMsg(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErrorMsg("New passwords do not match.");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwErrorMsg("New password must be at least 6 characters.");
      return;
    }

    try {
      await changePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      }).unwrap();
      setPwSuccessMsg("Password updated successfully!");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
      setTimeout(() => setPwSuccessMsg(null), 4000);
    } catch (err: any) {
      setPwErrorMsg(
        err?.data?.error?.message ||
          err?.data?.message ||
          err?.data?.error ||
          "Failed to update password."
      );
    }
  };

  const initials = getInitials(user?.name || "");
  const roleLabel =
    user?.role === "BUSINESS_OWNER"
      ? "Business Owner"
      : user?.role === "MANAGER"
      ? "Outlet Manager"
      : user?.role === "KITCHEN"
      ? "Kitchen Staff"
      : user?.role === "STAFF"
      ? "Staff Member"
      : user?.role || "User Account";

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6 text-[#1B2A4A] pb-16">
          
          {/* Top Feedback Notifications */}
          {saveSuccessMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
          {pwSuccessMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{pwSuccessMsg}</span>
            </div>
          )}

          {/* ─── Main Profile Card (Matching Design Layout) ───────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible mt-8">
            
         

            {/* Profile Content Container */}
            <div className="px-6 sm:px-10 pb-10 relative">

              {/* User Avatar + Name/Email + Edit Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-12 mb-8">
                <div className="flex items-center gap-5">
                  {/* Round Avatar Container */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-[#1B2A4A] to-[#D3232A] text-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold shrink-0 tracking-tight">
                    {initials}
                  </div>
                  {/* User Name & Email */}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1B2A4A] tracking-tight">
                      {user?.name || "Alexa Rawles"}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                      {user?.email || "alexarawles@gmail.com"}
                    </p>
                  </div>
                </div>

                {/* Right Side Edit Button */}
                <div className="self-start sm:self-center">
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D3232A] text-white hover:bg-[#b81d23] transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="px-6 py-2 text-xs font-bold rounded-xl bg-[#D3232A] text-white hover:bg-[#b81d23] transition shadow-xs flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Error feedback banner */}
              {saveErrorMsg && (
                <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveErrorMsg}</span>
                </div>
              )}

              {/* Edit Mode Helper Indicator Banner */}
              {editMode && (
                <div className="mb-6 p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-xs font-medium text-[#D3232A] flex items-center justify-between animate-in fade-in">
                  <span className="flex items-center gap-2 font-semibold">
                    <Edit3 className="w-4 h-4" />
                    Edit Mode Active — Fields highlighted with red borders are editable
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-[#D3232A] text-white rounded-md">
                    Editing
                  </span>
                </div>
              )}

              {/* ─── 2-Column Grid Fields (Matching Image Layout) ───────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-10">
                
                {/* Editable Field 1: Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5">
                      Full Name
                    </label>
                    {editMode && (
                      <span className="text-[10px] font-extrabold text-[#D3232A] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Editable
                      </span>
                    )}
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your First Name"
                      className="w-full px-4 py-3 bg-white border-2 border-[#D3232A] rounded-xl text-sm font-semibold text-[#1B2A4A] focus:outline-none focus:ring-4 focus:ring-[#D3232A]/10 shadow-xs transition"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-100 rounded-xl text-sm text-gray-800 font-medium">
                      {user?.name || "Your First Name"}
                    </div>
                  )}
                </div>

                {/* Editable Field 2: Nick Name / Phone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5">
                      Nick Name / Phone
                    </label>
                    {editMode && (
                      <span className="text-[10px] font-extrabold text-[#D3232A] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Editable
                      </span>
                    )}
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.phoneNo}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNo: e.target.value })
                      }
                      placeholder="Your Phone / Nick Name"
                      className="w-full px-4 py-3 bg-white border-2 border-[#D3232A] rounded-xl text-sm font-semibold text-[#1B2A4A] focus:outline-none focus:ring-4 focus:ring-[#D3232A]/10 shadow-xs transition"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-100 rounded-xl text-sm text-gray-800 font-medium">
                      {user?.phoneNo || formData.nickName || "Your Phone Number"}
                    </div>
                  )}
                </div>

                {/* Read-Only Field: Account Role */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#1B2A4A]">
                      Account Role
                    </label>
                    {editMode && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> System Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium flex items-center justify-between transition ${
                        editMode
                          ? "bg-[#F1F5F9] border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#F8FAFC] border-gray-100 text-gray-700"
                      }`}
                    >
                      <span>{roleLabel}</span>
                      {editMode ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Read-Only Field: Country */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#1B2A4A]">
                      Country
                    </label>
                    {editMode && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> System Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium flex items-center justify-between transition ${
                        editMode
                          ? "bg-[#F1F5F9] border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#F8FAFC] border-gray-100 text-gray-700"
                      }`}
                    >
                      <span>{formData.country}</span>
                      {editMode ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Read-Only Field: Time Zone */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#1B2A4A]">
                      Time Zone
                    </label>
                    {editMode && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> System Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium flex items-center justify-between transition ${
                        editMode
                          ? "bg-[#F1F5F9] border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#F8FAFC] border-gray-100 text-gray-700"
                      }`}
                    >
                      <span>{formData.timeZone}</span>
                      {editMode ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── My Email Address Section ─────────────────────────────────── */}
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <h3 className="text-base font-bold text-[#1B2A4A]">
                  My email Address
                </h3>

                {/* Active Primary Email Item Box */}
                <div className="flex items-center gap-3.5 p-3.5 bg-gray-50/80 border border-gray-200/70 rounded-xl max-w-md">
                  <div className="w-9 h-9 rounded-full bg-red-50 text-[#D3232A] flex items-center justify-center shrink-0 border border-red-100">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1B2A4A]">
                      {user?.email || "alexarawles@gmail.com"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Verified primary email address · Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Security & Password Card ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header Accordion Toggle */}
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full px-6 sm:px-10 py-5 flex items-center justify-between hover:bg-gray-50/80 transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1B2A4A]">
                    Security &amp; Password
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update your account password and security credentials
                  </p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg text-gray-400 bg-gray-50 border border-gray-200">
                {showPasswordSection ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Collapsible Form Body */}
            {showPasswordSection && (
              <div className="px-6 sm:px-10 pb-8 pt-2 border-t border-gray-100">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {pwErrorMsg && (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{pwErrorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-bold text-[#1B2A4A] mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPw ? "text" : "password"}
                          required
                          value={pwForm.oldPassword}
                          onChange={(e) =>
                            setPwForm({ ...pwForm, oldPassword: e.target.value })
                          }
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#1B2A4A] focus:outline-none focus:border-[#D3232A] focus:bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPw(!showOldPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showOldPw ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-[#1B2A4A] mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          required
                          value={pwForm.newPassword}
                          onChange={(e) =>
                            setPwForm({ ...pwForm, newPassword: e.target.value })
                          }
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#1B2A4A] focus:outline-none focus:border-[#D3232A] focus:bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showNewPw ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-[#1B2A4A] mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          required
                          value={pwForm.confirmPassword}
                          onChange={(e) =>
                            setPwForm({
                              ...pwForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-[#1B2A4A] focus:outline-none focus:border-[#D3232A] focus:bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showConfirmPw ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={isChangingPw}
                      className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#D3232A] text-white hover:bg-[#b81d23] transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      <Key className="w-4 h-4" />
                      {isChangingPw ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
