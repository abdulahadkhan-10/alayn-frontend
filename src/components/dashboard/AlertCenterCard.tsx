"use client";

import React, { memo } from "react";
import { Bell, AlertTriangle, Clock } from "lucide-react";

interface AlertItem {
  id: string;
  type: "STOCK" | "EXPIRY" | "PO" | "RATING" | "WASTE" | "TICKET";
  title: string;
  detail: string;
  time: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

const ALERTS: AlertItem[] = [
  { id: "1", type: "STOCK", title: "Amul Full Cream Milk Low Stock", detail: "14 L remaining (below 25 L threshold)", time: "10m ago", severity: "HIGH" },
  { id: "2", type: "EXPIRY", title: "3 Dairy Batches Expiring Soon", detail: "Expiry date in 48 hours for Batch BCH-8902", time: "45m ago", severity: "HIGH" },
  { id: "3", type: "PO", title: "Delayed Purchase Order #PO-9821", detail: "Supplier Verka Dairy past estimated delivery time", time: "1h ago", severity: "MEDIUM" },
  { id: "4", type: "RATING", title: "Customer Review Alert (2 Stars)", detail: "Slow delivery complaint logged on Soho Branch", time: "2h ago", severity: "LOW" },
];

export const AlertCenterCard = memo(function AlertCenterCard() {
  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl bg-red-50 text-[#D3232A] flex items-center justify-center border border-red-100 shrink-0">
            <Bell className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#1B2A4A] tracking-tight truncate">Executive Alert Center</h3>
            <p className="text-xs text-zinc-400 font-medium truncate">Real-time notification feed across operational risk categories</p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#D3232A] bg-red-50 px-3 py-1 rounded-xl border border-red-200/80 shrink-0 whitespace-nowrap">
          {ALERTS.length} Alerts Active
        </span>
      </div>

      {/* Alert Feed */}
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
        {ALERTS.map((alert) => (
          <div key={alert.id} className="p-4 bg-white hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="mt-0.5 shrink-0">
                {alert.severity === "HIGH" ? (
                  <AlertTriangle className="h-4 w-4 text-[#D3232A]" />
                ) : (
                  <Clock className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#1B2A4A] leading-snug">{alert.title}</p>
                <p className="text-zinc-500 font-medium mt-0.5">{alert.detail}</p>
              </div>
            </div>

            <span className="text-xs text-zinc-400 font-medium shrink-0 ml-2">{alert.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
