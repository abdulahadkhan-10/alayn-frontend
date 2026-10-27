"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CloudUpload, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { offlineBillingExpired, offlineDaysLeft, useOfflineStatus } from "@/lib/offline/offlineStatus";
import { discardRefused, refreshQueueCounts, retryRefused, syncNow } from "@/lib/offline/syncQueue";
import { listOpenOfflineBills, type QueuedOrder } from "@/lib/offline/offlineOrders";

const PANEL_WIDTH = 320;
const EDGE_GAP = 12;

/**
 * The POS's connection pill: green when online, amber while bills are waiting to reach the server,
 * red when the server refused some. Clicking it lists refused bills so someone can retry or drop them.
 */
interface OfflineBadgeProps {
  /** Outlet whose open offline bills are listed. */
  outletId?: string | null;
  /** Take payment for an open offline bill (opens the POS checkout for it). */
  onSettle?: (bill: QueuedOrder) => void;
}

export default function OfflineBadge({ outletId, onSettle }: OfflineBadgeProps) {
  const status = useOfflineStatus();
  const [open, setOpen] = useState(false);
  const [refused, setRefused] = useState<QueuedOrder[]>([]);
  const [openBills, setOpenBills] = useState<QueuedOrder[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // The POS toolbar clips anything that overflows it, so the panel is drawn over the page, under the
  // badge, and kept inside the screen on narrow layouts
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(PANEL_WIDTH, window.innerWidth - 2 * EDGE_GAP);
      const left = Math.min(Math.max(rect.left, EDGE_GAP), window.innerWidth - width - EDGE_GAP);
      setPosition({ top: rect.bottom + 8, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Close on a click outside the badge and its panel, or on Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void refreshQueueCounts().then((all) => setRefused(all.filter((q) => q.status === "attention")));
    void listOpenOfflineBills(outletId || undefined).then(setOpenBills);
  }, [open, status.attention, status.pending, outletId]);

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
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-live="polite"
        className={`h-9 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${tone}`}
      >
        {icon}
        {label}
      </button>

      {open && position && createPortal(
        <div
          ref={panelRef}
          style={{ top: position.top, left: position.left, width: `min(${PANEL_WIDTH}px, calc(100vw - ${2 * EDGE_GAP}px))` }}
          className="fixed z-[60] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-xs text-slate-600"
        >
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

          {!status.online && onSettle && openBills.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="font-semibold text-slate-900">Open bills on this device</p>
              <ul className="mt-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {openBills.map((q) => (
                  <li key={q.clientOrderId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {q.payload.tableNumber ? `Table ${q.payload.tableNumber}` : "Counter"} · ₹{(q.payload.totalPaise / 100).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{q.payload.orderNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onSettle(q);
                      }}
                      className="h-7 px-3 rounded-md bg-[#D3232A] hover:bg-[#b91c23] text-white font-semibold shrink-0 cursor-pointer"
                    >
                      Settle
                    </button>
                  </li>
                ))}
              </ul>
            </div>
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
        </div>,
        document.body
      )}
    </>
  );
}
