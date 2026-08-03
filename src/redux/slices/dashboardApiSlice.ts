import { baseApi } from "../store/baseApi";

export interface KpiResponse {
  totalRevenue: { value: string; change: string; isPositive: boolean };
  cogs: { value: string; change: string; isPositive: boolean };
  grossProfit: { value: string; change: string; isPositive: boolean };
  laborCosts: { value: string; change: string; isPositive: boolean };
  netMargin: { value: string; change: string; isPositive: boolean };
}

export interface SalesForecastPoint {
  date: string;
  actual?: number;
  projected?: number;
}

export interface InventoryForecastPoint {
  item: string;
  currentStock: number;
  threshold: number;
  daysRemaining: number;
}

export const dashboardApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpis: builder.query<KpiResponse, { outletId?: string; range?: string }>({
      query: ({ outletId, range }) => ({
        url: "/dashboard/kpi",
        params: {
          ...(outletId ? { outletId } : {}),
          ...(range ? { range } : {}),
        },
      }),
      transformResponse: (response: { data?: KpiResponse } | KpiResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as KpiResponse;
      },
      providesTags: ["Dashboard"],
    }),
    getSalesForecast: builder.query<SalesForecastPoint[], { outletId?: string }>({
      query: ({ outletId }) => ({
        url: "/dashboard/sales-forecast",
        params: outletId ? { outletId } : undefined,
      }),
      transformResponse: (response: { data?: SalesForecastPoint[] } | SalesForecastPoint[]) => {
        if ("data" in response && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: ["Dashboard"],
    }),
    getInventoryForecast: builder.query<InventoryForecastPoint[], { outletId?: string }>({
      query: ({ outletId }) => ({
        url: "/dashboard/inventory-forecast",
        params: outletId ? { outletId } : undefined,
      }),
      transformResponse: (response: { data?: InventoryForecastPoint[] } | InventoryForecastPoint[]) => {
        if ("data" in response && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetKpisQuery,
  useGetSalesForecastQuery,
  useGetInventoryForecastQuery,
} = dashboardApiSlice;
