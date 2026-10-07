"use client";

import React, { useRef, useState, useEffect } from "react";
import { Printer, X, CheckCircle, Utensils, Ban, AlertCircle } from "lucide-react";

export interface ThermalKOTProps {
  order: {
    id: string;
    orderNumber?: string;
    orderNo?: string;
    tableNumber?: number | string | null;
    tableNo?: number | string | null;
    source?: string;
    orderSource?: string;
    status?: string;
    createdAt?: string;
    placedByName?: string;
    placedByRole?: string;
    customerName?: string;
    comment?: string;
    cancelReason?: string;
    cancelledAt?: string;
    items?: Array<{
      id?: string;
      quantity: number;
      notes?: string;
      kotNo?: number;
      menuItem?: { name: string; isVeg?: boolean; dietaryType?: string };
      menuItemName?: string;
    }>;
    orderItems?: Array<{
      id?: string;
      quantity: number;
      notes?: string;
      kotNo?: number;
      menuItem?: { name: string; isVeg?: boolean; dietaryType?: string };
    }>;
    outlet?: {
      name?: string;
      address?: string;
    };
  };
  isCancellation?: boolean;
  onClose?: () => void;
  autoPrint?: boolean;
}

export default function ThermalKOT({
  order,
  isCancellation = false,
  onClose,
  autoPrint = false,
}: ThermalKOTProps) {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [hasPrinted, setHasPrinted] = useState(false);

  const actualOrder = (order as any)?.data || order || {};
  const orderNumber =
    actualOrder.orderNumber ||
    actualOrder.orderNo ||
    (actualOrder.id ? `#${String(actualOrder.id).slice(0, 8).toUpperCase()}` : "ORD-101");

  const rawTable = actualOrder.tableNumber ?? actualOrder.tableNo;
  const isTableOrder =
    rawTable !== null &&
    rawTable !== undefined &&
    String(rawTable).trim() !== "" &&
    String(rawTable) !== "COUNTER";
  const tableDisplay = isTableOrder ? `Table ${rawTable}` : "Counter / Direct";

  const orderSource = (
    actualOrder.source ||
    actualOrder.orderSource ||
    (isTableOrder ? "DINE-IN" : "COUNTER")
  ).toUpperCase();

  const outletName = actualOrder.outlet?.name || "ALAYN RESTAURANT";
  const serverName =
    actualOrder.placedByName ||
    (actualOrder.placedByRole ? `Staff (${actualOrder.placedByRole})` : "Cashier / Staff");

  const itemsList = actualOrder.items || actualOrder.orderItems || [];
  const maxKotNo = Math.max(...itemsList.map((i: any) => i.kotNo || 1), 1);

  const timestamp = actualOrder.createdAt
    ? new Date(actualOrder.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  const cancelTimestamp = actualOrder.cancelledAt
    ? new Date(actualOrder.cancelledAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const cancelReason = actualOrder.comment || actualOrder.cancelReason;

  const handlePrint = () => {
    const content = printContentRef.current;
    if (!content) return;

    const printWidth = paperWidth === "80mm" ? "78mm" : "56mm";
    const printWindow = window.open("", "_blank", "width=440,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isCancellation ? "VOID-KOT" : "KOT"}-${orderNumber}</title>
          <meta charset="UTF-8" />
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: 0mm;
            }
            @media print {
              html, body {
                width: ${printWidth};
                margin: 0 auto;
                padding: 0;
                background: #fff !important;
                color: #000 !important;
              }
            }
            * {
              box-sizing: border-box;
              color: #000 !important;
              font-family: 'Courier New', Courier, monospace !important;
            }
            body {
              width: ${printWidth};
              margin: 0 auto;
              padding: 4mm 2mm;
              font-size: 13px;
              line-height: 1.3;
            }
            .center { text-align: center; }
            .bold { font-weight: 900; }
            .cancel-banner {
              border: 2px solid #000;
              padding: 6px;
              text-align: center;
              font-weight: 900;
              margin: 8px 0;
            }
            .meta-table {
              width: 100%;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 6px 0;
              margin: 6px 0;
              font-size: 12px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .items-header {
              display: flex;
              justify-content: space-between;
              font-weight: 900;
              border-bottom: 1px solid #000;
              padding: 4px 0;
              margin-top: 8px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px dotted #aaa;
            }
            .item-qty {
              border: 1.5px solid #000;
              padding: 1px 6px;
              font-weight: 900;
              min-width: 26px;
              text-align: center;
            }
            .footer-line {
              text-align: center;
              font-weight: 900;
              border-top: 1.5px dashed #000;
              margin-top: 14px;
              padding-top: 8px;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 15px; text-transform: uppercase;">
            ${outletName}
          </div>
          <div class="center" style="font-size: 11px; margin-bottom: 6px;">
            KITCHEN ORDER TICKET (KOT)
          </div>

          ${
            isCancellation
              ? `
              <div class="cancel-banner">
                <div style="font-size: 14px; font-weight: 900;">*** VOID / CANCELLED ***</div>
                <div style="font-size: 11px; font-weight: 800; margin-top: 2px;">DO NOT PREPARE FOOD</div>
              </div>
            `
              : `
              <div class="center bold" style="font-size: 12px; border: 1px solid #000; padding: 2px 8px; display: inline-block; margin: 4px 0;">
                KOT #${maxKotNo}
              </div>
            `
          }

          <div class="center bold" style="font-size: 15px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 6px 0;">
            ${tableDisplay.toUpperCase()} (${orderSource})
          </div>

          <div class="meta-table">
            <div class="meta-row"><span>Order #:</span><span class="bold">${orderNumber}</span></div>
            <div class="meta-row"><span>Staff:</span><span>${serverName}</span></div>
            <div class="meta-row"><span>Placed:</span><span>${timestamp}</span></div>
            ${
              isCancellation
                ? `<div class="meta-row bold"><span>Cancelled:</span><span>${cancelTimestamp}</span></div>`
                : ""
            }
            ${
              actualOrder.customerName
                ? `<div class="meta-row"><span>Customer:</span><span>${actualOrder.customerName}</span></div>`
                : ""
            }
            ${
              isCancellation && cancelReason
                ? `<div style="margin-top: 4px; padding: 4px; border-left: 2px solid #000; font-size: 11px;"><strong>Reason:</strong> ${cancelReason}</div>`
                : ""
            }
          </div>

          <div class="items-header">
            <span>ITEM</span>
            <span>QTY</span>
          </div>

          ${itemsList
            .map((item: any) => {
              const name = item.menuItem?.name || item.menuItemName || "Item";
              const note = item.notes ? `<div style="font-size: 10px; font-style: italic; margin-left: 10px;">Note: ${item.notes}</div>` : "";
              return `
                <div class="item-row">
                  <div style="flex: 1; padding-right: 8px;">
                    <span class="bold">${name}</span>
                    ${note}
                  </div>
                  <div class="item-qty">${item.quantity}</div>
                </div>
              `;
            })
            .join("")}

          <div class="footer-line">
            ${isCancellation ? "*** CANCELLED • DO NOT PREPARE ***" : `--- END OF KOT #${maxKotNo} ---`}
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setHasPrinted(true);
  };

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* ── Sleek Modal Header ── */}
      <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCancellation
                ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                : "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
            }`}
          >
            {isCancellation ? <Ban className="w-4.5 h-4.5" /> : <Utensils className="w-4.5 h-4.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {isCancellation ? "Kitchen Void Ticket" : "Kitchen Order Ticket"}
              </h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${
                  isCancellation
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                {isCancellation ? "Void / Cancelled" : `KOT #${maxKotNo}`}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Order {orderNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Paper Width Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setPaperWidth("80mm")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperWidth === "80mm"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              80mm
            </button>
            <button
              onClick={() => setPaperWidth("58mm")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paperWidth === "58mm"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              58mm
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Preview Body ── */}
      <div className="p-5 bg-slate-50/70 overflow-y-auto max-h-[75vh]">
        <div
          ref={printContentRef}
          className={`mx-auto bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all ${
            paperWidth === "80mm" ? "max-w-[380px]" : "max-w-[310px]"
          }`}
        >
          {/* Restaurant Header */}
          <div className="text-center pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
              {outletName}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Kitchen Dispatch Order
            </p>
          </div>

          {/* Cancellation Alert Banner */}
          {isCancellation ? (
            <div className="my-3 p-3 bg-rose-50 border border-rose-200/90 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold text-rose-700 uppercase tracking-wide">
                  Order Voided &amp; Cancelled
                </div>
                <div className="text-[10px] font-medium text-rose-600">
                  Do not prepare food • Discard active prep
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center my-2.5">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 text-slate-800 rounded-lg inline-block">
                KOT #{maxKotNo}
              </span>
            </div>
          )}

          {/* Table / Destination Tag */}
          <div className="my-3 py-2 px-3 bg-slate-900 text-white rounded-xl text-center">
            <div className="text-sm font-extrabold tracking-tight uppercase">
              {tableDisplay}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Type: {orderSource}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="py-2.5 border-y border-dashed border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Order #:</span>
              <span className="font-bold text-slate-900 font-mono">{orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Staff:</span>
              <span className="font-semibold text-slate-800">{serverName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Placed:</span>
              <span className="text-slate-700">{timestamp}</span>
            </div>
            {isCancellation && (
              <div className="flex justify-between items-center font-semibold text-rose-600">
                <span>Cancelled At:</span>
                <span>{cancelTimestamp}</span>
              </div>
            )}
            {actualOrder.customerName && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-medium text-slate-800">{actualOrder.customerName}</span>
              </div>
            )}
          </div>

          {/* Cancellation Reason Box */}
          {isCancellation && cancelReason && (
            <div className="mt-3 p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-0.5">
                Cancellation Reason
              </div>
              <div className="text-xs font-semibold text-rose-950">
                {cancelReason}
              </div>
            </div>
          )}

          {/* Items Section */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5">
              <span>Item Description</span>
              <span>Qty</span>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {itemsList.map((item: any, idx: number) => {
                const itemName = item.menuItem?.name || item.menuItemName || "Item";
                const isVeg = item.menuItem?.dietaryType === "VEG" || item.menuItem?.isVeg === true;
                const isNonVeg =
                  item.menuItem?.dietaryType === "NON_VEG" || item.menuItem?.isVeg === false;

                return (
                  <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isVeg && (
                          <span
                            className="inline-flex items-center justify-center w-3.5 h-3.5 border border-emerald-600 rounded-xs shrink-0"
                            title="Vegetarian"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          </span>
                        )}
                        {isNonVeg && (
                          <span
                            className="inline-flex items-center justify-center w-3.5 h-3.5 border border-rose-600 rounded-xs shrink-0"
                            title="Non-Vegetarian"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {itemName}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="mt-1 pl-5 text-[11px] font-medium text-slate-500 italic">
                          ↳ Note: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-black text-slate-900 shrink-0 min-w-[28px] text-center">
                      {item.quantity}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Footer Status */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {isCancellation ? (
              <span className="text-rose-600 font-extrabold">*** CANCELLED — DO NOT PREPARE ***</span>
            ) : (
              <span>--- END OF KOT #{maxKotNo} ---</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Footer ── */}
      <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasPrinted ? "bg-emerald-400" : isCancellation ? "bg-rose-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                hasPrinted ? "bg-emerald-500" : isCancellation ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </span>
          <span className="hidden sm:inline">
            {hasPrinted ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Sent to Printer
              </span>
            ) : (
              `ESC/POS ${paperWidth} Ready`
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer active:scale-95"
            >
              Close
            </button>
          )}
          <button
            onClick={handlePrint}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 ${
              isCancellation
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isCancellation ? "Print Void KOT" : "Print KOT Ticket"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
