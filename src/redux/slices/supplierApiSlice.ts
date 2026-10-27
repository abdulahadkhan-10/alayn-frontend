import { baseApi } from "../store/baseApi";

export interface SupplierItemApi {
  id: string;
  supplierId: string;
  name: string;
  sku?: string | null;
  category: string;
  unit: string;
  pricePaise: number;
  minOrderQty: number;
  inStock: boolean;
  qualityGrade?: string | null;
  leadTimeHours: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  supplier?: {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    rating?: number;
    deliveryTerms?: string;
  };
}

export interface ComparisonOption extends SupplierItemApi {
  priceRupees: number;
  savingsPaise: number;
  savingsPercent: number;
  isCheaper: boolean;
  qualityScore?: number;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  rating: number;
  deliveryTerms?: string;
}

export interface SupplierComparisonResult {
  summary: {
    totalSuppliersFound: number;
    lowestPricePaise: number;
    lowestPriceRupees: number;
    highestSavingsPercent: number;
    fastestDeliveryHours: number;
  };
  recommendations: {
    cheapest: ComparisonOption | null;
    bestQuality: ComparisonOption | null;
    fastestDelivery: ComparisonOption | null;
  };
  allOptions: ComparisonOption[];
}

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<any, void>({
      query: () => "/suppliers/my-profile",
      providesTags: ["Supplier"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    updateMyProfile: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: "/suppliers/my-profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Supplier"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    getMyCatalog: builder.query<SupplierItemApi[], void>({
      query: () => "/suppliers/my-catalog",
      providesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => (Array.isArray(response) ? response : response?.data || []),
    }),

    createSupplierItem: builder.mutation<SupplierItemApi, Partial<SupplierItemApi>>({
      query: (body) => ({
        url: "/suppliers/my-catalog",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    updateSupplierItem: builder.mutation<SupplierItemApi, { id: string; data: Partial<SupplierItemApi> }>({
      query: ({ id, data }) => ({
        url: `/suppliers/my-catalog/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    deleteSupplierItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/suppliers/my-catalog/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    getMarketCatalog: builder.query<SupplierItemApi[], { search?: string; category?: string; inStockOnly?: boolean; maxPricePaise?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.set("search", params.search);
        if (params?.category && params.category !== "All") queryParams.set("category", params.category);
        if (params?.inStockOnly) queryParams.set("inStockOnly", "true");
        if (params?.maxPricePaise) queryParams.set("maxPricePaise", String(params.maxPricePaise));
        const qs = queryParams.toString();
        return `/suppliers/market-catalog${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => (Array.isArray(response) ? response : response?.data || []),
    }),

    compareSuppliers: builder.query<SupplierComparisonResult, { itemName?: string; category?: string; currentUnitCostPaise?: number; unit?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.itemName) queryParams.set("itemName", params.itemName);
        if (params.category && params.category !== "All") queryParams.set("category", params.category);
        if (params.currentUnitCostPaise !== undefined) queryParams.set("currentUnitCostPaise", String(params.currentUnitCostPaise));
        if (params.unit) queryParams.set("unit", params.unit);
        return `/suppliers/compare?${queryParams.toString()}`;
      },
      providesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => response?.data ?? response,
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetMyCatalogQuery,
  useCreateSupplierItemMutation,
  useUpdateSupplierItemMutation,
  useDeleteSupplierItemMutation,
  useGetMarketCatalogQuery,
  useCompareSuppliersQuery,
  useLazyCompareSuppliersQuery,
} = supplierApi;
