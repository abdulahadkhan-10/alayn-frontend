"use client";

import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function DashboardSkeleton() {
  return (
    <SkeletonTheme baseColor="#E2E8F0" highlightColor="#F8FAFC">
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Header Banner Skeleton */}
        <div className="bg-[#1B2A4A] p-6 lg:p-7 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between gap-4">
          <div className="w-full max-w-xl space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton width={110} height={20} borderRadius={6} baseColor="#1E293B" highlightColor="#334155" />
              <Skeleton width={140} height={20} borderRadius={6} baseColor="#1E293B" highlightColor="#334155" />
            </div>
            <Skeleton width={280} height={28} borderRadius={8} baseColor="#1E293B" highlightColor="#334155" />
            <Skeleton width={420} height={16} borderRadius={6} baseColor="#1E293B" highlightColor="#334155" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton width={120} height={36} borderRadius={8} baseColor="#1E293B" highlightColor="#334155" />
          </div>
        </div>

        {/* Financial KPI Grid Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Skeleton width={200} height={20} borderRadius={6} />
            <Skeleton width={120} height={16} borderRadius={6} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton width={80} height={14} borderRadius={4} />
                  <Skeleton width={40} height={16} borderRadius={4} />
                </div>
                <Skeleton width={110} height={28} borderRadius={6} />
                <Skeleton width={130} height={12} borderRadius={4} />
              </div>
            ))}
          </div>
        </div>

        {/* Forecast Charts Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton width={180} height={20} borderRadius={6} />
              <Skeleton width={80} height={28} borderRadius={8} />
            </div>
            <Skeleton height={240} borderRadius={12} />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton width={180} height={20} borderRadius={6} />
              <Skeleton width={80} height={28} borderRadius={8} />
            </div>
            <Skeleton height={240} borderRadius={12} />
          </div>
        </div>

        {/* Operational Insights Skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <Skeleton width={200} height={20} borderRadius={6} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200/70 space-y-2">
                <Skeleton width={140} height={16} borderRadius={4} />
                <Skeleton count={2} height={12} borderRadius={4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
