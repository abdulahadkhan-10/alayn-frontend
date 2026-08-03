import { baseApi } from "../store/baseApi";
import type { InventoryItemApi } from "./inventoryApiSlice";

export interface WasteLogApi {
  id: string;
  itemId: string;
  quantity: number;
  costAtLoggingPaise: number;
  reason: "SPOILAGE" | "OVER_PREP" | "RETURN" | "ERROR";
  loggedById: string;
  outletId?: string;
  outlet?: { id: string; name: string };
  createdAt: string;
  item?: InventoryItemApi | null;
}

export interface WasteSummaryApi {
  currentMonthWastePaise: number;
  byReason: {
    reason: "SPOILAGE" | "OVER_PREP" | "RETURN" | "ERROR";
    count: number;
    totalQuantity: number;
    totalCostPaise: number;
  }[];
}

export const wasteApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWasteLogs: builder.query<{ data: WasteLogApi[]; total: number }, { limit?: number; offset?: number } | void>({
      query: (params) => {
        const limit = params?.limit ?? 50;
        const offset = params?.offset ?? 0;
        return `/waste-logs?limit=${limit}&offset=${offset}`;
      },
      providesTags: ["Waste"],
      transformResponse: (response: any) => {
        if (response?.data && Array.isArray(response.data)) {
          return { data: response.data, total: response?.meta?.total ?? response.data.length };
        }
        if (Array.isArray(response)) return { data: response, total: response.length };
        return { data: [], total: 0 };
      },

    }),
    logWaste: builder.mutation<
      WasteLogApi,
      { itemId: string; quantity: number; reason: "SPOILAGE" | "OVER_PREP" | "RETURN" | "ERROR" }
    >({
      query: (data) => ({
        url: "/waste-logs",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Waste", "Inventory"],
    }),
    getWasteSummary: builder.query<WasteSummaryApi, void>({
      query: () => "/waste-logs/summary",
      providesTags: ["Waste"],
      transformResponse: (response: any) => response?.data ?? response,
    }),
  }),
});

export const {
  useGetWasteLogsQuery,
  useLogWasteMutation,
  useGetWasteSummaryQuery,
} = wasteApiSlice;
