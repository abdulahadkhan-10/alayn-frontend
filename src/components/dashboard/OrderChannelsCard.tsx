"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { useGetChannelDistributionQuery } from "@/redux/slices/dashboardApiSlice";

interface OrderChannelsCardProps {
  outletId?: string;
  range?: string; // same values as the dashboard date filter; defaults to this month
  rangeLabel?: string;
}

/** Where orders come from (dine-in, counter, QR, delivery), as a share of orders. */
export default function OrderChannelsCard({ outletId, range = "THIS_MONTH", rangeLabel = "this month" }: OrderChannelsCardProps) {
  const { data: channels = [] } = useGetChannelDistributionQuery({ outletId, range });
  const top = channels.length ? channels.reduce((a, b) => (b.value > a.value ? b : a)) : null;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-3" aria-labelledby="order-channels-title">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
          <PieChartIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 id="order-channels-title" className="text-base font-bold text-slate-800 tracking-tight">
            Order channels
          </h2>
          <p className="text-xs text-slate-500">Where orders come from · {rangeLabel}</p>
        </div>
      </div>

      <div className="h-[180px] flex items-center justify-center relative">
        {channels.length === 0 ? (
          <p className="text-sm text-slate-500">No orders {rangeLabel} yet.</p>
        ) : channels.length === 1 ? (
          // One channel: a ring that is 100% one colour says nothing a sentence can't
          <p className="text-sm font-semibold text-slate-800">
            All orders were {channels[0].name === "Dine-in" ? "dine-in" : `${channels[0].name.toLowerCase()} orders`}
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channels} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {channels.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  formatter={(val) => [`${val}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
            {top && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800 tabular-nums">
                  {top.value}
                  <span className="text-xs text-slate-500">%</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">{top.name}</span>
              </div>
            )}
          </>
        )}
      </div>

      {channels.length > 1 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-100 pt-3">
          {channels.map((ch) => (
            <li key={ch.name} className="flex items-center justify-center gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} aria-hidden="true" />
              <span className="text-slate-600">{ch.name}</span>
              <span className="font-semibold text-slate-800 tabular-nums">{ch.value}%</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
