"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  useGetKitchenTicketsQuery,
  useUpdateOrderStatusMutation,
  Order,
} from "@/redux/slices/orderApiSlice";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  RefreshCw,
  Utensils,
  Printer,
  AlertTriangle,
  XCircle,
  Bell,
  Layers,
  Monitor,
  Check,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import { useSocket } from "@/lib/useSocket";
import ThermalKOT from "../pos/ThermalKOT";

export default function KitchenDispatchBoardComponent() {
  const { activeBranch } = useBranch();
  const currentOutletId = activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;
  const kitchenMode = (activeBranch as any)?.kitchenMode || "HYBRID";

  const { data: tickets = [], isLoading, refetch, isFetching } = useGetKitchenTicketsQuery(undefined);
  const [updateStatus] = useUpdateOrderStatusMutation();

  // Printable Thermal KOT ticket state
  const [printingTicket, setPrintingTicket] = useState<{ order: any; isCancellation: boolean } | null>(null);

  // Dismissed cancelled orders state (manually cleared by cook)
  const [dismissedCancelledIds, setDismissedCancelledIds] = useState<Set<string>>(new Set());

  // Real-time clock ticker for 3-minute cancellation countdowns
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio chime function for Indian kitchen acoustic notifications
  const playKitchenChime = (isCancel = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCancel) {
        // High urgency 2-tone alarm chime for cancellation
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        // Standard kitchen bell ding for new order
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Real-time WebSocket connection
  const { isConnected } = useSocket(currentOutletId, {
    onKDSUpdate: (data: any) => {
      refetch();
      if (data?.status === "CANCELLED") {
        playKitchenChime(true);
      } else {
        playKitchenChime(false);
      }
    },
  });

  const handleBumpStatus = async (orderId: string, currentStatus: Order["status"]) => {
    let nextStatus: Order["status"] = "PREPARING";
    if (currentStatus === "SENT_TO_KITCHEN" || (currentStatus as string) === "RECEIVED") nextStatus = "PREPARING";
    else if (currentStatus === "PREPARING") nextStatus = "READY";
    else if (currentStatus === "READY") nextStatus = "SERVED";

    try {
      await updateStatus({ id: orderId, status: nextStatus }).unwrap();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Active cancelled orders within 3 minutes (180s)
  const activeCancelledOrders = useMemo(() => {
    const rawTickets = (tickets as any[]) || [];
    return rawTickets.filter((t) => {
      if (t.status !== "CANCELLED") return false;
      if (dismissedCancelledIds.has(t.id)) return false;

      const cancelTime = new Date(t.updatedAt || t.createdAt).getTime();
      const elapsedSeconds = Math.floor((now - cancelTime) / 1000);
      return elapsedSeconds < 180; // 3 minutes retention window
    });
  }, [tickets, dismissedCancelledIds, now]);

  const handleDismissCancelled = (id: string) => {
    setDismissedCancelledIds((prev) => new Set([...Array.from(prev), id]));
  };

  const columns: { title: string; status: Order["status"]; color: string; buttonColor: string; icon: any }[] = [
    { title: "Sent to Kitchen", status: "SENT_TO_KITCHEN", color: "border-gray-200 text-gray-800 bg-white", buttonColor: "bg-[#1B2A4A] hover:bg-black text-white", icon: Clock },
    { title: "In Preparation", status: "PREPARING", color: "border-amber-300 text-amber-800 bg-amber-50", buttonColor: "bg-amber-500 hover:bg-amber-600 text-white", icon: Flame },
    { title: "Ready for Pickup", status: "READY", color: "border-emerald-300 text-emerald-800 bg-emerald-50", buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white", icon: CheckCircle2 },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-[1900px] mx-auto space-y-5 bg-[#F4F5F8] min-h-screen text-[#1B2A4A]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#1B2A4A] flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-[#D3232A]" />
                Kitchen Operations & KOT Board
              </h1>
              {/* Active Kitchen Mode Badge */}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                kitchenMode === "KOT"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : kitchenMode === "KDS"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-purple-50 text-purple-800 border-purple-200"
              }`}>
                {kitchenMode === "KOT" ? (
                  <>
                    <Printer className="w-3 h-3" />
                    KOT Thermal Mode
                  </>
                ) : kitchenMode === "KDS" ? (
                  <>
                    <Monitor className="w-3 h-3" />
                    KDS Screen Mode
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3" />
                    Hybrid (KOT + KDS)
                  </>
                )}
              </span>
            </div>
            <p className="text-gray-500 text-xs font-medium mt-1">
              Real-time kitchen order ticket dispatch. Automatic 3-minute cancel retention active.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => playKitchenChime(false)}
              className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Test Kitchen Chime Sound"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Test Bell</span>
            </button>
            <button
              onClick={() => refetch()}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#1B2A4A] rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#D3232A]" : ""}`} />
              {isFetching ? "Syncing..." : "Refresh Feed"}
            </button>
          </div>
        </div>

        {/* Operational Notice if KOT Only Mode */}
        {kitchenMode === "KOT" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-blue-900 text-xs">
            <div className="flex items-center gap-2.5">
              <Printer className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <span className="font-extrabold uppercase tracking-wide">Physical KOT Mode Active:</span>
                <span className="ml-1 font-medium text-blue-800">
                  Line cooks operate via physical thermal paper slips. Use this board for monitoring and reprinting tickets.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full">
              Thermal Active
            </span>
          </div>
        )}

        {/* ── PRIORITY ALERT TRAY: CANCELLED ORDERS (Retained for 3 Minutes) ── */}
        {activeCancelledOrders.length > 0 && (
          <div className="bg-rose-500/10 border-2 border-rose-500 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-rose-700">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Order Cancellation Alert — Stop Preparation
                </h3>
              </div>
              <span className="text-xs font-bold text-rose-700 font-mono">
                {activeCancelledOrders.length} ticket(s) cancelled &bull; Auto-dismissing in 3 min
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeCancelledOrders.map((cancelledTicket) => {
                const cancelTime = new Date(cancelledTicket.updatedAt || cancelledTicket.createdAt).getTime();
                const elapsedSeconds = Math.floor((now - cancelTime) / 1000);
                const remainingSeconds = Math.max(0, 180 - elapsedSeconds);
                const mins = Math.floor(remainingSeconds / 60);
                const secs = remainingSeconds % 60;
                const formattedTime = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                const progressPercent = Math.max(0, (remainingSeconds / 180) * 100);

                const cOrderNo = cancelledTicket.orderNo || cancelledTicket.orderNumber || `#${cancelledTicket.id.slice(0, 6)}`;
                const cTableNo = cancelledTicket.tableNo || cancelledTicket.tableNumber || "COUNTER";
                const cItems = cancelledTicket.items || cancelledTicket.orderItems || [];

                return (
                  <div
                    key={cancelledTicket.id}
                    className="bg-white border-2 border-rose-400 rounded-xl p-3.5 shadow-md space-y-2.5 relative overflow-hidden"
                  >
                    {/* Visual countdown progress line at the top */}
                    <div
                      className="absolute top-0 left-0 h-1 bg-rose-500 transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />

                    <div className="flex justify-between items-start pt-1">
                      <div>
                        <span className="text-base font-black text-rose-700 tracking-tight">
                          {cOrderNo}
                        </span>
                        <div className="text-xs font-black uppercase text-zinc-900 mt-0.5">
                          TBL: <span className="text-rose-600 text-sm">{cTableNo}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-rose-300">
                          VOID / CANCELLED
                        </span>
                        <span className="text-[11px] font-mono font-black text-rose-600">
                          Clearing in {formattedTime}
                        </span>
                      </div>
                    </div>

                    {/* Cancelled items list */}
                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-lg p-2 space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block">
                        Cancelled Items (Do Not Cook):
                      </span>
                      {cItems.map((ci: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-rose-950 font-bold">
                          <span className="truncate pr-2">{ci.menuItem?.name || ci.menuItemName || "Item"}</span>
                          <span className="font-black px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded-xs text-[11px]">
                            x{ci.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setPrintingTicket({ order: cancelledTicket, isCancellation: true })}
                        className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-zinc-800 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Print Cancellation Thermal Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-700" />
                        Print Void KOT
                      </button>
                      <button
                        onClick={() => handleDismissCancelled(cancelledTicket.id)}
                        className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Acknowledge
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── KANBAN BOARD COLUMNS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {columns.map((col) => {
            const colTickets = (tickets as any[])
              .filter((t) => t.status !== "CANCELLED" && t.status !== "COMPLETED")
              .map((t) => {
                const items = t.orderItems || t.items || [];
                const matchingItems = items.filter((item: any) => {
                  if (!item.status) return true;
                  if (col.status === "SENT_TO_KITCHEN") {
                    return item.status === "SENT_TO_KITCHEN" || item.status === "RECEIVED";
                  }
                  return item.status === col.status;
                });
                return { ...t, activeItems: matchingItems };
              })
              .filter((t) => t.activeItems.length > 0);

            const IconComponent = col.icon;

            return (
              <div
                key={col.status}
                className="bg-gray-200/80 border-2 border-gray-300 rounded-xl p-3 flex flex-col min-h-[700px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)]"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-black/10">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 border rounded-lg shadow-xs ${col.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <h3 className="font-black text-[#1B2A4A] text-sm tracking-wider uppercase">{col.title}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 bg-white text-[#1B2A4A] font-black rounded-full border border-gray-300 shadow-xs font-mono">
                    {colTickets.length}
                  </span>
                </div>

                {/* Tickets Column Body */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none">
                  {isLoading ? (
                    [1, 2].map((n) => (
                      <div key={n} className="h-48 bg-white animate-pulse rounded-xl border border-gray-200 shadow-xs" />
                    ))
                  ) : colTickets.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 bg-white/50 rounded-xl">
                      <Utensils className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Station Clear</p>
                    </div>
                  ) : (
                    colTickets.map((ticket) => {
                      const ticketOrderNo = ticket.orderNo || ticket.orderNumber || `#${ticket.id.slice(0, 6)}`;
                      const ticketTableNo = ticket.tableNo || ticket.tableNumber || "COUNTER";
                      const ticketSource = ticket.orderSource || ticket.source || "TABLE";
                      const ticketItems = ticket.activeItems || [];
                      const maxKotNo = Math.max(...ticketItems.map((i: any) => i.kotNo || 1), 1);

                      return (
                        <div
                          key={ticket.id}
                          className="bg-white border border-gray-300 rounded-xl p-3.5 space-y-3 shadow-sm hover:shadow-md transition-all"
                        >
                          {/* Ticket Header */}
                          <div className="flex justify-between items-start pb-2.5 border-b-2 border-dashed border-gray-200">
                            <div className="flex flex-col pr-2">
                              <span className="text-sm font-black text-[#1B2A4A] tracking-normal leading-tight break-all">
                                {ticketOrderNo} {maxKotNo > 1 && <span className="text-rose-600 ml-1 inline-block font-black text-xs">(KOT #{maxKotNo})</span>}
                              </span>
                              <span className="text-xs text-gray-600 font-extrabold uppercase tracking-wide mt-1">
                                TBL: <span className="text-[#1B2A4A] font-black">{ticketTableNo}</span>
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-[#1B2A4A] font-black uppercase tracking-widest rounded-md border border-gray-300">
                                  {ticketSource}
                                </span>
                                {/* Quick Print KOT button on ticket */}
                                <button
                                  onClick={() => setPrintingTicket({ order: ticket, isCancellation: false })}
                                  className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black rounded-md transition cursor-pointer"
                                  title="Print / Reprint KOT Ticket"
                                >
                                  <Printer className="w-3.5 h-3.5 text-zinc-700" />
                                </button>
                              </div>
                              <span className="text-[10px] text-gray-500 font-bold font-mono">
                                {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Ticket Items List */}
                          <div className="space-y-2 py-1">
                            {ticketItems.map((item: any, idx: number) => {
                              const isVeg = item.menuItem?.dietaryType === "VEG" || item.menuItem?.isVeg === true;
                              const isNonVeg = item.menuItem?.dietaryType === "NON_VEG" || (item.menuItem?.isVeg === false);

                              return (
                                <div key={idx} className="flex flex-col gap-1">
                                  <div className="flex items-start gap-2 text-[13px]">
                                    <span className="font-black text-white bg-red-600 px-1.5 py-0.5 rounded-sm shrink-0 border border-red-700 shadow-xs leading-none flex items-center justify-center">
                                      {item.quantity}
                                    </span>
                                    <div className="flex-1 leading-tight pt-0.5">
                                      <div className="flex items-center gap-1.5">
                                        {isVeg && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Veg" />}
                                        {isNonVeg && <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" title="Non-Veg" />}
                                        <span className="font-bold text-[#1B2A4A]">
                                          {item.menuItem?.name || item.menuItemName || "Item"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {item.notes && (
                                    <div className="ml-7 bg-amber-100/60 border-l-2 border-amber-400 px-2 py-1 rounded-r-md">
                                      <span className="text-[9px] text-amber-900 font-bold uppercase tracking-widest block opacity-75 mb-0.5">Prep Note</span>
                                      <span className="text-[11px] text-amber-950 font-semibold">{item.notes}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Bottom Action Bump Button */}
                          <div className="pt-2.5 border-t-2 border-dashed border-gray-200">
                            <button
                              onClick={() => handleBumpStatus(ticket.id, ticket.status)}
                              className={`w-full py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer tracking-wider uppercase ${col.buttonColor}`}
                            >
                              {(col.status === "SENT_TO_KITCHEN" || (col.status as string) === "RECEIVED") && "START PREP"}
                              {col.status === "PREPARING" && "MARK READY"}
                              {col.status === "READY" && "MARK SERVED"}
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Thermal KOT Printable Modal */}
        {printingTicket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPrintingTicket(null);
            }}
          >
            <ThermalKOT
              order={printingTicket.order}
              isCancellation={printingTicket.isCancellation}
              onClose={() => setPrintingTicket(null)}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
