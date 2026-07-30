"use client";

import React, { memo } from "react";
import { Package, ShieldAlert, Clock, ArrowRight } from "lucide-react";

interface InventorySummary {
  totalValue: number;
  healthScore: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  avgDaysRemaining: number;
  turnoverRatio: number;
}

const DEFAULT_SUMMARY: InventorySummary = {
  totalValue: 845000,
  healthScore: 92,
  lowStockCount: 4,
  outOfStockCount: 1,
  expiringSoonCount: 3,
  avgDaysRemaining: 12.5,
  turnoverRatio: 4.8,
};

const PREDICTED_STOCKOUTS = [
  { item: "Amul Full Cream Milk", currentStock: "14 L", predictedOutDate: "Tomorrow 2:00 PM", suggestedPOQty: "50 L", supplier: "Amul Dairy", riskLevel: "HIGH" },
  { item: "Espresso Beans (Arabica)", currentStock: "3.5 kg", predictedOutDate: "30 Jul (2 Days)", suggestedPOQty: "15 kg", supplier: "Blue Tokai", riskLevel: "MEDIUM" },
  { item: "Mozzarella Cheese Blocks", currentStock: "2.1 kg", predictedOutDate: "31 Jul (3 Days)", suggestedPOQty: "20 kg", supplier: "Verka Dairy", riskLevel: "MEDIUM" },
];

export const InventoryAnalyticsSection = memo(function InventoryAnalyticsSection() {
  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-6">
      {/* Nory-Inspired Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#0B1221] tracking-tight">Inventory Health &amp; Depletion Velocity</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Nory Intelligence Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Valuation, turnover speed, predictive stockouts &amp; suggested PO quantities</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#0B1221] bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200/80">
            Valuation: ₹{DEFAULT_SUMMARY.totalValue.toLocaleString("en-IN")}
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Inventory Score: {DEFAULT_SUMMARY.healthScore}/100
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
          <span className="text-[10.5px] font-bold uppercase text-zinc-400 block">Low Stock</span>
          <span className="text-lg font-extrabold text-orange-600 mt-0.5 block">{DEFAULT_SUMMARY.lowStockCount} items</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
          <span className="text-[10.5px] font-bold uppercase text-zinc-400 block">Out of Stock</span>
          <span className="text-lg font-extrabold text-[#D3232A] mt-0.5 block">{DEFAULT_SUMMARY.outOfStockCount} item</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
          <span className="text-[10.5px] font-bold uppercase text-zinc-400 block">Expiring Soon</span>
          <span className="text-lg font-extrabold text-orange-600 mt-0.5 block">{DEFAULT_SUMMARY.expiringSoonCount} batches</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
          <span className="text-[10.5px] font-bold uppercase text-zinc-400 block">Days Coverage</span>
          <span className="text-lg font-extrabold text-[#0B1221] mt-0.5 block">{DEFAULT_SUMMARY.avgDaysRemaining} days</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
          <span className="text-[10.5px] font-bold uppercase text-zinc-400 block">Turnover Velocity</span>
          <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">{DEFAULT_SUMMARY.turnoverRatio}x / mo</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
          <span className="text-[10.5px] font-bold uppercase text-zinc-400 block">Ageing / Dead Stock</span>
          <span className="text-lg font-extrabold text-zinc-700 mt-0.5 block">₹14,200</span>
        </div>
      </div>

      {/* Predicted Stockout & Suggested Quantities Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Predicted Stockout Horizon &amp; Suggested PO Quantities</h4>
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3.5">Ingredient Item</th>
                <th className="px-4 py-3.5">Current Stock</th>
                <th className="px-4 py-3.5">Predicted Stockout</th>
                <th className="px-4 py-3.5">Suggested Reorder Qty</th>
                <th className="px-4 py-3.5">Primary Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {PREDICTED_STOCKOUTS.map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-[#0B1221]">{row.item}</td>
                  <td className="px-4 py-3.5 font-extrabold text-orange-600">{row.currentStock}</td>
                  <td className="px-4 py-3.5 font-extrabold text-[#D3232A]">{row.predictedOutDate}</td>
                  <td className="px-4 py-3.5 font-extrabold text-emerald-700">{row.suggestedPOQty}</td>
                  <td className="px-4 py-3.5 text-zinc-600 font-semibold">{row.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
