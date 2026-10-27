import { estimateBill, type GstRegistrationType } from "@/lib/billing";
import { queueGetAll, queuePut } from "./db";
import { getDeviceCode, nextOfflineSequence } from "./offlinePack";
import { refreshQueueCounts } from "./syncQueue";

/** One cart line as the POS holds it (prices in rupees, as shown on screen). */
export interface OfflineCartLine {
  menuItem: { id: string; name: string };
  quantity: number;
  unitPrice: number;
  notes?: string;
  selectedModifiers?: { id?: string; groupId?: string; name: string; price: number; isVariant?: boolean }[];
}

export type OfflinePaymentMethod = "CASH" | "CARD" | "UPI";

/** The bill as the /orders/sync endpoint expects it (see alayn-backend order.schema.ts offlineSyncSchema). */
export interface OfflineOrderPayload {
  clientOrderId: string;
  orderNumber: string;
  createdAt: string;
  source: "TABLE" | "COUNTER";
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    unitPricePaise: number;
    modifiers?: { id: string; groupId?: string; name: string; pricePaise: number; isVariant?: boolean }[];
  }[];
  discountPaise?: number;
  rates: { cgstRate: number; sgstRate: number; serviceChargeRate: number };
  gstRegistrationType: GstRegistrationType;
  totalPaise: number;
  settlement?: { idempotencyKey: string; payments: { method: OfflinePaymentMethod; amountPaise: number; verified: boolean }[] };
}

export interface QueuedOrder {
  clientOrderId: string;
  outletId: string;
  /** pending: waiting to sync. attention: the server refused it and someone needs to look. */
  status: "pending" | "attention";
  attempts: number;
  lastError?: string;
  queuedAt: number;
  payload: OfflineOrderPayload;
  /** Same shape as a server order, so it reprints exactly as it first printed. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  printable: any;
  // Line names, kept for the bill and for staff reviewing refused bills
  itemNames: Record<string, string>;
}

type Outlet = {
  id: string;
  name?: string;
  cgstRateDecimal?: number | string | null;
  sgstRateDecimal?: number | string | null;
  serviceTaxRateDecimal?: number | string | null;
  gstRegistrationType?: string | null;
  [key: string]: unknown;
};

const rateOf = (v: number | string | null | undefined, fallback: number) => (v === null || v === undefined ? fallback : Number(v));

/** Same three-letter prefix the server uses for this outlet's normal order numbers. */
function outletPrefix(name?: string) {
  return (name || "ALAYN").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
}

/** Today's date in India time as YYYYMMDD, matching the server's order numbers. */
function istDateKey(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts.replace(/-/g, "");
}

const toPaise = (rupees: number) => Math.round(rupees * 100);

function lineFromCart(ci: OfflineCartLine) {
  const modifiers = (ci.selectedModifiers || [])
    .filter((m) => m.id)
    .map((m) => ({ id: m.id as string, groupId: m.groupId, name: m.name, pricePaise: toPaise(Number(m.price) || 0), isVariant: !!m.isVariant }));
  return {
    menuItemId: ci.menuItem.id,
    quantity: ci.quantity,
    notes: ci.notes || undefined,
    unitPricePaise: toPaise(ci.unitPrice),
    ...(modifiers.length > 0 ? { modifiers } : {}),
  };
}

function priceBill(
  items: OfflineOrderPayload["items"],
  rates: OfflineOrderPayload["rates"],
  source: OfflineOrderPayload["source"],
  discountPaise: number,
  gstRegistrationType: GstRegistrationType
) {
  const est = estimateBill(
    items.map((i) => ({ price: i.unitPricePaise / 100, quantity: i.quantity })),
    rates,
    { dineIn: source === "TABLE", discount: discountPaise / 100, gstRegistrationType }
  );
  return {
    subtotalPaise: toPaise(est.subtotal),
    discountPaise: toPaise(est.discount),
    serviceChargePaise: toPaise(est.serviceCharge),
    cgstPaise: toPaise(est.cgst),
    sgstPaise: toPaise(est.sgst),
    roundOffPaise: toPaise(est.roundOff),
    totalPaise: toPaise(est.total),
  };
}

/** Builds the order object the receipt / KOT printers read, in the server's response shape. */
function toPrintable(
  payload: OfflineOrderPayload,
  bill: ReturnType<typeof priceBill>,
  outlet: Outlet,
  itemNames: Record<string, string>,
  placedByName: string,
  kotItems?: OfflineOrderPayload["items"]
) {
  const mapItem = (i: OfflineOrderPayload["items"][number], idx: number) => ({
    id: `${payload.clientOrderId}-${idx}`,
    menuItemId: i.menuItemId,
    menuItem: { id: i.menuItemId, name: itemNames[i.menuItemId] || "Item" },
    quantity: i.quantity,
    notes: i.notes,
    unitPricePaise: i.unitPricePaise,
    subtotalPaise: i.unitPricePaise * i.quantity,
    unitPrice: i.unitPricePaise / 100,
    subtotal: (i.unitPricePaise * i.quantity) / 100,
    modifiers: i.modifiers || [],
    status: "SERVED",
  });
  const items = payload.items.map(mapItem);
  const payments = (payload.settlement?.payments || []).map((p) => ({ method: p.method, amountPaise: p.amountPaise, status: "CONFIRMED" }));
  return {
    id: payload.clientOrderId,
    isOffline: true,
    orderNumber: payload.orderNumber,
    orderNo: payload.orderNumber,
    outletId: outlet.id,
    outlet,
    branchName: outlet.name,
    source: payload.source,
    orderSource: payload.source,
    tableNumber: payload.tableNumber ?? null,
    tableNo: payload.tableNumber !== undefined ? String(payload.tableNumber) : undefined,
    status: payload.settlement ? "COMPLETED" : "SERVED",
    createdAt: payload.createdAt,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    placedByName,
    placedByRole: "STAFF",
    ...bill,
    serviceTaxPaise: bill.serviceChargePaise,
    taxPaise: bill.cgstPaise + bill.sgstPaise + bill.serviceChargePaise,
    subtotal: bill.subtotalPaise / 100,
    discountAmount: bill.discountPaise / 100,
    serviceChargeAmount: bill.serviceChargePaise / 100,
    cgstAmount: bill.cgstPaise / 100,
    sgstAmount: bill.sgstPaise / 100,
    roundOffAmount: bill.roundOffPaise / 100,
    totalAmount: bill.totalPaise / 100,
    cgstRate: payload.rates.cgstRate,
    sgstRate: payload.rates.sgstRate,
    serviceChargeRate: payload.rates.serviceChargeRate,
    isDineIn: payload.source === "TABLE",
    gstRegistrationType: payload.gstRegistrationType,
    payments,
    paymentMethod: payments[0]?.method,
    paymentStatus: payload.settlement ? "PAID" : "PENDING",
    items,
    orderItems: items,
    // Only the new round goes on the kitchen ticket when a table adds to its offline bill
    kotItems: (kotItems || payload.items).map(mapItem),
  };
}

export interface OfflineOrderInput {
  /** The id the online attempt already used, so the sync can tell if that attempt reached the server. */
  clientOrderId: string;
  outlet: Outlet;
  cart: OfflineCartLine[];
  source: "TABLE" | "COUNTER";
  tableNo?: string;
  discount: number;
  customerName?: string;
  customerPhone?: string;
  placedByName: string;
  /** Paid now (checkout). Without it the bill stays open, like "send to kitchen". */
  payment?: OfflinePaymentMethod;
}

/**
 * Saves a bill made with no connection and returns it in the shape the printers expect. A table
 * that already has an open offline bill gets the new items added to that bill, like a new KOT round.
 */
export async function createOfflineOrder(input: OfflineOrderInput) {
  const { outlet } = input;
  const rates = {
    cgstRate: rateOf(outlet.cgstRateDecimal, 2.5),
    sgstRate: rateOf(outlet.sgstRateDecimal, 2.5),
    serviceChargeRate: rateOf(outlet.serviceTaxRateDecimal, 0),
  };
  const gstRegistrationType = (outlet.gstRegistrationType || "REGULAR") as GstRegistrationType;
  const tableNumber = input.source === "TABLE" && input.tableNo ? parseInt(input.tableNo, 10) || undefined : undefined;
  const newItems = input.cart.map(lineFromCart);
  const itemNames: Record<string, string> = {};
  input.cart.forEach((ci) => (itemNames[ci.menuItem.id] = ci.menuItem.name));

  // A table's open offline bill (not yet synced, not yet paid) takes the next round
  const openBill = tableNumber
    ? (await queueGetAll<QueuedOrder>()).find(
        (q) => q.outletId === outlet.id && q.status === "pending" && !q.payload.settlement && q.payload.tableNumber === tableNumber
      )
    : undefined;

  let payload: OfflineOrderPayload;
  if (openBill) {
    payload = { ...openBill.payload, items: [...openBill.payload.items, ...newItems] };
    Object.assign(itemNames, openBill.itemNames);
  } else {
    const now = new Date();
    const dateKey = istDateKey(now);
    const [device, seq] = [await getDeviceCode(), await nextOfflineSequence(dateKey)];
    payload = {
      clientOrderId: input.clientOrderId,
      orderNumber: `${outletPrefix(outlet.name)}${dateKey}-${device}-${String(seq).padStart(4, "0")}`,
      createdAt: now.toISOString(),
      source: input.source,
      ...(tableNumber ? { tableNumber } : {}),
      items: newItems,
      rates,
      gstRegistrationType,
      totalPaise: 0,
    };
  }
  if (input.customerName) payload.customerName = input.customerName;
  if (input.customerPhone) payload.customerPhone = input.customerPhone;

  const discountPaise = toPaise(input.discount || 0) || payload.discountPaise || 0;
  const bill = priceBill(payload.items, payload.rates, payload.source, discountPaise, payload.gstRegistrationType);
  payload.discountPaise = bill.discountPaise || undefined;
  payload.totalPaise = bill.totalPaise;
  if (input.payment) {
    payload.settlement = {
      idempotencyKey: `offline-${payload.clientOrderId}`,
      // The cashier taking the money at the till is the confirmation that it was received
      payments: [{ method: input.payment, amountPaise: bill.totalPaise, verified: true }],
    };
  }

  const printable = toPrintable(payload, bill, outlet, itemNames, input.placedByName, newItems);
  const record: QueuedOrder = {
    clientOrderId: payload.clientOrderId,
    outletId: outlet.id,
    status: "pending",
    attempts: 0,
    queuedAt: openBill?.queuedAt ?? Date.now(),
    payload,
    printable,
    itemNames,
  };
  const saved = await queuePut(record);
  if (!saved) {
    throw new Error("This device can't store bills offline (browser storage is blocked). Reconnect to keep billing.");
  }
  await refreshQueueCounts();
  return { order: printable, addedToOpenBill: !!openBill };
}
