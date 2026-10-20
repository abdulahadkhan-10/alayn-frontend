import { baseApi } from "../store/baseApi";

export interface OrderItemModifier {
  id?: string;
  name: string;
  price?: number;
  pricePaise?: number;
  isVariant?: boolean;
}

export interface OrderItem {
  id?: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  modifiers?: OrderItemModifier[];
  modifiersJson?: string;
  menuItem?: {
    id: string;
    name: string;
    price: number;
  };
}

/** One part of a split payment. Amounts are whole paise. */
export interface SplitPaymentPart {
  method: "CASH" | "CARD" | "UPI";
  amountPaise: number;
  /** UPI UTR / card approval code */
  reference?: string;
  /** Cashier confirmed an online payment was received (required for UPI / card at settlement) */
  verified?: boolean;
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
    // The server prices each option from the menu by id; the rest is ignored
    modifiers?: OrderItemModifier[];
  }[];
  paymentMethod: "CASH" | "CARD" | "UPI";
  discountAmount?: number;
  couponCode?: string;
  couponId?: string;
  taxAmount?: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  orderNumber?: string;
  outletId: string;
  branchName?: string;
  orderSource: "TABLE" | "COUNTER" | "QR" | "DELIVERY";
  tableNo?: string;
  status: "SENT_TO_KITCHEN" | "PREPARING" | "READY" | "SERVED" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  serviceTaxAmount?: number;
  serviceChargeAmount?: number;
  serviceChargeRate?: number | null;
  cgstRate?: number | null;
  sgstRate?: number | null;
  roundOffAmount?: number;
  serviceChargeWaived?: boolean;
  serviceChargeWaiveReason?: string | null;
  isDineIn?: boolean;
  gstRegistrationType?: "REGULAR" | "COMPOSITION" | "UNREGISTERED";
  discountAmount: number;
  couponCode?: string | null;
  couponId?: string | null;
  /** "SPLIT" when the bill was paid with more than one method */
  paymentMethod: "CASH" | "CARD" | "UPI" | "SPLIT";
  paymentStatus: "PENDING" | "CONFIRMED" | "FAILED";
  isSplitPayment?: boolean;
  /** Confirmed payments on the bill, one per part of a split */
  paymentSplits?: { method: "CASH" | "CARD" | "UPI"; amountPaise: number; amount: number; reference: string | null }[];
  payments?: { id: string; method: "CASH" | "CARD" | "UPI"; amountPaise: number; status: "PENDING" | "CONFIRMED" | "FAILED" | "VOID"; reference?: string | null }[];
  paidAmount?: number;
  balanceDue?: number;
  balanceDuePaise?: number;
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

    updateOrderStatus: builder.mutation<
      Order,
      {
        id: string;
        status: Order["status"];
        comment?: string;
        paymentMethod?: "CASH" | "CARD" | "UPI";
        /** Settle with a split instead of one paymentMethod */
        payments?: SplitPaymentPart[];
        /** Same key for retries of one settle attempt — the server never settles twice */
        idempotencyKey?: string;
        /** Settle even though a UTR / approval code was already used on another bill */
        allowDuplicateReference?: boolean;
        customerName?: string;
        customerPhone?: string;
        couponCode?: string;
        couponId?: string;
        discountAmount?: number;
        discountPaise?: number;
      }
    >({
      query: ({
        id,
        status,
        comment,
        paymentMethod,
        payments,
        idempotencyKey,
        allowDuplicateReference,
        customerName,
        customerPhone,
        couponCode,
        couponId,
        discountAmount,
        discountPaise,
      }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        body: {
          status,
          comment,
          paymentMethod,
          payments,
          idempotencyKey,
          allowDuplicateReference,
          customerName,
          customerPhone,
          couponCode,
          couponId,
          discountAmount,
          discountPaise,
        },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ["Orders", "KitchenTickets"],
    }),

    setServiceChargeWaiver: builder.mutation<Order, { id: string; waive: boolean; reason?: string }>({
      query: ({ id, waive, reason }) => ({
        url: `/orders/${id}/service-charge`,
        method: "PATCH",
        body: { waive, reason },
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
  useSetServiceChargeWaiverMutation,
} = orderApi;
