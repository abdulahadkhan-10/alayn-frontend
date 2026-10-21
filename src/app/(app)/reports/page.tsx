"use client";

import React, { Suspense, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Info } from "lucide-react";

import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportFilterBar from "@/components/reports/ReportFilterBar";
import QuickCompare from "@/components/reports/QuickCompare";
import ComparisonKpis from "@/components/reports/ComparisonKpis";
import TrendChart from "@/components/reports/TrendChart";
import TrendTable from "@/components/reports/TrendTable";
import BreakdownTable from "@/components/reports/BreakdownTable";
import ItemsTable from "@/components/reports/ItemsTable";
import HighlightsCard from "@/components/reports/HighlightsCard";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import { useGetReportOptionsQuery, useGetReportQuery, type ReportData } from "@/redux/slices/reportsApiSlice";
import { paramsFromSearch, paramsToSearch, type ReportParams } from "@/lib/reportQuery";

const REPORT_ROLES = ["BUSINESS_OWNER", "MANAGER", "SUPER_ADMIN"];
const CARD = "bg-white rounded-2xl border border-slate-200/80 shadow-xs";

/** The server's reason, when it sent one ("Pick a period of 400 days or fewer") */
function serverMessage(error: unknown): string | null {
  const data = (error as { data?: { error?: { message?: unknown } } } | undefined)?.data;
  return typeof data?.error?.message === "string" ? data.error.message : null;
}

function ReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading report">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${CARD} p-5`}>
            <Skeleton width="50%" height={12} />
            <Skeleton width="70%" height={28} className="mt-3" />
            <Skeleton width="80%" height={10} className="mt-3" />
          </div>
        ))}
      </div>
      <div className={`${CARD} p-5`}>
        <Skeleton width={160} height={16} />
        <Skeleton height={260} className="mt-4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className={`${CARD} p-5`}>
            <Skeleton width={120} height={16} />
            <Skeleton count={5} height={20} className="mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportBody({ report }: { report: ReportData }) {
  const empty = report.totals.current.orders === 0;
  const hasPrev = report.comparison != null;
  const noRows = empty ? "No sales in this period" : "Nothing to show with these filters";
  const sales = { hasPrev, emptyMessage: noRows, subtitle: "Sales before tax" };

  return (
    <div className="space-y-6">
      <HighlightsCard highlights={report.highlights} empty={empty} />
      <ComparisonKpis report={report} />
      <TrendChart report={report} empty={empty} />
      <TrendTable report={report} empty={empty} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <BreakdownTable title="Channels" firstColumn="Channel" rows={report.channels} {...sales} />
        <BreakdownTable
          title="Payments"
          firstColumn="Payment method"
          rows={report.payments}
          {...sales}
          subtitle="Amounts received, including tax"
        />
        <BreakdownTable title="Categories" firstColumn="Category" rows={report.categories} {...sales} subtitle="Item sales before bill discounts" />
        <BreakdownTable title="Hours" firstColumn="Hour" rows={report.hours} {...sales} />
        <BreakdownTable title="Weekdays" firstColumn="Weekday" rows={report.weekdays} {...sales} />
        <BreakdownTable
          title="Stock wasted"
          firstColumn="Reason"
          rows={report.waste}
          hasPrev={hasPrev}
          waste
          subtitle="Value of stock logged as waste"
          emptyMessage="No stock logged as waste in this period"
        />
        {report.outlets.length > 1 && <BreakdownTable title="Outlets" firstColumn="Outlet" rows={report.outlets} {...sales} />}
      </div>

      <ItemsTable items={report.items} hasPrev={hasPrev} empty={empty} />

      {report.notes.length > 0 && (
        <section className={`${CARD} p-5`} aria-label="Notes">
          <ul className="space-y-1.5">
            {report.notes.map((n) => (
              <li key={n} className="flex gap-2 text-xs leading-relaxed text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useAppSelector((state) => state.auth.user?.role);
  const { activeBranch, loading: branchLoading } = useBranch();

  useEffect(() => {
    if (role && !REPORT_ROLES.includes(role)) router.replace("/dashboard");
  }, [role, router]);

  // The URL is the single source of truth for the filters
  const search = searchParams.toString();
  const params = useMemo(() => paramsFromSearch(new URLSearchParams(search)), [search]);
  const setParams = useCallback(
    (next: ReportParams) => {
      const qs = paramsToSearch(next);
      router.replace(qs ? `/reports?${qs}` : "/reports", { scroll: false });
    },
    [router],
  );

  const ready = !branchLoading && activeBranch != null;
  const { data: options } = useGetReportOptionsQuery(undefined, { skip: !ready });
  const { currentData: report, isFetching, isError, error } = useGetReportQuery(params, { skip: !ready });

  const outletCount = options?.outlets.length ?? 0;
  const outletMode = outletCount <= 1 ? "hidden" : role === "MANAGER" ? "single" : "multi";
  const scope = report?.scope.outletNames ?? [];
  const scopeLabel = scope.length > 2 ? `${scope.length} outlets` : scope.join(", ");
  const detail = serverMessage(error);

  return (
    <div className="py-6 px-4 sm:px-6 max-w-[1500px] mx-auto space-y-6 font-sans bg-[#F8FAFC] min-w-0">
      <div className={`${CARD} flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5`}>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500">
            {report
              ? `${scopeLabel || "Your outlet"} · ${report.period.label}${report.comparison ? ` · ${report.comparison.compareLabel}` : ""}`
              : "Compare sales, orders and waste across any period"}
          </p>
        </div>
        {/* Download slot: the PDF / Excel menu goes here (Task 8) */}
        <div className="flex shrink-0 items-center gap-2" />
      </div>

      <QuickCompare params={params} onChange={setParams} />
      <ReportFilterBar
        params={params}
        onChange={setParams}
        options={options}
        outletMode={outletMode}
        currentOutlet={activeBranch ? { id: activeBranch.id, name: activeBranch.name } : null}
      />

      {isError ? (
        <div className={`${CARD} p-8 text-center`} role="alert">
          <p className="text-sm font-semibold text-slate-800">Couldn&apos;t load this report. Check the dates and try again.</p>
          {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
      ) : !report || isFetching ? (
        <ReportSkeleton />
      ) : (
        <ReportBody report={report} />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="py-6 px-4 sm:px-6 max-w-[1500px] mx-auto">
              <ReportSkeleton />
            </div>
          }
        >
          <ReportsContent />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  );
}
