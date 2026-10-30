import React, { useState, useCallback, useEffect, memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import Header from "../Header";
import AuthGuard from "../auth/AuthGuard";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import SubscriptionPaywall from "../subscription/SubscriptionPaywall";
import { ProLockedPanel } from "../subscription/ProUpgrade";
import { isProOnlyRoute, useIsPro } from "@/lib/plan";

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

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    branches, 
    activeBranch,
    loading: branchesLoading, 
    isDemo, 
    hasActiveSubscription,
    hasAnyActiveBranch 
  } = useBranch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Read synchronously on client so navigating between pages never flashes expanded -> collapsed
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsed);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSupplier = user?.role === "SUPPLIER";

  // Suppliers have their own standalone app (suppliers.alaynai.com); redirect immediately if they land in the restaurant app
  useEffect(() => {
    if (mounted && isSupplier) {
      const supplierUrl = process.env.NEXT_PUBLIC_SUPPLIER_PORTAL_URL
        ? `${process.env.NEXT_PUBLIC_SUPPLIER_PORTAL_URL}/orders`
        : "https://suppliers.alaynai.com/orders";
      window.location.href = supplierUrl;
    }
  }, [mounted, isSupplier]);

  const handleToggleCollapse = useCallback(() => {
    setIsAnimating(true);
    setIsCollapsed((prev: boolean) => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsAnimating(true);
    setMobileSidebarOpen(false);
  }, []);
  const openMobileSidebar = useCallback(() => {
    setIsAnimating(true);
    setMobileSidebarOpen(true);
  }, []);

  const isOwner = user?.role === "BUSINESS_OWNER" || user?.role === "SUPER_ADMIN";
  const isCaptiveOnboarding = mounted && isOwner && !isDemo && !branchesLoading && branches.length === 0;

  // Unrestricted routes where users manage outlets or view billing/support without active subscription
  const isUnrestrictedRoute = 
    isSupplier ||
    pathname === "/supplier" ||
    pathname?.startsWith("/supplier/") ||
    pathname === "/profile" ||
    pathname?.startsWith("/profile/") ||
    pathname === "/outlets" || 
    pathname?.startsWith("/outlets/create") || 
    pathname === "/settings/billing" || 
    pathname?.startsWith("/support");

  // Determine if paywall must be shown:
  // Show paywall if not demo, not loading, route is restricted, not a supplier, and active branch is not subscribed
  const showPaywall = mounted && !isSupplier && !isDemo && !branchesLoading && !isUnrestrictedRoute && !hasActiveSubscription;

  // Shifts, attendance and leave are part of Alayn Pro; Basic outlets see an upgrade prompt instead
  const isPro = useIsPro();
  const showProLock = mounted && !showPaywall && !isSupplier && !branchesLoading && !isPro && isProOnlyRoute(pathname, user?.role);

  const sidebarW = isCollapsed ? COLLAPSED : EXPANDED;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F9]">
      {/* ─── Mobile backdrop ─────────────────── */}
      {mobileSidebarOpen && !isCaptiveOnboarding && !isSupplier && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-260 ease-out"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar wrapper ───────────────────────────────────────────── */}
      {!isCaptiveOnboarding && !isSupplier && (
        <div
          suppressHydrationWarning
          className={[
            "fixed inset-y-0 left-0 z-30",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:static lg:translate-x-0 lg:inset-auto",
            "shrink-0 overflow-hidden",
          ].join(" ")}
          style={{
            width: sidebarW,
            contain: "layout style",
            willChange: "width, transform",
            transition: isAnimating
              ? "width 240ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)"
              : "none",
          }}
        >
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </div>
      )}

      {/* ─── Main content ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={openMobileSidebar} />
        <main
          className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 lg:p-8 min-w-0"
          id="main-content"
        >
          {showPaywall ? (
            <SubscriptionPaywall targetBranch={activeBranch} />
          ) : showProLock ? (
            <ProLockedPanel
              title="Shifts, attendance and leave"
              description="Plan shifts and rosters, approve swaps and leave, and track clock-ins with Alayn Pro. Your staff directory and logins stay available on Basic."
            />
          ) : (
            children
          )}
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
