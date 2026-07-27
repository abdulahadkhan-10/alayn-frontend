"use client";

import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  PlusCircle,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Star,
  Search,
  Filter,
  ShieldAlert,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetTicketsQuery,
  useGetMyQueriesQuery,
  Ticket,
  StaffQuery,
} from "@/redux/slices/ticketApiSlice";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import { useBranch } from "@/lib/BranchContext";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SupportSkeleton from "./SupportSkeleton";
import RaiseQueryModal from "./RaiseQueryModal";
import TicketDetailModal from "./TicketDetailModal";

export default function SupportPage() {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role || "BUSINESS_OWNER";
  const isOwner = role === "BUSINESS_OWNER";
  const isManager = role === "MANAGER";
  const isEmployee = role === "STAFF" || role === "KITCHEN";

  // Use activeBranch from global navbar BranchContext
  const { activeBranch } = useBranch();
  const selectedOutletId = activeBranch?.id === "all" ? "all" : activeBranch?.id;

  const [activeTab, setActiveTab] = useState<"staff_queries" | "customer_tickets" | "my_queries">(
    isEmployee ? "my_queries" : "staff_queries"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Fetch Outlets
  const { data: outletsData } = useGetOutletsQuery();
  const outlets = useMemo(() => {
    return Array.isArray(outletsData) ? outletsData : (outletsData as any)?.data || [];
  }, [outletsData]);

  // Fetch Tickets
  const sourceTableParam =
    activeTab === "staff_queries"
      ? "StaffQuery"
      : activeTab === "customer_tickets"
      ? "Feedback"
      : undefined;

  const { data: ticketsData, isLoading: isLoadingTickets } = useGetTicketsQuery(
    {
      outletId: selectedOutletId,
      sourceTable: sourceTableParam,
      status: statusFilter !== "all" ? statusFilter : undefined,
    },
    { skip: activeTab === "my_queries" }
  );

  // Fetch My Queries (For Staff / Kitchen / Manager)
  const { data: myQueriesData, isLoading: isLoadingMyQueries } = useGetMyQueriesQuery(undefined, {
    skip: !isEmployee && activeTab !== "my_queries",
  });

  const tickets = useMemo(() => ticketsData?.data || [], [ticketsData]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (activeTab === "my_queries" && myQueriesData) {
      const total = myQueriesData.length;
      const open = myQueriesData.filter((q) => q.status === "OPEN").length;
      const inProgress = myQueriesData.filter((q) => q.status === "IN_PROGRESS").length;
      const resolved = myQueriesData.filter((q) => q.status === "RESOLVED").length;
      return { total, open, inProgress, resolved };
    }

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "OPEN").length;
    const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const resolved = tickets.filter((t) => t.status === "RESOLVED").length;
    return { total, open, inProgress, resolved };
  }, [tickets, myQueriesData, activeTab]);

  // Filtered Tickets / Queries based on search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const query = searchQuery.toLowerCase();
    return tickets.filter((t) => {
      const titleMatch = t.title?.toLowerCase().includes(query);
      const descMatch = t.description?.toLowerCase().includes(query);
      const outletMatch = t.outlet?.name?.toLowerCase().includes(query);
      const empMatch = t.staffQuery?.employee?.name?.toLowerCase().includes(query);
      return titleMatch || descMatch || outletMatch || empMatch;
    });
  }, [tickets, searchQuery]);

  const isPageLoading = activeTab === "my_queries" ? isLoadingMyQueries : isLoadingTickets;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header Title & Actions ────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Support & Queries Hub
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isOwner
                ? "Branch-wise management of staff queries, internal concerns, and customer feedback."
                : isManager
                ? "Manage branch staff concerns and escalate operational queries to leadership."
                : "Submit queries, track resolution, and communicate with branch management."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Action Button to Raise Query / Concern (Managers, Staff, Kitchen only) */}
            {!isOwner && (
              <button
                onClick={() => setIsRaiseModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b01e23] transition-colors cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                {isManager ? "Raise Concern to Owner" : "Raise Query / Concern"}
              </button>
            )}
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 mb-2">
          {!isEmployee && (
            <>
              <button
                onClick={() => setActiveTab("staff_queries")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                  activeTab === "staff_queries"
                    ? "bg-[#D3232A] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                )}
              >
                <User className="h-4 w-4" />
                Staff Queries & Concerns
              </button>

              <button
                onClick={() => setActiveTab("customer_tickets")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                  activeTab === "customer_tickets"
                    ? "bg-[#D3232A] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                )}
              >
                <Star className="h-4 w-4" />
                Customer Feedbacks
              </button>
            </>
          )}

          {!isOwner && (
            <button
              onClick={() => setActiveTab("my_queries")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                activeTab === "my_queries"
                  ? "bg-[#D3232A] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              My Submitted Concerns
            </button>
          )}
        </div>

        {/* ── Skeleton or Main Content ────────────────────────── */}
        {isPageLoading ? (
          <SupportSkeleton />
        ) : (
          <>
            {/* ── Stat Metric Cards Row ───────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Items
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open / Pending
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.open}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Progress
                </p>
                <p className="mt-1 text-2xl font-semibold text-purple-600">{stats.inProgress}</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.resolved}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Bar ──────────────────────────────── */}
        {activeTab !== "my_queries" && (
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket title, category, description or employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A] bg-white text-gray-700 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Main List Container ─────────────────────────────── */}
        {activeTab === "my_queries" ? (
          /* My Queries View */
          <div className="space-y-3">
            {isLoadingMyQueries ? (
              <div className="flex h-40 items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D3232A] border-t-transparent" />
              </div>
            ) : myQueriesData && myQueriesData.length > 0 ? (
              myQueriesData.map((q: any) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {q.category}
                      </span>

                      {q.outlet && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded border border-gray-200 font-medium">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          {q.outlet.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase",
                          q.status === "RESOLVED" && "bg-emerald-100 text-emerald-800",
                          q.status === "IN_PROGRESS" && "bg-purple-100 text-purple-800",
                          q.status === "OPEN" && "bg-amber-100 text-amber-800"
                        )}
                      >
                        {q.status}
                      </span>
                      <span className="text-gray-500 font-medium">{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-900 font-normal leading-relaxed">{q.description}</p>

                  {/* Show Response Comment if Ticket History exists */}
                  {q.ticket?.histories && q.ticket.histories.length > 1 && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3.5 text-xs space-y-1">
                      <p className="font-semibold text-gray-900">Management Response:</p>
                      <p className="text-gray-600 font-medium">
                        {q.ticket.histories[q.ticket.histories.length - 1].comment || "Status updated"}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <HelpCircle className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-semibold text-gray-900">No Queries Raised Yet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Have a question or operational concern? Click "Raise Query / Concern" above to contact management.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Tickets View (Staff Queries or Customer Feedbacks) */
          <div className="space-y-3">
            {isLoadingTickets ? (
              <div className="flex h-40 items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D3232A] border-t-transparent" />
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                const isStaff = t.sourceTable === "StaffQuery";
                const sq = t.staffQuery;
                const fb = t.feedback;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="group cursor-pointer bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Distinction Badge */}
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                            isStaff
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {isStaff ? `Staff Query: ${sq?.category || "Internal"}` : "Customer Feedback"}
                        </span>

                        {/* Outlet / Branch Distinction */}
                        {t.outlet && (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded border border-gray-200 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            {t.outlet.name}
                          </span>
                        )}

                        {/* Priority */}
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                            t.priority === "HIGH"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status */}
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase",
                            t.status === "RESOLVED" && "bg-emerald-100 text-emerald-800",
                            t.status === "IN_PROGRESS" && "bg-purple-100 text-purple-800",
                            t.status === "OPEN" && "bg-amber-100 text-amber-800"
                          )}
                        >
                          {t.status}
                        </span>

                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#D3232A] transition-colors">
                        {t.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>
                    </div>

                    {/* Source Metadata */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {isStaff && sq?.employee && (
                          <span className="flex items-center gap-1.5 font-medium text-gray-700">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {sq.employee.name} <span className="text-gray-400 font-normal">({sq.employee.role})</span>
                          </span>
                        )}

                        {!isStaff && fb && (
                          <span className="flex items-center gap-1 text-amber-700 font-semibold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            Rating {fb.rating}/5
                            {fb.order?.orderNumber && (
                              <span className="text-gray-500 font-normal"> | Order #{fb.order.orderNumber}</span>
                            )}
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(t.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <MessageSquare className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-semibold text-gray-900">No Tickets Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  No items match your active filters or branch selection.
                </p>
              </div>
            )}
          </div>
        )}
        </>
        )}

        {/* ── Modals ───────────────────────────────────────────── */}
        <RaiseQueryModal
          isOpen={isRaiseModalOpen}
          onClose={() => setIsRaiseModalOpen(false)}
          userRole={role}
        />

        <TicketDetailModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          canManage={!isEmployee}
        />
      </div>
    </DashboardLayout>
  );
}
