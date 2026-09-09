import { baseApi } from "../store/baseApi";

export interface SubscriptionPlan {
  planCode: string;
  name: string;
  description: string;
  monthlyFeePaise: number;
  gstRatePercent: number;
  features: string[];
  basePriceRupees: number;
  gstRupees: number;
  totalPayableRupees: number;
  totalPayablePaise: number;
}

export interface InitiateSubscriptionResponse {
  orderId: string;
  cfOrderId: string;
  paymentSessionId: string;
  orderAmountRupees: number;
  baseAmountRupees: number;
  gstAmountRupees: number;
  currency: string;
  plan: {
    code: string;
    name: string;
    features: string[];
  };
}

export interface OutletSubscriptionStatusResponse {
  hasSubscription: boolean;
  subscriptionId?: string;
  status: "ACTIVE" | "PENDING_PAYMENT" | "EXPIRED" | "CANCELED";
  isActive: boolean;
  daysRemaining: number;
  planCode?: string;
  planName?: string;
  monthlyFeeRupees?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  recentPayments?: any[];
}

export interface BillingHistoryItem {
  id: string;
  orderId: string;
  cfPaymentId?: string;
  outletId: string;
  outletName: string;
  outletCity: string;
  amountRupees: number;
  taxRupees: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "USER_DROPPED";
  paymentMethod: string;
  paidAt: string;
  createdAt: string;
}

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query<SubscriptionPlan[], void>({
      query: () => "/subscriptions/plans",
      transformResponse: (response: { data?: SubscriptionPlan[] } | SubscriptionPlan[]) => {
        if (Array.isArray(response)) return response;
        return response?.data || [];
      },
      providesTags: ["Subscription"],
    }),

    initiateOutletSubscription: builder.mutation<
      InitiateSubscriptionResponse,
      { outletId: string; planCode?: string; months?: number }
    >({
      query: (body) => ({
        url: "/subscriptions/outlets/initiate",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data?: InitiateSubscriptionResponse } | InitiateSubscriptionResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as InitiateSubscriptionResponse;
      },
      invalidatesTags: ["Subscription", "Outlet"],
    }),

    verifyOutletPayment: builder.mutation<
      any,
      { orderId: string }
    >({
      query: (body) => ({
        url: "/subscriptions/outlets/verify",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data?: any } | any) => {
        if ("data" in response && response.data) return response.data;
        return response;
      },
      invalidatesTags: ["Subscription", "Outlet"],
    }),

    getOutletSubscriptionStatus: builder.query<
      OutletSubscriptionStatusResponse,
      string
    >({
      query: (outletId) => `/subscriptions/outlets/${outletId}/status`,
      transformResponse: (response: { data?: OutletSubscriptionStatusResponse } | OutletSubscriptionStatusResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as OutletSubscriptionStatusResponse;
      },
      providesTags: (_res, _err, id) => [{ type: "Subscription", id }],
    }),

    getBillingHistory: builder.query<BillingHistoryItem[], void>({
      query: () => "/subscriptions/billing-history",
      transformResponse: (response: { data?: BillingHistoryItem[] } | BillingHistoryItem[]) => {
        if (Array.isArray(response)) return response;
        return response?.data || [];
      },
      providesTags: ["Subscription"],
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useInitiateOutletSubscriptionMutation,
  useVerifyOutletPaymentMutation,
  useGetOutletSubscriptionStatusQuery,
  useGetBillingHistoryQuery,
} = subscriptionApi;
