import { baseApi } from "../store/baseApi";

export interface NotificationItem {
  id: string;
  userId?: string | null;
  businessId?: string | null;
  outletId?: string | null;
  role?: string | null;
  title: string;
  message: string;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: NotificationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface GetUnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export const notificationApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      GetNotificationsResponse,
      { page?: number; limit?: number; unreadOnly?: boolean } | void
    >({
      query: (params) => ({
        url: "/notifications",
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          ...(params?.unreadOnly ? { unreadOnly: true } : {}),
        },
      }),
      providesTags: ["Notifications"],
    }),

    getUnreadCount: builder.query<GetUnreadCountResponse, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),

    markAsRead: builder.mutation<{ success: boolean; data: NotificationItem }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    markAllAsRead: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    deleteNotification: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApiSlice;
