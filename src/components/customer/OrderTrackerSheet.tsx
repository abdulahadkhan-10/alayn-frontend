"use client";

import React from "react";
import { Banknote, Check, CircleAlert, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerPaymentClaims } from "@/lib/splitPayment";
import BottomSheet from "./BottomSheet";
import { ORDER_STEPS, formatRupees, orderStepIndex } from "./menuFormat";

/* eslint-disable @typescript-eslint/no-explicit-any -- the table's running order comes untyped from the public API */
interface OrderTrackerSheetProps {
  open: boolean;
  onClose: () => void;
  order: any;
  paymentClaims: CustomerPaymentClaims;
  canOrderMore: boolean;
}

/** Where the table's order is in the kitchen, what's on it, and how it's being paid */
export default function OrderTrackerSheet({ open, onClose, order, paymentClaims, canOrderMore }: OrderTrackerSheetProps) {
  if (!order) return null;
  const step = orderStepIndex(order.status);
  const cancelled = step === -1;
  const settled = order.status === "COMPLETED";
  const items: any[] = order.items || [];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={cancelled ? "Order cancelled" : settled ? "Bill settled" : ORDER_STEPS[step].label}
      description={`Order ${order.orderNumber || ""}${order.tableNumber ? ` · Table ${order.tableNumber}` : ""}`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-xl bg-(--espresso) text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#243556] active:scale-[0.98]"
        >
          {canOrderMore && !cancelled && !settled ? "Order more" : "Back to menu"}
        </button>
      }
    >
      <div className="mt-4 space-y-7">
        {cancelled ? (
          <p className="flex items-start gap-2.5 rounded-2xl bg-[#FDF2F3] px-4 py-3 text-sm text-[#8F1620]">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This order was cancelled by the restaurant. Please ask a member of staff if you have questions.
          </p>
        ) : (
          <ol aria-label="Order progress" className="relative space-y-5">
            {ORDER_STEPS.map((s, i) => {
              const done = i < step || settled;
              const current = i === step && !settled;
              return (
                <li key={s.key} className="relative flex gap-3.5" aria-current={current ? "step" : undefined}>
                  {i < ORDER_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn("absolute left-[11px] top-7 h-[calc(100%-4px)] w-0.5 rounded-full", done ? "bg-[#15803D]" : "bg-zinc-200")}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      done && "bg-[#15803D] text-white",
                      current && "bg-white ring-2 ring-[#15803D]",
                      !done && !current && "bg-white ring-2 ring-zinc-200"
                    )}
                  >
                    {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    {current && <span className="h-2 w-2 rounded-full bg-[#15803D] motion-safe:animate-pulse" />}
                  </span>
                  <div className="-mt-0.5">
                    <p className={cn("text-[15px]", done || current ? "font-semibold text-(--espresso)" : "text-(--muted)")}>{s.label}</p>
                    {current && <p className="text-[13px] text-(--muted)">{s.hint}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <PaymentStatus order={order} paymentClaims={paymentClaims} />

        <section>
          <h3 className="text-sm font-semibold text-(--espresso)">On your bill</h3>
          <ul className="mt-2 divide-y divide-zinc-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                <span className="min-w-0 text-(--espresso)">
                  <span className="tabular-nums text-(--muted)">{item.quantity} × </span>
                  {item.menuItem?.name || "Item"}
                </span>
                <span className="shrink-0 tabular-nums text-(--muted)">
                  {formatRupees(item.subtotalPaise ?? (item.unitPricePaise || 0) * (item.quantity || 1), { exact: true })}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-(--espresso)">
            <span>Total</span>
            <span className="tabular-nums">{formatRupees(order.totalPaise || 0, { exact: true })}</span>
          </div>
        </section>
      </div>
    </BottomSheet>
  );
}

function PaymentStatus({ order, paymentClaims }: { order: any; paymentClaims: CustomerPaymentClaims }) {
  const paid = order.paymentStatus === "PAID" || order.status === "COMPLETED";
  const Icon = paymentClaims.upi ? QrCode : Banknote;
  const title = paid ? "Paid" : paymentClaims.upi ? "UPI payment being checked" : "Pay at the counter";
  const detail = paid
    ? "Thank you, your bill is settled."
    : paymentClaims.upi
      ? paymentClaims.upiReferences.length > 0
        ? `UTR ${paymentClaims.upiReferences.join(", ")} · the cashier will confirm it`
        : "The cashier will confirm your payment"
      : "Pay by cash, card or UPI when you're done";
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-[#F4F5F8] px-4 py-3.5">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", paid ? "bg-[#15803D] text-white" : "bg-white text-(--espresso)")}>
        {paid ? <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" /> : <Icon className="h-5 w-5" aria-hidden="true" />}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-(--espresso)">{title}</p>
        <p className="break-words text-[13px] text-(--muted)">{detail}</p>
      </div>
    </div>
  );
}
