"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useDismiss } from "@/lib/useDismiss";
import type { ReportOptions } from "@/redux/slices/reportsApiSlice";
import QuickCompare from "./QuickCompare";
import { istDay, type CompareMode, type ReportGranularity, type ReportParams, type ReportPreset } from "@/lib/reportQuery";

const PERIODS: { value: ReportPreset; label: string }[] = [
  { value: "TODAY", label: "Today" }, { value: "YESTERDAY", label: "Yesterday" }, { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "THIS_WEEK", label: "This week" }, { value: "LAST_WEEK", label: "Last week" }, { value: "THIS_MONTH", label: "This month" },
  { value: "LAST_MONTH", label: "Last month" }, { value: "THIS_QUARTER", label: "This quarter" }, { value: "LAST_QUARTER", label: "Last quarter" },
  { value: "THIS_YEAR", label: "This year" }, { value: "LAST_YEAR", label: "Last year" }, { value: "CUSTOM", label: "Custom dates" },
];
const COMPARE_OPTIONS: { value: CompareMode; label: string }[] = [
  { value: "PREVIOUS", label: "Previous period" }, { value: "LAST_YEAR", label: "Same period last year" },
  { value: "CUSTOM", label: "Custom dates" }, { value: "NONE", label: "No comparison" },
];
const DAY_MODES = { all: "All days", weekdays: "Weekdays Mon–Fri", weekends: "Weekends", pick: "Pick days" } as const;
const DAY_SETS: Record<"weekdays" | "weekends", number[]> = { weekdays: [1, 2, 3, 4, 5], weekends: [0, 6] };
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_SETS = [
  { key: "breakfast", label: "Breakfast 7–11", from: 7, to: 11 }, { key: "lunch", label: "Lunch 12–16", from: 12, to: 16 },
  { key: "evening", label: "Evening 16–19", from: 16, to: 19 }, { key: "dinner", label: "Dinner 19–23", from: 19, to: 23 },
];
const GROUPS: { value: ReportGranularity | ""; label: string }[] = [
  { value: "", label: "Auto" }, { value: "hour", label: "Hour" }, { value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" },
];

const hourName = (h: number) => (h === 0 || h === 24 ? "Midnight" : h === 12 ? "Noon" : h < 12 ? `${h} AM` : `${h - 12} PM`);
const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((n) => b.includes(n));
const CONTROL = "whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** A button with a panel of checkboxes; on phones the panel spans the filter bar instead of the button. */
function Popover({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return (
    <div ref={ref} className="sm:relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${CONTROL} inline-flex max-w-56 items-center gap-1.5`}>
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:inset-x-auto sm:left-0 sm:w-72">
          {children}
        </div>
      )}
    </div>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-blue-600" />
      <span className="min-w-0 truncate" title={typeof children === "string" ? children : undefined}>{children}</span>
    </label>
  );
}

interface ReportFilterBarProps {
  params: ReportParams;
  onChange: (next: ReportParams) => void;
  options?: ReportOptions;
  /** multi: owners pick several outlets · single: managers pick one · hidden: only one outlet */
  outletMode: "multi" | "single" | "hidden";
  currentOutlet: { id: string; name: string } | null;
}

export default function ReportFilterBar({ params, onChange, options, outletMode, currentOutlet }: ReportFilterBarProps) {
  const set = (patch: Partial<ReportParams>) => onChange({ ...params, ...patch });
  const [pickingDays, setPickingDays] = useState(false);
  const [customHours, setCustomHours] = useState(false);
  const minDay = options?.earliestSale ? new Date(options.earliestSale).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : undefined;
  const today = istDay();

  // Categories come once per outlet: show each name once, and pick every id that carries it
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, { name: string; ids: string[] }>();
    for (const c of options?.categories ?? []) {
      const name = c.name.trim();
      const key = name.toLowerCase();
      const g = groups.get(key) ?? { name, ids: [] };
      g.ids.push(c.id);
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [options?.categories]);
  const chosenCategories = new Set(params.categories ?? []);
  const pickedGroups = categoryGroups.filter((g) => g.ids.some((id) => chosenCategories.has(id)));

  const weekdays = params.weekdays ?? [];
  const dayMode: keyof typeof DAY_MODES = pickingDays
    ? "pick"
    : weekdays.length === 0 ? "all" : sameSet(weekdays, DAY_SETS.weekdays) ? "weekdays" : sameSet(weekdays, DAY_SETS.weekends) ? "weekends" : "pick";
  const hourSet = HOUR_SETS.find((h) => h.from === params.hourFrom && h.to === params.hourTo);
  const hasHours = params.hourFrom !== undefined || params.hourTo !== undefined;
  const hourMode = customHours ? "custom" : !hasHours ? "all" : hourSet ? hourSet.key : "custom";
  const from = params.hourFrom ?? 0;
  const to = params.hourTo ?? 24;

  const outlets = params.outlets ?? [];
  const outletName = (id: string) => options?.outlets.find((o) => o.id === id)?.name ?? "1 outlet";
  const outletLabel =
    outlets.length === 0 ? (currentOutlet?.id === "all" ? "All outlets" : currentOutlet?.name ?? "Current outlet")
      : outlets.length === 1 ? outletName(outlets[0]) : `${outlets.length} outlets`;

  // Filters behind "More filters": each one that isn't at its default counts once
  const moreCount = [params.sources?.length, params.categories?.length, weekdays.length, hasHours, params.granularity].filter(Boolean).length;
  const [moreOpen, setMoreOpen] = useState(moreCount > 0);
  const reset = () => {
    setPickingDays(false);
    setCustomHours(false);
    onChange({ ...params, sources: undefined, categories: undefined, weekdays: undefined, hourFrom: undefined, hourTo: undefined, granularity: undefined });
  };

  return (
    <div className="relative flex flex-col gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <QuickCompare params={params} onChange={onChange} />
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <Field label="Period">
          <select
            className={CONTROL}
            value={params.preset}
            onChange={(e) => {
              const preset = e.target.value as ReportPreset;
              set(preset === "CUSTOM" ? { preset, from: params.from ?? `${today.slice(0, 8)}01`, to: params.to ?? today } : { preset, from: undefined, to: undefined });
            }}
          >
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {params.preset === "CUSTOM" && (
            <>
              <input type="date" aria-label="Period start" className={CONTROL} min={minDay} max={params.to ?? today} value={params.from ?? ""} onChange={(e) => e.target.value && set({ from: e.target.value })} />
              <span className="text-xs text-slate-500">to</span>
              <input type="date" aria-label="Period end" className={CONTROL} min={params.from ?? minDay} max={today} value={params.to ?? ""} onChange={(e) => e.target.value && set({ to: e.target.value })} />
            </>
          )}
        </Field>

        <Field label="Compare with">
          <select
            className={CONTROL}
            value={params.compare}
            onChange={(e) => {
              const compare = e.target.value as CompareMode;
              set(compare === "CUSTOM" ? { compare, cFrom: params.cFrom ?? istDay(14), cTo: params.cTo ?? istDay(8) } : { compare, cFrom: undefined, cTo: undefined });
            }}
          >
            {COMPARE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {params.compare === "CUSTOM" && (
            <>
              <input type="date" aria-label="Compare start" className={CONTROL} max={params.cTo ?? today} value={params.cFrom ?? ""} onChange={(e) => e.target.value && set({ cFrom: e.target.value })} />
              <span className="text-xs text-slate-500">to</span>
              <input type="date" aria-label="Compare end" className={CONTROL} min={params.cFrom} max={today} value={params.cTo ?? ""} onChange={(e) => e.target.value && set({ cTo: e.target.value })} />
            </>
          )}
        </Field>

        {outletMode === "multi" && options && (
          <Field label="Outlets">
            <Popover label={outletLabel}>
              {options.outlets.map((o) => (
                <Check
                  key={o.id}
                  checked={outlets.includes(o.id)}
                  onChange={() => set({ outlets: outlets.includes(o.id) ? outlets.filter((id) => id !== o.id) : [...outlets, o.id] })}
                >
                  {o.name}
                </Check>
              ))}
              <p className="px-2 pt-1 text-[11px] text-slate-500">None ticked shows {currentOutlet?.id === "all" ? "all outlets" : "the current outlet"}.</p>
            </Popover>
          </Field>
        )}
        {outletMode === "single" && options && (
          <Field label="Outlet">
            <select
              className={CONTROL}
              value={outlets[0] ?? currentOutlet?.id ?? ""}
              onChange={(e) => set({ outlets: e.target.value === currentOutlet?.id ? undefined : [e.target.value] })}
            >
              {options.outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
        )}

        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="report-more-filters"
          onClick={() => setMoreOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            moreOpen || moreCount > 0 ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
          More filters{moreCount > 0 && ` (${moreCount})`}
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {moreOpen && (
        <div id="report-more-filters" className="flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
          <Field label="Channels">
            <button type="button" aria-pressed={!params.sources?.length} onClick={() => set({ sources: undefined })} className={chip(!params.sources?.length)}>
              All
            </button>
            {(options?.channels ?? []).map((c) => {
              const on = params.sources?.includes(c.key) ?? false;
              const next = on ? (params.sources ?? []).filter((s) => s !== c.key) : [...(params.sources ?? []), c.key];
              return (
                <button key={c.key} type="button" aria-pressed={on} onClick={() => set({ sources: next.length ? next : undefined })} className={chip(on)}>
                  {c.label}
                </button>
              );
            })}
          </Field>

          {categoryGroups.length > 0 && (
            <Field label="Categories">
              <Popover label={pickedGroups.length === 0 ? "All categories" : pickedGroups.length === 1 ? pickedGroups[0].name : `${pickedGroups.length} categories`}>
                {categoryGroups.map((g) => {
                  const on = g.ids.some((id) => chosenCategories.has(id));
                  const toggle = () => {
                    const rest = (params.categories ?? []).filter((id) => !g.ids.includes(id));
                    const next = on ? rest : [...rest, ...g.ids];
                    set({ categories: next.length ? next : undefined });
                  };
                  return <Check key={g.name.toLowerCase()} checked={on} onChange={toggle}>{g.name}</Check>;
                })}
              </Popover>
            </Field>
          )}

          <Field label="Days">
            <select
              className={CONTROL}
              value={dayMode}
              onChange={(e) => {
                const mode = e.target.value as keyof typeof DAY_MODES;
                setPickingDays(mode === "pick");
                if (mode === "all") set({ weekdays: undefined });
                else if (mode !== "pick") set({ weekdays: DAY_SETS[mode] });
              }}
            >
              {Object.entries(DAY_MODES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            {dayMode === "pick" &&
              WEEK.map((d) => {
                const on = weekdays.includes(d);
                const next = on ? weekdays.filter((n) => n !== d) : [...weekdays, d].sort((a, b) => a - b);
                return (
                  <button key={d} type="button" aria-pressed={on} onClick={() => set({ weekdays: next.length ? next : undefined })} className={chip(on)}>
                    {DAY_NAMES[d]}
                  </button>
                );
              })}
          </Field>

          <Field label="Hours">
            <select
              className={CONTROL}
              value={hourMode}
              onChange={(e) => {
                const key = e.target.value;
                const preset = HOUR_SETS.find((h) => h.key === key);
                setCustomHours(key === "custom");
                if (key === "all") set({ hourFrom: undefined, hourTo: undefined });
                else if (preset) set({ hourFrom: preset.from, hourTo: preset.to });
              }}
            >
              <option value="all">All day</option>
              {HOUR_SETS.map((h) => <option key={h.key} value={h.key}>{h.label}</option>)}
              <option value="custom">Custom</option>
            </select>
            {hourMode === "custom" && (
              <>
                <select aria-label="From hour" className={CONTROL} value={from} onChange={(e) => { const f = Number(e.target.value); set({ hourFrom: f, hourTo: Math.max(to, f + 1) }); }}>
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourName(h)}</option>)}
                </select>
                <span className="text-xs text-slate-500">to</span>
                <select aria-label="To hour" className={CONTROL} value={to} onChange={(e) => { const t = Number(e.target.value); set({ hourFrom: Math.min(from, t - 1), hourTo: t }); }}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{hourName(h)}</option>)}
                </select>
              </>
            )}
          </Field>

          <Field label="Group by">
            <select className={CONTROL} value={params.granularity ?? ""} onChange={(e) => set({ granularity: (e.target.value || undefined) as ReportGranularity | undefined })}>
              {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>

          <button
            type="button"
            onClick={reset}
            disabled={moreCount === 0 && !pickingDays && !customHours}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

function chip(on: boolean) {
  return `whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    on ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
  }`;
}
