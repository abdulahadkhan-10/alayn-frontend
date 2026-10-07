import { baseApi } from "../store/baseApi";

export interface Outlet {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  businessId: string;
  cgstRateDecimal?: number | string;
  sgstRateDecimal?: number | string;
  serviceTaxRateDecimal?: number | string;
  phone?: string;
  gstin?: string;
  receiptTagline?: string;
  receiptFooter?: string;
  upiId?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number;
  earlyBufferMinutes?: number;
  lateGraceMinutes?: number;
  kitchenMode?: "KOT" | "KDS" | "HYBRID";
  createdAt?: string;
  updatedAt?: string;
  subscription?: {
    id: string;
    status: "ACTIVE" | "PENDING_PAYMENT" | "EXPIRED" | "CANCELED";
    planCode?: string;
    planName?: string;
    monthlyFeePaise?: number;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
  } | null;
}

export interface CreateOutletInput {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  couponCode?: string;
  kitchenMode?: "KOT" | "KDS" | "HYBRID";
}

export const outletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOutlets: builder.query<Outlet[], void>({
      query: () => "/outlets",
      transformResponse: (response: { data?: Outlet[]; success?: boolean } | Outlet[]) => {
        if (Array.isArray(response)) return response;
        return response?.data || [];
      },
      providesTags: ["Outlet"],
      keepUnusedDataFor: 300,
    }),

    createOutlet: builder.mutation<Outlet, CreateOutletInput>({
      query: (body) => ({
        url: "/outlets",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data?: Outlet } | Outlet) => {
        if ("data" in response && response.data) return response.data;
        return response as Outlet;
      },
      invalidatesTags: ["Outlet"],
    }),

    updateTaxRates: builder.mutation<any, { outletId?: string; cgstRate: number; sgstRate: number; serviceTaxRate?: number }>({
      query: ({ outletId, cgstRate, sgstRate, serviceTaxRate }) => ({
        url: "/outlets/tax-rates",
        method: "PATCH",
        body: { cgstRate, sgstRate, serviceTaxRate },
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      invalidatesTags: ["Outlet"],
    }),

    updateReceiptDetails: builder.mutation<any, { outletId?: string; phone?: string; gstin?: string; receiptTagline?: string; receiptFooter?: string; upiId?: string }>({
      query: ({ outletId, phone, gstin, receiptTagline, receiptFooter, upiId }) => ({
        url: "/outlets/receipt-details",
        method: "PATCH",
        body: { phone, gstin, receiptTagline, receiptFooter, upiId },
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      invalidatesTags: ["Outlet"],
    }),

    updateLocation: builder.mutation<any, { outletId?: string; latitude: number; longitude: number; geofenceRadius: number }>({
      query: ({ outletId, latitude, longitude, geofenceRadius }) => ({
        url: "/outlets/location",
        method: "PATCH",
        body: { latitude, longitude, geofenceRadius },
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      invalidatesTags: ["Outlet"],
    }),

    updateKitchenMode: builder.mutation<any, { outletId?: string; kitchenMode: "KOT" | "KDS" | "HYBRID" }>({
      query: ({ outletId, kitchenMode }) => ({
        url: "/outlets/kitchen-mode",
        method: "PATCH",
        body: { kitchenMode },
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      invalidatesTags: ["Outlet"],
    }),

    updateAttendanceRules: builder.mutation<unknown, { outletId?: string; earlyBufferMinutes: number; lateGraceMinutes: number }>({
      query: ({ outletId, earlyBufferMinutes, lateGraceMinutes }) => ({
        url: "/outlets/attendance-rules",
        method: "PATCH",
        body: { earlyBufferMinutes, lateGraceMinutes },
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      invalidatesTags: ["Outlet"],
    }),

    resolveMapLink: builder.mutation<{ lat: number; lng: number; name?: string }, { url: string; outletId?: string }>({
      query: ({ url, outletId }) => ({
        url: "/outlets/resolve-map-link",
        method: "POST",
        body: { url },
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      transformResponse: (response: { data?: { lat: number; lng: number; name?: string } } | { lat: number; lng: number; name?: string }) => {
        if ("data" in response && response.data) return response.data;
        return response as { lat: number; lng: number; name?: string };
      },
    }),

    deleteOutlet: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/outlets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Outlet"],
    }),
  }),
});

export const {
  useGetOutletsQuery,
  useCreateOutletMutation,
  useDeleteOutletMutation,
  useUpdateTaxRatesMutation,
  useUpdateReceiptDetailsMutation,
  useUpdateLocationMutation,
  useUpdateKitchenModeMutation,
  useUpdateAttendanceRulesMutation,
  useResolveMapLinkMutation,
} = outletApi;
