"use client";

import React, { memo } from "react";
import { Truck, Clock, CheckCircle2, AlertTriangle, ShieldCheck, FileText } from "lucide-react";

interface SupplierPerf {
  name: string;
  category: string;
  avgDeliveryHours: number;
  fulfillmentPct: number;
  damagedPct: number;
  status: "EXCELLENT" | "GOOD" | "DELAYED";
}

const SUPPLIERS_PERF: SupplierPerf[] = [
  { name: "Amul Dairy Pvt Ltd", category: "Dairy", avgDeliveryHours: 12, fulfillmentPct: 99.2, damagedPct: 0.1, status: "EXCELLENT" },
  { name: "Blue Tokai Coffee", category: "Beverages", avgDeliveryHours: 18, fulfillmentPct: 98.0, damagedPct: 0.2, status: "EXCELLENT" },
  { name: "Verka Dairy Supplies", category: "Dairy", avgDeliveryHours: 36, fulfillmentPct: 91.5, damagedPct: 1.8, status: "DELAYED" },
];

export const PurchaseAnalyticsSection = memo(function PurchaseAnalyticsSection() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 tracking-tight">Purchase Orders &amp; Supplier Telemetry</h3>
          <p className="text-xs text-zinc-400 font-medium">Order fulfillment rates, vendor lead times &amp; damaged goods tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-semibold">Active POs: 4 Pending · 1 Delayed</span>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-600">Placed / Pending</span>
          <span className="text-xl font-extrabold mt-0.5 block">4 Orders</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-600">Delayed Shipments</span>
          <span className="text-xl font-extrabold mt-0.5 block">1 Order</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600">Completed (MTD)</span>
          <span className="text-xl font-extrabold mt-0.5 block">28 Orders</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-zinc-400">Damaged Goods Rate</span>
          <span className="text-xl font-extrabold mt-0.5 block">0.4%</span>
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 text-zinc-400 font-semibold uppercase tracking-wider text-[11px] border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3">Supplier Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-center">Avg Lead Time</th>
              <th className="px-4 py-3 text-center">Fulfillment %</th>
              <th className="px-4 py-3 text-center">Damaged Rate</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {SUPPLIERS_PERF.map((sup, i) => (
              <tr key={i} className="hover:bg-zinc-50/60 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">{sup.name}</td>
                <td className="px-4 py-3 text-zinc-500 font-medium">{sup.category}</td>
                <td className="px-4 py-3 text-center font-bold text-zinc-800">{sup.avgDeliveryHours} hrs</td>
                <td className="px-4 py-3 text-center font-semibold text-emerald-700">{sup.fulfillmentPct}%</td>
                <td className="px-4 py-3 text-center font-medium text-zinc-600">{sup.damagedPct}%</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                      sup.status === "EXCELLENT"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {sup.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
