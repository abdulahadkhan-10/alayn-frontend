"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Sliders, Truck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    name: "Stock Items",
    href: "/inventory",
    icon: Package,
    desc: "Live stock counts & values",
  },
  {
    name: "Adjust Stock",
    href: "/inventory/adjust",
    icon: Sliders,
    desc: "Update counts & fix differences",
  },
  {
    name: "Orders & Suppliers",
    href: "/inventory/procurement",
    icon: Truck,
    desc: "Place restock orders & vendors",
  },
];

export default function InventoryNavTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-1.5 sm:p-2 shadow-xs">
      <nav aria-label="Inventory Navigation" className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 min-w-[180px] sm:min-w-0 flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all text-left group",
                isActive
                  ? "bg-[#D3232A] text-white shadow-sm font-semibold"
                  : "bg-zinc-50/80 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-100"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "rounded-lg p-1.5 transition-colors shrink-0",
                    isActive ? "bg-white/20 text-white" : "bg-white text-zinc-500 shadow-2xs group-hover:text-zinc-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs sm:text-sm font-bold leading-tight truncate">{tab.name}</p>
                  <p
                    className={cn(
                      "text-[10px] leading-tight mt-0.5 truncate",
                      isActive ? "text-white/80" : "text-zinc-400 group-hover:text-zinc-500"
                    )}
                  >
                    {tab.desc}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 shrink-0 hidden md:block",
                  isActive ? "text-white" : "text-zinc-400"
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
