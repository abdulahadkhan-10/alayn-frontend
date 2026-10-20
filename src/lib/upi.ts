/**
 * UPI "pay to the restaurant" links and QR codes, built from the outlet's own UPI ID (Settings → Receipt).
 * Money goes straight from the customer's UPI app to the restaurant's account; nothing passes through Alayn,
 * so the cashier still confirms it arrived (soundbox / UPI app) before settling.
 */

// handle@bank, e.g. cafe.alayn@okhdfcbank or 9876543210@ybl
const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

export function isValidUpiId(upiId: string | null | undefined): upiId is string {
  return !!upiId && UPI_ID_PATTERN.test(upiId.trim());
}

/**
 * upi://pay link (also the QR content) for an exact amount, or "" when there is nothing safe to pay:
 * no valid UPI ID, or no amount. Never falls back to a placeholder ID: money sent there would be lost.
 */
export function buildUpiPayUrl({
  upiId,
  payeeName,
  amountPaise,
  note,
}: {
  upiId: string | null | undefined;
  payeeName: string;
  amountPaise: number;
  /** Shown with the payment in the restaurant's UPI app, e.g. "Bill ALA2026102000012" */
  note?: string;
}): string {
  if (!isValidUpiId(upiId) || !Number.isFinite(amountPaise) || amountPaise <= 0) return "";
  const params = [
    `pa=${encodeURIComponent(upiId.trim())}`,
    `pn=${encodeURIComponent(payeeName.trim().slice(0, 50) || "Restaurant")}`,
    `am=${(Math.round(amountPaise) / 100).toFixed(2)}`,
    "cu=INR",
  ];
  const tn = note?.trim().slice(0, 50);
  if (tn) params.push(`tn=${encodeURIComponent(tn)}`);
  return `upi://pay?${params.join("&")}`;
}
