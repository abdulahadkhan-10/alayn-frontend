/**
 * Professional ESC/POS Binary Command Generator for ALAYN POS.
 *
 * Emits raw ESC/POS binary buffers that speak directly to any thermal printer
 * (Epson, TVS, NGX, Everycom, RPP02, MPT-II, Xprinter, Sunmi, Posiflex, 58mm & 80mm).
 *
 * Benefits:
 * - 100% hardware-rendered font (crisp, high contrast, zero blur).
 * - Full paper width utilization (48 cols for 80mm, 32 cols for 58mm).
 * - Zero watermarks (not rendered as bitmap/graphic).
 * - Instant (< 200ms) execution over Bluetooth / USB / LAN.
 */

import { billItemRows, itemModifiers, receiptCashierName } from "./billLines";
import { getPaymentLines } from "./splitPayment";

export interface ESCPOSOptions {
  paperWidth?: "80mm" | "58mm";
  cutPaper?: boolean;
  openCashDrawer?: boolean;
  beep?: boolean;
}

export class ESCPOSBuilder {
  private buffer: number[] = [];
  private cols: number;
  private is80mm: boolean;

  // ESC/POS Command Constants
  private static readonly ESC = 0x1b;
  private static readonly GS = 0x1d;
  private static readonly FS = 0x1c;

  constructor(paperWidth: "80mm" | "58mm" = "80mm") {
    this.is80mm = paperWidth === "80mm";
    this.cols = this.is80mm ? 48 : 32;
    this.init();
  }

  /** Initialize printer to clean defaults */
  init(): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x40); // ESC @
    return this;
  }

  /** Text Alignment: 0 = Left, 1 = Center, 2 = Right */
  align(alignment: "left" | "center" | "right"): this {
    const code = alignment === "center" ? 1 : alignment === "right" ? 2 : 0;
    this.buffer.push(ESCPOSBuilder.ESC, 0x61, code); // ESC a n
    return this;
  }

  /** Set bold text on / off */
  bold(enable: boolean = true): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x45, enable ? 1 : 0); // ESC E n
    return this;
  }

  /** Set text size: 0 = Normal, 1 = Double Height, 2 = Double Width, 3 = Double Both */
  textSize(width: 1 | 2 = 1, height: 1 | 2 = 1): this {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(ESCPOSBuilder.GS, 0x21, n); // GS ! n
    return this;
  }

  /** Invert colors (white on black) */
  invert(enable: boolean = true): this {
    this.buffer.push(ESCPOSBuilder.GS, 0x42, enable ? 1 : 0); // GS B n
    return this;
  }

  /** Append raw text string encoded in ASCII / UTF-8 */
  text(str: string): this {
    // Replace rupee symbol with 'Rs.' for thermal printers without Unicode Rupee glyph
    const sanitized = str.replace(/₹/g, "Rs.");
    for (let i = 0; i < sanitized.length; i++) {
      const charCode = sanitized.charCodeAt(i);
      if (charCode < 128) {
        this.buffer.push(charCode);
      } else {
        // Safe fallback for non-ASCII characters
        this.buffer.push(0x3f); // '?'
      }
    }
    return this;
  }

  /** Append text with a newline */
  textLine(str: string = ""): this {
    this.text(str);
    this.newLine();
    return this;
  }

  newLine(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a); // LF
    }
    return this;
  }

  /** Horizontal divider line made of hyphens or equal signs */
  divider(char: string = "-"): this {
    this.textLine(char.repeat(this.cols));
    return this;
  }

  /** Double-column left / right justification (e.g. "Subtotal         Rs.450.00") */
  twoColumns(left: string, right: string, padChar: string = " "): this {
    const l = left.replace(/₹/g, "Rs.");
    const r = right.replace(/₹/g, "Rs.");
    const spaceCount = Math.max(1, this.cols - l.length - r.length);
    const line = l + padChar.repeat(spaceCount) + r;
    this.textLine(line);
    return this;
  }

  /** Three-column layout (e.g. "Item Name         Qty     Price") */
  threeColumns(col1: string, col2: string, col3: string, col2Width = 6, col3Width = 10): this {
    const col1Width = Math.max(10, this.cols - col2Width - col3Width - 2);
    const c1 = col1.replace(/₹/g, "Rs.").slice(0, col1Width).padEnd(col1Width, " ");
    const c2 = col2.padStart(col2Width, " ");
    const c3 = col3.replace(/₹/g, "Rs.").padStart(col3Width, " ");
    this.textLine(`${c1} ${c2} ${c3}`);
    return this;
  }

  /** Trigger cash drawer kick (ESC p 0 25 250) */
  cashDrawer(): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  /** Trigger buzzer / beep if printer supports it */
  beep(times: number = 2): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x42, times, 2);
    return this;
  }

  /** Paper cut (GS V 66 0 = Partial Cut after feeding 3 lines) */
  cut(partial: boolean = true): this {
    this.newLine(4); // Feed paper past print head
    this.buffer.push(ESCPOSBuilder.GS, 0x56, partial ? 0x01 : 0x00);
    return this;
  }

  /** Return the final binary payload as Uint8Array */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /** Return plain text representation for text-mode fallback */
  toPlainText(): string {
    return String.fromCharCode(...this.buffer.filter((b) => b >= 32 || b === 10));
  }
}

/**
 * 🍳 Generates ESC/POS Binary Buffer for a Kitchen Order Ticket (KOT).
 */
export function buildKOTBytes(order: any, isCancellation = false, paperWidth: "80mm" | "58mm" = "80mm"): Uint8Array {
  const actualOrder = order?.data || order || {};
  const is80mm = paperWidth === "80mm";
  const builder = new ESCPOSBuilder(paperWidth);

  const orderNumber =
    actualOrder.orderNumber ||
    actualOrder.orderNo ||
    (actualOrder.id ? `#${String(actualOrder.id).slice(0, 8).toUpperCase()}` : "ORD-101");

  const rawTable = actualOrder.tableNumber ?? actualOrder.tableNo;
  const isTable =
    rawTable !== null &&
    rawTable !== undefined &&
    String(rawTable).trim() !== "" &&
    String(rawTable) !== "COUNTER";
  const tableTitle = isTable ? `TABLE #${rawTable}` : "COUNTER / TAKEAWAY";

  // Items removed earlier already got their own void slip: only an item-void slip lists cancelled items
  const items = (actualOrder.items || actualOrder.orderItems || []).filter(
    (i: any) => (actualOrder.isItemVoid ? true : i.status !== "CANCELLED")
  );
  const maxKotNo = Math.max(...items.map((i: any) => i.kotNo || 1), 1);

  const timeStr = actualOrder.createdAt
    ? new Date(actualOrder.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const dateStr = actualOrder.createdAt
    ? new Date(actualOrder.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const serverName = actualOrder.placedByName || (actualOrder.placedByRole ? `Staff (${actualOrder.placedByRole})` : "Cashier");

  // ── HEADER ──
  builder.align("center");
  if (isCancellation) {
    builder.bold(true).textSize(2, 2);
    builder.textLine("!! CANCELLED KOT !!");
    builder.textSize(1, 1).bold(false);
    builder.textLine("*** DO NOT PREPARE ***");
  } else {
    builder.bold(true).textSize(2, 2);
    builder.textLine("KITCHEN TICKET");
    builder.textSize(1, 1).bold(false);
    builder.textLine(`KOT #${maxKotNo} • ${orderNumber}`);
  }

  builder.divider("=");

  // ── TABLE / LOCATION (Extra Large) ──
  builder.align("center");
  builder.bold(true).textSize(2, 2);
  builder.textLine(tableTitle);
  builder.textSize(1, 1).bold(false);

  builder.divider("-");

  // ── ORDER METADATA ──
  builder.align("left");
  builder.twoColumns(`Date: ${dateStr}`, `Time: ${timeStr}`);
  builder.twoColumns(`Order: ${orderNumber}`, `Server: ${serverName}`);
  builder.divider("=");

  // ── ITEMS TABLE ──
  builder.bold(true);
  builder.twoColumns("ITEM", "QTY");
  builder.bold(false);
  builder.divider("-");

  for (const item of items) {
    const name = (item.menuItem?.name || item.menuItemName || item.name || "Item").trim();
    const qty = `[ ${item.quantity}x ]`;

    builder.bold(true);
    const maxCols = is80mm ? 48 : 32;
    const maxNameWidth = maxCols - qty.length - 2;

    if (name.length <= maxNameWidth) {
      builder.twoColumns(name, qty);
    } else {
      // Wrap long item name cleanly across lines by words so it is never truncated
      const words = name.split(" ");
      let line1 = "";
      let remaining = "";
      for (const w of words) {
        if ((line1 + (line1 ? " " : "") + w).length <= maxNameWidth) {
          line1 += (line1 ? " " : "") + w;
        } else {
          remaining += (remaining ? " " : "") + w;
        }
      }
      builder.twoColumns(line1 || name.slice(0, maxNameWidth), qty);
      if (remaining) {
        builder.textLine(remaining);
      }
    }
    builder.bold(false);

    // Print modifiers if any
    const kModifiers = itemModifiers(item);
    if (Array.isArray(kModifiers) && kModifiers.length > 0) {
      for (const mod of kModifiers) {
        if (mod.isVariant) {
          builder.textLine(`   > SIZE: ${mod.name}`);
        } else {
          builder.textLine(`   > + ${mod.name}`);
        }
      }
    }

    // Print preparation note if any
    if (item.notes && item.notes.trim()) {
      builder.textLine(` * NOTE: ${item.notes.trim()}`);
    }
  }

  builder.divider("=");

  // ── FOOTER ──
  builder.align("center");
  if (isCancellation) {
    builder.bold(true);
    // isItemVoid: only the listed items were removed, the rest of the order still stands
    builder.textLine(actualOrder.isItemVoid ? "*** ITEM CANCELLED ***" : "*** ORDER CANCELLED ***");
    if (actualOrder.comment || actualOrder.cancelReason) {
      builder.textLine(`Reason: ${actualOrder.comment || actualOrder.cancelReason}`);
    }
  } else {
    builder.bold(true);
    builder.textLine(`--- END OF KOT #${maxKotNo} ---`);
  }

  builder.beep(1);
  builder.cut(true);

  return builder.build();
}

/**
 * 🧾 Generates ESC/POS Binary Buffer for a Customer Bill / Receipt.
 */
export function buildReceiptBytes(order: any, paperWidth: "80mm" | "58mm" = "80mm"): Uint8Array {
  const actualOrder = order?.data || order || {};
  const is80mm = paperWidth === "80mm";
  const builder = new ESCPOSBuilder(paperWidth);

  const billNo =
    actualOrder.orderNumber ||
    actualOrder.orderNo ||
    (actualOrder.id ? `#${String(actualOrder.id).slice(0, 8).toUpperCase()}` : "BILL-1001");

  const outlet = actualOrder.outlet || {};
  const outletName = outlet.name || "ALAYN RESTAURANT";
  const outletAddress = outlet.address ? `${outlet.address}${outlet.city ? `, ${outlet.city}` : ""}` : "";
  const outletPhone = outlet.phone || "";
  const outletGstin = outlet.gstin || "";
  const tagline = outlet.receiptTagline || "";
  const footerMessage = outlet.receiptFooter || "Thank you for dining with us!\nVisit again soon!";

  const rawTable = actualOrder.tableNumber ?? actualOrder.tableNo;
  const isTable =
    rawTable !== null &&
    rawTable !== undefined &&
    String(rawTable).trim() !== "" &&
    String(rawTable) !== "COUNTER";
  const tableTitle = isTable ? `Table: #${rawTable}` : "Counter Direct";

  // Items removed from the bill are not charged, so they don't print
  const items = (actualOrder.items || actualOrder.orderItems || []).filter(
    (item: any) => item.status !== "CANCELLED"
  );

  const orderDate = actualOrder.createdAt ? new Date(actualOrder.createdAt) : new Date();
  const dateStr = orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const subtotal = actualOrder.subtotalPaise !== undefined
    ? actualOrder.subtotalPaise / 100
    : actualOrder.subtotal !== undefined
      ? Number(actualOrder.subtotal)
      : actualOrder.totalAmount !== undefined
        ? Number(actualOrder.totalAmount)
        : 0;
  const discount = actualOrder.discountPaise !== undefined
    ? actualOrder.discountPaise / 100
    : actualOrder.discountAmount !== undefined
      ? Number(actualOrder.discountAmount)
      : 0;
  const serviceCharge = actualOrder.serviceChargeAmount !== undefined
    ? Number(actualOrder.serviceChargeAmount)
    : actualOrder.serviceTaxAmount !== undefined
      ? Number(actualOrder.serviceTaxAmount)
      : actualOrder.serviceTaxPaise !== undefined
        ? actualOrder.serviceTaxPaise / 100
        : 0;
  const taxable = Math.max(0, subtotal - discount + serviceCharge);

  const cgstRate = actualOrder.cgstRate !== undefined && actualOrder.cgstRate !== null
    ? Number(actualOrder.cgstRate)
    : 2.5;
  const sgstRate = actualOrder.sgstRate !== undefined && actualOrder.sgstRate !== null
    ? Number(actualOrder.sgstRate)
    : 2.5;

  const cgst = actualOrder.cgstPaise !== undefined
    ? actualOrder.cgstPaise / 100
    : actualOrder.cgstAmount !== undefined
      ? Number(actualOrder.cgstAmount)
      : Math.round(((taxable * cgstRate) / 100) * 100) / 100;
  const sgst = actualOrder.sgstPaise !== undefined
    ? actualOrder.sgstPaise / 100
    : actualOrder.sgstAmount !== undefined
      ? Number(actualOrder.sgstAmount)
      : Math.round(((taxable * sgstRate) / 100) * 100) / 100;

  const roundOff = actualOrder.roundOffAmount !== undefined
    ? Number(actualOrder.roundOffAmount)
    : actualOrder.roundOffPaise !== undefined
      ? actualOrder.roundOffPaise / 100
      : 0;

  const finalTotal = actualOrder.totalPaise !== undefined
    ? actualOrder.totalPaise / 100
    : actualOrder.totalAmount !== undefined
      ? Number(actualOrder.totalAmount)
      : Math.round(taxable + cgst + sgst);
  const paymentLines = getPaymentLines(actualOrder);
  const paymentMethod = paymentLines.length > 1 ? "SPLIT" : actualOrder.paymentMethod || "CASH";

  // ── HEADER ──
  builder.align("center");
  builder.bold(true).textSize(2, 2);
  builder.textLine(outletName);
  builder.textSize(1, 1).bold(false);

  if (tagline) {
    builder.textLine(tagline);
  }
  if (outletAddress) {
    builder.textLine(outletAddress);
  }
  if (outletPhone) {
    builder.textLine(`Ph: ${outletPhone}`);
  }
  if (outletGstin) {
    builder.bold(true).textLine(`GSTIN: ${outletGstin}`).bold(false);
  }

  builder.divider("=");
  builder.bold(true).textLine("RETAIL TAX INVOICE").bold(false);
  builder.divider("-");

  // ── METADATA ──
  builder.align("left");
  builder.twoColumns(`Bill No: ${billNo}`, tableTitle);
  builder.twoColumns(`Date: ${dateStr}`, `Time: ${timeStr}`);
  const cashierName = receiptCashierName(actualOrder);
  builder.twoColumns(cashierName ? `Cashier: ${cashierName}` : "", `Mode: ${paymentMethod}`);

  if (actualOrder.customerName || actualOrder.customerPhone) {
    const custInfo = [actualOrder.customerName, actualOrder.customerPhone].filter(Boolean).join(" • ");
    builder.textLine(`Customer: ${custInfo}`);
  }

  builder.divider("=");

  // ── ITEMS TABLE ──
  builder.bold(true);
  if (is80mm) {
    builder.threeColumns("ITEM", "QTY", "AMOUNT", 6, 10);
  } else {
    builder.twoColumns("ITEM (QTY)", "AMOUNT");
  }
  builder.bold(false);
  builder.divider("-");

  for (const item of items) {
    const line = billItemRows(item);
    const qty = String(line.qty);

    if (is80mm) {
      builder.threeColumns(line.name, qty, `Rs.${line.amountRupees.toFixed(2)}`, 6, 10);
      for (const addon of line.addons) {
        builder.threeColumns(`  + ${addon.name}`, qty, `Rs.${addon.amountRupees.toFixed(2)}`, 6, 10);
      }
    } else {
      builder.twoColumns(`${line.name} x${qty}`, `Rs.${line.amountRupees.toFixed(2)}`);
      for (const addon of line.addons) {
        builder.twoColumns(`  + ${addon.name}`, `Rs.${addon.amountRupees.toFixed(2)}`);
      }
    }
  }

  builder.divider("=");

  // ── TOTALS ──
  builder.align("left");
  builder.twoColumns("Subtotal:", `Rs.${Number(subtotal).toFixed(2)}`);

  if (discount > 0) {
    builder.twoColumns(
      `Discount ${actualOrder.couponCode ? `(${actualOrder.couponCode})` : ""}:`,
      `-Rs.${Number(discount).toFixed(2)}`
    );
    builder.twoColumns("Taxable Value:", `Rs.${Number(taxable).toFixed(2)}`);
  }
  if (serviceCharge > 0) {
    builder.twoColumns("Service Charge:", `Rs.${Number(serviceCharge).toFixed(2)}`);
  }
  if (cgst > 0 || sgst > 0) {
    builder.twoColumns(`CGST (${cgstRate}%):`, `Rs.${Number(cgst).toFixed(2)}`);
    builder.twoColumns(`SGST (${sgstRate}%):`, `Rs.${Number(sgst).toFixed(2)}`);
  }
  if (roundOff !== 0) {
    builder.twoColumns("Round off:", `${roundOff > 0 ? "+" : ""}Rs.${Number(roundOff).toFixed(2)}`);
  }

  builder.divider("-");

  // Grand Total (Large & Bold)
  builder.bold(true).textSize(2, 2);
  builder.twoColumns("TOTAL:", `Rs.${Number(finalTotal).toFixed(2)}`);
  builder.textSize(1, 1).bold(false);

  builder.divider("=");

  // Payment Status
  builder.align("center");
  builder.bold(true).textLine(`PAID VIA ${paymentMethod.toUpperCase()}`).bold(false);
  if (paymentLines.length > 1) {
    builder.align("left");
    for (const line of paymentLines) {
      const label = line.reference ? `${line.label} (Ref ${line.reference})` : line.label;
      builder.twoColumns(`  ${label}`, `Rs.${(line.amountPaise / 100).toFixed(2)}`);
    }
    builder.align("center");
  }
  builder.newLine();

  // ── FOOTER MESSAGE ──
  builder.align("center");
  for (const line of footerMessage.split("\n")) {
    if (line.trim()) builder.textLine(line.trim());
  }

  builder.cashDrawer(); // Pop open counter cash drawer
  builder.cut(true);    // Cut receipt

  return builder.build();
}

/**
 * Generates formatted pure text string (full width) for Android Text Intent fallback.
 * Uses 0 graphics, so RawBT / Print Services do NOT add watermark or downscale!
 */
export function buildFormattedPlainText(order: any, type: "KOT" | "BILL", paperWidth: "80mm" | "58mm" = "80mm"): string {
  const isKOT = type === "KOT";
  const bytes = isKOT ? buildKOTBytes(order, false, paperWidth) : buildReceiptBytes(order, paperWidth);

  // Filter binary control characters down to clean printable ASCII + newlines
  const textChars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 10 || (b >= 32 && b <= 126)) {
      textChars.push(String.fromCharCode(b));
    }
  }
  return textChars.join("");
}
