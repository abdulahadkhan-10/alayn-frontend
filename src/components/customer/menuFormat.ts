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
