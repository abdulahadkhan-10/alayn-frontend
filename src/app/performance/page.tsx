"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  PerformanceOverview, 
  PerformanceRevenueChart, 
  PerformanceMetricCard,
  PerformanceDrivers
} from "@/components/PerformanceOverview";
import { fetchPerformanceData, fallbackData } from "@/lib/api";

export default function PerformancePage() {
  const [data, setData] = useState<typeof fallbackData>(fallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const perfData = await fetchPerformanceData();
        setData(perfData);
      } catch (err) {
        console.error("Failed to load performance page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="mx-auto max-w-7xl">
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Performance Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                {loading ? "Loading operational analytics..." : "All locations operations are synchronized and on track"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Today: Oct 24, 2023
              </div>
              <button className="bg-[#0B1221] text-white hover:bg-slate-800 transition-colors px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                Export Report
              </button>
            </div>
          </div>

          {/* 3-Column KPI Cards Grid (Real Data Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <PerformanceMetricCard 
              title="Net Sales"
              value={data.kpis.netSales.value}
              trend={data.kpis.netSales.trend}
              trendType={data.kpis.netSales.type}
            />
            <PerformanceMetricCard 
              title="Transactions"
              value={data.kpis.transactions.value}
              trend={data.kpis.transactions.trend}
              trendType={data.kpis.transactions.type}
            />
            <PerformanceMetricCard 
              title="Avg Order Value"
              value={data.kpis.avgOrderValue.value}
              trend={data.kpis.avgOrderValue.trend}
              trendType={data.kpis.avgOrderValue.type}
            />
          </div>

          {/* Row 1: Chart (Full Width) */}
          <div className="mb-6">
            <PerformanceRevenueChart 
              chartData={data.chart}
            />
          </div>

          {/* Row 2: Location Performance Table (Full width) */}
          <div className="w-full">
            <PerformanceOverview locations={data.locations} />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
