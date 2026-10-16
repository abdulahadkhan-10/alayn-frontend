"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useGetAttentionQuery } from "@/redux/slices/dashboardApiSlice";

interface NeedsAttentionCardProps {
  outletId?: string;
}

/**
 * The few things to act on right now (staff not in, stock expired or running low, forgotten bills),
 * most urgent first. Shrinks to one line when everything is fine.
 */
export default function NeedsAttentionCard({ outletId }: NeedsAttentionCardProps) {
  const { data: items, isLoading, isError } = useGetAttentionQuery({ outletId });

  if (isLoading) {
    return <div className="h-16 rounded-2xl border border-slate-200/80 bg-white animate-pulse" aria-hidden="true" />;
  }
  // If the check itself fails, say nothing rather than a false "all good"
  if (isError || !items) return null;

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-5 py-3.5 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          <span className="font-semibold">All good right now.</span> Staff, stock and bills need no action.
        </span>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200/80 bg-white shadow-xs" aria-labelledby="needs-attention-title">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <h2 id="needs-attention-title" className="text-sm font-bold text-slate-800">
          Needs attention
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{items.length}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.kind}>
            <Link
              href={item.href}
              className="flex min-h-[52px] items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${item.severity === "high" ? "bg-rose-500" : "bg-amber-500"}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{item.title}</span>
                <span className="block text-xs text-slate-600 sm:truncate">{item.detail}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
