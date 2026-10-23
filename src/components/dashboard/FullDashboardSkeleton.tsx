"use client";

import React, { useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface Props {
  children?: React.ReactNode;
}

const EXPANDED = 244;
const COLLAPSED = 72;
const LS_KEY = "alayn_sidebar_collapsed";

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved !== null ? Boolean(JSON.parse(saved)) : false;
  } catch {
    return false;
  }
}

export default function FullDashboardSkeleton({ children }: Props) {
  const [isCollapsed] = useState<boolean>(getInitialCollapsed);

  return (
    <SkeletonTheme baseColor="#E2E8F0" highlightColor="#F8FAFC">
      <div className="flex h-screen overflow-hidden bg-[#F4F7F9]">
        {/* ─── Sidebar Skeleton ─── */}
        <div
          style={{ width: isCollapsed ? COLLAPSED : EXPANDED }}
          className={`hidden lg:flex flex-col justify-between border-r border-white/[0.06] bg-[#090D16] shrink-0 ${
            isCollapsed ? "p-2 items-center" : "p-3"
          }`}
        >
          <SkeletonTheme baseColor="#1E293B" highlightColor="#334155">
            <div className="space-y-5 w-full">
              {/* Sidebar Logo Skeleton */}
              <div
                className={`flex items-center h-12 border-b border-white/[0.06] pb-2 ${
                  isCollapsed ? "justify-center" : "gap-3 px-2"
                }`}
              >
                <Skeleton width={36} height={36} borderRadius={8} />
                {!isCollapsed && <Skeleton width={110} height={22} borderRadius={6} />}
              </div>

              {/* Sidebar Menu Nav Items Skeletons */}
              <div className="space-y-2 pt-1">
                {[...Array(8)].map((_, i) =>
                  isCollapsed ? (
                    <div key={i} className="flex justify-center py-1">
                      <Skeleton width={36} height={36} borderRadius={8} />
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-2.5 h-9 rounded-lg bg-white/[0.03]"
                    >
                      <Skeleton width={18} height={18} borderRadius={4} />
                      <Skeleton width={110} height={14} borderRadius={4} />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Sidebar Bottom User Profile Skeleton */}
            <div
              className={`border-t border-white/[0.06] pt-3 flex items-center w-full ${
                isCollapsed ? "justify-center" : "gap-2.5 px-1"
              }`}
            >
              <Skeleton width={34} height={34} borderRadius={8} />
              {!isCollapsed && (
                <div className="space-y-1">
                  <Skeleton width={100} height={12} borderRadius={4} />
                  <Skeleton width={70} height={10} borderRadius={4} />
                </div>
              )}
            </div>
          </SkeletonTheme>
        </div>

        {/* ─── Main Section (Header + Content) Skeleton ─── */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Header Skeleton */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
            <div className="flex items-center gap-4">
              <Skeleton width={160} height={32} borderRadius={8} />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton width={200} height={32} borderRadius={20} />
              <Skeleton circle width={32} height={32} />
            </div>
          </div>

          {/* Page Content Skeleton */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
            {children ? (
              children
            ) : (
              <>
                {/* Banner Skeleton */}
                <div className="bg-[#0B1221] p-6 rounded-2xl border border-slate-800 flex justify-between items-center overflow-hidden gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <Skeleton width={120} height={18} borderRadius={6} baseColor="#1E293B" highlightColor="#334155" containerClassName="block max-w-full" className="max-w-full" />
                    <Skeleton width={240} height={26} borderRadius={8} baseColor="#1E293B" highlightColor="#334155" containerClassName="block max-w-full" className="max-w-full" />
                    <Skeleton width={340} height={14} borderRadius={4} baseColor="#1E293B" highlightColor="#334155" containerClassName="block max-w-full" className="max-w-full" />
                  </div>
                  <Skeleton width={110} height={36} borderRadius={8} baseColor="#1E293B" highlightColor="#334155" containerClassName="shrink-0 hidden sm:block" />
                </div>

                {/* KPI Cards Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 space-y-3">
                      <Skeleton width={80} height={14} borderRadius={4} />
                      <Skeleton width={100} height={26} borderRadius={6} />
                      <Skeleton width={110} height={12} borderRadius={4} />
                    </div>
                  ))}
                </div>

                {/* Content Cards Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                    <Skeleton width={180} height={20} borderRadius={6} />
                    <Skeleton height={200} borderRadius={12} />
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                    <Skeleton width={180} height={20} borderRadius={6} />
                    <Skeleton height={200} borderRadius={12} />
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </SkeletonTheme>
  );
}
