"use client";

import React from "react";
import Link from "next/link";
import { Download, FileBarChart, Loader2 } from "lucide-react";
import { paramsToSearch, type ReportParams } from "@/lib/reportQuery";
import { useReportDownload } from "@/components/reports/ExportMenu";

/** Under a report answer: open the full report, or download its PDF straight away. */
export default function ReportLinkActions({ params }: { params: ReportParams }) {
  const { busy, run } = useReportDownload(params);
  const search = paramsToSearch(params);
  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-white/30 hover:bg-white/[0.06]";
  return (
    <span className="my-1 inline-flex flex-wrap gap-2 align-middle">
      <Link href={search ? `/reports?${search}` : "/reports"} className={chip}>
        <FileBarChart className="h-3.5 w-3.5" aria-hidden />
        Open full report
      </Link>
      <button type="button" onClick={() => run("pdf")} disabled={busy} className={`${chip} disabled:opacity-60`}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
        {busy ? "Downloading…" : "Download PDF"}
      </button>
    </span>
  );
}
