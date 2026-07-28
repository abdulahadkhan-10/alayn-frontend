"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Package, Truck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Purchase Orders",
    href: "/inventory/procurement",
    icon: Truck,
  },
  {
    name: "Vendors",
    href: "/inventory/procurement?tab=suppliers",
    icon: Building2,
  },
];

export default function InventoryNavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams?.get("tab");

  return (
    <div className="w-full border-b border-zinc-200 bg-white">
      <nav aria-label="Inventory Navigation" className="flex items-center gap-6 px-1">
        {tabs.map((tab) => {
          const isVendorsTab = tab.href.includes("tab=suppliers");
          const isPOsTab = tab.href === "/inventory/procurement" && !isVendorsTab;
          
          let isActive = false;
          if (isVendorsTab) {
            isActive = pathname === "/inventory/procurement" && activeTabParam === "suppliers";
          } else if (isPOsTab) {
            isActive = pathname === "/inventory/procurement" && activeTabParam !== "suppliers";
          } else {
            isActive = pathname === "/inventory" || pathname === "/inventory/adjust";
          }

          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 py-3 border-b-2 text-sm font-bold transition-all",
                isActive
                  ? "border-[#D3232A] text-[#D3232A]"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-[#D3232A]" : "text-zinc-400")} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


