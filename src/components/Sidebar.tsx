"use client";

import React, { memo, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Store,
  Users,
  Package,
  UtensilsCrossed,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  Trash2,
  Settings,
  Calendar,
  FileText,
  CreditCard,
  ChefHat,
  Clock,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/redux/store/hooks";
import { logout } from "@/redux/slices/authSlice";
import { useLogoutMutation } from "@/redux/slices/authApiSlice";

type Role = "BUSINESS_OWNER" | "SUPER_ADMIN" | "MANAGER" | "STAFF" | "KITCHEN" | "SUPPLIER";

interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}


const ownerNavItems: NavItem[] = [
  { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
  { name: "Location Manager", icon: Store, href: "/outlets" },
  { name: "Workforce", icon: Users, href: "/workforce" },
  { name: "Smart Inventory", icon: Package, href: "/inventory" },
  { name: "Menu Manager", icon: UtensilsCrossed, href: "/menu" },
  { name: "Table Management", icon: QrCode, href: "/tables" },
  { name: "POS Terminal", icon: CreditCard, href: "/pos" },
  { name: "Live Orders", icon: ClipboardList, href: "/orders" },
  { name: "Kitchen Dispatch", icon: ChefHat, href: "/kitchen" },
  { name: "Support & Tickets", icon: MessageSquare, href: "/support" },
  { name: "Waste Management", icon: Trash2, href: "/waste" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

const managerNavItems: NavItem[] = [
  { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
  { name: "Workforce Directory", icon: Users, href: "/workforce" },
  { name: "Inventory", icon: Package, href: "/inventory" },
  { name: "Menu Manager", icon: UtensilsCrossed, href: "/menu" },
  { name: "Table Management", icon: QrCode, href: "/tables" },
  { name: "POS Terminal", icon: CreditCard, href: "/pos" },
  { name: "Live Orders", icon: ClipboardList, href: "/orders" },
  { name: "Kitchen Dispatch", icon: ChefHat, href: "/kitchen" },
  { name: "Support Tickets", icon: MessageSquare, href: "/support" },
  { name: "Waste Logs", icon: Trash2, href: "/waste" },
];

const staffNavItems: NavItem[] = [
  { name: "Shift Calendar", icon: Calendar, href: "/workforce" },
  { name: "Leave Request", icon: FileText, href: "/workforce/leaves" },
  { name: "POS Terminal", icon: CreditCard, href: "/pos" },
  { name: "Live Orders", icon: ClipboardList, href: "/orders" },
  { name: "Support & Queries", icon: MessageSquare, href: "/support" },
  { name: "Attendance Logs", icon: Clock, href: "/workforce/attendance" },
];

const kitchenNavItems: NavItem[] = [
  { name: "Shift Calendar", icon: Calendar, href: "/workforce" },
  { name: "Leave Request", icon: FileText, href: "/workforce/leaves" },
  { name: "Kitchen Dispatch", icon: ChefHat, href: "/kitchen" },
  { name: "Support & Queries", icon: MessageSquare, href: "/support" },
  { name: "Attendance Logs", icon: Clock, href: "/workforce/attendance" },
];

const supplierNavItems: NavItem[] = [
  { name: "Supplier Portal", icon: Package, href: "/supplier" },
  { name: "Account Profile", icon: Users, href: "/profile" },
];

// Memoized nav link item
const NavLinkItem = memo(function NavLinkItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.name : undefined}
      className={cn(
        "group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 ease-out overflow-hidden min-w-0",
        isCollapsed ? "h-11 w-11 justify-center px-0 mx-auto" : "h-10 px-3.5 w-full",
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#D3232A]" />
      )}
      <item.icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
          !isCollapsed && "mr-3",
          isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-200"
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "truncate leading-normal py-0.5 transition-all duration-200 ease-out whitespace-nowrap overflow-hidden",
          isCollapsed
            ? "opacity-0 max-w-0 pointer-events-none translate-x-[-4px]"
            : "opacity-100 max-w-[160px] translate-x-0"
        )}
      >
        {item.name}
      </span>
      {item.badge && (
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full bg-[#D3232A] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none transition-all duration-200 ease-out",
            isCollapsed ? "opacity-0 max-w-0" : "opacity-100"
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
});

function SidebarComponent({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const role: Role = useMemo(() => (user?.role as Role) || "BUSINESS_OWNER", [user?.role]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi(undefined).unwrap();
    } catch {
      // ignore network errors on logout
    } finally {
      dispatch(logout());
      window.location.href = "/login";
    }
  };

  const navItems = useMemo(() => {
    if (role === "MANAGER") return managerNavItems;
    if (role === "STAFF") return staffNavItems;
    if (role === "KITCHEN") return kitchenNavItems;
    if (role === "SUPPLIER") return supplierNavItems;
    return ownerNavItems;
  }, [role]);

  // Use stable SSR-safe fallbacks until client mounts
  const displayName = mounted ? (user?.name || "Owner") : "Owner";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayRole = (user?.role || "BUSINESS_OWNER").replace(/_/g, " ");

  return (
    <aside
      className="flex h-full flex-col bg-[#0B1221] border-r border-white/[0.05] relative select-none w-full overflow-hidden"
      aria-label="Sidebar navigation"
    >
      {/* ── Logo & Integrated Collapse Toggle ───────── */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/[0.05] transition-all duration-200 ease-out overflow-hidden",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <div className="flex items-center justify-between w-full h-full min-w-0">
          <div className="relative flex items-center h-full min-w-0 overflow-hidden">
            <div
              className={cn(
                "transition-all duration-200 ease-out flex items-center",
                isCollapsed
                  ? "opacity-0 scale-90 pointer-events-none w-0 overflow-hidden"
                  : "opacity-100 scale-100 w-[130px]"
              )}
            >
              <Image
                src="/whitelogo.png"
                alt="Alayn AI"
                width={160}
                height={44}
                onClick={() => {
                  if (role === "SUPPLIER") router.push("/supplier");
                  else if (role === "STAFF") router.push("/pos");
                  else if (role === "KITCHEN") router.push("/kitchen");
                  else router.push("/dashboard");
                }}
                className="w-[130px] h-auto object-contain cursor-pointer"
                priority
              />
            </div>

            <div
              className={cn(
                "transition-all duration-200 ease-out flex items-center justify-center",
                isCollapsed
                  ? "opacity-100 scale-100 w-11 h-11"
                  : "opacity-0 scale-90 pointer-events-none w-0 overflow-hidden"
              )}
            >
              <Image
                src="/whitealogo.png"
                alt="Alayn AI"
                width={64}
                height={64}
                className="w-10 h-10 object-contain scale-[2.2] shadow-sm"
                priority
              />
            </div>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-colors duration-150 cursor-pointer ml-auto"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Main Nav (scrollable, fills all space) ── */}
      <div className={cn("flex-1 min-h-0 flex flex-col pt-4 overflow-hidden transition-all duration-200 ease-out", isCollapsed ? "px-2" : "px-3")}>
        <p
          className={cn(
            "px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600 transition-all duration-200 ease-out whitespace-nowrap overflow-hidden",
            isCollapsed ? "opacity-0 h-0 mb-0 pointer-events-none" : "opacity-100 h-4 mb-2"
          )}
        >
          Navigation
        </p>

        {/* overflow-y-auto so items never hide behind footer */}
        <nav
          className="flex-1 overflow-y-auto flex flex-col gap-[3px] pb-2 scrollbar-none"
          role="navigation"
          style={{ scrollbarWidth: "none" }}
        >
          {navItems.map((item) => {
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
            return (
              <NavLinkItem
                key={item.href}
                item={item}
                isActive={isActive}
                isCollapsed={isCollapsed}
              />
            );
          })}
        </nav>
      </div>

      {/* ── User Badge & Log Out (pinned at bottom) ─────────── */}
      <div
        className={cn(
          "shrink-0 border-t border-white/[0.05] p-3 flex flex-col gap-2 bg-[#080d18] transition-all duration-200 ease-out overflow-hidden",
          isCollapsed ? "items-center px-2" : "px-3"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-xl bg-white/[0.04] border border-white/[0.05] transition-all duration-200 ease-out min-w-0 overflow-hidden",
            isCollapsed ? "h-11 w-11 justify-center px-0 gap-0" : "w-full px-3 py-2.5 gap-3"
          )}
          title={isCollapsed ? `${displayName} (${displayRole})` : undefined}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D3232A] text-xs font-bold text-white shadow-sm leading-none"
            suppressHydrationWarning
          >
            {displayInitial}
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 transition-all duration-200 ease-out whitespace-nowrap overflow-hidden",
              isCollapsed
                ? "opacity-0 max-w-0 pointer-events-none translate-x-[-4px]"
                : "opacity-100 max-w-[160px] translate-x-0"
            )}
          >
            <p className="truncate text-xs font-semibold text-zinc-200 leading-tight" suppressHydrationWarning>
              {displayName}
            </p>
            <p className="truncate text-[10px] text-zinc-500 font-medium leading-tight mt-0.5" suppressHydrationWarning>
              {displayRole}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? "Log Out" : undefined}
          aria-label="Log Out"
          className={cn(
            "group flex items-center rounded-xl text-[13px] font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ease-out cursor-pointer overflow-hidden min-w-0",
            isCollapsed ? "h-11 w-11 justify-center px-0" : "h-10 w-full px-3.5"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-zinc-500 group-hover:text-red-400 transition-colors" />
          <span
            className={cn(
              "truncate leading-normal py-0.5 ml-3 transition-all duration-200 ease-out whitespace-nowrap overflow-hidden",
              isCollapsed
                ? "opacity-0 max-w-0 pointer-events-none translate-x-[-4px] ml-0"
                : "opacity-100 max-w-[160px] translate-x-0"
            )}
          >
            Log Out
          </span>
        </button>
      </div>
    </aside>
  );
}

export default memo(SidebarComponent);
