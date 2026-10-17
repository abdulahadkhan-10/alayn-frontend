"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";

export interface OpenOrder {
  id: string;
  ticket: string;
  source: string;
  tableNo: string | null;
  status: string;
  totalAmount: number;
  createdAt: string | null;
}

interface RightNowCardProps {
  orders: OpenOrder[];
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** "THE202610080001" → "#0001" (the full number is in the title) */
const shortTicket = (ticket: string) => {
  const m = /(\d{4})$/.exec(ticket);
  return m ? `#${m[1]}` : ticket;
};

/** "SENT_TO_KITCHEN" → "Sent to kitchen" */
const statusLabel = (status: string) => {
  const t = status.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Where an order is: "Table 4", "Counter", "QR order", "Delivery" */
function orderLocation(source: string, tableNo: string | null) {
  if (source === "TABLE") return tableNo ? `Table ${tableNo}` : "Table";
  if (source === "QR") return tableNo ? `QR · Table ${tableNo}` : "QR order";
  if (source === "DELIVERY") return "Delivery";
  return "Counter";
}

/** "12 min", "1h 5m", "21 hr" (short enough for the stat box) */
function age(createdAt: string | null) {
  if (!createdAt) return null;
  const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  if (mins < 180) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  if (mins < 48 * 60) return `${Math.floor(mins / 60)} hr`;
  return `${Math.floor(mins / 1440)} days`;
}

const STATUS_STYLE: Record<string, string> = {
  SENT_TO_KITCHEN: "bg-amber-50 text-amber-800",
  PREPARING: "bg-blue-50 text-blue-700",
  READY: "bg-emerald-50 text-emerald-700",
};

/** Open orders at a glance: how many, how much is unsettled, how long the oldest has waited, and the latest few. */
export default function RightNowCard({ orders }: RightNowCardProps) {
  const total = orders.reduce((s, o) => s + o.totalAmount, 0);
  const oldest = orders.reduce<OpenOrder | null>(
    (a, o) => (o.createdAt && (!a?.createdAt || o.createdAt < a.createdAt) ? o : a),
    null,
  );
  const latest = [...orders].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 3);

  return (
    <section
      className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4"
      aria-labelledby="right-now-title"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 id="right-now-title" className="text-base font-bold text-slate-800 tracking-tight">
              Right now
            </h2>
            <p className="text-xs text-slate-500">Orders in the kitchen or not yet paid</p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 px-3 py-3">
        <div>
          <dt className="text-xs text-slate-500">Open</dt>
          <dd className="text-xl font-bold text-slate-900 tabular-nums">{orders.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Unsettled</dt>
          <dd className="text-xl font-bold text-slate-900 tabular-nums">{inr(total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Oldest</dt>
          <dd className="text-xl font-bold text-slate-900 tabular-nums">{age(oldest?.createdAt ?? null) ?? "—"}</dd>
        </div>
      </dl>

      {orders.length === 0 ? (
        <p className="flex-1 py-4 text-center text-sm text-slate-500">No open orders. Everything is settled.</p>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100">
          {latest.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-slate-900">
                  <span className="tabular-nums text-slate-500" title={o.ticket}>
                    {shortTicket(o.ticket)}
                  </span>{" "}
                  <span className="font-semibold">{orderLocation(o.source, o.tableNo)}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_STYLE[o.status] ?? "bg-slate-100 text-slate-700"}`}>
                    {statusLabel(o.status)}
                  </span>
                  {age(o.createdAt) && <span>{age(o.createdAt)} ago</span>}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">{inr(o.totalAmount)}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/orders"
        className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        {orders.length > 3 ? `All ${orders.length} open orders` : "Live orders"} <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
