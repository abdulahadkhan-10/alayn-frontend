"use client";

import React from "react";
import type { OutletComparisonRow } from "@/redux/slices/dashboardApiSlice";

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

interface PerformanceOverviewProps {
  locations: OutletComparisonRow[];
  loading?: boolean;
  error?: boolean;
}

export default function PerformanceOverview({ locations, loading, error }: PerformanceOverviewProps) {
  const totalSalesPaise = locations.reduce((sum, l) => sum + l.totalSalesPaise, 0);
  const rows = [...locations].sort((a, b) => b.totalSalesPaise - a.totalSalesPaise);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col mt-6 w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Location Performance</h3>
        <p className="text-sm text-gray-500">All-time settled sales before tax</p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-6 py-10 text-center text-sm font-medium text-red-600">
          Couldn&apos;t load location performance. Please refresh to try again.
        </p>
      ) : rows.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm font-medium text-gray-500">
          No settled orders yet. Locations appear here once they record sales.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Sales</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Share of sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((loc) => {
                  const share = totalSalesPaise > 0 ? (loc.totalSalesPaise / totalSalesPaise) * 100 : 0;
                  return (
                    <tr key={loc.outletId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 text-sm">{loc.outletName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium tabular-nums">{inr(loc.totalSalesPaise)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600 tabular-nums">
                        {loc.totalCompletedOrders.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-[#0B1221]" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 tabular-nums">{share.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-500">
              {rows.length} {rows.length === 1 ? "location" : "locations"} with sales
            </span>
          </div>
        </>
      )}
    </div>
  );
}
