"use client";

import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function WorkforceSkeleton() {
  return (
    <SkeletonTheme baseColor="#E2E8F0" highlightColor="#F8FAFC">
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Workforce Header & Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton width={90} height={14} borderRadius={4} />
                <Skeleton width={32} height={32} borderRadius={8} />
              </div>
              <Skeleton width={70} height={28} borderRadius={6} />
              <Skeleton width={130} height={12} borderRadius={4} />
            </div>
          ))}
        </div>

        {/* Action Controls & Search Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton height={42} borderRadius={10} className="w-full max-w-md" />
            <Skeleton width={100} height={42} borderRadius={10} />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton width={140} height={42} borderRadius={10} />
            <Skeleton width={140} height={42} borderRadius={10} />
          </div>
        </div>

        {/* Staff Table Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <Skeleton width={160} height={20} borderRadius={6} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </div>

          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton circle width={40} height={40} />
                  <div className="space-y-1.5 flex-1 max-w-xs">
                    <Skeleton width={140} height={16} borderRadius={4} />
                    <Skeleton width={180} height={12} borderRadius={4} />
                  </div>
                </div>

                <div className="hidden sm:block">
                  <Skeleton width={90} height={22} borderRadius={6} />
                </div>

                <div className="hidden md:block">
                  <Skeleton width={110} height={14} borderRadius={4} />
                </div>

                <div>
                  <Skeleton width={75} height={24} borderRadius={6} />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton width={32} height={32} borderRadius={8} />
                  <Skeleton width={32} height={32} borderRadius={8} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
