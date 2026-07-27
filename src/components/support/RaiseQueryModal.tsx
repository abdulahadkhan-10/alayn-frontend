"use client";

import React, { useState } from "react";
import { X, Send, AlertTriangle, HelpCircle, ShieldAlert, Sparkles, Building2 } from "lucide-react";
import { useCreateStaffQueryMutation } from "@/redux/slices/ticketApiSlice";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import { cn } from "@/lib/utils";

interface RaiseQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  activeOutletId?: string;
}

const CATEGORIES = [
  "Shift & Roster Issue",
  "Pay & Benefits Query",
  "Equipment & Maintenance",
  "Safety & Workplace Concern",
  "Manager Escalation",
  "General Concern",
];

export default function RaiseQueryModal({ isOpen, onClose, userRole, activeOutletId }: RaiseQueryModalProps) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<"NORMAL" | "HIGH">("NORMAL");
  const [description, setDescription] = useState("");
  const [selectedOutletId, setSelectedOutletId] = useState(activeOutletId || "");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: outletsData } = useGetOutletsQuery();
  const [createStaffQuery, { isLoading }] = useCreateStaffQueryMutation();

  const outlets = Array.isArray(outletsData)
    ? outletsData
    : (outletsData as any)?.data || [];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!description.trim()) {
      setErrorMsg("Please describe your concern or query.");
      return;
    }

    try {
      await createStaffQuery({
        category,
        description: description.trim(),
        priority,
        outletId: selectedOutletId || activeOutletId,
      }).unwrap();

      setDescription("");
      setPriority("NORMAL");
      setCategory(CATEGORIES[0]);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.message || "Failed to submit query. Please try again.");
    }
  };

  const isManager = userRole === "MANAGER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isManager ? "Raise Concern to Business Owner" : "Submit Query / Concern"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isManager
                ? "Report operational concerns directly to business leadership."
                : "Your concern will be routed to your branch manager and business owner."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Branch Outlet Selector (if available) */}
          {outlets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-gray-400" />
                Branch / Outlet Location
              </label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A] bg-white cursor-pointer"
              >
                <option value="" className="text-gray-500">
                  Select Location (Default Current Branch)
                </option>
                {outlets.map((o: any) => (
                  <option key={o.id} value={o.id} className="text-gray-900">
                    {o.name} ({o.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A] bg-white cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="text-gray-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency / Priority</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority("NORMAL")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  priority === "NORMAL"
                    ? "border-blue-300 bg-blue-50 text-blue-700 shadow-xs"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                <Sparkles className="h-4 w-4" />
                Normal Priority
              </button>
              <button
                type="button"
                onClick={() => setPriority("HIGH")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  priority === "HIGH"
                    ? "border-rose-300 bg-rose-50 text-rose-700 shadow-xs"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                <ShieldAlert className="h-4 w-4" />
                High / Urgent
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details & Explanation
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your question, issue, or concern clearly..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b01e23] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Concern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
