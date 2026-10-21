"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { downloadReport, type DownloadFormat } from "@/lib/downloadReport";
import { showToast } from "@/lib/toast";
import type { ReportParams } from "@/lib/reportQuery";

/** Runs a download and toasts the server's reason when it fails. */
export function useReportDownload(params: ReportParams) {
  const [busy, setBusy] = useState(false);
  const run = async (format: DownloadFormat, section?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadReport(params, format, section);
    } catch (e) {
      showToast.error("Download failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/** "Download" button with PDF and Excel choices, for the page header. */
export default function ExportMenu({ params }: { params: ReportParams }) {
  const { busy, run } = useReportDownload(params);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (format: DownloadFormat) => {
    setOpen(false);
    void run(format);
  };
  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? "Preparing…" : "Download"}
        {!busy && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <button type="button" role="menuitem" className={item} onClick={() => choose("pdf")}>
            <FileText className="h-4 w-4 text-slate-400" /> PDF report
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => choose("xlsx")}>
            <FileSpreadsheet className="h-4 w-4 text-slate-400" /> Excel (all tables)
          </button>
        </div>
      )}
    </div>
  );
}

/** Small "CSV" button for a table header. */
export function CsvButton({ params, section, label }: { params: ReportParams; section: string; label: string }) {
  const { busy, run } = useReportDownload(params);
  return (
    <button
      type="button"
      onClick={() => void run("csv", section)}
      disabled={busy}
      aria-label={`Download ${label} as CSV`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-70"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      CSV
    </button>
  );
}
