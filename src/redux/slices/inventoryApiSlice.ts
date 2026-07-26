import { baseApi } from "../store/baseApi";

export interface InventoryItemApi {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  reorderThreshold: number;
  unitCostPaise: number;
  currentStock: number;
  outletId?: string;
  outlet?: { id: string; name: string };
  createdAt?: string;
}

export interface InventoryAlertsResult {
  lowStockItems: InventoryItemApi[];
  expiringBatches: {
    id: string;
    itemId: string;
    quantity: number;
    expiryDate: string;
    batchNumber: string;
    unitCostPaise: number;
    item?: InventoryItemApi;
  }[];
}

export const inventoryApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query<{ items: InventoryItemApi[]; total: number }, void>({
      query: () => "/inventory/items",
      providesTags: ["Inventory"],
      transformResponse: (response: any) => {
        if (response?.data) return response.data;
        if (Array.isArray(response)) return { items: response, total: response.length };
        return { items: [], total: 0 };
      },
    }),
    createItem: builder.mutation<InventoryItemApi, Partial<InventoryItemApi>>({
      query: (data) => ({
        url: "/inventory/items",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Inventory"],
    }),
    adjustStock: builder.mutation<
      { success: boolean },
      { itemId: string; change: number; reason: "SALE" | "WASTE" | "PURCHASE" | "ADJUSTMENT" }
    >({
      query: ({ itemId, change, reason }) => ({
        url: `/inventory/items/${itemId}/adjust`,
        method: "POST",
        body: { change, reason },
      }),
      invalidatesTags: ["Inventory", "Waste"],

    }),
    getLowStockAlerts: builder.query<InventoryAlertsResult, void>({
      query: () => "/inventory/alerts",
      providesTags: ["Inventory"],
      transformResponse: (response: any) => response?.data ?? response,
    }),
  }),
});

export const {
  useGetItemsQuery,
  useCreateItemMutation,
  useAdjustStockMutation,
  useGetLowStockAlertsQuery,
} = inventoryApiSlice;
