/**
 * Splits an order line into what a bill prints: the dish at its own price, then one row per
 * paid / free add-on with that add-on's price. The rows always add up to the line's subtotal.
 *
 *   Chicken Chilly        1   199.00   199.00
 *     + Onion             1    20.00    20.00
 *     + Butter            1    15.00    15.00
 *
 * A chosen variant (Half / Full) is part of the dish itself, so it goes in the dish name.
 */

export interface BillAddonRow {
  name: string;
  unitRupees: number;
  amountRupees: number;
}

export interface BillItemRows {
  name: string;
  qty: number;
  unitRupees: number;
  amountRupees: number;
  addons: BillAddonRow[];
  notes?: string;
}

/** An order line's chosen add-ons, from the API's parsed list or its stored JSON snapshot */
export function itemModifiers(item: any): any[] {
  if (Array.isArray(item?.modifiers)) return item.modifiers;
  if (!item?.modifiersJson) return [];
  if (typeof item.modifiersJson !== "string") return Array.isArray(item.modifiersJson) ? item.modifiersJson : [];
  try {
    const parsed = JSON.parse(item.modifiersJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const modifierPaise = (m: any) =>
  m.pricePaise !== undefined && m.pricePaise !== null ? Number(m.pricePaise) : Math.round(Number(m.price || 0) * 100);

export function billItemRows(item: any): BillItemRows {
  const qty = Number(item.quantity) || 1;
  const baseName = (item.menuItem?.name || item.menuItemName || item.name || "Item").trim();

  // What was actually charged per unit (dish + add-ons), as stored on the order
  const unitPaise =
    item.unitPricePaise !== undefined && item.unitPricePaise !== null
      ? Number(item.unitPricePaise)
      : item.unitPrice !== undefined
        ? Math.round(Number(item.unitPrice) * 100)
        : Number(item.menuItem?.pricePaise) || 0;
  const linePaise =
    item.subtotalPaise !== undefined && item.subtotalPaise !== null ? Number(item.subtotalPaise) : unitPaise * qty;

  const mods = itemModifiers(item);
  const variant = mods.find((m: any) => m.isVariant);
  const addonMods = mods.filter((m: any) => !m.isVariant);

  const addons: BillAddonRow[] = addonMods.map((m: any) => {
    const paise = modifierPaise(m);
    return { name: m.name, unitRupees: paise / 100, amountRupees: (paise * qty) / 100 };
  });
  const addonsPaisePerUnit = addonMods.reduce((sum: number, m: any) => sum + modifierPaise(m), 0);

  // The dish's own price is whatever is left once the add-ons are taken out
  const dishUnitPaise = unitPaise - addonsPaisePerUnit;
  const dishLinePaise = linePaise - addonsPaisePerUnit * qty;

  return {
    name: variant ? `${baseName} (${variant.name})` : baseName,
    qty,
    unitRupees: dishUnitPaise / 100,
    amountRupees: dishLinePaise / 100,
    addons,
    notes: item.notes?.trim() || undefined,
  };
}
