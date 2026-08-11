import { baseApi } from "../store/baseApi";

export interface KpiResponse {
  totalRevenue: { value: string; change: string; isPositive: boolean; prev?: string };
  cogs: { value: string; change: string; isPositive: boolean; prev?: string };
  grossProfit: { value: string; change: string; isPositive: boolean; prev?: string };
  laborCosts: { value: string; change: string; isPositive: boolean; prev?: string };
  netMargin: { value: string; change: string; isPositive: boolean; prev?: string };
  avgOrderValue?: { value: string; change: string; isPositive: boolean; prev?: string };
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

export interface SalesVelocityPoint {
  time: string;
  revenue: number;
}

export interface ChannelDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface TopSellingItemPoint {
  name: string;
  volume: number;
  revenue: number;
  category: string;
}

export const dashboardApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKpis: builder.query<KpiResponse, { outletId?: string; range?: string; startDate?: string; endDate?: string }>({
      query: ({ outletId, range, startDate, endDate }) => ({
        url: "/dashboard/kpi",
        params: {
          ...(outletId ? { outletId } : {}),
          ...(range ? { range } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      }),
      transformResponse: (response: { data?: KpiResponse } | KpiResponse) => {
        if ("data" in response && response.data) return response.data;
        return response as KpiResponse;
      },
      providesTags: ["Dashboard"],
    }),
    getSalesVelocity: builder.query<SalesVelocityPoint[], { outletId?: string; range?: string; startDate?: string; endDate?: string }>({
      query: ({ outletId, range, startDate, endDate }) => ({
        url: "/dashboard/sales-velocity",
        params: {
          ...(outletId ? { outletId } : {}),
          ...(range ? { range } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      }),
      transformResponse: (response: { data?: SalesVelocityPoint[] } | SalesVelocityPoint[]) => {
        if ("data" in response && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: ["Dashboard"],
    }),
    getChannelDistribution: builder.query<ChannelDistributionPoint[], { outletId?: string; range?: string; startDate?: string; endDate?: string }>({
      query: ({ outletId, range, startDate, endDate }) => ({
        url: "/dashboard/channel-distribution",
        params: {
          ...(outletId ? { outletId } : {}),
          ...(range ? { range } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      }),
      transformResponse: (response: { data?: ChannelDistributionPoint[] } | ChannelDistributionPoint[]) => {
        if ("data" in response && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: ["Dashboard"],
    }),
    getTopSellingItems: builder.query<TopSellingItemPoint[], { outletId?: string; range?: string; startDate?: string; endDate?: string }>({
      query: ({ outletId, range, startDate, endDate }) => ({
        url: "/dashboard/top-selling-items",
        params: {
          ...(outletId ? { outletId } : {}),
          ...(range ? { range } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      }),
      transformResponse: (response: { data?: TopSellingItemPoint[] } | TopSellingItemPoint[]) => {
        if ("data" in response && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
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
  useGetSalesVelocityQuery,
  useGetChannelDistributionQuery,
  useGetTopSellingItemsQuery,
  useGetSalesForecastQuery,
  useGetInventoryForecastQuery,
} = dashboardApiSlice;
