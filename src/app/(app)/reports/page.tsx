"use client";

import React, { Suspense, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Info } from "lucide-react";

import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportFilterBar from "@/components/reports/ReportFilterBar";
import ComparisonKpis from "@/components/reports/ComparisonKpis";
import TrendChart from "@/components/reports/TrendChart";
import SalesBreakdown from "@/components/reports/SalesBreakdown";
import WhenPeopleBuy from "@/components/reports/WhenPeopleBuy";
import WasteList from "@/components/reports/WasteList";
import ItemsTable from "@/components/reports/ItemsTable";
import ExportMenu from "@/components/reports/ExportMenu";
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
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
      <div className={`${CARD} p-5`}>
        <Skeleton width={180} height={16} />
        <Skeleton count={5} height={20} className="mt-3" />
      </div>
    </div>
  );
}

function ReportBody({ report, params }: { report: ReportData; params: ReportParams }) {
  const empty = report.totals.current.orders === 0;
  const hasPrev = report.comparison != null;

  return (
    <div className="space-y-6">
      <HighlightsCard highlights={report.highlights} empty={empty} />
      <ComparisonKpis report={report} />
      <TrendChart report={report} empty={empty} params={params} />
      <SalesBreakdown report={report} params={params} />
      <WhenPeopleBuy report={report} params={params} />
      <ItemsTable items={report.items} hasPrev={hasPrev} empty={empty} params={params} />
      <WasteList rows={report.waste} params={params} />

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
        {ready && <div className="flex shrink-0 items-center gap-2"><ExportMenu params={params} /></div>}
      </div>

      <ReportFilterBar
        params={params}
        onChange={setParams}
        options={options}
        outletMode={outletMode}
        currentOutlet={activeBranch ? { id: activeBranch.id, name: activeBranch.name } : null}
      />

      {!branchLoading && activeBranch == null ? (
        <div className={`${CARD} p-8 text-center`}>
          <p className="text-sm font-semibold text-slate-800">Pick an outlet to see its report.</p>
        </div>
      ) : isError ? (
        <div className={`${CARD} p-8 text-center`} role="alert">
          <p className="text-sm font-semibold text-slate-800">Couldn&apos;t load this report. Check the dates and try again.</p>
          {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
      ) : !report || isFetching ? (
        <ReportSkeleton />
      ) : (
        <ReportBody report={report} params={params} />
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
