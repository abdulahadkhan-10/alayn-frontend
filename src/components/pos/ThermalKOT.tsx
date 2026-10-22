"use client";

import React, { useRef, useState, useEffect } from "react";
import { Printer, X, CheckCircle, Utensils, Ban, AlertCircle, Loader2, Bluetooth } from "lucide-react";
import { printThermalHtml } from "@/lib/printUtils";
import {
  autoPrintKOT,
  buildKotHtml,
  pairWebBluetoothPrinter,
  isWebBluetoothSupported,
  getConnectedPrinterName,
} from "@/lib/bluetoothAutoPrinter";
import { kotHeader, kotItems } from "@/lib/kotLines";

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
    isItemVoid?: boolean;
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
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("alayn_thermal_paper_width");
      if (saved === "80mm" || saved === "58mm") return saved;
    }
    return "80mm";
  });
  const [hasPrinted, setHasPrinted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMode, setPrintMode] = useState<"bluetooth" | "system">("system");
  const [btName, setBtName] = useState<string | null>(() => getConnectedPrinterName());
  const [isPairingBt, setIsPairingBt] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("alayn_print_mode");
    if (saved === "bluetooth" || saved === "system") {
      setPrintMode(saved as any);
    } else {
      setPrintMode("system");
    }
  }, []);

  const changePrintMode = (mode: "bluetooth" | "system") => {
    setPrintMode(mode);
    localStorage.setItem("alayn_print_mode", mode);
  };

  const handlePairBluetooth = async () => {
    setIsPairingBt(true);
    const res = await pairWebBluetoothPrinter();
    setIsPairingBt(false);
    if (res.success) {
      setBtName(res.name || "Bluetooth Printer");
      changePrintMode("bluetooth");
    } else if (res.error && res.error !== "Cancelled by user") {
      alert(res.error);
    }
  };

  const changePaperWidth = (width: "80mm" | "58mm") => {
    setPaperWidth(width);
    if (typeof window !== "undefined") {
      localStorage.setItem("alayn_thermal_paper_width", width);
    }
  };

  const actualOrder = (order as any)?.data || order || {};
  const itemsList = kotItems(actualOrder);
  const kot = kotHeader(actualOrder, itemsList);
  const maxKotNo = kot.kotNo;
  const orderNumber = kot.orderNumber;

  const handlePrint = async () => {
    setIsPrinting(true);
    const kotHtml = buildKotHtml(actualOrder, isCancellation, paperWidth);

    // Dispatch through hardware auto-printer (Native Bluetooth -> Direct ESC/POS stream -> System fallback)
    const result = await autoPrintKOT(actualOrder, isCancellation, paperWidth);
    if (!result.success) {
      // System print fallback if hardware Bluetooth or stream is unavailable
      await printThermalHtml(kotHtml);
    }

    setHasPrinted(true);
    setIsPrinting(false);
    setTimeout(() => {
      onClose?.();
    }, 600);
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
      {/* -- Sleek Modal Header -- */}
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

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* -- Preview Body -- */}
      <div className="p-5 bg-slate-50/70 overflow-y-auto max-h-[75vh]">
        <div
          ref={printContentRef}
          className={`mx-auto bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all ${
            paperWidth === "80mm" ? "max-w-[380px]" : "max-w-[310px]"
          }`}
        >
          {/* Cancellation Alert Banner */}
          {isCancellation ? (
            <div className="my-3 p-3 bg-rose-50 border border-rose-200/90 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold text-rose-700 uppercase tracking-wide">
                  {actualOrder.isItemVoid ? "Item Cancelled from Order" : <>Order Voided &amp; Cancelled</>}
                </div>
                <div className="text-[10px] font-medium text-rose-600">
                  {actualOrder.isItemVoid
                    ? "Stop preparing the items below • Rest of the order continues"
                    : "Do not prepare food • Discard active prep"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-2.5 text-sm font-extrabold text-slate-900">
              <span>KOT #{maxKotNo}</span>
              <span className="font-mono">{kot.sentAt}</span>
            </div>
          )}

          {/* Table / Destination Tag */}
          <div className="my-3 py-2 px-3 bg-slate-900 text-white rounded-xl text-center">
            <div className="text-base font-extrabold tracking-tight uppercase">{kot.location}</div>
          </div>

          {/* Metadata Grid */}
          <div className="py-2.5 border-y border-dashed border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Order:</span>
              <span className="font-bold text-slate-900 font-mono">{orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Server:</span>
              <span className="font-semibold text-slate-800">{kot.serverName}</span>
            </div>
            {isCancellation && (
              <div className="flex justify-between items-center font-semibold text-rose-600">
                <span>Cancelled:</span>
                <span>{kot.cancelledAt}</span>
              </div>
            )}
          </div>

          {/* Cancellation Reason Box */}
          {isCancellation && kot.cancelReason && (
            <div className="mt-3 p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-0.5">
                Cancellation Reason
              </div>
              <div className="text-xs font-semibold text-rose-950">
                {kot.cancelReason}
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
                      {(() => {
                        const mods = item.modifiers || (item.modifiersJson ? (typeof item.modifiersJson === "string" ? JSON.parse(item.modifiersJson) : item.modifiersJson) : []);
                        if (!Array.isArray(mods) || mods.length === 0) return null;
                        return (
                          <div className="mt-1 pl-5 space-y-0.5">
                            {mods.map((m: any, mIdx: number) => (
                              <div key={mIdx} className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                                ↳ {m.isVariant ? `SIZE: ${m.name}` : `+ ${m.name}`}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
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

        </div>
      </div>

      {/* -- Modal Footer -- */}
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
            ) : btName ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Bluetooth className="w-3.5 h-3.5" /> Direct Bluetooth ({btName})
              </span>
            ) : (
              `ESC/POS ${paperWidth} System Print`
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
            onClick={() => handlePrint()}
            disabled={isPrinting || isPairingBt}
            className={`px-4.5 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75 ${
              isCancellation
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                : "bg-[#1B2A4A] hover:bg-[#2d4272] text-white shadow-[#1B2A4A]/20"
            }`}
          >
            {isPrinting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5" />
            )}
            <span>
              {isPrinting
                ? "Printing..."
                : isCancellation
                ? "Print Void Slip"
                : "Print KOT Ticket"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
