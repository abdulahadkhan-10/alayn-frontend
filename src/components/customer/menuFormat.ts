import type { CustomerMenuItem } from "@/lib/api";

export type DietaryType = "VEG" | "NON_VEG" | "VEGAN";

export function dietaryTypeOf(item: Pick<CustomerMenuItem, "dietaryType" | "isVeg">): DietaryType {
  return item.dietaryType || (item.isVeg ? "VEG" : "NON_VEG");
}

/** ₹250 on the menu, ₹250.50 when there are paise; `exact` always shows paise (bill lines) */
export function formatRupees(paise: number, { exact = false }: { exact?: boolean } = {}): string {
  const rupees = paise / 100;
  const showPaise = exact || Math.round(paise) % 100 !== 0;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: showPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Where an order is, in words a diner understands */
export const ORDER_STEPS = [
  { key: "PLACED", label: "Order placed", hint: "The kitchen has your order" },
  { key: "PREPARING", label: "Being prepared", hint: "Your food is being cooked" },
  { key: "READY", label: "Ready", hint: "On its way to your table" },
  { key: "SERVED", label: "Served", hint: "Enjoy your meal" },
] as const;

/** Index into ORDER_STEPS for an order status (-1 when cancelled) */
export function orderStepIndex(status: string | undefined): number {
  switch (status) {
    case "PREPARING":
      return 1;
    case "READY":
    case "DISPATCHED":
      return 2;
    case "SERVED":
    case "COMPLETED":
      return 3;
    case "CANCELLED":
      return -1;
    default:
      return 0;
  }
}

/** Text field style shared by the ordering sheets (16px text so iPhones don't zoom in) */
export const inputClass =
  "block h-12 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-base text-(--espresso) placeholder:text-zinc-400 " +
  "transition-[border-color,box-shadow] focus:border-(--espresso) focus:outline-none focus:ring-3 focus:ring-[#1B2A4A]/10";

export type BillPaymentMethod = "UPI" | "CARD" | "CASH";

interface PaymentLike {
  method: string;
  status: string;
  amountPaise: number;
  reference?: string | null;
}

/** What is paid and still due on the table's running bill, and how the diner said they'd pay */
export function tableBillStatus(order: { totalPaise?: number; payments?: PaymentLike[] } | null | undefined) {
  const payments = order?.payments || [];
  const totalPaise = order?.totalPaise || 0;
  const paidPaise = payments.filter((p) => p.status === "CONFIRMED").reduce((sum, p) => sum + p.amountPaise, 0);
  const duePaise = Math.max(0, totalPaise - paidPaise);
  const pending = payments.filter((p) => p.status === "PENDING");
  const request = pending.length > 0
    ? {
        method: pending[pending.length - 1].method as BillPaymentMethod,
        amountPaise: pending.reduce((sum, p) => sum + p.amountPaise, 0),
        references: pending.map((p) => p.reference).filter((r): r is string => !!r),
      }
    : null;
  return {
    totalPaise,
    paidPaise,
    duePaise,
    request,
    /** They asked for the bill, then ordered more: the amount they chose to pay no longer covers it */
    requestOutdated: !!request && request.amountPaise < duePaise,
  };
}
