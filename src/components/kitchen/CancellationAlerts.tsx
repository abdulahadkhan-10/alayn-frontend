"use client";

import React from "react";
import { Ban, Check, MinusCircle, type LucideIcon } from "lucide-react";

// Cancel alerts stay on the kitchen screen for 3 minutes
export const CANCEL_RETENTION_SECONDS = 180;

type Tone = "rose" | "amber";

const TONES: Record<Tone, { stripe: string; icon: string; ring: string; badge: string }> = {
  rose: {
    stripe: "bg-rose-600",
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    ring: "stroke-rose-500",
    badge: "bg-rose-600",
  },
  amber: {
    stripe: "bg-amber-500",
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    ring: "stroke-amber-500",
    badge: "bg-amber-500",
  },
};

interface Modifier {
  name?: string;
  title?: string;
}
interface KitchenItem {
  id?: string;
  quantity?: number;
  cancelledQuantity?: number;
  kotNo?: number;
  menuItemName?: string;
  menuItem?: { name?: string } | null;
  modifiers?: Modifier[];
  modifiersJson?: string | Modifier[] | null;
}
interface KitchenTicket {
  id: string;
  orderNo?: string | null;
  orderNumber?: string | null;
  tableNo?: number | string | null;
  tableNumber?: number | string | null;
}

const itemName = (item: KitchenItem) => item.menuItem?.name || item.menuItemName || "Item";

function modifierNames(item: KitchenItem): string[] {
  let list: Modifier[] = [];
  if (Array.isArray(item.modifiers) && item.modifiers.length > 0) list = item.modifiers;
  else if (item.modifiersJson) {
    try {
      const parsed = typeof item.modifiersJson === "string" ? JSON.parse(item.modifiersJson) : item.modifiersJson;
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      // Unreadable modifiers: show the dish without them
    }
  }
  return list.map((m) => m.name || m.title || "Extra");
}

/** "#0003": the last 4 digits of the order number, the same digits the voice alert reads out. */
function shortOrderNo(ticket: KitchenTicket): string {
  const full = String(ticket.orderNo || ticket.orderNumber || "");
  const digits = full.replace(/\D/g, "").slice(-4);
  return digits ? `#${digits}` : `#${ticket.id.slice(0, 6)}`;
}

function Countdown({ remainingSeconds, tone }: { remainingSeconds: number; tone: Tone }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, remainingSeconds / CANCEL_RETENTION_SECONDS));
  const label = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 tabular-nums shrink-0" title="Clears automatically">
      <svg viewBox="0 0 24 24" className="h-5 w-5 -rotate-90" aria-hidden="true">
        <circle cx="12" cy="12" r={radius} fill="none" strokeWidth="3" className="stroke-gray-200" />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className={`${TONES[tone].ring} transition-[stroke-dashoffset] duration-1000 ease-linear`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      {label}
    </div>
  );
}

function TicketHeading({ ticket, kotNo }: { ticket: KitchenTicket; kotNo?: number }) {
  const table = ticket.tableNo || ticket.tableNumber;
  return (
    <div className="min-w-0">
      <p className="text-lg font-bold text-[#1B2A4A] leading-tight truncate">{table ? `Table ${table}` : "Counter"}</p>
      <p className="text-xs text-gray-500 mt-0.5 tabular-nums" title={String(ticket.orderNo || ticket.orderNumber || "")}>
        Order {shortOrderNo(ticket)}
        {kotNo && kotNo > 1 ? ` · KOT ${kotNo}` : ""}
      </p>
    </div>
  );
}

function AcknowledgeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-auto w-full h-10 rounded-xl bg-[#1B2A4A] hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A4A] focus-visible:ring-offset-2"
    >
      <Check className="h-4 w-4" />
      Acknowledge
    </button>
  );
}

function AlertTray({
  tone,
  icon: Icon,
  title,
  count,
  noun,
  children,
}: {
  tone: Tone;
  icon: LucideIcon;
  title: string;
  count: number;
  noun: string;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <section
      role="alert"
      className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${t.stripe}`} aria-hidden="true" />
      <header className="flex items-center justify-between gap-3 pl-6 pr-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${t.icon}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#1B2A4A] leading-tight">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {count} {noun}
              {count === 1 ? "" : "s"} · clears automatically after 3 minutes
            </p>
          </div>
        </div>
        <span className={`h-7 min-w-7 px-2 rounded-full ${t.badge} text-white text-sm font-bold flex items-center justify-center tabular-nums`}>
          {count}
        </span>
      </header>
      <div className="grid gap-3 pl-6 pr-5 pb-5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">{children}</div>
    </section>
  );
}

const cardClass = "bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

/* ── Whole orders cancelled ── */

export interface CancelledOrderEntry {
  ticket: KitchenTicket;
  items: KitchenItem[];
  remainingSeconds: number;
}

export function CancelledOrdersTray({ entries, onAcknowledge }: { entries: CancelledOrderEntry[]; onAcknowledge: (id: string) => void }) {
  return (
    <AlertTray tone="rose" icon={Ban} title="Order cancelled — stop preparing" count={entries.length} noun="order">
      {entries.map(({ ticket, items, remainingSeconds }) => (
        <article key={ticket.id} className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <TicketHeading ticket={ticket} />
            <Countdown remainingSeconds={remainingSeconds} tone="rose" />
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">Do not cook</p>
            {items.length === 0 ? (
              <p className="py-1.5 text-sm text-gray-500">No items left on this order</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const mods = modifierNames(item);
                  return (
                    <li key={item.id || idx} className="flex items-start gap-3 py-1.5">
                      <span className="shrink-0 h-6 min-w-8 px-1.5 rounded-md bg-white border border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center tabular-nums">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-semibold text-gray-800 line-through decoration-rose-500/60 decoration-2 truncate">
                          {itemName(item)}
                        </p>
                        {mods.length > 0 && <p className="text-xs text-gray-500 truncate">{mods.join(", ")}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <AcknowledgeButton onClick={() => onAcknowledge(ticket.id)} />
        </article>
      ))}
    </AlertTray>
  );
}

/* ── Items removed from a running order ── */

export interface CancelledItemEntry {
  key: string;
  ticket: KitchenTicket;
  item: KitchenItem;
  isFullyRemoved: boolean;
  remainingSeconds: number;
}

export function CancelledItemsTray({ entries, onAcknowledge }: { entries: CancelledItemEntry[]; onAcknowledge: (key: string) => void }) {
  return (
    <AlertTray tone="amber" icon={MinusCircle} title="Item removed — stop preparing" count={entries.length} noun="item">
      {entries.map(({ key, ticket, item, isFullyRemoved, remainingSeconds }) => {
        const mods = modifierNames(item);
        return (
          <article key={key} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <TicketHeading ticket={ticket} kotNo={item.kotNo} />
              <Countdown remainingSeconds={remainingSeconds} tone="amber" />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 flex items-start gap-3">
              <span className="shrink-0 h-6 min-w-8 px-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center tabular-nums">
                −{item.cancelledQuantity}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-semibold text-gray-800 truncate ${
                    isFullyRemoved ? "line-through decoration-rose-500/60 decoration-2" : ""
                  }`}
                >
                  {itemName(item)}
                </p>
                {mods.length > 0 && <p className="text-xs text-gray-500 truncate">{mods.join(", ")}</p>}
              </div>
            </div>

            <p
              className={`text-sm font-semibold ${isFullyRemoved ? "text-rose-600" : "text-amber-700"}`}
            >
              {isFullyRemoved ? "Do not cook" : `Cook only ${item.quantity}`}
            </p>

            <AcknowledgeButton onClick={() => onAcknowledge(key)} />
          </article>
        );
      })}
    </AlertTray>
  );
}
