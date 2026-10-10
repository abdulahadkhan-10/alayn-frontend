"use client";

import { useTabsPill } from "@/lib/useTabsPill";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const defaultData = [
  { name: "Mon", sales: 120 },
  { name: "Tue", sales: 300 },
  { name: "Wed", sales: 280 },
  { name: "Thu", sales: 290 },
  { name: "Fri", sales: 220 },
  { name: "Sat", sales: 70 },
  { name: "Sun", sales: 300 },
];

const locationData = [
  { name: "London Soho", sales: 420 },
  { name: "Manchester", sales: 310 },
  { name: "Birmingham", sales: 380 },
  { name: "Leeds", sales: 280 },
];

const channelData = [
  { name: "Counter", sales: 650 },
  { name: "QR Orders", sales: 350 },
  { name: "Delivery", sales: 400 },
];

const daypartData = [
  { name: "Breakfast", sales: 180 },
  { name: "Lunch", sales: 450 },
  { name: "Dinner", sales: 620 },
  { name: "Late Night", sales: 150 },
];

interface PerformanceRevenueChartProps {
  chartData?: Array<{ name: string; actual: number }>;
}

export default function PerformanceRevenueChart({
  chartData
}: PerformanceRevenueChartProps) {
  const [activeTab, setActiveTab] = useState<"Overview" | "By Location" | "By Channel" | "By Daypart">("Overview");
  const tabsBarRef = useTabsPill(activeTab);

  // Format backend chart data if provided
  const backendFormatted = chartData?.map(item => ({
    name: item.name,
    sales: item.actual
  })) || defaultData;

  // Decide data based on tab selection
  let currentData = backendFormatted;
  if (activeTab === "By Location") currentData = locationData;
  else if (activeTab === "By Channel") currentData = channelData;
  else if (activeTab === "By Daypart") currentData = daypartData;

  const tabs = ["Overview", "By Location", "By Channel", "By Daypart"] as const;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex-1 flex flex-col min-h-[400px]">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
          <p className="text-sm text-gray-500">Real-time tracking of sales volume across standard intervals</p>
        </div>

        {/* Styled Tab Bar Selector */}
        <div ref={tabsBarRef} role="tablist" className="relative flex bg-gray-100 p-1.5 rounded-lg border border-gray-200">
          <span className="t-tabs-pill shadow-sm" aria-hidden="true" />
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative z-[1] px-4 py-1.5 rounded-md text-xs font-bold transition-colors",
                activeTab === tab
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="flex-1 w-full relative min-h-[250px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentData}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [value ? `₹${Number(value).toLocaleString()}` : "₹0", "Sales"]}
              />
              <Bar
                dataKey="sales"
                fill="#0B1221"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
