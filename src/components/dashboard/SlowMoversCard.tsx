"use client";

import React from "react";
import Link from "next/link";
import { Snail } from "lucide-react";
import { useGetSlowMoversQuery } from "@/redux/slices/dashboardApiSlice";

interface SlowMoversCardProps {
  outletId?: string;
}

const SHOWN = 5;

/** Dishes still on the menu that nobody has ordered for two weeks: candidates to promote, fix or drop. */
export default function SlowMoversCard({ outletId }: SlowMoversCardProps) {
  const { data, isLoading, isError } = useGetSlowMoversQuery({ outletId });
  const shell = "lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4";

  if (isLoading) return <div className={`${shell} h-[300px] animate-pulse`} aria-hidden="true" />;
  if (isError || !data) return null;

  const items = data.items;
  return (
    <section className={shell} aria-labelledby="slow-movers-title">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
          <Snail className="h-5 w-5" />
        </div>
        <div>
          <h2 id="slow-movers-title" className="text-base font-bold text-slate-800 tracking-tight">
            Not selling
          </h2>
          <p className="text-xs text-slate-500">On the menu, but no orders in {data.days} days</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="flex-1 py-6 text-center text-sm text-slate-500">
          Nothing to flag. Every dish sold at least once in the last {data.days} days (dishes added in that time are left out).
        </p>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-slate-100">
            {items.slice(0, SHOWN).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-600 tabular-nums">
                  {item.lastSoldDaysAgo === null ? "Never sold" : `Last sold ${item.lastSoldDaysAgo} days ago`}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">
            {items.length > SHOWN ? `${items.length - SHOWN} more. ` : ""}Feature them, fix the price, or take them off the menu.{" "}
            <Link href="/menu" className="font-semibold text-slate-700 hover:underline">
              Open menu
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
