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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOutletInput {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
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
  }),
});

export const {
  useGetOutletsQuery,
  useCreateOutletMutation,
  useUpdateTaxRatesMutation,
  useUpdateReceiptDetailsMutation,
  useUpdateLocationMutation,
  useResolveMapLinkMutation,
} = outletApi;
