export type DateRangePreset =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "MTD"
  | "QTD"
  | "YTD"
  | "CUSTOM";

export type CompareMode = "PREVIOUS_PERIOD" | "PREVIOUS_YEAR" | "NONE";

export interface DashboardFilterState {
  dateRange: DateRangePreset;
  startDate?: string;
  endDate?: string;
  selectedOutletIds: string[]; // empty array = Entire Business
  compareMode: CompareMode;
}

export type OutletHealthStatus = "EXCELLENT" | "GOOD" | "NEEDS_ATTENTION" | "CRITICAL";

export interface ExecutiveKpiMetric {
  id: string;
  title: string;
  value: string;
  rawValue: number;
  unit: "currency" | "percent" | "number" | "rating";
  change: string; // e.g. "+18.4%"
  isPositive: boolean;
  sparkline: number[];
  tooltip: string;
  category: "FINANCIAL" | "OPERATIONAL" | "CUSTOMER" | "INVENTORY";
  prevPeriodValue: string;
  insightSentence: string;
  iconName: string;
}

export interface OutletPerformanceRecord {
  id: string;
  name: string;
  code: string;
  city: string;
  revenue: number;
  orders: number;
  growth: number;
  grossProfit: number;
  foodCostPct: number;
  wasteCost: number;
  rating: number;
  staffCount: number;
  inventoryValue: number;
  stockoutCount: number;
  healthScore: number; // 0-100
  healthStatus: OutletHealthStatus;
  sparkline: number[];
}

export interface AiCommandInsightItem {
  id: string;
  type: "CRITICAL" | "WARNING" | "OPPORTUNITY" | "INFO";
  title: string;
  description: string;
  impact: string;
  estimatedSavings?: string;
  estimatedRevenueImpact?: string;
  confidencePct: number;
  timeSensitivity: string; // e.g. "Action needed in 24h"
  recommendedAction: string;
  outletName: string;
}
