"use client";

import React, { useRef, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X, CheckCircle, Download, Share2, Utensils, CreditCard, Smartphone } from "lucide-react";

export interface ThermalReceiptProps {
  order: {
    id: string;
    orderNumber?: string;
    orderNo?: string;
    tableNumber?: number | null;
    tableNo?: number | null;
    source?: string;
    status?: string;
    createdAt: string;
    subtotalPaise?: number;
    subtotal?: number;
    cgstPaise?: number;
    sgstPaise?: number;
    serviceTaxPaise?: number;
    taxPaise?: number;
    taxAmount?: number;
    totalPaise?: number;
    totalAmount?: number;
    discountAmount?: number;
    discountPaise?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    serviceTaxAmount?: number;
    placedByName?: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod?: string;
    payments?: Array<{ amountPaise: number; method: string; status: string }>;
    items?: Array<{
      id?: string;
      quantity: number;
      unitPricePaise?: number;
      subtotalPaise?: number;
      notes?: string;
      menuItem?: { name: string; price?: number; pricePaise?: number };
      menuItemName?: string;
    }>;
    orderItems?: Array<{
      id?: string;
      quantity: number;
      unitPricePaise?: number;
      subtotalPaise?: number;
      notes?: string;
      menuItem?: { name: string; price?: number; pricePaise?: number };
    }>;
    outlet?: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      phone?: string;
      gstin?: string;
      receiptTagline?: string;
      receiptFooter?: string;
      upiId?: string;
      cgstRateDecimal?: number | string;
      sgstRateDecimal?: number | string;
      serviceTaxRateDecimal?: number | string;
    };
  };
  onClose?: () => void;
}

export default function ThermalReceipt({ order, onClose }: ThermalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rollStarted, setRollStarted] = useState(false);

  // Trigger roll animation after first paint
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setRollStarted(true), 60);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Safely unwraps order if nested under { data: ... }
  const actualOrder = (order as any)?.data || order || {};

  // Normalize order values
  const billNo =
    actualOrder.orderNumber ||
    actualOrder.orderNo ||
    (actualOrder.id ? String(actualOrder.id).slice(0, 8).toUpperCase() : "BILL-1001");
  const itemsList = actualOrder.items || actualOrder.orderItems || [];

  const outletName = actualOrder.outlet?.name || "ALAYN CAFE & RESTO";
  const outletAddress = actualOrder.outlet?.address
    ? `${actualOrder.outlet.address}${actualOrder.outlet.city ? `, ${actualOrder.outlet.city}` : ""}`
    : "";
  const outletPhone = actualOrder.outlet?.phone || "";
  const outletGstin = actualOrder.outlet?.gstin || "";
  const tagline = actualOrder.outlet?.receiptTagline || "";
  const footerMessage = actualOrder.outlet?.receiptFooter || "Thank you for dining with us!\nWe hope to see you again soon.";
  const upiVpa = actualOrder.outlet?.upiId || "merchant@upi";

  const orderDate = actualOrder.createdAt ? new Date(actualOrder.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const formattedTime = orderDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const tableDisplay = actualOrder.tableNumber || actualOrder.tableNo;
  const orderSourceDisplay = tableDisplay
    ? `Dine In — Table ${tableDisplay}`
    : actualOrder.source === "COUNTER" || actualOrder.source === "POS"
      ? "Counter / POS"
      : actualOrder.source || "Counter Direct";

  const cashierName = actualOrder.placedByName || "Staff";
  const customerName = actualOrder.customerName || "";
  const customerPhone = actualOrder.customerPhone || "";

  // Financial math (in Rupees)
  const subtotalRupees = actualOrder.subtotalPaise !== undefined
    ? actualOrder.subtotalPaise / 100
    : actualOrder.subtotal !== undefined
      ? Number(actualOrder.subtotal)
      : 0;

  const discountRupees = actualOrder.discountPaise !== undefined
    ? actualOrder.discountPaise / 100
    : actualOrder.discountAmount !== undefined
      ? Number(actualOrder.discountAmount)
      : 0;

  const grandTotalRupees = actualOrder.totalPaise !== undefined
    ? actualOrder.totalPaise / 100
    : actualOrder.totalAmount !== undefined
      ? Number(actualOrder.totalAmount)
      : 0;

  const cgstRupees = actualOrder.cgstPaise !== undefined
    ? actualOrder.cgstPaise / 100
    : actualOrder.cgstAmount !== undefined
      ? Number(actualOrder.cgstAmount)
      : (subtotalRupees * 0.025);

  const sgstRupees = actualOrder.sgstPaise !== undefined
    ? actualOrder.sgstPaise / 100
    : actualOrder.sgstAmount !== undefined
      ? Number(actualOrder.sgstAmount)
      : (subtotalRupees * 0.025);

  const serviceTaxRupees = actualOrder.serviceTaxPaise !== undefined
    ? actualOrder.serviceTaxPaise / 100
    : actualOrder.serviceTaxAmount !== undefined
      ? Number(actualOrder.serviceTaxAmount)
      : 0;

  const cgstRate = actualOrder.outlet?.cgstRateDecimal !== undefined
    ? Number(actualOrder.outlet.cgstRateDecimal)
    : subtotalRupees > 0 ? Number(((cgstRupees / subtotalRupees) * 100).toFixed(1)) : 2.5;

  const sgstRate = actualOrder.outlet?.sgstRateDecimal !== undefined
    ? Number(actualOrder.outlet.sgstRateDecimal)
    : subtotalRupees > 0 ? Number(((sgstRupees / subtotalRupees) * 100).toFixed(1)) : 2.5;

  const serviceTaxRate = actualOrder.outlet?.serviceTaxRateDecimal !== undefined
    ? Number(actualOrder.outlet.serviceTaxRateDecimal)
    : subtotalRupees > 0 && serviceTaxRupees > 0 ? Number(((serviceTaxRupees / subtotalRupees) * 100).toFixed(1)) : 0;

  const totalQty = itemsList.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0);

  const isPaid = actualOrder.status === "COMPLETED" ||
    (actualOrder.payments && actualOrder.payments.some((p: any) => p.status === "CONFIRMED"));
  const paymentMethodLabel = actualOrder.paymentMethod || actualOrder.payments?.[0]?.method || "CASH";

  // Dynamic UPI Payment QR String
  const upiPaymentUrl = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(outletName)}&am=${grandTotalRupees.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill ${billNo}`)}`;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=400,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice — ${billNo} | ${outletName}</title>
          <meta charset="UTF-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: 80mm auto; margin: 0mm; }
            @media print {
              html, body {
                width: 78mm;
                margin: 0 auto;
                padding: 0;
                background: #fff;
                color: #000;
              }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 78mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              color: #000;
              background: #fff;
            }
            /* Override tailwind text colors for high contrast thermal print */
            * {
              color: #000 !important;
            }
            .border-gray-300, .border-gray-400, .border-gray-500, .border-gray-600 {
              border-color: #000 !important;
            }
          </style>
        </head>
        <body class="bg-white">
          ${content.innerHTML}
          <script>
            // Wait for Tailwind to process
            setTimeout(() => {
              window.print();
              window.close();
            }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden" style={{ maxHeight: "90vh" }}>

      {/* ── Clean Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Printer className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-900 font-bold text-sm leading-tight">Tax Invoice Preview</p>
              {isPaid && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PAID ({paymentMethodLabel})
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] font-mono mt-0.5">
              Bill #{billNo} • {formattedDate}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Success Toast ── */}
      {showSuccess && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Print job sent to thermal printer
        </div>
      )}

      {/* ── Thermal Receipt Paper Preview ── */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-100 to-gray-200 px-5 pb-5 pt-0 flex justify-center">

        {/* Paper with roll-out animation */}
        <div className="relative w-[296px]">
          {/* Printer machine slot — the physical "mouth" the paper exits from */}
          <div
            className="relative h-[22px] overflow-hidden sticky top-0 z-10"
            style={{
              background: "linear-gradient(to bottom, #0d0d0d 0%, #2a2a2a 55%, #1a1a1a 100%)",
              boxShadow: "0 3px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            {/* Slot opening — narrow dark gap */}
            <div
              className="absolute inset-x-4 bottom-0 h-[5px] rounded-t"
              style={{ background: "rgba(0,0,0,0.85)", boxShadow: "inset 0 2px 6px rgba(0,0,0,1)" }}
            />
            {/* Scanning light sweep */}
            {rollStarted && (
              <div
                className="absolute top-2 w-12 h-[2px] rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.9), transparent)",
                  animation: "printer-light-sweep 3500ms linear forwards",
                }}
              />
            )}
          </div>

          {/* Clip mask — overflow:hidden gates what's visible of the paper */}
          <div style={{ overflow: "hidden" }}>
            {/* The paper itself — slides down from -100% to 0 */}
            <div
              style={{
                transform: rollStarted ? "translateY(0)" : "translateY(-100%)",
                transition: rollStarted ? "transform 3500ms cubic-bezier(0.12, 0.8, 0.3, 1)" : "none",
                willChange: "transform",
              }}
            >
            {/* Inner receipt content with ref for printing */}
            <div
              ref={receiptRef}
              className="bg-white text-black w-[296px] px-5 pb-6 select-text"
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            >
            {/* ── STORE HEADER ── */}
            <div className="text-center pt-4 pb-2 space-y-0.5">
              <h2 className="text-[17px] font-black tracking-tight uppercase leading-none">{outletName}</h2>
              {tagline && <p className="text-[10.5px] italic font-medium mt-1">{tagline}</p>}
              {outletAddress && <p className="text-[10px] mt-0.5">{outletAddress}</p>}
              {outletPhone && <p className="text-[10.5px]">Mob: {outletPhone}</p>}
              {outletGstin && (
                <p className="text-[10.5px] font-bold mt-1">GSTIN: {outletGstin}</p>
              )}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* ── ORDER META ── */}
            <div className="text-[10.5px] space-y-1 mb-2 mt-2">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-bold">{formattedDate} {formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-bold">{orderSourceDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span className="font-bold">{cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Bill No:</span>
                <span className="font-black">{billNo}</span>
              </div>
              {(customerName || customerPhone) && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold text-right">
                    {customerName || "Guest"} {customerPhone ? `(${customerPhone})` : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* ── ITEMS HEADER ── */}
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider border-b border-black pb-1 mb-2 mt-2">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-12 text-right">Price</span>
              <span className="w-16 text-right">Amount</span>
            </div>

            {/* ── ITEMS LIST ── */}
            <div className="space-y-1.5 mb-2">
              {itemsList.map((item: any, idx: number) => {
                const name = item.menuItem?.name || item.menuItemName || "Menu Item";
                const qty = item.quantity || 1;
                const unitPrice = item.unitPricePaise !== undefined
                  ? item.unitPricePaise / 100
                  : item.menuItem?.pricePaise
                    ? item.menuItem.pricePaise / 100
                    : item.menuItem?.price || 0;
                const lineAmount = item.subtotalPaise !== undefined
                  ? item.subtotalPaise / 100
                  : (unitPrice * qty);

                return (
                  <div key={idx}>
                    <div className="flex justify-between text-[11px] items-start">
                      <span className="flex-1 pr-1 font-bold leading-tight">{name}</span>
                      <span className="w-8 text-center">{qty}</span>
                      <span className="w-12 text-right">{unitPrice.toFixed(2)}</span>
                      <span className="w-16 text-right font-black">{lineAmount.toFixed(2)}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[10px] pl-2 mt-0.5 italic flex items-start gap-1">
                        <span>↳</span> <span className="leading-tight">{item.notes}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* ── TOTALS ── */}
            <div className="space-y-1 text-[11px] mt-2">
              <div className="flex justify-between font-bold">
                <span>Sub Total ({totalQty} items)</span>
                <span>₹{subtotalRupees.toFixed(2)}</span>
              </div>

              {discountRupees > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>- ₹{discountRupees.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>CGST @ {cgstRate}%</span>
                <span>₹{cgstRupees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST @ {sgstRate}%</span>
                <span>₹{sgstRupees.toFixed(2)}</span>
              </div>
              {serviceTaxRupees > 0 && (
                <div className="flex justify-between">
                  <span>Service Tax {serviceTaxRate > 0 ? `@ ${serviceTaxRate}%` : ""}</span>
                  <span>₹{serviceTaxRupees.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-black my-2" />

            {/* ── GRAND TOTAL ── */}
            <div className="flex justify-between items-center text-[16px] font-black py-1">
              <span>GRAND TOTAL</span>
              <span>₹{grandTotalRupees.toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* ── PAYMENT STATUS ── */}
            <div className="text-center py-2">
              {isPaid ? (
                <div className="inline-block border-2 border-black px-4 py-1 text-[12px] font-black uppercase tracking-widest bg-black text-white">
                  ✓ PAID — {paymentMethodLabel}
                </div>
              ) : (
                <div className="inline-block border-2 border-dashed border-black px-4 py-1 text-[12px] font-bold uppercase tracking-wider">
                  PAYMENT PENDING
                </div>
              )}
            </div>

            {/* ── FOOTER MESSAGE ── */}
            <div className="text-center text-[11px] my-3 whitespace-pre-line leading-relaxed border-t border-dashed border-black pt-3 font-bold">
              {footerMessage}
            </div>

            {/* ── UPI QR CODE ── */}
            <div className="flex flex-col items-center mt-2 pt-2 border-t border-dashed border-black">
              <div className="p-1 border border-black rounded-sm bg-white inline-block">
                <QRCodeSVG value={upiPaymentUrl} size={88} level="M" />
              </div>
              <p className="text-[10px] font-bold mt-1.5 text-center text-black">
                Scan & Pay via UPI
              </p>
              <p className="text-[9px] font-medium mt-0.5">{upiVpa}</p>
            </div>

            {/* ── BOTTOM SPACING ── */}
            <div className="mt-4 text-center text-[9px] tracking-widest font-bold">
              — ALAYN POS —
            </div>
          </div>{/* end receiptRef div */}
            </div>{/* end translateY sliding div */}

            {/* Perforated bottom edge */}
            <div className="h-3 bg-white" style={{
              backgroundImage: "radial-gradient(circle at 8px 100%, transparent 5px, white 6px)",
              backgroundSize: "16px 10px",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "0 bottom",
            }} />

          </div>{/* end overflow:hidden clip mask */}


          {/* Paper drop shadow */}
          <div className="absolute inset-x-2 -bottom-2 h-4 bg-black/10 blur-md rounded-full -z-10" />
        </div>
      </div>

      {/* ── Clean Footer Action Bar ── */}
      <div className="shrink-0 bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Smartphone className="w-3.5 h-3.5" />
          80mm Standard Thermal Format
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
