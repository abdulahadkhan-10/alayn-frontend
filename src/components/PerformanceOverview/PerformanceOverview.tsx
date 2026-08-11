"use client";

import React, { useState } from "react";
import { ChevronRight, MoreVertical, ListFilter } from "lucide-react";

interface LocationData {
  name: string;
  sales: string;
  variance: string;
  varianceType: "positive" | "negative" | "neutral";
  orders: string;
  status: "ON TRACK" | "ACTION NEEDED" | "WATCH";
}

const locationsData: LocationData[] = [
  {
    name: "London Soho",
    sales: "₹42,840",
    variance: "+2.4%",
    varianceType: "positive",
    orders: "1,204",
    status: "ON TRACK",
  },
  {
    name: "Manchester Deansgate",
    sales: "₹31,200",
    variance: "-4.1%",
    varianceType: "negative",
    orders: "948",
    status: "ACTION NEEDED",
  },
  {
    name: "Birmingham Bullring",
    sales: "₹38,650",
    variance: "+12.4%",
    varianceType: "positive",
    orders: "1,120",
    status: "ON TRACK",
  },
  {
    name: "Leeds Victoria",
    sales: "₹28,400",
    variance: "--",
    varianceType: "neutral",
    orders: "812",
    status: "WATCH",
  },
];

export default function PerformanceOverview({ locations = locationsData }: { locations?: LocationData[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col mt-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Location Performance</h3>
        <div className="flex gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
            <ListFilter className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Sales vs Forecast</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locations.map((loc) => (
              <tr key={loc.name} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                  {loc.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {loc.sales}{" "}
                  <span
                    className={`ml-1 text-xs font-semibold ${loc.varianceType === "positive"
                        ? "text-emerald-500"
                        : loc.varianceType === "negative"
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                  >
                    {loc.variance}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                  {loc.orders}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${loc.status === "ON TRACK"
                        ? "bg-emerald-50 text-emerald-700"
                        : loc.status === "ACTION NEEDED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                  >
                    {loc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 group-hover:text-gray-900 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-200 gap-4 sm:gap-0">
        <span className="text-sm font-semibold text-gray-500">
          Showing 4 of 14 locations
        </span>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded transition-colors">
            Previous
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${currentPage === page
                  ? "bg-[#0B1221] text-white"
                  : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {page}
            </button>
          ))}
          <button className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
