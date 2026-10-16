import { baseApi } from "../store/baseApi";

export interface KpiResponse {
  totalRevenue: { value: string; change: string; isPositive: boolean; prev?: string };
  cogs: { value: string; change: string; isPositive: boolean; prev?: string };
  grossProfit: { value: string; change: string; isPositive: boolean; prev?: string };
  laborCosts: { value: string; change: string; isPositive: boolean; prev?: string };
  netMargin: { value: string; change: string; isPositive: boolean; prev?: string };
  avgOrderValue?: { value: string; change: string; isPositive: boolean; prev?: string };
  orders?: { value: string; change: string; isPositive: boolean; prev?: string }; // settled orders
  // Revenue = settled sales before tax; these are reported separately
  taxCollected?: { value: string };
  serviceCharge?: { value: string };
  openBills?: { value: string; count: number };
  // False when no menu item has recipe costs, so food cost / margin can't be computed yet
  cogsConfigured?: boolean;
}

export interface SalesForecastPoint {
  date: string; // YYYY-MM-DD, outlet-local
  label: string;
  isToday: boolean;
  isFuture: boolean;
  actual: number | null; // ₹ before tax (today: so far)
  projected: number | null;
  low: number | null; // likely range
  high: number | null;
  closed: boolean;
}

export type SalesForecastRange = "7d" | "30d" | "90d";

export interface SalesForecastResponse {
  /** learning: no estimate yet · early: rough estimate · ok: full forecast */
  status: "ok" | "early" | "learning";
  salesDays: number; // days that actually had sales
  earlyEstimateAfterDays: number;
  fullForecastAfterDays: number;
  points: SalesForecastPoint[];
  accuracy: { mapePct: number; daysEvaluated: number } | null;
  summary: { next7DaysProjected: number; last7DaysActual: number; vsLast7DaysPct: number | null } | null;
  coverage: { forecasted: number; total: number };
}

export interface AttentionItem {
  kind: "expired_stock" | "staff_not_in" | "stale_bills" | "low_stock" | "expiring_soon";
  severity: "high" | "medium";
  title: string; // "2 people not clocked in"
  detail: string; // "Head Waiter (shift started 4 PM), ..."
  href: string; // page where it can be fixed
}

/** in · left · not_in (shift started, no clock-in) · upcoming · leave · off (weekly off) */
export type StaffTodayStatus = "in" | "left" | "not_in" | "upcoming" | "leave" | "off";

export interface StaffTodayResponse {
  rosterSource: "assignments" | "weekly" | "none"; // none = no roster set up for today
  summary: { working: number; in: number; notIn: number; onLeave: number };
  staff: {
    id: string;
    name: string;
    role: string;
    outletName: string | null;
    shiftLabel: string | null; // "Morning · 8 AM–4 PM"
    status: StaffTodayStatus;
    statusLabel: string; // "In since 8:12 AM (late)"
    late: boolean;
  }[];
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

// All-time settled sales per outlet (only outlets that have at least one settled order)
export interface OutletComparisonRow {
  outletId: string;
  outletName: string;
  totalCompletedOrders: number;
  totalSalesPaise: number;
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
    getSalesForecast: builder.query<SalesForecastResponse, { outletId?: string; range?: SalesForecastRange }>({
      query: ({ outletId, range }) => ({
        url: "/dashboard/sales-forecast",
        params: { ...(outletId ? { outletId } : {}), ...(range ? { range } : {}) },
      }),
      transformResponse: (response: { data: SalesForecastResponse }) => response.data,
      providesTags: ["Dashboard"],
    }),
    getOutletComparison: builder.query<OutletComparisonRow[], void>({
      query: () => ({ url: "/analytics/outlet-comparison" }),
      transformResponse: (response: { data?: OutletComparisonRow[] }) => response.data ?? [],
      providesTags: ["Dashboard"],
    }),
    getAttention: builder.query<AttentionItem[], { outletId?: string }>({
      query: ({ outletId }) => ({
        url: "/dashboard/attention",
        params: outletId ? { outletId } : undefined,
      }),
      transformResponse: (response: { data: { items: AttentionItem[] } }) => response.data.items,
      providesTags: ["Dashboard"],
    }),
    getStaffToday: builder.query<StaffTodayResponse, { outletId?: string }>({
      query: ({ outletId }) => ({
        url: "/dashboard/staff-today",
        params: outletId ? { outletId } : undefined,
      }),
      transformResponse: (response: { data: StaffTodayResponse }) => response.data,
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
  useGetAttentionQuery,
  useGetStaffTodayQuery,
  useGetInventoryForecastQuery,
  useGetOutletComparisonQuery,
} = dashboardApiSlice;
