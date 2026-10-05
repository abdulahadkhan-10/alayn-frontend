"use client";

import React, { useRef, useState } from "react";
import { Printer, X, AlertTriangle, CheckCircle, Utensils, Ban } from "lucide-react";

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
  const kotRef = useRef<HTMLDivElement>(null);
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [hasPrinted, setHasPrinted] = useState(false);

  const actualOrder = (order as any)?.data || order || {};
  const orderNumber =
    actualOrder.orderNumber ||
    actualOrder.orderNo ||
    (actualOrder.id ? `#${String(actualOrder.id).slice(0, 8).toUpperCase()}` : "ORD-101");

  const rawTable = actualOrder.tableNumber ?? actualOrder.tableNo;
  const isTableOrder = rawTable !== null && rawTable !== undefined && String(rawTable).trim() !== "" && String(rawTable) !== "COUNTER";
  const tableDisplay = isTableOrder ? `TABLE ${rawTable}` : "COUNTER / DIRECT";

  const orderSource = (actualOrder.source || actualOrder.orderSource || (isTableOrder ? "TABLE" : "COUNTER")).toUpperCase();
  const outletName = actualOrder.outlet?.name || "ALAYN RESTAURANT";
  const serverName = actualOrder.placedByName || (actualOrder.placedByRole ? `Staff (${actualOrder.placedByRole})` : "Cashier / Staff");

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
    : new Date().toLocaleString("en-IN");

  const cancelTimestamp = actualOrder.cancelledAt
    ? new Date(actualOrder.cancelledAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const handlePrint = () => {
    const content = kotRef.current;
    if (!content) return;

    const printWidth = paperWidth === "80mm" ? "78mm" : "56mm";
    const printWindow = window.open("", "_blank", "width=420,height=700");
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
              .no-print { display: none !important; }
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
              line-height: 1.25;
            }
            .center { text-align: center; }
            .bold { font-weight: 900; }
            .header-title { font-size: 17px; font-weight: 900; margin-bottom: 2px; }
            .kot-badge { font-size: 15px; font-weight: 900; text-transform: uppercase; margin: 4px 0; }
            .cancel-badge {
              background: #000 !important;
              color: #fff !important;
              padding: 4px;
              font-size: 15px;
              font-weight: 900;
              margin: 6px 0;
              text-align: center;
              border: 2px solid #000;
            }
            .cancel-badge * { color: #fff !important; }
            .dashed-border {
              border-top: 1.5px dashed #000;
              border-bottom: 1.5px dashed #000;
              padding: 4px 0;
              margin: 5px 0;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin: 2px 0;
            }
            .table-hero {
              font-size: 18px;
              font-weight: 900;
              text-align: center;
              padding: 3px 0;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              margin: 6px 0;
            }
            .item-row {
              margin: 7px 0;
              padding-bottom: 5px;
              border-bottom: 1px dotted #666;
            }
            .item-main {
              display: flex;
              align-items: flex-start;
              gap: 8px;
            }
            .item-qty {
              font-size: 16px;
              font-weight: 900;
              border: 1.5px solid #000;
              padding: 1px 5px;
              min-width: 26px;
              text-align: center;
              line-height: 1.1;
            }
            .item-name {
              font-size: 14px;
              font-weight: 800;
              flex: 1;
            }
            .item-note {
              margin-left: 34px;
              margin-top: 3px;
              font-size: 11px;
              font-weight: 800;
              font-style: italic;
            }
            .footer-cut {
              text-align: center;
              margin-top: 15px;
              font-size: 11px;
              border-top: 1px dashed #000;
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
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

  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 max-w-md w-full">
      {/* Top Modal Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1B2A4A] text-white">
        <div className="flex items-center gap-2">
          <Printer className="w-4 h-4 text-emerald-400" />
          <span className="font-extrabold text-sm tracking-wide">
            {isCancellation ? "Kitchen Cancellation Ticket" : "Kitchen Order Ticket (KOT)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Paper Size Selector */}
          <div className="flex bg-black/30 rounded-lg p-0.5 text-xs font-bold">
            <button
              onClick={() => setPaperWidth("80mm")}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                paperWidth === "80mm" ? "bg-white text-[#1B2A4A] shadow-xs" : "text-gray-300 hover:text-white"
              }`}
            >
              80mm
            </button>
            <button
              onClick={() => setPaperWidth("58mm")}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                paperWidth === "58mm" ? "bg-white text-[#1B2A4A] shadow-xs" : "text-gray-300 hover:text-white"
              }`}
            >
              58mm
            </button>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Thermal Receipt Roll Preview */}
      <div className="p-4 bg-gray-100 flex justify-center max-h-[70vh] overflow-y-auto">
        <div
          ref={kotRef}
          className={`bg-white p-4 shadow-md font-mono text-black border border-gray-300 transition-all ${
            paperWidth === "80mm" ? "w-[300px]" : "w-[240px]"
          }`}
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
          {/* Outlet Header */}
          <div className="text-center pb-2 border-b border-black">
            <div className="text-base font-black tracking-wider uppercase">{outletName}</div>
            <div className="text-[11px] font-bold text-gray-700">KITCHEN DISPATCH ORDER</div>
          </div>

          {/* Cancellation Alert Header or Normal Header */}
          {isCancellation ? (
            <div className="my-2 bg-black text-white text-center p-2 rounded-xs">
              <div className="text-sm font-black tracking-widest uppercase">
                *** VOID / CANCELLED ***
              </div>
              <div className="text-[11px] font-extrabold uppercase mt-0.5">
                DO NOT PREPARE FOOD
              </div>
            </div>
          ) : (
            <div className="text-center my-1.5">
              <span className="text-xs font-black tracking-widest uppercase px-2 py-0.5 border border-black inline-block">
                KOT #{maxKotNo}
              </span>
            </div>
          )}

          {/* Table Number & Order Source Banner */}
          <div className="my-2 py-1.5 border-y-2 border-black text-center bg-gray-50">
            <div className="text-lg font-black tracking-tight">{tableDisplay}</div>
            <div className="text-[11px] font-extrabold tracking-widest text-gray-700 uppercase">
              TYPE: {orderSource}
            </div>
          </div>

          {/* Order Details & Meta */}
          <div className="text-[11px] space-y-1 py-1 border-b border-dashed border-black">
            <div className="flex justify-between">
              <span className="font-bold">Order #:</span>
              <span className="font-black">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Server / Staff:</span>
              <span className="font-bold">{serverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Time Placed:</span>
              <span>{timestamp}</span>
            </div>
            {isCancellation && (
              <div className="flex justify-between font-black text-red-600">
                <span>Cancelled At:</span>
                <span>{cancelTimestamp}</span>
              </div>
            )}
            {actualOrder.customerName && (
              <div className="flex justify-between">
                <span className="font-bold">Customer:</span>
                <span>{actualOrder.customerName}</span>
              </div>
            )}
            {isCancellation && (actualOrder.comment || actualOrder.cancelReason) && (
              <div className="bg-gray-100 p-1 mt-1 border-l-2 border-black text-[10px] font-bold">
                Reason: {actualOrder.comment || actualOrder.cancelReason}
              </div>
            )}
          </div>

          {/* Items Header */}
          <div className="flex justify-between text-[11px] font-black uppercase py-1 border-b-2 border-black mt-2">
            <span>Item Description</span>
            <span>Qty</span>
          </div>

          {/* Items List */}
          <div className="py-1 divide-y divide-gray-200">
            {itemsList.map((item: any, idx: number) => {
              const itemName = item.menuItem?.name || item.menuItemName || "Item";
              const isVeg = item.menuItem?.dietaryType === "VEG" || item.menuItem?.isVeg === true;
              const isNonVeg = item.menuItem?.dietaryType === "NON_VEG" || (item.menuItem?.isVeg === false);

              return (
                <div key={idx} className="py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {isVeg && (
                          <span className="text-[9px] font-black px-1 border border-black rounded-xs">
                            V
                          </span>
                        )}
                        {isNonVeg && (
                          <span className="text-[9px] font-black px-1 border border-black bg-black text-white rounded-xs">
                            NV
                          </span>
                        )}
                        <span className="text-[13px] font-black leading-tight">{itemName}</span>
                      </div>
                      {item.notes && (
                        <div className="mt-1 pl-4 text-[11px] font-extrabold italic text-gray-800">
                          *** NOTE: {item.notes} ***
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-black border-2 border-black px-1.5 py-0.5 rounded-xs shrink-0 min-w-[26px] text-center">
                      {item.quantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Cut Marker */}
          <div className="pt-3 mt-2 border-t-2 border-dashed border-black text-center text-[10px] font-bold text-gray-600">
            {isCancellation ? (
              <span className="font-black uppercase text-black">*** CANCELLED - DO NOT PREPARE ***</span>
            ) : (
              <span>--- END OF TICKET #{maxKotNo} ---</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500 font-medium">
          {hasPrinted ? (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Ticket Printed
            </span>
          ) : (
            <span>Ready for thermal printer ({paperWidth})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          )}
          <button
            onClick={handlePrint}
            className={`px-5 py-2 text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer ${
              isCancellation
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-[#1B2A4A] hover:bg-[#2d4272] text-white"
            }`}
          >
            <Printer className="w-4 h-4" />
            {isCancellation ? "Print Cancellation KOT" : "Print KOT Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
