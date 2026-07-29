"use client";

import React, { useState, useCallback, useEffect, memo } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import AuthGuard from "../auth/AuthGuard";

const EXPANDED = 244;
const COLLAPSED = 72;
const LS_KEY = "alayn_sidebar_collapsed";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Always start false (matches SSR), then sync from localStorage after mount
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved !== null) setIsCollapsed(JSON.parse(saved));
    } catch { /* noop */ }
    setMounted(true);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev: boolean) => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);

  // Before mount: always render expanded width (matches SSR)
  const sidebarW = mounted ? (isCollapsed ? COLLAPSED : EXPANDED) : EXPANDED;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F9]">
      {/* ─── Mobile backdrop ─────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar wrapper ───────────────────────────────────────────── */}
      <div
        suppressHydrationWarning
        className={[
          "fixed inset-y-0 left-0 z-30",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0 lg:inset-auto",
          "shrink-0",
        ].join(" ")}
        style={{
          width: sidebarW,
          contain: "layout style",
          willChange: "width",
          transition: mounted ? "width 180ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        }}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* ─── Main content ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={openMobileSidebar} />
        <main
          className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 lg:p-8 min-w-0"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthGuard>
  );
}

export default memo(DashboardLayout);
