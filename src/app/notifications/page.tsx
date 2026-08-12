"use client";

import React, { useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Bell,
  Check,
  ShoppingBag,
  AlertTriangle,
  Truck,
  Calendar,
  MessageSquare,
  Trash2,
  FileText,
  Loader2,
  Utensils,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  NotificationItem,
} from "@/redux/slices/notificationApiSlice";
import { toast } from "react-toastify";

// Helper functions (duplicated from dropdown for isolated use)
const getIcon = (type: string) => {
  switch (type) {
    case "ORDER_PLACED":
      return <ShoppingBag className="h-5 w-5 text-blue-600" />;
    case "ORDER_READY":
      return <Utensils className="h-5 w-5 text-emerald-600" />;
    case "LOW_STOCK":
    case "EXPIRY_ALERT":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case "PO_SENT":
    case "PO_DISPATCHED":
    case "PO_RECEIVED":
      return <Truck className="h-5 w-5 text-purple-600" />;
    case "LEAVE_REQUESTED":
    case "LEAVE_STATUS_CHANGED":
    case "SHIFT_SWAP_REQUESTED":
      return <Calendar className="h-5 w-5 text-indigo-600" />;
    case "TICKET_CREATED":
      return <MessageSquare className="h-5 w-5 text-slate-700" />;
    case "HIGH_WASTE_LOGGED":
      return <Trash2 className="h-5 w-5 text-rose-600" />;
    default:
      return <FileText className="h-5 w-5 text-blue-600" />;
  }
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const getTargetRoute = (item: NotificationItem): string => {
  switch (item.entityType) {
    case "ORDER":
      return item.type === "ORDER_PLACED" ? "/kitchen" : "/orders";
    case "STOCK":
      return "/inventory";
    case "PURCHASE_ORDER":
      return "/inventory/procurement";
    case "LEAVE_REQUEST":
    case "SHIFT_SWAP":
      return "/workforce";
    case "TICKET":
      return "/support";
    case "WASTE":
      return "/waste";
    default:
      return "/";
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  
  // Fetch a larger limit for the dedicated page
  const { data, isLoading, refetch } = useGetNotificationsQuery({ limit: 50 });
  const rawNotifications = data?.data || [];
  
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = React.useMemo(() => {
    let unhidden = rawNotifications.filter((n) => !hiddenIds.has(n.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      unhidden = unhidden.filter(
        (n) => n.title.toLowerCase().includes(q) || (n.message && n.message.toLowerCase().includes(q))
      );
    }
    return unhidden;
  }, [rawNotifications, hiddenIds, searchQuery]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReadIds((prev) => new Set(prev).add(id));
    try {
      await markAsRead(id).unwrap();
    } catch (error) {
      console.error("Failed to mark notification read", error);
    }
  };

  const handleMarkAllRead = async () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => new Set([...prev, ...allIds]));
    try {
      await markAllAsRead().unwrap();
      refetch();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all read", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenIds((prev) => new Set(prev).add(id));
    try {
      await deleteNotification(id).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="mx-auto max-w-5xl px-4 py-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl flex items-center gap-3">
                <Bell className="h-8 w-8 text-blue-600" />
                Notification Center
              </h1>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                View and manage all your operational alerts and system updates.
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white shadow-sm"
                />
              </div>
              
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll || notifications.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
              >
                {isMarkingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            </div>
          </div>

          {/* List Container */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Loading your notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="h-16 w-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100 shadow-inner">
                  <Bell className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No notifications found</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {searchQuery ? "We couldn't find any notifications matching your search." : "You're all caught up! You have no alerts or updates at this time."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((item) => {
                  const targetRoute = getTargetRoute(item);
                  const isItemRead = item.isRead || readIds.has(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isItemRead) handleMarkAsRead(item.id);
                        router.push(targetRoute);
                      }}
                      className={`group flex items-start sm:items-center gap-4 p-5 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !isItemRead ? "bg-blue-50/30" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div className="relative shrink-0 mt-1 sm:mt-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-all ${
                          !isItemRead ? "bg-white border-blue-100" : "bg-gray-50 border-gray-100"
                        }`}>
                          {getIcon(item.type)}
                        </div>
                        {!isItemRead && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 rounded-full bg-blue-600 ring-2 ring-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                          <h4 className={`text-base tracking-tight truncate ${!isItemRead ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                            {item.title}
                          </h4>
                          <span className="text-xs font-medium text-gray-400 whitespace-nowrap shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.message}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 flex items-center sm:ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Notification"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                <span className="text-xs font-semibold text-gray-500">Showing {notifications.length} notifications</span>
              </div>
            )}
          </div>
          
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
