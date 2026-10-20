"use client";

import React, { useId, useState } from "react";
import { Banknote, ExternalLink, Loader2, QrCode, ShoppingBag, SquarePen } from "lucide-react";
import type { CustomerMenuItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "../common/QRCodeSVG";
import BottomSheet from "./BottomSheet";
import type { CartModifierItem } from "./ItemOptionsSheet";
import { QuantityStepper } from "./MenuBits";
import { formatRupees } from "./menuFormat";

export interface CartLine {
  cartItemId: string;
  item: CustomerMenuItem;
  quantity: number;
  notes?: string;
  selectedModifiers?: CartModifierItem[];
  unitPricePaise: number;
}

export interface CartBill {
  subtotalPaise: number;
  serviceChargePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  roundOffPaise: number;
  totalPaise: number;
}

type PaymentChoice = "UPI" | "CASH";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  bill: CartBill;
  taxRates?: { cgstRate: number; sgstRate: number };
  onChangeQuantity: (cartItemId: string, delta: number) => void;
  onChangeNote: (cartItemId: string, note: string) => void;
  guestName: string;
  guestPhone: string;
  onGuestNameChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  upiAvailable: boolean;
  counterAvailable: boolean;
  payment: PaymentChoice;
  onPaymentChange: (value: PaymentChoice) => void;
  upiUrl: string;
  upiId: string;
  upiReference: string;
  onUpiReferenceChange: (value: string) => void;
  tableNumber?: number;
  placing: boolean;
  onPlaceOrder: () => void;
}

const inputClass =
  "block h-12 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-base text-(--espresso) placeholder:text-zinc-400 " +
  "transition-[border-color,box-shadow] focus:border-(--espresso) focus:outline-none focus:ring-3 focus:ring-[#1B2A4A]/10";

export default function CartSheet(props: CartSheetProps) {
  const { open, onClose, lines, bill, placing, onPlaceOrder, tableNumber } = props;
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Your order"
      description={`${tableNumber ? `Table ${tableNumber} · ` : ""}${itemCount} item${itemCount === 1 ? "" : "s"}`}
      footer={
        lines.length > 0 ? (
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={placing}
            aria-busy={placing}
            className={cn(
              "flex h-13 w-full items-center justify-between gap-3 rounded-xl bg-(--amber) px-5 text-base font-semibold text-white",
              "transition-[transform,background-color] duration-150 ease-out hover:bg-[#A91A24] active:scale-[0.98]",
              "disabled:cursor-wait disabled:opacity-80 disabled:active:scale-100",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--amber)"
            )}
          >
            <span className="flex items-center gap-2">
              {placing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {placing ? "Placing order…" : "Place order"}
            </span>
            <span className="tabular-nums">{formatRupees(bill.totalPaise, { exact: true })}</span>
          </button>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <p className="mt-4 text-base font-semibold text-(--espresso)">Your order is empty</p>
          <p className="mt-1 text-sm text-(--muted)">Add dishes from the menu to get started.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-11 rounded-xl border border-zinc-300 px-5 text-sm font-semibold text-(--espresso) transition-colors hover:bg-zinc-50"
          >
            Browse menu
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-7">
          <OrderLines {...props} />
          <GuestDetails {...props} />
          <PaymentChoiceSection {...props} />
          <BillSummary bill={bill} taxRates={props.taxRates} />
        </div>
      )}
    </BottomSheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-(--espresso)">{children}</h3>;
}

function OrderLines({ lines, onChangeQuantity, onChangeNote }: CartSheetProps) {
  const [editingNote, setEditingNote] = useState<string | null>(null);
  return (
    <ul className="divide-y divide-zinc-100">
      {lines.map((line) => {
        const editing = editingNote === line.cartItemId;
        return (
          <li key={line.cartItemId} className="py-4 first:pt-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-snug text-(--espresso)">{line.item.name}</p>
                {line.selectedModifiers && line.selectedModifiers.length > 0 && (
                  <p className="mt-0.5 text-[13px] leading-snug text-(--muted)">
                    {line.selectedModifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium tabular-nums text-(--espresso)">
                  {formatRupees(line.unitPricePaise * line.quantity)}
                </p>
              </div>
              <QuantityStepper
                value={line.quantity}
                onDecrement={() => onChangeQuantity(line.cartItemId, -1)}
                onIncrement={() => onChangeQuantity(line.cartItemId, 1)}
                label={line.item.name}
                size="sm"
              />
            </div>

            {editing ? (
              <div className="mt-3">
                <label htmlFor={`note-${line.cartItemId}`} className="sr-only">
                  Cooking note for {line.item.name}
                </label>
                <textarea
                  id={`note-${line.cartItemId}`}
                  rows={2}
                  maxLength={200}
                  autoFocus
                  value={line.notes || ""}
                  onChange={(e) => onChangeNote(line.cartItemId, e.target.value)}
                  onBlur={() => setEditingNote(null)}
                  placeholder="e.g. less spicy, no onion"
                  className={cn(inputClass, "h-auto resize-none py-2.5")}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingNote(line.cartItemId)}
                className="mt-2 inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg text-left text-[13px] font-medium text-(--muted) transition-colors hover:text-(--espresso)"
              >
                <SquarePen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{line.notes?.trim() ? `Note: ${line.notes.trim()}` : "Add cooking note"}</span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function GuestDetails({ guestName, guestPhone, onGuestNameChange, onGuestPhoneChange }: CartSheetProps) {
  const nameId = useId();
  const phoneId = useId();
  return (
    <section className="space-y-3">
      <div>
        <SectionTitle>Your details</SectionTitle>
        <p className="mt-0.5 text-[13px] text-(--muted)">Optional, so staff can find you and send your bill.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-[13px] font-medium text-(--espresso)">
            Name
          </label>
          <input id={nameId} type="text" autoComplete="name" maxLength={100} value={guestName} onChange={(e) => onGuestNameChange(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor={phoneId} className="mb-1.5 block text-[13px] font-medium text-(--espresso)">
            Mobile number
          </label>
          <input
            id={phoneId}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={guestPhone}
            onChange={(e) => onGuestPhoneChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  );
}

function PaymentChoiceSection(props: CartSheetProps) {
  const { upiAvailable, counterAvailable, payment, onPaymentChange, upiUrl, upiId, upiReference, onUpiReferenceChange, bill } = props;
  const [showQr, setShowQr] = useState(false);
  const utrId = useId();
  const options: { value: PaymentChoice; title: string; detail: string; icon: React.ElementType; available: boolean }[] = [
    { value: "UPI", title: "Pay now with UPI", detail: "GPay, PhonePe, Paytm or any UPI app", icon: QrCode, available: upiAvailable },
    { value: "CASH", title: "Pay at the counter", detail: "Cash, card or UPI when you leave", icon: Banknote, available: counterAvailable },
  ];
  const visible = options.filter((o) => o.available);

  return (
    <section className="space-y-3">
      <SectionTitle>Payment</SectionTitle>
      <div role="radiogroup" aria-label="Payment" className="space-y-2.5">
        {visible.map(({ value, title, detail, icon: Icon }) => {
          const checked = payment === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onPaymentChange(value)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-[border-color,background-color]",
                checked ? "border-(--espresso) bg-[#F4F5F8] ring-1 ring-(--espresso)" : "border-zinc-200 hover:border-zinc-300",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--espresso)"
              )}
            >
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", checked ? "bg-(--espresso) text-white" : "bg-zinc-100 text-zinc-600")}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-(--espresso)">{title}</span>
                <span className="block text-[13px] text-(--muted)">{detail}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", checked ? "border-(--espresso)" : "border-zinc-300")}
              >
                {checked && <span className="h-2.5 w-2.5 rounded-full bg-(--espresso)" />}
              </span>
            </button>
          );
        })}
      </div>

      {payment === "UPI" && upiUrl && (
        <div className="space-y-4 rounded-2xl bg-[#F4F5F8] p-4">
          <ol className="space-y-4">
            <li className="flex gap-3">
              <StepNumber n={1} />
              <div className="min-w-0 flex-1 space-y-2.5">
                <p className="text-sm text-(--espresso)">
                  Pay <span className="font-semibold tabular-nums">{formatRupees(bill.totalPaise, { exact: true })}</span> to the restaurant
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
                  The 12-digit number in your UPI app after paying. It helps the cashier match your payment.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <StepNumber n={3} />
              <p className="pt-0.5 text-sm text-(--espresso)">Place your order below. The restaurant confirms your payment before your bill is closed.</p>
            </li>
          </ol>
        </div>
      )}

      {payment === "CASH" && (
        <p className="rounded-2xl bg-[#F4F5F8] px-4 py-3 text-[13px] leading-relaxed text-(--muted)">
          Your order goes to the kitchen now. Pay at the counter when you&apos;re done.
        </p>
      )}
    </section>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-(--espresso) ring-1 ring-zinc-200">
      {n}
    </span>
  );
}

function BillSummary({ bill, taxRates }: { bill: CartBill; taxRates?: { cgstRate: number; sgstRate: number } }) {
  const rows: [string, number][] = [["Item total", bill.subtotalPaise]];
  if (bill.serviceChargePaise > 0) rows.push(["Service charge", bill.serviceChargePaise]);
  if (bill.cgstPaise > 0) rows.push([`CGST${taxRates ? ` (${taxRates.cgstRate}%)` : ""}`, bill.cgstPaise]);
  if (bill.sgstPaise > 0) rows.push([`SGST${taxRates ? ` (${taxRates.sgstRate}%)` : ""}`, bill.sgstPaise]);
  return (
    <section className="space-y-3">
      <SectionTitle>Bill details</SectionTitle>
      <dl className="space-y-2 text-sm">
        {rows.map(([label, paise]) => (
          <div key={label} className="flex justify-between gap-4 text-(--muted)">
            <dt>{label}</dt>
            <dd className="tabular-nums">{formatRupees(paise, { exact: true })}</dd>
          </div>
        ))}
        {bill.roundOffPaise !== 0 && (
          <div className="flex justify-between gap-4 text-(--muted)">
            <dt>Round off</dt>
            <dd className="tabular-nums">
              {bill.roundOffPaise > 0 ? "+" : "−"}
              {formatRupees(Math.abs(bill.roundOffPaise), { exact: true })}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 text-base font-semibold text-(--espresso)">
          <dt>To pay</dt>
          <dd className="tabular-nums">{formatRupees(bill.totalPaise, { exact: true })}</dd>
        </div>
      </dl>
    </section>
  );
}
