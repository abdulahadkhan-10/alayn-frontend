"use client";

import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function SupportSkeleton() {
  return (
    <SkeletonTheme baseColor="#E2E8F0" highlightColor="#F8FAFC">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton width={90} height={14} borderRadius={4} />
                <Skeleton width={36} height={36} borderRadius={8} />
              </div>
              <Skeleton width={60} height={28} borderRadius={6} />
            </div>
          ))}
        </div>

        {/* Filter & Search Bar Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-center justify-between">
          <div className="flex-1 w-full">
            <Skeleton height={40} borderRadius={8} />
          </div>
          <div className="w-40">
            <Skeleton height={40} borderRadius={8} />
          </div>
        </div>

        {/* Tickets List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton width={130} height={22} borderRadius={12} />
                  <Skeleton width={110} height={22} borderRadius={6} />
                  <Skeleton width={70} height={22} borderRadius={12} />
                </div>
                <Skeleton width={90} height={22} borderRadius={12} />
              </div>

              <div className="space-y-2 py-1">
                <Skeleton width="60%" height={20} borderRadius={4} />
                <Skeleton width="95%" height={14} borderRadius={4} />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <Skeleton width={150} height={14} borderRadius={4} />
                <Skeleton width={100} height={14} borderRadius={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}
