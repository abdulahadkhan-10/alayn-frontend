"use client";

import React from "react";
import { Banknote, Check, CircleAlert, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import BottomSheet from "./BottomSheet";
import { ORDER_STEPS, formatRupees, orderStepIndex, tableBillStatus } from "./menuFormat";

/* eslint-disable @typescript-eslint/no-explicit-any -- the table's running order comes untyped from the public API */
interface TableBillSheetProps {
  open: boolean;
  onClose: () => void;
  order: any;
  canOrderMore: boolean;
  onPay: () => void;
}

const METHOD_TEXT = {
  UPI: { icon: QrCode, title: "UPI payment being checked" },
  CARD: { icon: CreditCard, title: "Paying by card at the counter" },
  CASH: { icon: Banknote, title: "Paying by cash at the counter" },
} as const;

/**
 * Everything the table has ordered, every round, on one bill with the taxes worked out once on the total.
 * Where the food is in the kitchen, and the way to ask for the bill and pay.
 */
export default function TableBillSheet({ open, onClose, order, canOrderMore, onPay }: TableBillSheetProps) {
  if (!order) return null;
  const step = orderStepIndex(order.status);
  const cancelled = step === -1;
  const settled = order.status === "COMPLETED";
  const items: any[] = order.items || [];
  const status = tableBillStatus(order);
  const canPay = !cancelled && !settled && status.duePaise > 0 && (!status.request || status.requestOutdated);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={cancelled ? "Order cancelled" : settled ? "Bill settled" : "Your bill"}
      description={[order.tableNumber ? `Table ${order.tableNumber}` : null, order.orderNumber ? `Order ${order.orderNumber}` : null].filter(Boolean).join(" · ")}
      footer={
        <div className="flex gap-3">
          {canOrderMore && !cancelled && !settled && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "h-12 rounded-xl border border-zinc-300 px-4 text-[15px] font-semibold text-(--espresso) transition-[transform,background-color] duration-150 ease-out hover:bg-zinc-50 active:scale-[0.98]",
                canPay ? "shrink-0" : "flex-1"
              )}
            >
              Order more
            </button>
          )}
          {canPay ? (
            <button
              type="button"
              onClick={onPay}
              className="flex h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-(--amber) px-4 text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#A91A24] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--amber)"
            >
              <span className="truncate">{status.requestOutdated ? "Pay new total" : "Pay bill"}</span>
              <span className="shrink-0 tabular-nums">{formatRupees(status.duePaise, { exact: true })}</span>
            </button>
          ) : (
            (!canOrderMore || cancelled || settled) && (
              <button
                type="button"
                onClick={onClose}
                className="h-12 flex-1 rounded-xl bg-(--espresso) text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#243556] active:scale-[0.98]"
              >
                Back to menu
              </button>
            )
          )}
        </div>
      }
    >
      <div className="mt-4 space-y-7">
        {cancelled ? (
          <p className="flex items-start gap-2.5 rounded-2xl bg-[#FDF2F3] px-4 py-3 text-sm text-[#8F1620]">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This order was cancelled by the restaurant. Please ask a member of staff if you have questions.
          </p>
        ) : (
          <KitchenProgress step={step} settled={settled} />
        )}

        {!cancelled && <PaymentStatus order={order} tableNumber={order.tableNumber} onChange={onPay} />}

        <section>
          <h3 className="text-sm font-semibold text-(--espresso)">Everything you&apos;ve ordered</h3>
          <ul className="mt-2 divide-y divide-zinc-100">
            {items.map((item) => {
              const removed = item.status === "CANCELLED";
              return (
                <li key={item.id} className={cn("flex items-baseline justify-between gap-4 py-2.5 text-sm", removed && "text-(--muted) line-through")}>
                  <span className={cn("min-w-0", !removed && "text-(--espresso)")}>
                    <span className="tabular-nums text-(--muted)">{item.quantity} × </span>
                    {item.menuItem?.name || "Item"}
                  </span>
                  <span className="shrink-0 tabular-nums text-(--muted)">
                    {formatRupees(item.subtotalPaise ?? (item.unitPricePaise || 0) * (item.quantity || 1), { exact: true })}
                  </span>
                </li>
              );
            })}
          </ul>
          <BillBreakdown order={order} paidPaise={status.paidPaise} duePaise={status.duePaise} />
        </section>
      </div>
    </BottomSheet>
  );
}

function KitchenProgress({ step, settled }: { step: number; settled: boolean }) {
  return (
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
  );
}

/** The bill as the cashier will print it: taxes once, on the whole table's food */
function BillBreakdown({ order, paidPaise, duePaise }: { order: any; paidPaise: number; duePaise: number }) {
  const rate = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? ` (${n}%)` : "";
  };
  const rows: [string, number][] = [["Item total", order.subtotalPaise || 0]];
  if (order.discountPaise > 0) rows.push(["Discount", -order.discountPaise]);
  if (order.serviceTaxPaise > 0) rows.push([`Service charge${rate(order.serviceChargeRate)}`, order.serviceTaxPaise]);
  if (order.cgstPaise > 0) rows.push([`CGST${rate(order.cgstRate)}`, order.cgstPaise]);
  if (order.sgstPaise > 0) rows.push([`SGST${rate(order.sgstRate)}`, order.sgstPaise]);
  if (order.roundOffPaise) rows.push(["Round off", order.roundOffPaise]);
  const signed = (paise: number) => `${paise < 0 ? "−" : ""}${formatRupees(Math.abs(paise), { exact: true })}`;

  return (
    <dl className="mt-2 space-y-2 border-t border-zinc-200 pt-3 text-sm">
      {rows.map(([label, paise]) => (
        <div key={label} className="flex justify-between gap-4 text-(--muted)">
          <dt>{label}</dt>
          <dd className="tabular-nums">{signed(paise)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 text-base font-semibold text-(--espresso)">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatRupees(order.totalPaise || 0, { exact: true })}</dd>
      </div>
      {paidPaise > 0 && duePaise > 0 && (
        <>
          <div className="flex justify-between gap-4 text-(--muted)">
            <dt>Paid</dt>
            <dd className="tabular-nums">−{formatRupees(paidPaise, { exact: true })}</dd>
          </div>
          <div className="flex justify-between gap-4 font-semibold text-(--espresso)">
            <dt>Still to pay</dt>
            <dd className="tabular-nums">{formatRupees(duePaise, { exact: true })}</dd>
          </div>
        </>
      )}
    </dl>
  );
}

function PaymentStatus({ order, tableNumber, onChange }: { order: any; tableNumber?: number; onChange: () => void }) {
  const status = tableBillStatus(order);
  const paid = order.status === "COMPLETED" || (status.totalPaise > 0 && status.duePaise === 0);
  const request = status.request;

  if (paid) {
    return (
      <StatusCard icon={<Check className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />} tone="done" title="Paid">
        Thank you, your bill is settled.
      </StatusCard>
    );
  }
  if (!request) return null;
  if (status.requestOutdated) {
    return (
      <StatusCard icon={<CircleAlert className="h-5 w-5" aria-hidden="true" />} tone="warn" title="Your bill has changed">
        You ordered more after asking for the bill. Choose how to pay the new total of {formatRupees(status.duePaise, { exact: true })}.
      </StatusCard>
    );
  }

  const { icon: Icon, title } = METHOD_TEXT[request.method] || METHOD_TEXT.CASH;
  return (
    <StatusCard icon={<Icon className="h-5 w-5" aria-hidden="true" />} tone="info" title={title}>
      {request.method === "UPI" && request.references.length > 0 && <>UTR {request.references.join(", ")}. </>}
      Go to the counter and ask for the bill for <span className="font-semibold text-(--espresso)">{tableNumber ? `Table ${tableNumber}` : `order ${order.orderNumber}`}</span>.
      {" "}
      {request.method === "UPI" ? "The cashier checks your payment and gives you the printed bill." : "The cashier prints it and takes your payment."}
      <button
        type="button"
        onClick={onChange}
        className="mt-2 block text-[13px] font-semibold text-(--espresso) underline decoration-zinc-300 underline-offset-4 hover:decoration-(--espresso)"
      >
        Pay another way
      </button>
    </StatusCard>
  );
}

function StatusCard({ icon, tone, title, children }: { icon: React.ReactNode; tone: "done" | "info" | "warn"; title: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3.5 rounded-2xl px-4 py-3.5", tone === "warn" ? "bg-[#FFF7E6]" : "bg-[#F4F5F8]")}>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone === "done" ? "bg-[#15803D] text-white" : tone === "warn" ? "bg-white text-[#B45309]" : "bg-white text-(--espresso)"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-(--espresso)">{title}</p>
        <div className="break-words text-[13px] leading-relaxed text-(--muted)">{children}</div>
      </div>
    </div>
  );
}
