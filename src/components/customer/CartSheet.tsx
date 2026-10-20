"use client";

import React, { useId, useState } from "react";
import { Loader2, ReceiptText, ShoppingBag, SquarePen } from "lucide-react";
import type { CustomerMenuItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import BottomSheet from "./BottomSheet";
import type { CartModifierItem } from "./ItemOptionsSheet";
import { QuantityStepper } from "./MenuBits";
import { formatRupees, inputClass } from "./menuFormat";

export interface CartLine {
  cartItemId: string;
  item: CustomerMenuItem;
  quantity: number;
  notes?: string;
  selectedModifiers?: CartModifierItem[];
  unitPricePaise: number;
}

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  /** Price of the dishes in this round, before taxes */
  itemTotalPaise: number;
  /** The table already has a running bill this round is added to */
  addingToBill: boolean;
  onChangeQuantity: (cartItemId: string, delta: number) => void;
  onChangeNote: (cartItemId: string, note: string) => void;
  guestName: string;
  guestPhone: string;
  onGuestNameChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  tableNumber?: number;
  placing: boolean;
  onPlaceOrder: () => void;
}

export default function CartSheet(props: CartSheetProps) {
  const { open, onClose, lines, itemTotalPaise, addingToBill, placing, onPlaceOrder, tableNumber } = props;
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
              {placing ? "Sending to kitchen…" : addingToBill ? "Add to my order" : "Place order"}
            </span>
            <span className="tabular-nums">{formatRupees(itemTotalPaise, { exact: true })}</span>
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
          {!addingToBill && <GuestDetails {...props} />}
          <RoundSummary itemTotalPaise={itemTotalPaise} addingToBill={addingToBill} />
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

/** No taxes or payment here: they're worked out once, on the table's whole bill, when the diner is done */
function RoundSummary({ itemTotalPaise, addingToBill }: { itemTotalPaise: number; addingToBill: boolean }) {
  return (
    <section className="space-y-3">
      <div className="flex justify-between gap-4 text-base font-semibold text-(--espresso)">
        <span>Item total</span>
        <span className="tabular-nums">{formatRupees(itemTotalPaise, { exact: true })}</span>
      </div>
      <p className="flex gap-3 rounded-2xl bg-[#F4F5F8] px-4 py-3 text-[13px] leading-relaxed text-(--muted)">
        <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-(--espresso)" aria-hidden="true" />
        <span>
          {addingToBill ? "These dishes are added to your table's bill. " : "Order as many times as you like. "}
          Taxes are added once on the final bill, and you pay when you&apos;re done.
        </span>
      </p>
    </section>
  );
}
