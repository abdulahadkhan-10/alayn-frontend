import { baseApi } from "../store/baseApi";

export interface TicketHistory {
  id: string;
  ticketId: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  changedById?: string;
  comment?: string;
  createdAt: string;
}

export interface StaffQuery {
  id: string;
  employeeId: string;
  category: string;
  description: string;
  status: string;
  outletId: string;
  createdAt: string;
  employee?: {
    id: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  outlet?: {
    id: string;
    name: string;
    city: string;
  };
}

export interface Feedback {
  id: string;
  orderId: string;
  rating: number;
  comment: string;
  source: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber?: string;
    tableNumber?: number;
    totalPaise?: number;
  };
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  priority: "LOW" | "NORMAL" | "HIGH";
  sourceTable: "StaffQuery" | "Feedback";
  sourceId: string;
  outletId: string;
  createdAt: string;
  updatedAt: string;
  outlet?: {
    id: string;
    name: string;
    city: string;
  };
  histories?: TicketHistory[];
  staffQuery?: StaffQuery | null;
  feedback?: Feedback | null;
}

export interface GetTicketsQueryParams {
  outletId?: string;
  sourceTable?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export const ticketApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<
      { data: Ticket[]; meta: { limit: number; offset: number; total: number } },
      GetTicketsQueryParams
    >({
      query: (params) => ({
        url: "/tickets",
        params: {
          ...(params.outletId && params.outletId !== "all" ? { outletId: params.outletId } : {}),
          ...(params.sourceTable ? { sourceTable: params.sourceTable } : {}),
          ...(params.status ? { status: params.status } : {}),
          limit: params.limit || 50,
          offset: params.offset || 0,
        },
      }),
      providesTags: ["Tickets"],
    }),

    getMyQueries: builder.query<(StaffQuery & { ticket?: Ticket | null })[], void>({
      query: () => "/tickets/my-queries",
      transformResponse: (response: any) => response.data || response,
      providesTags: ["StaffQueries"],
    }),

    createStaffQuery: builder.mutation<
      StaffQuery,
      { category: string; description: string; priority?: "LOW" | "NORMAL" | "HIGH"; outletId?: string }
    >({
      query: (body) => ({
        url: "/tickets/staff-queries",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tickets", "StaffQueries"],
    }),

    updateTicketStatus: builder.mutation<
      Ticket,
      { id: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED"; comment?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/tickets/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tickets", "StaffQueries"],
    }),

    createFeedback: builder.mutation<
      Feedback,
      { orderId: string; rating: number; comment: string; source?: string }
    >({
      query: (body) => ({
        url: "/tickets/feedback",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tickets"],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetMyQueriesQuery,
  useCreateStaffQueryMutation,
  useUpdateTicketStatusMutation,
  useCreateFeedbackMutation,
} = ticketApiSlice;
