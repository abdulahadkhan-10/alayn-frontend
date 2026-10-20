"use client";

import React, { useId, useState } from "react";
import { Banknote, Check, CreditCard, ExternalLink, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "../common/QRCodeSVG";
import BottomSheet from "./BottomSheet";
import { formatRupees, inputClass, type BillPaymentMethod } from "./menuFormat";

interface PayBillSheetProps {
  open: boolean;
  onClose: () => void;
  amountDuePaise: number;
  tableNumber?: number;
  orderNumber?: string;
  upiAvailable: boolean;
  counterAvailable: boolean;
  /** upi:// link for the amount due ("" when UPI isn't set up) */
  upiUrl: string;
  upiId: string;
  /** Resolves true once the restaurant has the request */
  onRequestBill: (method: BillPaymentMethod, upiReference: string) => Promise<boolean>;
}

const OPTIONS: { value: BillPaymentMethod; title: string; detail: string; icon: React.ElementType; counter: boolean }[] = [
  { value: "UPI", title: "UPI", detail: "Pay now from your phone", icon: QrCode, counter: false },
  { value: "CARD", title: "Card", detail: "Pay at the counter", icon: CreditCard, counter: true },
  { value: "CASH", title: "Cash", detail: "Pay at the counter", icon: Banknote, counter: true },
];

/**
 * The diner is done: they pick how to pay the table's whole bill. UPI is paid here from their phone;
 * card and cash are paid at the counter. Either way they collect the printed bill from the cashier,
 * who confirms the payment.
 */
export default function PayBillSheet(props: PayBillSheetProps) {
  const { open, onClose, amountDuePaise, tableNumber, orderNumber, upiAvailable, counterAvailable, onRequestBill } = props;
  const options = OPTIONS.filter((o) => (o.counter ? counterAvailable : upiAvailable));
  const [method, setMethod] = useState<BillPaymentMethod>(options[0]?.value ?? "CASH");
  const [upiReference, setUpiReference] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<BillPaymentMethod | null>(null);
  const chosen = options.some((o) => o.value === method) ? method : options[0]?.value ?? "CASH";
  const where = tableNumber ? `Table ${tableNumber}` : `order ${orderNumber || ""}`.trim();

  const submit = async () => {
    if (sending) return;
    setSending(true);
    try {
      if (await onRequestBill(chosen, upiReference.trim())) setSent(chosen);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Bill requested"
        footer={
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-xl bg-(--espresso) text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#243556] active:scale-[0.98]"
          >
            Done
          </button>
        }
      >
        <div className="mt-2 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#15803D] text-white">
            <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <p className="mt-5 text-[15px] leading-relaxed text-(--muted)">Now go to the counter and tell the cashier</p>
          <p className="mt-2 rounded-2xl bg-[#F4F5F8] px-5 py-3 font-heading text-xl font-bold text-(--espresso)">
            &ldquo;Bill for {where}, please&rdquo;
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-(--muted)">
            {sent === "UPI"
              ? "They'll check your UPI payment and hand you the printed bill."
              : `They'll print your bill for ${formatRupees(amountDuePaise, { exact: true })} and take your ${sent === "CARD" ? "card" : "cash"} payment.`}
          </p>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Pay bill"
      description={`${tableNumber ? `Table ${tableNumber} · ` : ""}${formatRupees(amountDuePaise, { exact: true })} including taxes`}
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={sending || options.length === 0}
          aria-busy={sending}
          className={cn(
            "flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-(--amber) px-5 text-base font-semibold text-white",
            "transition-[transform,background-color] duration-150 ease-out hover:bg-[#A91A24] active:scale-[0.98]",
            "disabled:cursor-wait disabled:opacity-80 disabled:active:scale-100",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--amber)"
          )}
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {sending ? "Sending…" : chosen === "UPI" ? "I've paid · get my bill" : "Request bill"}
        </button>
      }
    >
      <div className="mt-4 space-y-5">
        <div role="radiogroup" aria-label="How would you like to pay?" className={cn("grid gap-2.5", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {options.map(({ value, title, detail, icon: Icon }) => {
            const checked = chosen === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setMethod(value)}
                className={cn(
                  "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-[border-color,background-color]",
                  checked ? "border-(--espresso) bg-[#F4F5F8] ring-1 ring-(--espresso)" : "border-zinc-200 hover:border-zinc-300",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--espresso)"
                )}
              >
                <Icon className={cn("h-6 w-6", checked ? "text-(--espresso)" : "text-zinc-500")} aria-hidden="true" />
                <span className="text-[15px] font-semibold text-(--espresso)">{title}</span>
                <span className="text-[12px] leading-tight text-(--muted)">{detail}</span>
              </button>
            );
          })}
        </div>

        {chosen === "UPI" ? (
          <UpiSteps {...props} upiReference={upiReference} onUpiReferenceChange={setUpiReference} />
        ) : (
          <p className="rounded-2xl bg-[#F4F5F8] px-4 py-3 text-[13px] leading-relaxed text-(--muted)">
            We&apos;ll let the staff know. Then go to the counter, ask for the bill for {where}, and pay by {chosen === "CARD" ? "card" : "cash"}. You&apos;ll get a printed bill.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

function UpiSteps({
  upiUrl,
  upiId,
  amountDuePaise,
  upiReference,
  onUpiReferenceChange,
}: PayBillSheetProps & { upiReference: string; onUpiReferenceChange: (value: string) => void }) {
  const [showQr, setShowQr] = useState(false);
  const utrId = useId();
  if (!upiUrl) return null;
  return (
    <ol className="space-y-4 rounded-2xl bg-[#F4F5F8] p-4">
      <li className="flex gap-3">
        <StepNumber n={1} />
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="text-sm text-(--espresso)">
            Pay <span className="font-semibold tabular-nums">{formatRupees(amountDuePaise, { exact: true })}</span> to the restaurant
          </p>
          <a
            href={upiUrl}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--espresso) text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#243556] active:scale-[0.98] sm:hidden"
          >
            Open UPI app <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            aria-expanded={showQr}
            className="text-[13px] font-medium text-(--espresso) underline decoration-zinc-300 underline-offset-4 hover:decoration-(--espresso) sm:hidden"
          >
            {showQr ? "Hide QR code" : "Paying from another phone? Show QR code"}
          </button>
          <div className={cn("items-center gap-4 rounded-xl bg-white p-3", showQr ? "flex" : "hidden sm:flex")}>
            <QRCodeSVG value={upiUrl} size={132} fgColor="#1B2A4A" />
            <div className="min-w-0 text-[13px] text-(--muted)">
              <p>Scan with any UPI app</p>
              <p className="mt-1 break-all font-mono text-xs text-(--espresso)">{upiId}</p>
            </div>
          </div>
        </div>
      </li>
      <li className="flex gap-3">
        <StepNumber n={2} />
        <div className="min-w-0 flex-1">
          <label htmlFor={utrId} className="block text-sm text-(--espresso)">
            UPI reference number (UTR) <span className="text-(--muted)">· optional</span>
          </label>
          <input
            id={utrId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={30}
            value={upiReference}
            onChange={(e) => onUpiReferenceChange(e.target.value)}
            aria-describedby={`${utrId}-help`}
            className={cn(inputClass, "mt-1.5 font-mono tracking-wide")}
          />
          <p id={`${utrId}-help`} className="mt-1.5 text-[13px] leading-snug text-(--muted)">
            The 12-digit number in your UPI app after paying. It helps the cashier find your payment.
          </p>
        </div>
      </li>
      <li className="flex gap-3">
        <StepNumber n={3} />
        <p className="pt-0.5 text-sm text-(--espresso)">Tap below, then collect your printed bill at the counter.</p>
      </li>
    </ol>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-(--espresso) ring-1 ring-zinc-200">
      {n}
    </span>
  );
}
