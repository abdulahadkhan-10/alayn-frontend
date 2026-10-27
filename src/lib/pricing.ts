/**
 * Alayn's price per outlet, before 18% GST: ₹3,000 a month, or ₹26,000 for a year (non-refundable).
 * Keep in step with src/modules/subscription/pricing.ts in the backend, which decides what is charged.
 */
export const MONTHLY_FEE = 3000;
export const YEARLY_FEE = 26000;
export const GST_PERCENT = 18;
export const MAX_MONTHS = 36;

/** What the yearly plan saves against paying month by month for 12 months */
export const YEARLY_SAVING = MONTHLY_FEE * 12 - YEARLY_FEE;

export const withGst = (amount: number) => Math.round(amount * (100 + GST_PERCENT)) / 100;

/** Price before GST for some months: each full year at the yearly price, the months left over at the monthly price */
export function basePriceFor(months: number): number {
  const m = Math.max(1, Math.min(MAX_MONTHS, Math.floor(months) || 1));
  return Math.floor(m / 12) * YEARLY_FEE + (m % 12) * MONTHLY_FEE;
}

export const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
