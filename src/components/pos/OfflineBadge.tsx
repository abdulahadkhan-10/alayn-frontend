"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CloudUpload, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useDismiss } from "@/lib/useDismiss";
import { offlineBillingExpired, offlineDaysLeft, useOfflineStatus } from "@/lib/offline/offlineStatus";
import { discardRefused, refreshQueueCounts, retryRefused, syncNow } from "@/lib/offline/syncQueue";
import type { QueuedOrder } from "@/lib/offline/offlineOrders";

/**
 * The POS's connection pill: green when online, amber while bills are waiting to reach the server,
 * red when the server refused some. Clicking it lists refused bills so someone can retry or drop them.
 */
export default function OfflineBadge() {
  const status = useOfflineStatus();
  const [open, setOpen] = useState(false);
  const [refused, setRefused] = useState<QueuedOrder[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    if (!open) return;
    void refreshQueueCounts().then((all) => setRefused(all.filter((q) => q.status === "attention")));
  }, [open, status.attention]);

  const daysLeft = offlineDaysLeft(status);
  const expired = offlineBillingExpired(status);

  let tone = "border-emerald-200 bg-emerald-50 text-emerald-700";
  let icon = <Wifi className="w-3.5 h-3.5" />;
  let label = "Online";
  if (status.attention > 0) {
    tone = "border-rose-200 bg-rose-50 text-rose-700";
    icon = <AlertTriangle className="w-3.5 h-3.5" />;
    label = `${status.attention} ${status.attention === 1 ? "bill needs" : "bills need"} attention`;
  } else if (!status.online) {
    tone = expired ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-800";
    icon = <WifiOff className="w-3.5 h-3.5" />;
    label = expired
      ? "Offline too long · reconnect to bill"
      : `Offline${status.pending > 0 ? ` · ${status.pending} ${status.pending === 1 ? "bill" : "bills"} waiting` : ""}` +
        (daysLeft !== null ? ` · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left` : "");
  } else if (status.pending > 0) {
    tone = "border-amber-200 bg-amber-50 text-amber-800";
    icon = status.syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />;
    label = status.syncing ? `Syncing ${status.pending} ${status.pending === 1 ? "bill" : "bills"}` : `${status.pending} waiting to sync`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-live="polite"
        className={`h-9 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${tone}`}
      >
        {icon}
        {label}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-xs text-slate-600">
          {!status.online ? (
            <p>
              No internet. Bills are saved on this device and print as normal. They go to the server by themselves when the
              connection returns. Offline billing works for up to 7 days.
            </p>
          ) : status.pending > 0 ? (
            <p>Internet is back. Saved bills are being sent to the server now.</p>
          ) : (
            <p>Connected. If the internet drops, keep billing: bills are saved on this device and synced later.</p>
          )}

          {status.online && status.pending > 0 && !status.syncing && (
            <button
              type="button"
              onClick={() => void syncNow()}
              className="mt-3 h-8 px-3 rounded-lg bg-[#1B2A4A] text-white font-medium cursor-pointer"
            >
              Sync now
            </button>
          )}

          {refused.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="font-semibold text-slate-900">Bills the server refused</p>
              <ul className="mt-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
                {refused.map((q) => (
                  <li key={q.clientOrderId} className="rounded-lg border border-slate-100 p-2">
                    <p className="font-medium text-slate-800">
                      {q.payload.orderNumber} · ₹{(q.payload.totalPaise / 100).toFixed(2)}
                    </p>
                    <p className="mt-0.5 text-rose-700">{q.lastError}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void retryRefused(q.clientOrderId)}
                        className="h-7 px-2.5 rounded-md border border-slate-200 font-medium cursor-pointer"
                      >
                        Try again
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove bill ${q.payload.orderNumber} from this device? Only do this after entering it by hand.`)) {
                            void discardRefused(q.clientOrderId).then(() =>
                              setRefused((list) => list.filter((r) => r.clientOrderId !== q.clientOrderId))
                            );
                          }
                        }}
                        className="h-7 px-2.5 rounded-md border border-rose-200 text-rose-700 font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
