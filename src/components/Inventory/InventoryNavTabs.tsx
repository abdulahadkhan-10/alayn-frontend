"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Inventory",               href: "/inventory" },
  { name: "Purchase Orders",         href: "/inventory/procurement" },
  { name: "Vendors",                 href: "/inventory/procurement?tab=suppliers" },
  { name: "Marketplace & Best Rates", href: "/inventory/procurement?tab=marketplace" },
];

export default function InventoryNavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams?.get("tab");

  return (
    <div className="w-full border-b border-zinc-200 bg-white">
      <nav aria-label="Inventory Navigation" className="flex items-center gap-0 px-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isMarketplaceTab = tab.href.includes("tab=marketplace");
          const isVendorsTab = tab.href.includes("tab=suppliers");
          const isPOsTab = tab.href === "/inventory/procurement" && !isVendorsTab && !isMarketplaceTab;

          let isActive = false;
          if (isMarketplaceTab) {
            isActive = pathname === "/inventory/procurement" && activeTabParam === "marketplace";
          } else if (isVendorsTab) {
            isActive = pathname === "/inventory/procurement" && activeTabParam === "suppliers";
          } else if (isPOsTab) {
            isActive = pathname === "/inventory/procurement" && activeTabParam !== "suppliers" && activeTabParam !== "marketplace";
          } else {
            isActive = pathname === "/inventory" || pathname === "/inventory/adjust" || pathname === "/inventory/count";
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative py-3.5 px-5 text-sm font-medium transition-colors duration-150 whitespace-nowrap",
                "border-b-2",
                isActive
                  ? "border-[#D3232A] text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
