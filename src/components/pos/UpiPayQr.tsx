"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatPaise } from "@/lib/splitPayment";
import { buildUpiPayUrl } from "@/lib/upi";

interface UpiPayQrProps {
  /** The outlet's UPI ID (Settings → General → UPI VPA) */
  upiId: string | null | undefined;
  payeeName: string;
  amountPaise: number;
  /** Shown with the payment in the restaurant's UPI app, e.g. "Bill ALA2026102000012" */
  note?: string;
  size?: number;
}

/** QR the customer scans with any UPI app to pay the restaurant this exact amount */
export default function UpiPayQr({ upiId, payeeName, amountPaise, note, size = 112 }: UpiPayQrProps) {
  const url = buildUpiPayUrl({ upiId, payeeName, amountPaise, note });

  if (!url) {
    return (
      <p className="text-[11px] text-slate-600 bg-white border border-dashed border-slate-300 rounded-lg px-2.5 py-2">
        No UPI ID set for this outlet. Add it in <span className="font-semibold">Settings → General → UPI VPA</span> to show a
        payment QR here.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2">
      <div className="p-1 bg-white rounded-md border border-slate-100 shrink-0">
        <QRCodeSVG value={url} size={size} level="M" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[11px] font-semibold text-slate-500">Customer scans with any UPI app</p>
        <p className="text-lg font-bold text-slate-900 tabular-nums">{formatPaise(amountPaise)}</p>
        <p className="text-[11px] text-slate-500 font-mono truncate">{upiId}</p>
      </div>
    </div>
  );
}
