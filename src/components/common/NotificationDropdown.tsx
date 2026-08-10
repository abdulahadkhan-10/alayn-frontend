"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  ShoppingBag,
  AlertTriangle,
  Truck,
  Calendar,
  HelpCircle,
  Trash2,
  Sparkles,
  Loader2,
  Utensils,
  MessageSquare,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useBranch } from "@/lib/BranchContext";
import { useSocket } from "@/lib/useSocket";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  NotificationItem,
} from "@/redux/slices/notificationApiSlice";

export default function NotificationDropdown() {
  const router = useRouter();
  const { activeBranch } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData, isLoading, refetch } = useGetNotificationsQuery({ limit: 20 });
  const { data: unreadCountData, refetch: refetchUnreadCount } = useGetUnreadCountQuery();

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const unreadCount = unreadCountData?.data?.unreadCount || 0;
  const notifications = notificationsData?.data || [];

  // Socket real-time notification handler
  const { isConnected } = useSocket(activeBranch?.id, {
    onNotification: (data: NotificationItem) => {
      refetch();
      refetchUnreadCount();

      // Toast alert for incoming live notifications
      toast.info(
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs text-gray-900">{data.title}</span>
          <span className="text-xs text-gray-600 line-clamp-2">{data.message}</span>
        </div>,
        {
          autoClose: 5000,
          hideProgressBar: false,
          icon: <Sparkles className="h-4 w-4 text-[#D3232A]" />,
        }
      );
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await markAsRead(id).unwrap();
      refetchUnreadCount();
    } catch (error) {
      console.error("Failed to mark notification read", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetchUnreadCount();
    } catch (error) {
      console.error("Failed to mark all notifications read", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
      refetchUnreadCount();
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    setIsClearingAll(true);
    try {
      await Promise.all(notifications.map((item) => deleteNotification(item.id).unwrap()));
      refetchUnreadCount();
      refetch();
    } catch (error) {
      console.error("Failed to clear notifications", error);
    } finally {
      setIsClearingAll(false);
    }
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

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-9 w-9 flex items-center justify-center text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all"
        title="Notifications"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5 text-gray-700 stroke-[1.8]" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#D3232A] text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Container */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-[410px] rounded-[22px] bg-white p-5 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Notifications</h3>

            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll || unreadCount === 0}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-40 transition-colors"
              >
                {isMarkingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                )}
                Mark all as read
              </button>

              <button
                onClick={handleClearAll}
                disabled={isClearingAll || notifications.length === 0}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-40 transition-colors"
              >
                {isClearingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Clear all
              </button>
            </div>
          </div>


          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                  <Bell className="h-6 w-6 stroke-[1.5]" />
                </div>
                <p className="text-sm font-bold text-gray-800">No notifications</p>
                <p className="text-xs text-gray-400 mt-0.5">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((item) => {
                const targetRoute = getTargetRoute(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.isRead) handleMarkAsRead(item.id);
                      setIsOpen(false);
                      router.push(targetRoute);
                    }}
                    className={`group relative flex items-start gap-3.5 p-2.5 rounded-xl transition-all cursor-pointer hover:bg-gray-50/90 ${
                      !item.isRead ? "bg-[#F8FAFC]" : ""
                    }`}
                  >
                    {/* Icon Box with Blue Unread Dot on Top-Left */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] group-hover:bg-white group-hover:shadow-xs flex items-center justify-center transition-all border border-gray-100">
                        {getIcon(item.type)}
                      </div>

                      {/* Top-Left Blue Dot for Unread Items (as seen in screenshot) */}
                      {!item.isRead && (
                        <span className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-sm font-semibold text-gray-900 leading-snug tracking-tight">
                        {item.title}
                        {item.message && item.message !== item.title && (
                          <span className="font-normal text-gray-700 ml-1">
                            {item.message}
                          </span>
                        )}
                      </p>

                      <p className="text-xs text-gray-400 font-normal mt-1">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>

                    {/* Quick Action (Trash / Mark read) on Hover */}
                    <div className="absolute right-2 top-3 hidden group-hover:flex items-center gap-1.5 bg-white/90 p-1 rounded-lg shadow-xs">
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action Button */}
          <div className="pt-4 mt-2 border-t border-gray-100">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/support");
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-colors text-center shadow-xs"
            >
              Show all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

