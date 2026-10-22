"use client";

import { TModal } from "@/components/ui/TModal";
import React, { memo, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutGrid,
  Store,
  Users,
  Package,
  UtensilsCrossed,
  ClipboardList,
  MessageSquare,
  Trash2,
  Settings,
  Calendar,
  FileText,
  CreditCard,
  ChefHat,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  LogOut,
  Loader2,
  Lock,
  FileBarChart,
} from "lucide-react";
import { cn, formatRole } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/redux/store/hooks";
import { logout } from "@/redux/slices/authSlice";
import { useLogoutMutation } from "@/redux/slices/authApiSlice";
import { useBranch } from "@/lib/BranchContext";
import { baseApi } from "@/redux/store/baseApi";
import { getKitchenModeCapabilities } from "@/lib/kitchenMode";

type Role = "BUSINESS_OWNER" | "SUPER_ADMIN" | "MANAGER" | "STAFF" | "KITCHEN" | "SUPPLIER";

type NavCategory = "Core" | "Service & Floor" | "Back-of-House" | "Team & Locations" | "System";

interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
  category: NavCategory;
  badge?: string;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CATEGORY_ORDER: NavCategory[] = [
  "Core",
  "Service & Floor",
  "Back-of-House",
  "Team & Locations",
  "System",
];

const ownerNavItems: NavItem[] = [
  { name: "Overview", icon: LayoutGrid, href: "/dashboard", category: "Core" },
  { name: "Reports", icon: FileBarChart, href: "/reports", category: "Core" },
  { name: "POS Terminal", icon: CreditCard, href: "/pos", category: "Service & Floor" },
  { name: "Live Orders", icon: ClipboardList, href: "/orders", category: "Service & Floor" },
  { name: "Kitchen Dispatch", icon: ChefHat, href: "/kitchen", category: "Service & Floor" },
  { name: "Table Management", icon: QrCode, href: "/tables", category: "Service & Floor" },
  { name: "Menu Manager", icon: UtensilsCrossed, href: "/menu", category: "Back-of-House" },
  { name: "Smart Inventory", icon: Package, href: "/inventory", category: "Back-of-House" },
  { name: "Waste Management", icon: Trash2, href: "/waste", category: "Back-of-House" },
  { name: "Workforce", icon: Users, href: "/workforce", category: "Team & Locations" },
  { name: "Location Manager", icon: Store, href: "/outlets", category: "Team & Locations" },
  { name: "Support & Tickets", icon: MessageSquare, href: "/support", category: "System" },
  { name: "Settings", icon: Settings, href: "/settings", category: "System" },
];

const managerNavItems: NavItem[] = [
  { name: "Overview", icon: LayoutGrid, href: "/dashboard", category: "Core" },
  { name: "Reports", icon: FileBarChart, href: "/reports", category: "Core" },
  { name: "POS Terminal", icon: CreditCard, href: "/pos", category: "Service & Floor" },
  { name: "Live Orders", icon: ClipboardList, href: "/orders", category: "Service & Floor" },
  { name: "Kitchen Dispatch", icon: ChefHat, href: "/kitchen", category: "Service & Floor" },
  { name: "Table Management", icon: QrCode, href: "/tables", category: "Service & Floor" },
  { name: "Menu Manager", icon: UtensilsCrossed, href: "/menu", category: "Back-of-House" },
  { name: "Inventory", icon: Package, href: "/inventory", category: "Back-of-House" },
  { name: "Waste Logs", icon: Trash2, href: "/waste", category: "Back-of-House" },
  { name: "Workforce Directory", icon: Users, href: "/workforce", category: "Team & Locations" },
  { name: "Support Tickets", icon: MessageSquare, href: "/support", category: "System" },
  { name: "Settings", icon: Settings, href: "/settings", category: "System" },
];

const staffNavItems: NavItem[] = [
  { name: "POS Terminal", icon: CreditCard, href: "/pos", category: "Service & Floor" },
  { name: "Live Orders", icon: ClipboardList, href: "/orders", category: "Service & Floor" },
  { name: "Shift Calendar", icon: Calendar, href: "/workforce", category: "Team & Locations" },
  { name: "Attendance Logs", icon: Clock, href: "/workforce/attendance", category: "Team & Locations" },
  { name: "Leave Request", icon: FileText, href: "/workforce/leaves", category: "Team & Locations" },
  { name: "Support & Queries", icon: MessageSquare, href: "/support", category: "System" },
];

const kitchenNavItems: NavItem[] = [
  { name: "Kitchen Dispatch", icon: ChefHat, href: "/kitchen", category: "Service & Floor" },
  { name: "Shift Calendar", icon: Calendar, href: "/workforce", category: "Team & Locations" },
  { name: "Attendance Logs", icon: Clock, href: "/workforce/attendance", category: "Team & Locations" },
  { name: "Leave Request", icon: FileText, href: "/workforce/leaves", category: "Team & Locations" },
  { name: "Support & Queries", icon: MessageSquare, href: "/support", category: "System" },
];

const supplierNavItems: NavItem[] = [
  { name: "Supplier Portal", icon: Package, href: "/supplier", category: "Core" },
  { name: "Account Profile", icon: Users, href: "/profile", category: "System" },
];

const NavLinkItem = memo(function NavLinkItem({
  item,
  isActive,
  isCollapsed,
  isLocked,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isLocked?: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={isCollapsed ? (isLocked ? `${item.name} (Subscription Required)` : item.name) : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-[13px] transition-all duration-150 ease-out min-w-0",
        isCollapsed ? "h-9 w-9 justify-center px-0 mx-auto" : "h-9 px-2.5 w-full",
        isActive
          ? "bg-white/[0.08] text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 ring-white/[0.07]"
          : "text-slate-400 font-medium hover:bg-white/[0.04] hover:text-slate-200",
        isLocked && !isActive && "text-slate-500 hover:text-slate-400"
      )}
    >
      {/* Active Left Pill Indicator */}
      {isActive && (
        <span
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-[#D3232A] shadow-[0_0_8px_rgba(211,35,42,0.75)]",
            isCollapsed ? "h-4" : "h-4"
          )}
        />
      )}

      {/* Icon Container */}
      <div
        className={cn(
          "shrink-0 flex items-center justify-center transition-colors duration-150",
          !isCollapsed && "mr-2.5"
        )}
      >
        <item.icon
          className={cn(
            "h-[17px] w-[17px] transition-transform duration-150 group-hover:scale-105",
            isActive
              ? "text-[#FF4D54]"
              : isLocked
              ? "text-slate-600 group-hover:text-slate-400"
              : "text-slate-400 group-hover:text-slate-200"
          )}
          strokeWidth={isActive ? 2.2 : 1.85}
          aria-hidden="true"
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "truncate leading-none transition-all duration-150 ease-out whitespace-nowrap overflow-hidden",
          isCollapsed
            ? "opacity-0 max-w-0 pointer-events-none"
            : "opacity-100 max-w-[155px]"
        )}
      >
        {item.name}
      </span>

      {/* Right Affix: Lock / Badge */}
      {!isCollapsed && (isLocked || item.badge) && (
        <div className="ml-auto pl-1.5 flex items-center shrink-0">
          {isLocked ? (
            <span title="Subscription Required">
              <Lock className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400/80 transition-colors" />
            </span>
          ) : item.badge ? (
            <span className="rounded-md bg-[#D3232A]/20 border border-[#D3232A]/40 px-1.5 py-0.5 text-[10px] font-bold text-red-300 leading-none">
              {item.badge}
            </span>
          ) : null}
        </div>
      )}
    </Link>
  );
});

function SidebarComponent({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { hasActiveSubscription, isDemo, activeBranch } = useBranch();
  const role: Role = useMemo(() => (user?.role as Role) || "BUSINESS_OWNER", [user?.role]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutMutation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi(undefined).unwrap();
    } catch {
      // ignore network errors on logout
    } finally {
      dispatch(baseApi.util.resetApiState());
      dispatch(logout());
      window.location.href = "/login";
    }
  };

  const navItems = useMemo(() => {
    let items = ownerNavItems;
    if (role === "MANAGER") items = managerNavItems;
    else if (role === "STAFF") items = staffNavItems;
    else if (role === "KITCHEN") items = kitchenNavItems;
    else if (role === "SUPPLIER") items = supplierNavItems;

    const { supportsKdsScreen } = getKitchenModeCapabilities(activeBranch?.kitchenMode);
    if (!supportsKdsScreen) {
      return items.filter((item) => item.href !== "/kitchen");
    }
    return items;
  }, [role, activeBranch?.kitchenMode]);

  const groupedSections = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: navItems.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [navItems]);

  const userName = mounted && user?.name ? user.name : "Restaurant Operator";
  const userInitial = mounted && user?.name ? user.name.charAt(0).toUpperCase() : "O";
  const userRoleLabel = mounted ? formatRole(user?.role) : "Owner";
  const outletLabel = mounted && activeBranch?.name ? activeBranch.name : null;

  return (
    <aside
      suppressHydrationWarning
      className="flex h-full flex-col bg-[#090D16] border-r border-white/[0.06] relative select-none w-full overflow-hidden"
      aria-label="Sidebar navigation"
    >
      {/* Subtle top ambient radial highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.025] to-transparent"
        aria-hidden="true"
      />

      {/* ── Brand Header & Collapse Control ───────── */}
      <div
        className={cn(
          "relative flex h-16 shrink-0 items-center border-b border-white/[0.06] transition-all duration-200 ease-out",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <div className="flex items-center justify-between w-full h-full min-w-0">
          {!isCollapsed ? (
            <div className="flex items-center min-w-0">
              {/* Trademarked logo in its registered colours, on a white panel against the dark sidebar */}
              <button
                type="button"
                onClick={() => {
                  if (role === "SUPPLIER") router.push("/supplier");
                  else if (role === "STAFF") router.push("/pos");
                  else if (role === "KITCHEN") router.push("/kitchen");
                  else router.push("/dashboard");
                }}
                aria-label="Go to home"
                className="inline-flex items-center rounded-lg bg-white px-3 py-2 ring-1 ring-white/10 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.6)] cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Image
                  src="/alayn-logo-tm.png"
                  alt="Alayn AI"
                  width={960}
                  height={188}
                  className="h-[20px] w-auto object-contain"
                  priority
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-white/10 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.6)] transition-opacity duration-150 group-hover:opacity-0">
                <Image
                  src="/alayn-mark-tm.png"
                  alt="Alayn AI"
                  width={256}
                  height={232}
                  className="h-[22px] w-auto object-contain"
                  priority
                />
              </span>
              <PanelLeftOpen className="absolute h-4 w-4 text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            </button>
          )}

          {!isCollapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white ring-1 ring-transparent hover:ring-white/[0.08] transition-all duration-150 cursor-pointer ml-auto"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Categorized Operational Navigation ── */}
      <div
        className={cn(
          "flex-1 min-h-0 flex flex-col py-3 overflow-y-auto overflow-x-hidden transition-all duration-200 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isCollapsed ? "px-2" : "px-3"
        )}
      >
        <nav className="flex-1 flex flex-col gap-3.5" role="navigation">
          {groupedSections.map((group, groupIdx) => (
            <div key={group.category} className="flex flex-col gap-0.5">
              {/* Section Header or Collapsed Divider */}
              {group.category !== "Core" && (
                isCollapsed ? (
                  groupIdx > 0 && (
                    <div className="mx-auto my-1 h-px w-5 bg-white/[0.07]" aria-hidden="true" />
                  )
                ) : (
                  <div className="px-2.5 pt-1 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {group.category}
                    </span>
                  </div>
                )
              )}

              {/* Section Links */}
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" &&
                    pathname.startsWith(item.href) &&
                    !navItems.some(
                      (other) =>
                        other.href !== item.href &&
                        other.href.startsWith(item.href) &&
                        pathname.startsWith(other.href)
                    ));

                const isLocked =
                  !isDemo &&
                  !hasActiveSubscription &&
                  item.href !== "/outlets" &&
                  item.href !== "/support" &&
                  !item.href.startsWith("/outlets");

                return (
                  <NavLinkItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    isLocked={isLocked}
                  />
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Subscription Warning Banner when unpaid ── */}
      {!isDemo && !hasActiveSubscription && (
        <div className={cn("shrink-0 px-3 pb-2.5 transition-all duration-200", isCollapsed && "px-2")}>
          {isCollapsed ? (
            <Link
              href="/outlets"
              title="Subscription Required — Click to Pay"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-[#D3232A] hover:text-white hover:border-transparent transition-all mx-auto"
            >
              <Lock className="h-4 w-4" />
            </Link>
          ) : (
            <div className="rounded-xl bg-gradient-to-b from-amber-500/[0.08] to-red-500/[0.08] border border-amber-500/20 p-3 text-xs shadow-inner">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px] mb-1">
                <Lock className="h-3 w-3 shrink-0" />
                <span>Subscription Required</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                Activate outlet billing to unlock POS, KDS & inventory modules.
              </p>
              <Link
                href="/outlets"
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#D3232A] hover:bg-[#b81d24] py-1.5 text-[11px] font-semibold text-white transition-colors shadow-xs"
              >
                Manage Billing
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Operator Dock Footer (User Context + Sign Out) ─────────── */}
      <div
        className={cn(
          "shrink-0 border-t border-white/[0.06] p-2.5 bg-[#060911]",
          isCollapsed ? "flex flex-col items-center gap-1.5" : ""
        )}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={handleLogoutClick}
            title={`${userName} (${userRoleLabel}) — Sign Out`}
            aria-label="Sign Out"
            className="group flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2">
            {/* Operator Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#D3232A] to-[#99151B] text-xs font-bold text-white shadow-xs ring-1 ring-white/15">
              {userInitial}
            </div>

            {/* Operator Name & Role / Active Outlet */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-[12px] font-semibold text-slate-200 leading-tight">
                {userName}
              </p>
              <p className="truncate text-[10.5px] font-medium text-slate-400 leading-tight mt-0.5">
                {userRoleLabel}
                {outletLabel ? ` · ${outletLabel}` : ""}
              </p>
            </div>

            {/* Quick Sign Out Trigger */}
            <button
              type="button"
              onClick={handleLogoutClick}
              title="Sign Out"
              aria-label="Sign Out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Logout Confirmation Modal ───────── */}
      {mounted &&
        createPortal(
          <TModal open={showLogoutModal} className="z-[100] bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#D3232A]">
                  <LogOut className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sign Out</h3>
                  <p className="text-sm text-gray-500">Are you sure you want to sign out?</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                You will need to log back in to access the Alayn Operating System. Any unsaved changes on your current screen might be lost.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={confirmLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] transition-colors shadow-sm disabled:opacity-75"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing Out...
                    </>
                  ) : (
                    "Yes, Sign Out"
                  )}
                </button>
              </div>
            </div>
          </TModal>,
          document.body
        )}
    </aside>
  );
}

export default memo(SidebarComponent);
