/**
 * What a kitchen ticket shows, shared by the on-screen preview, the system print (HTML) and the
 * thermal printer (ESC/POS) so the three never drift apart. Kitchen essentials only: no outlet
 * name, ticket title, order channel or customer details.
 */

const time = (value: string | number | Date) =>
  new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

export interface KotHeader {
  kotNo: number;
  /** "TABLE 4", "DELIVERY" (the kitchen packs it) or "COUNTER" */
  location: string;
  orderNumber: string;
  serverName: string;
  /** When this KOT reached the kitchen (a later round keeps its own time) */
  sentAt: string;
  cancelledAt: string;
  cancelReason: string | null;
}

export function kotItems(order: any): any[] {
  // Items removed earlier already got their own void slip: only an item-void slip lists cancelled items
  return (order.items || order.orderItems || []).filter((i: any) => (order.isItemVoid ? true : i.status !== "CANCELLED"));
}

export function kotHeader(order: any, items: any[]): KotHeader {
  const rawTable = order.tableNumber ?? order.tableNo;
  const hasTable = rawTable !== null && rawTable !== undefined && String(rawTable).trim() !== "" && String(rawTable) !== "COUNTER";
  const source = String(order.source || order.orderSource || "").toUpperCase();

  const latestItemAt = items
    .map((i) => i.createdAt)
    .filter(Boolean)
    .sort()
    .pop();

  return {
    kotNo: Math.max(...items.map((i) => i.kotNo || 1), 1),
    location: hasTable ? `TABLE ${rawTable}` : source === "DELIVERY" ? "DELIVERY" : "COUNTER",
    orderNumber: order.orderNumber || order.orderNo || (order.id ? String(order.id).slice(0, 8).toUpperCase() : "-"),
    serverName: order.placedByName || "Staff",
    sentAt: time(latestItemAt || order.createdAt || Date.now()),
    cancelledAt: time(order.cancelledAt || Date.now()),
    cancelReason: order.comment || order.cancelReason || null,
  };
}
