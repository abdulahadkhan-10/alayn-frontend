import { baseApi } from "../store/baseApi";

export interface OrderItem {
  id?: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  menuItem?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface CreateOrderPayload {
  outletId?: string;
  orderSource: "TABLE" | "COUNTER" | "QR" | "DELIVERY";
  tableNo?: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
  paymentMethod: "CASH" | "CARD" | "UPI";
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  orderNumber?: string;
  outletId: string;
  orderSource: "TABLE" | "COUNTER" | "QR" | "DELIVERY";
  tableNo?: string;
  status: "SENT_TO_KITCHEN" | "PREPARING" | "READY" | "SERVED" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  discountAmount: number;
  paymentMethod: "CASH" | "CARD" | "UPI";
  paymentStatus: "PENDING" | "CONFIRMED" | "FAILED";
  placedByName?: string;
  placedByRole?: string;
  customerName?: string;
  customerPhone?: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
  outlet?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    gstin?: string;
    receiptTagline?: string;
    receiptFooter?: string;
    upiId?: string;
  };
}

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<
      Order[],
      {
        status?: string;
        outletId?: string;
        excludeCompleted?: boolean;
        startDate?: string;
        endDate?: string;
        placedByName?: string;
        source?: string;
        paymentMethod?: string;
      } | void
    >({
      query: (params) => ({
        url: "/orders",
        method: "GET",
        params: params || undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response ?? [],
      providesTags: ["Orders"],
    }),

    getKitchenTickets: builder.query<Order[], void>({
      query: () => ({
        url: "/kitchen/tickets",
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data ?? response ?? [],
      providesTags: ["KitchenTickets"],
    }),

    createOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ["Orders", "KitchenTickets"],
    }),

    updateOrderStatus: builder.mutation<Order, { id: string; status: Order["status"]; comment?: string; paymentMethod?: "CASH" | "CARD" | "UPI"; customerName?: string; customerPhone?: string }>({
      query: ({ id, status, comment, paymentMethod, customerName, customerPhone }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        body: { status, comment, paymentMethod, customerName, customerPhone },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ["Orders", "KitchenTickets"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetKitchenTicketsQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} = orderApi;
