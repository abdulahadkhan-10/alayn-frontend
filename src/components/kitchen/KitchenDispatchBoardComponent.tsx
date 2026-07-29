"use client";

import React, { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  useGetKitchenTicketsQuery,
  useUpdateOrderStatusMutation,
  Order,
} from "@/redux/slices/orderApiSlice";
import { ChefHat, Clock, CheckCircle2, Flame, ArrowRight, RefreshCw, Utensils } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";

export default function KitchenDispatchBoardComponent() {
  const { data: tickets = [], isLoading, refetch, isFetching } = useGetKitchenTicketsQuery(undefined);

  useEffect(() => {
    // Realtime Socket.IO WebSocket Connection for Zero-Polling KDS Feed
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("kds_update", () => {
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

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

  const columns: { title: string; status: Order["status"]; color: string; icon: any }[] = [
    { title: "Sent to Kitchen", status: "SENT_TO_KITCHEN", color: "border-blue-200 text-blue-700 bg-blue-50", icon: Clock },
    { title: "In Preparation", status: "PREPARING", color: "border-amber-200 text-amber-700 bg-amber-50", icon: Flame },
    { title: "Ready for Pickup", status: "READY", color: "border-emerald-200 text-emerald-700 bg-emerald-50", icon: CheckCircle2 },
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
        <button
          onClick={() => refetch()}
          className="btn-ghost flex items-center gap-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#D3232A]" : ""}`} />
          {isFetching ? "Syncing..." : "Refresh Feed"}
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col min-h-[600px] shadow-sm"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg border ${col.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-[#1B2A4A] text-sm">{col.title}</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold border border-gray-200">
                  {colTickets.length}
                </span>
              </div>

              {/* Tickets Column Body */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {isLoading ? (
                  [1, 2].map((n) => (
                    <div key={n} className="h-40 bg-gray-50 animate-pulse rounded-xl border border-gray-200" />
                  ))
                ) : colTickets.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    <Utensils className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No tickets in this section</p>
                  </div>
                ) : (
                  colTickets.map((ticket) => {
                    const ticketOrderNo = ticket.orderNo || ticket.orderNumber || `#${ticket.id.slice(0, 6)}`;
                    const ticketTableNo = ticket.tableNo || ticket.tableNumber || "Counter Direct";
                    const ticketSource = ticket.orderSource || ticket.source || "TABLE";
                    const ticketItems = ticket.activeItems || [];
                    const maxKotNo = Math.max(...ticketItems.map((i: any) => i.kotNo || 1), 1);

                    return (
                      <div
                        key={ticket.id}
                        className="bg-gray-50/60 border border-gray-200 hover:border-gray-300 rounded-xl p-4 space-y-3 transition shadow-sm"
                      >
                        {/* Ticket Header */}
                        <div className="flex justify-between items-start pb-2 border-b border-gray-200/60">
                          <div>
                            <span className="text-xs font-extrabold text-[#D3232A] font-mono">
                              {ticketOrderNo} {maxKotNo > 1 ? `(KOT #${maxKotNo})` : ""}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 font-medium">
                              Table: {ticketTableNo}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold uppercase">
                            {ticketSource}
                          </span>
                        </div>

                        {/* Placer Info Badge */}
                        <div className="flex items-center justify-between text-[10.5px] bg-white border border-gray-200 px-2 py-1 rounded-lg">
                          <span className="text-gray-600">Placed by: <strong className="text-[#1B2A4A] font-bold">{ticket.placedByName || (ticketSource === "COUNTER" ? "Counter Staff" : "Staff")}</strong></span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 bg-gray-100 rounded text-gray-700 uppercase tracking-wider">{ticket.placedByRole || (ticketSource === "COUNTER" ? "COUNTER" : "STAFF")}</span>
                        </div>

                        {/* Ticket Items List */}
                        <div className="space-y-1 py-1">
                          {ticketItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[#1B2A4A]">
                                <span className="text-[#D3232A] mr-1.5">{item.quantity}x</span>
                                {item.menuItem?.name || "Item"}
                              </span>
                              {item.notes && (
                                <span className="text-[10px] text-gray-500 italic">({item.notes})</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Bottom Action Bump Button */}
                        <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center">
                          <span className="text-[11px] text-gray-400">
                            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => handleBumpStatus(ticket.id, ticket.status)}
                            className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                          >
                            {(col.status === "SENT_TO_KITCHEN" || (col.status as string) === "RECEIVED") && "Start Prep"}
                            {col.status === "PREPARING" && "Mark Ready"}
                            {col.status === "READY" && "Mark Served"}
                            <ArrowRight className="w-3.5 h-3.5" />
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
    </DashboardLayout>
  );
}
