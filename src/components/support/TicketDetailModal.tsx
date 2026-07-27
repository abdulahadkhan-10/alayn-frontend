"use client";

import React, { useState } from "react";
import { X, Clock, CheckCircle2, AlertCircle, MessageSquare, User, Building2, Star, Send, ShieldAlert } from "lucide-react";
import { Ticket, useUpdateTicketStatusMutation } from "@/redux/slices/ticketApiSlice";
import { cn } from "@/lib/utils";

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  canManage?: boolean;
}

export default function TicketDetailModal({ ticket, isOpen, onClose, canManage = true }: TicketDetailModalProps) {
  const [newStatus, setNewStatus] = useState<"OPEN" | "IN_PROGRESS" | "RESOLVED">("IN_PROGRESS");
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [updateTicketStatus, { isLoading }] = useUpdateTicketStatusMutation();

  if (!isOpen || !ticket) return null;

  const isStaffQuery = ticket.sourceTable === "StaffQuery";
  const staffQuery = ticket.staffQuery;
  const feedback = ticket.feedback;

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      await updateTicketStatus({
        id: ticket.id,
        status: newStatus,
        comment: comment.trim() || undefined,
      }).unwrap();

      setComment("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.message || "Failed to update ticket status.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0 pr-4">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-2 text-sm font-semibold",
                isStaffQuery
                  ? "bg-purple-100 text-purple-800"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {isStaffQuery ? <User className="h-5 w-5" /> : <Star className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase",
                    isStaffQuery
                      ? "bg-purple-100 text-purple-800"
                      : "bg-amber-100 text-amber-800"
                  )}
                >
                  {isStaffQuery ? "Internal Staff Query" : "Customer Feedback Ticket"}
                </span>

                {ticket.outlet && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded border border-gray-200 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    {ticket.outlet.name}
                  </span>
                )}

                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    ticket.priority === "HIGH"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-blue-100 text-blue-800"
                  )}
                >
                  {ticket.priority === "HIGH" && <ShieldAlert className="h-3.5 w-3.5" />}
                  {ticket.priority} PRIORITY
                </span>
              </div>

              <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                {ticket.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Main Description Card */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Submitted Details</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>

            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>

            {/* Staff Details if StaffQuery */}
            {isStaffQuery && staffQuery?.employee && (
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    {staffQuery.employee.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{staffQuery.employee.name}</span>
                    <span className="text-gray-500 ml-2">({staffQuery.employee.role})</span>
                  </div>
                </div>
                {staffQuery.category && (
                  <span className="rounded bg-white px-2.5 py-1 text-gray-700 font-medium border border-gray-200">
                    Category: {staffQuery.category}
                  </span>
                )}
              </div>
            )}

            {/* Feedback Details if Feedback */}
            {!isStaffQuery && feedback && (
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-700 font-bold">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span>{feedback.rating} / 5 Rating</span>
                  </div>
                  {feedback.order?.orderNumber && (
                    <span className="text-gray-500">| Order #{feedback.order.orderNumber}</span>
                  )}
                </div>
                <span className="rounded bg-white px-2.5 py-1 text-gray-700 font-medium border border-gray-200">
                  Source: {feedback.source}
                </span>
              </div>
            )}
          </div>

          {/* Timeline History */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Event Timeline & Comments
            </h3>
            <div className="space-y-2">
              {ticket.histories && ticket.histories.length > 0 ? (
                ticket.histories.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg border border-gray-200 bg-white p-3 text-xs flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                            h.status === "RESOLVED" && "bg-emerald-100 text-emerald-800",
                            h.status === "IN_PROGRESS" && "bg-purple-100 text-purple-800",
                            h.status === "OPEN" && "bg-amber-100 text-amber-800"
                          )}
                        >
                          {h.status}
                        </span>
                        <span className="text-gray-800">{h.comment || "Status updated"}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 shrink-0">
                      {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No historical entries yet.</p>
              )}
            </div>
          </div>

          {/* Manage Form (For Manager / Business Owner) */}
          {canManage && ticket.status !== "RESOLVED" && (
            <form onSubmit={handleStatusUpdate} className="pt-4 border-t border-gray-200 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">
                Update Status & Post Response
              </h3>

              {errorMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewStatus("IN_PROGRESS")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all cursor-pointer",
                    newStatus === "IN_PROGRESS"
                      ? "border-amber-300 bg-amber-50 text-amber-800 shadow-xs"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setNewStatus("RESOLVED")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-all cursor-pointer",
                    newStatus === "RESOLVED"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xs"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Resolved
                </button>
              </div>

              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a response comment or resolution note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b01e23] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Save Status & Response
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
