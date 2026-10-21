// The report's filters live in the page URL so a reload or a shared link shows the same report.
// These helpers turn the URL into ReportParams and back, and format the report's numbers.

export const PRESETS = [
  "TODAY", "YESTERDAY", "LAST_7_DAYS", "THIS_WEEK", "LAST_WEEK", "THIS_MONTH", "LAST_MONTH",
  "THIS_QUARTER", "LAST_QUARTER", "THIS_YEAR", "LAST_YEAR", "CUSTOM",
] as const;
export const COMPARES = ["PREVIOUS", "LAST_YEAR", "CUSTOM", "NONE"] as const;
export const GRANULARITIES = ["hour", "day", "week", "month"] as const;

export type ReportPreset = (typeof PRESETS)[number];
export type CompareMode = (typeof COMPARES)[number];
export type ReportGranularity = (typeof GRANULARITIES)[number];

export interface ReportParams {
  preset: ReportPreset;
  compare: CompareMode;
  from?: string; // YYYY-MM-DD, only with preset CUSTOM
  to?: string;
  cFrom?: string; // only with compare CUSTOM
  cTo?: string;
  outlets?: string[];
  sources?: string[];
  categories?: string[];
  weekdays?: number[]; // 0 = Sunday … 6
  hourFrom?: number; // 0–23
  hourTo?: number; // 1–24, exclusive
  granularity?: ReportGranularity; // undefined = automatic
}

export const DEFAULT_PRESET: ReportPreset = "THIS_MONTH";
export const DEFAULT_COMPARE: CompareMode = "PREVIOUS";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function oneOf<T extends string>(allowed: readonly T[], value: string | null): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function listOf(value: string | null): string[] | undefined {
  const items = (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function wholeIn(value: string | null, min: number, max: number): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

const day = (value: string | null) => (value && DAY.test(value) ? value : undefined);

/** Reads report filters from the page URL. Unknown or broken values fall back to "not set". */
export function paramsFromSearch(sp: URLSearchParams): ReportParams {
  const p: ReportParams = {
    preset: oneOf(PRESETS, sp.get("preset")) ?? DEFAULT_PRESET,
    compare: oneOf(COMPARES, sp.get("compare")) ?? DEFAULT_COMPARE,
  };
  if (p.preset === "CUSTOM") {
    const from = day(sp.get("from"));
    const to = day(sp.get("to"));
    if (from && to) Object.assign(p, { from, to });
    else p.preset = DEFAULT_PRESET; // a custom period without dates can't be shown
  }
  if (p.compare === "CUSTOM") {
    const cFrom = day(sp.get("cFrom"));
    const cTo = day(sp.get("cTo"));
    if (cFrom && cTo) Object.assign(p, { cFrom, cTo });
    else p.compare = DEFAULT_COMPARE;
  }
  const outlets = listOf(sp.get("outlets"));
  if (outlets) p.outlets = outlets;
  const sources = listOf(sp.get("sources"));
  if (sources) p.sources = sources;
  const categories = listOf(sp.get("categories"));
  if (categories) p.categories = categories;
  const weekdays = listOf(sp.get("weekdays"))?.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  if (weekdays && weekdays.length) p.weekdays = weekdays;
  const hourFrom = wholeIn(sp.get("hourFrom"), 0, 23);
  const hourTo = wholeIn(sp.get("hourTo"), 1, 24);
  // An impossible window (start not before end) is ignored rather than sent
  if (hourFrom === undefined || hourTo === undefined || hourFrom < hourTo) {
    if (hourFrom !== undefined) p.hourFrom = hourFrom;
    if (hourTo !== undefined) p.hourTo = hourTo;
  }
  const granularity = oneOf(GRANULARITIES, sp.get("granularity"));
  if (granularity) p.granularity = granularity;
  return p;
}

/** The query string for these filters (no leading "?"). Defaults are left out to keep links short. */
export function paramsToSearch(p: ReportParams): string {
  const sp = new URLSearchParams();
  if (p.preset !== DEFAULT_PRESET) sp.set("preset", p.preset);
  if (p.compare !== DEFAULT_COMPARE) sp.set("compare", p.compare);
  if (p.preset === "CUSTOM" && p.from && p.to) {
    sp.set("from", p.from);
    sp.set("to", p.to);
  }
  if (p.compare === "CUSTOM" && p.cFrom && p.cTo) {
    sp.set("cFrom", p.cFrom);
    sp.set("cTo", p.cTo);
  }
  if (p.outlets?.length) sp.set("outlets", p.outlets.join(","));
  if (p.sources?.length) sp.set("sources", p.sources.join(","));
  if (p.categories?.length) sp.set("categories", p.categories.join(","));
  if (p.weekdays?.length) sp.set("weekdays", p.weekdays.join(","));
  if (p.hourFrom !== undefined) sp.set("hourFrom", String(p.hourFrom));
  if (p.hourTo !== undefined) sp.set("hourTo", String(p.hourTo));
  if (p.granularity) sp.set("granularity", p.granularity);
  // Commas are safe in a query string and keep shared links readable
  return sp.toString().replace(/%2C/gi, ",");
}

// ---------- formatting ----------

/** Integer paise as "₹12,345" (en-IN grouping, no decimals). */
export function formatPaise(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  return `${sign}₹${Math.round(Math.abs(paise) / 100).toLocaleString("en-IN")}`;
}

export const formatCount = (n: number) => n.toLocaleString("en-IN");

/** "+12.3%", "-4.0%", or "—" when there is nothing to compare with. */
export function formatChange(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return `${pct > 0 ? "+" : ""}${(Math.round(pct * 10) / 10).toFixed(1)}%`;
}

/**
 * Text colour for a change: green when good, red when bad, grey when flat, unknown or neutral.
 * Up is good except where `lowerIsBetter` (waste, cancelled orders), as in the PDF.
 */
export function changeTone(pct: number | null | undefined, lowerIsBetter = false, neutral = false): string {
  if (neutral || pct == null || pct === 0) return "text-slate-500";
  return pct < 0 === lowerIsBetter ? "text-emerald-700" : "text-rose-600";
}

/** "YYYY-MM-DD" in India time, `daysAgo` days back. */
export const istDay = (daysAgo = 0) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
