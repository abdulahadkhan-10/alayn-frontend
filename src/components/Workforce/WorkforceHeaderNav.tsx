"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calendar, CalendarOff, MonitorSmartphone, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store/hooks";
import { isProOnlyRoute, useIsPro } from "@/lib/plan";

export default function WorkforceHeaderNav() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const isPro = useIsPro();
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

  const tabs = isManagerOrOwner
    ? [
        { name: "Staff Directory", href: "/workforce", icon: Users },
        { name: "Shift Scheduler", href: "/workforce/scheduler", icon: Calendar },
        { name: "Leave Approvals", href: "/workforce/leaves", icon: CalendarOff },
        { name: "Attendance Logs", href: "/workforce/attendance", icon: Clock },
      ]
    : [
        { name: "My Shift Calendar", href: "/workforce", icon: Calendar },
        { name: "My Leave Requests", href: "/workforce/leaves", icon: CalendarOff },
        { name: "My Attendance Logs", href: "/workforce/attendance", icon: Clock },
      ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-[#D3232A] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
            {!isPro && isProOnlyRoute(tab.href, user?.role) && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                <Lock className="h-2.5 w-2.5" /> Pro
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
