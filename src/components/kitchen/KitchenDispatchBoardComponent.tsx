"use client";

import React from "react";
import {
  useGetKitchenTicketsQuery,
  useUpdateOrderStatusMutation,
  Order,
} from "@/redux/slices/orderApiSlice";
import { ChefHat, Clock, CheckCircle2, Flame, ArrowRight, RefreshCw, Utensils, Wifi, WifiOff } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import { useSocket } from "@/lib/useSocket";

export default function KitchenDispatchBoardComponent() {
  const { activeBranch } = useBranch();
  const currentOutletId = activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;

  const { data: tickets = [], isLoading, refetch, isFetching } = useGetKitchenTicketsQuery(undefined);

  // Real-time WebSocket connection using centralized useSocket hook
  const { isConnected } = useSocket(currentOutletId, {
    onKDSUpdate: () => {
      refetch();
    },
  });

  const [updateStatus] = useUpdateOrderStatusMutation();

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

  const columns: { title: string; status: Order["status"]; color: string; buttonColor: string; icon: any }[] = [
    { title: "Sent to Kitchen", status: "SENT_TO_KITCHEN", color: "border-gray-200 text-gray-800 bg-white", buttonColor: "bg-[#1B2A4A] hover:bg-black text-white rounded-none", icon: Clock },
    { title: "In Preparation", status: "PREPARING", color: "border-amber-300 text-amber-800 bg-amber-50", buttonColor: "bg-amber-500 hover:bg-amber-600 text-white rounded-none", icon: Flame },
    { title: "Ready for Pickup", status: "READY", color: "border-emerald-300 text-emerald-800 bg-emerald-50", buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white rounded-none", icon: CheckCircle2 },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1800px] mx-auto space-y-6 bg-[#F4F5F8] min-h-screen text-[#1B2A4A]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A] flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-[#D3232A]" />
              Kitchen Operations Board (KOT)
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Real-time kitchen order ticket dispatch. Auto-syncs every 4 seconds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isConnected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {isConnected ? "Live WebSocket Sync" : "Connecting..."}
          </div> this div is for checking the connection on the frontend of websockets !!  */}
            <button
              onClick={() => refetch()}
              className="btn-ghost flex items-center gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#D3232A]" : ""}`} />
              {isFetching ? "Syncing..." : "Refresh Feed"}
            </button>
          </div>
        </div>

        {/* Kanban Board Columns */}
        <div className="overflow-x-auto pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
          <div className="flex lg:grid lg:grid-cols-3 gap-6 w-max lg:w-auto">
            {columns.map((col) => {
              const colTickets = (tickets as any[])
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
                  className="w-[85vw] sm:w-[360px] lg:w-auto shrink-0 bg-gray-200/80 border-2 border-gray-300 rounded-md p-3 flex flex-col min-h-[700px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]"
                >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-black/10">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 border shadow-sm ${col.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <h3 className="font-black text-[#1B2A4A] text-sm tracking-widest uppercase">{col.title}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-white text-[#1B2A4A] font-black border border-gray-300 shadow-sm font-mono">
                    {colTickets.length}
                  </span>
                </div>

                {/* Tickets Column Body */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
                  {isLoading ? (
                    [1, 2].map((n) => (
                      <div key={n} className="h-48 bg-white animate-pulse border border-gray-200 shadow-sm" />
                    ))
                  ) : colTickets.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-300 bg-white/50">
                      <Utensils className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Zone Clear</p>
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
                          className="bg-white border border-gray-300 p-3 space-y-3 shadow-[4px_4px_0px_rgba(0,0,0,0.05)] transition-all"
                        >
                          {/* Ticket Header */}
                          <div className="flex justify-between items-start pb-2 border-b-2 border-dashed border-gray-200">
                            <div className="flex flex-col pr-2">
                              <span className="text-sm font-semibold text-[#1B2A4A] tracking-normal leading-tight break-all">
                                {ticketOrderNo} {maxKotNo > 1 && <span className="text-rose-600 ml-1 inline-block font-bold text-[11px]">(KOT #{maxKotNo})</span>}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                TBL: <span className="text-[#1B2A4A]">{ticketTableNo}</span>
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-[#1B2A4A] font-black uppercase tracking-widest border border-gray-300">
                                {ticketSource}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold font-mono">
                                {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Ticket Items List */}
                          <div className="space-y-2 py-1">
                            {ticketItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-1">
                                <div className="flex items-start gap-2 text-[13px]">
                                  <span className="font-black text-white bg-red-600 px-1.5 py-0.5 shrink-0 border border-red-700 shadow-sm leading-none flex items-center justify-center">
                                    {item.quantity}
                                  </span>
                                  <span className="font-bold text-[#1B2A4A] leading-tight pt-0.5">
                                    {item.menuItem?.name || "Item"}
                                  </span>
                                </div>
                                {item.notes && (
                                  <div className="ml-7 bg-amber-100/50 border-l-2 border-amber-400 px-2 py-1">
                                    <span className="text-[10px] text-amber-900 font-bold uppercase tracking-widest block opacity-70 mb-0.5">Note</span>
                                    <span className="text-[11px] text-amber-900 font-semibold">{item.notes}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Bottom Action Bump Button */}
                          <div className="pt-3 border-t-2 border-dashed border-gray-200">
                            <button
                              onClick={() => handleBumpStatus(ticket.id, ticket.status)}
                              className={`w-full py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2 transition-all border border-black/10 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] tracking-widest uppercase ${col.buttonColor}`}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
