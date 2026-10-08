/**
 * Bill calculation — mirrors alayn-backend/src/modules/orders/billing.ts
 * Single source of truth for bill estimation on the POS and order previews.
 *
 * All financial math is done in paise integers to prevent IEEE-754 floating-point drift:
 *   subtotal       = Σ unit price × qty
 *   net            = subtotal − discount
 *   service charge = round(net × scRate)       (dine-in only; voluntary)
 *   taxable value  = net + service charge     (GST applies on food + service charge)
 *   CGST / SGST    = round(taxable × rate)    (0 for COMPOSITION / UNREGISTERED)
 *   total          = round(gross to nearest 100 paise)
 *   round-off      = total − gross
 */

export type GstRegistrationType = 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED';

export interface BillRates {
  /** Percentages, e.g. 2.5 for 2.5% */
  cgstRate: number;
  sgstRate: number;
  serviceChargeRate: number;
}

export interface BillOptions {
  /** Service charge only applies to dine-in (TABLE/QR) orders */
  dineIn: boolean;
  serviceChargeWaived?: boolean;
  /** Discount in Rupees */
  discount?: number;
  gstRegistrationType?: GstRegistrationType;
}

export interface CartLineItem {
  price: number;
  quantity: number;
}

export interface BillEstimate {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  roundOff: number;
  total: number;
  appliedRates: BillRates;
}

export const DINE_IN_SOURCES = ['TABLE', 'QR'];

export function isDineIn(source?: string | null): boolean {
  return !!source && DINE_IN_SOURCES.includes(source.toUpperCase());
}

export function estimateBill(
  items: CartLineItem[],
  rates: BillRates,
  options: BillOptions
): BillEstimate {
  // Convert to paise
  const subtotalPaise = items.reduce(
    (sum, item) => sum + Math.round((item.price || 0) * 100) * (item.quantity || 0),
    0
  );

  const discountPaise = Math.min(
    Math.max(0, Math.round((options.discount || 0) * 100)),
    subtotalPaise
  );
  const netPaise = subtotalPaise - discountPaise;

  const serviceChargeRate =
    options.dineIn && !options.serviceChargeWaived ? Math.max(0, rates.serviceChargeRate || 0) : 0;
  const serviceChargePaise = Math.round((netPaise * serviceChargeRate) / 100);

  const collectsGst = (options.gstRegistrationType || 'REGULAR') === 'REGULAR';
  const cgstRate = collectsGst ? Math.max(0, rates.cgstRate || 0) : 0;
  const sgstRate = collectsGst ? Math.max(0, rates.sgstRate || 0) : 0;

  const taxableValuePaise = netPaise + serviceChargePaise;
  const cgstPaise = Math.round((taxableValuePaise * cgstRate) / 100);
  const sgstPaise = Math.round((taxableValuePaise * sgstRate) / 100);

  const grossPaise = taxableValuePaise + cgstPaise + sgstPaise;
  const totalPaise = Math.round(grossPaise / 100) * 100;
  const roundOffPaise = totalPaise - grossPaise;

  return {
    subtotal: subtotalPaise / 100,
    discount: discountPaise / 100,
    serviceCharge: serviceChargePaise / 100,
    taxableValue: taxableValuePaise / 100,
    cgst: cgstPaise / 100,
    sgst: sgstPaise / 100,
    roundOff: roundOffPaise / 100,
    total: totalPaise / 100,
    appliedRates: { cgstRate, sgstRate, serviceChargeRate },
  };
}
