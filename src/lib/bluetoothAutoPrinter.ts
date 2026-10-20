/**
 * 🖨️ ALAYN Professional Hardware Print Dispatcher
 *
 * Designed for 100% Zero-Touch Restaurant Operations:
 * 1. Web Bluetooth: Direct from Chrome browser to any Bluetooth thermal printer (zero app, zero watermark).
 * 2. Native Bluetooth SPP: When running inside Android APK shell (Cordova / Capacitor).
 * 3. System Print Fallback: Universal high-speed silent iframe print (zero redirect, zero Play Store).
 *
 * NEVER forces redirect to Play Store for RawBT unless explicitly requested by the user.
 */

import { buildKOTBytes, buildReceiptBytes, buildFormattedPlainText } from "./escpos";
import { printThermalHtml } from "./printUtils";
import { billItemRows, receiptCashierName } from "./billLines";
import { getPaymentLines } from "./splitPayment";

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export interface PrintResult {
  success: boolean;
  channel: "bluetooth-native" | "web-bluetooth" | "android-stream" | "kiosk-system";
  message?: string;
  error?: any;
}

// Global cached connection for Web Bluetooth
let cachedDevice: any = null;
let cachedCharacteristic: any = null;

// Global cached connection for Web Serial (USB Thermal Printers)
let cachedSerialPort: any = null;
let cachedSerialWriter: any = null;

/** Check if Web Bluetooth is supported in the current browser */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean((navigator as any).bluetooth);
}

/** Check if Web Serial (USB) is supported in the current browser */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean((navigator as any).serial);
}

/** Check if a Web Bluetooth printer is currently connected */
export function isPrinterConnected(): boolean {
  return Boolean(
    (cachedCharacteristic && cachedDevice && cachedDevice.gatt?.connected) ||
    (cachedSerialPort && cachedSerialPort.writable)
  );
}

/** Get the display name of the paired printer */
export function getConnectedPrinterName(): string | null {
  if (cachedCharacteristic && cachedDevice && cachedDevice.gatt?.connected) {
    return cachedDevice?.name || "Bluetooth Printer";
  }
  if (cachedSerialPort && cachedSerialPort.writable) {
    return "USB Thermal Printer";
  }
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("alayn_bt_printer_name") ||
      localStorage.getItem("alayn_usb_printer_name") ||
      null
    );
  }
  return null;
}

/** Check if running inside Android APK (Capacitor/Cordova) */
function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).Capacitor?.isNativePlatform?.() || (window as any).bluetoothSerial);
}

/** Check if running on Android OS */
function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/** Convert Uint8Array to Base64 cleanly */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * ⚡ Strategy 1: Pair and connect Web Bluetooth Printer directly from Chrome
 * No apps, no watermarks, native ESC/POS hardware streaming.
 */
export async function pairWebBluetoothPrinter(): Promise<{ success: boolean; name?: string; error?: string }> {
  if (!isWebBluetoothSupported()) {
    return { success: false, error: "Web Bluetooth is not supported in this browser. Please use Chrome on Android, Windows, or Mac." };
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        "0000e0ff-0000-1000-8000-00805f9b34fb",
        "0000af30-0000-1000-8000-00805f9b34fb",
      ],
    });

    device.addEventListener("gattserverdisconnected", () => {
      cachedCharacteristic = null;
      console.log("[Alayn BT] Printer disconnected");
    });

    const server = await device.gatt.connect();
    cachedDevice = device;

    const services = await server.getPrimaryServices();
    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          cachedCharacteristic = char;
          break;
        }
      }
      if (cachedCharacteristic) break;
    }

    if (cachedCharacteristic) {
      if (typeof window !== "undefined") {
        localStorage.setItem("alayn_bt_printer_name", device.name || "Bluetooth Printer");
        localStorage.setItem("alayn_print_mode", "bluetooth");
      }
      return { success: true, name: device.name || "Bluetooth Printer" };
    }
    return { success: false, error: "Connected to device, but no printable ESC/POS channel was found." };
  } catch (err: any) {
    if (err.name === "NotFoundError") {
      return { success: false, error: "Cancelled by user" };
    }
    return { success: false, error: err.message || "Failed to pair Bluetooth printer" };
  }
}

/** Disconnect Web Bluetooth */
export function disconnectWebBluetoothPrinter(): void {
  if (cachedDevice && cachedDevice.gatt && cachedDevice.gatt.connected) {
    cachedDevice.gatt.disconnect();
  }
  cachedDevice = null;
  cachedCharacteristic = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("alayn_bt_printer_name");
  }
}

/**
 * ⚡ Strategy 1B: Pair and connect USB Thermal Printer via Web Serial directly from Chrome
 * Works on Windows, Mac, Linux for all TVS, Epson, Xprinter, POS-58, POS-80 USB printers.
 */
export async function pairWebSerialPrinter(): Promise<{ success: boolean; name?: string; error?: string }> {
  if (!isWebSerialSupported()) {
    return {
      success: false,
      error: "Web Serial is not supported in this browser. Please use Chrome or Edge.",
    };
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    cachedSerialPort = port;
    cachedSerialWriter = port.writable.getWriter();
    if (typeof window !== "undefined") {
      localStorage.setItem("alayn_usb_printer_name", "USB Thermal Printer");
      localStorage.setItem("alayn_print_mode", "serial");
    }
    return { success: true, name: "USB Thermal Printer" };
  } catch (err: any) {
    if (err.name === "NotFoundError") {
      return { success: false, error: "Cancelled by user" };
    }
    return { success: false, error: err.message || "Failed to pair USB printer" };
  }
}

/** Send ESC/POS bytes over Web Serial (USB) */
export async function printViaWebSerial(bytes: Uint8Array): Promise<boolean> {
  if (!cachedSerialPort) return false;
  try {
    if (!cachedSerialWriter || cachedSerialPort.writable.locked) {
      cachedSerialWriter = cachedSerialPort.writable.getWriter();
    }
    await cachedSerialWriter.write(bytes);
    cachedSerialWriter.releaseLock();
    return true;
  } catch (err) {
    console.error("[Alayn Serial] Write error:", err);
    try {
      cachedSerialWriter?.releaseLock();
    } catch (_) {}
    return false;
  }
}

/**
 * ⚡ Send ESC/POS bytes over Web Bluetooth
 */
export async function printViaWebBluetooth(bytes: Uint8Array): Promise<boolean> {
  if (!cachedCharacteristic) {
    if (cachedDevice && cachedDevice.gatt && !cachedDevice.gatt.connected) {
      try {
        const server = await cachedDevice.gatt.connect();
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              cachedCharacteristic = char;
              break;
            }
          }
          if (cachedCharacteristic) break;
        }
      } catch (err) {
        console.warn("[Alayn BT] Reconnect failed:", err);
        return false;
      }
    } else {
      return false;
    }
  }

  if (!cachedCharacteristic) return false;

  try {
    const CHUNK_SIZE = 100;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      if (cachedCharacteristic.properties.writeWithoutResponse) {
        await cachedCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await cachedCharacteristic.writeValue(chunk);
      }
    }
    return true;
  } catch (err) {
    console.error("[Alayn BT] Write error:", err);
    cachedCharacteristic = null;
    return false;
  }
}

/**
 * ⚡ Strategy 2: Native Bluetooth SPP Auto-Print (Android Tablet APK)
 */
async function printViaNativeBluetooth(bytes: Uint8Array): Promise<boolean> {
  const bt = (window as any).bluetoothSerial;
  if (!bt) return false;

  return new Promise((resolve) => {
    bt.list(
      async (devices: Array<{ name?: string; address: string; class?: number }>) => {
        if (!devices || devices.length === 0) {
          console.warn("[Alayn Printer] No paired Bluetooth devices found in Android Settings.");
          resolve(false);
          return;
        }

        const PRINTER_KEYWORDS = ["printer", "pos", "rpp", "mpt", "thermal", "bt", "58", "80", "innerprinter", "ngx", "tvs", "everycom"];
        let matched = devices.find((d) => {
          const name = (d.name || "").toLowerCase();
          return PRINTER_KEYWORDS.some((kw) => name.includes(kw));
        });

        if (!matched && devices.length === 1) {
          matched = devices[0];
        }

        if (!matched) {
          matched = devices[0];
        }

        const macAddress = matched.address;
        console.log(`[Alayn Printer] Auto-detected printer: ${matched.name || "Unknown"} (${macAddress})`);

        bt.connect(
          macAddress,
          () => {
            bt.write(
              bytes.buffer,
              () => {
                console.log("[Alayn Printer] ESC/POS buffer transmitted successfully!");
                setTimeout(() => bt.disconnect(), 1000);
                resolve(true);
              },
              (err: any) => {
                console.error("[Alayn Printer] Write failed:", err);
                bt.disconnect();
                resolve(false);
              }
            );
          },
          (connectErr: any) => {
            console.error("[Alayn Printer] Bluetooth connection failed:", connectErr);
            resolve(false);
          }
        );
      },
      (listErr: any) => {
        console.error("[Alayn Printer] Failed to query paired Bluetooth devices:", listErr);
        resolve(false);
      }
    );
  });
}

/**
 * ⚡ Strategy 3: Optional RawBT intent - ONLY invoked if user explicitly opted in
 */
function printViaAndroidStreamIntent(bytes: Uint8Array, plainText: string): boolean {
  if (typeof window === "undefined" || !isAndroidDevice()) return false;

  try {
    const base64Bytes = uint8ArrayToBase64(bytes);
    const intentUrl = `intent:base64,${base64Bytes}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.title=Alayn%20Order;end;`;

    const anchor = document.createElement("a");
    anchor.href = intentUrl;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
    }, 1500);

    return true;
  } catch (err) {
    console.error("[Alayn Printer] Android Intent print failed:", err);
    return false;
  }
}

/**
 * 🍳 Unified Auto-Print for Kitchen Order Ticket (KOT)
 * Dispatches cleanly without unwanted app redirects.
 */
export async function autoPrintKOT(order: any, isCancellation = false, paperWidth: "80mm" | "58mm" = "80mm"): Promise<PrintResult> {
  const bytes = buildKOTBytes(order, isCancellation, paperWidth);

  // Step 1: If running inside Native Android APK shell (Bluetooth SPP)
  if (isNativeApp()) {
    const success = await printViaNativeBluetooth(bytes);
    if (success) {
      return { success: true, channel: "bluetooth-native" };
    }
  }

  // Step 2: If Web Bluetooth printer is connected directly in Chrome
  if (cachedCharacteristic) {
    const success = await printViaWebBluetooth(bytes);
    if (success) {
      return { success: true, channel: "web-bluetooth" };
    }
  }

  // Step 2B: If USB Thermal Printer is connected via Web Serial
  if (cachedSerialPort) {
    const success = await printViaWebSerial(bytes);
    if (success) {
      return { success: true, channel: "web-serial" as any };
    }
  }

  // Step 3: ONLY if user explicitly enabled RawBT in settings
  const userMode = typeof window !== "undefined" ? localStorage.getItem("alayn_print_mode") : "system";
  if (userMode === "rawbt" && isAndroidDevice()) {
    const plainText = buildFormattedPlainText(order, "KOT", paperWidth);
    const success = printViaAndroidStreamIntent(bytes, plainText);
    if (success) {
      return { success: true, channel: "android-stream" };
    }
  }

  // Step 4: Direct System Thermal Fallback (Silent iframe print / OS print dialog)
  try {
    const html = buildKotHtml(order, isCancellation, paperWidth);
    const printed = await printThermalHtml(html);
    return { success: printed, channel: "kiosk-system" };
  } catch (err: any) {
    console.error("[Alayn Printer] System KOT print failed:", err);
    return { success: false, channel: "kiosk-system", error: err?.message };
  }
}

/**
 * 🖨️ Builds standard thermal HTML for Kitchen Order Tickets
 */
export function buildKotHtml(order: any, isCancellation = false, paperWidth: "80mm" | "58mm" = "80mm"): string {
  const actualOrder = (order as any)?.data || order || {};
  const orderNumber = actualOrder.orderNumber || actualOrder.orderNo || (actualOrder.id ? String(actualOrder.id).slice(0, 8) : "KOT-1");
  const tableDisplay = actualOrder.tableNumber || actualOrder.tableNo ? `Table ${actualOrder.tableNumber || actualOrder.tableNo}` : "Counter Direct";
  const orderSource = (actualOrder.orderSource || actualOrder.source || "DINE-IN").toUpperCase();
  const outletName = actualOrder.outlet?.name || "ALAYN RESTAURANT";
  const serverName = actualOrder.placedByName || (actualOrder.placedByRole ? `Staff (${actualOrder.placedByRole})` : "Staff");
  const itemsList = actualOrder.items || actualOrder.orderItems || [];
  const maxKotNo = Math.max(...itemsList.map((i: any) => i.kotNo || 1), 1);
  const printWidth = paperWidth === "80mm" ? "78mm" : "56mm";
  const timestamp = actualOrder.createdAt
    ? new Date(actualOrder.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const cancelTimestamp = actualOrder.cancelledAt
    ? new Date(actualOrder.cancelledAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : timestamp;

  const cancelReason = actualOrder.comment || actualOrder.cancelReason;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${isCancellation ? "VOID-KOT" : "KOT"}-${orderNumber}</title>
        <meta charset="UTF-8" />
        <style>
          @page { size: ${paperWidth} auto; margin: 0mm; }
          @media print {
            html, body {
              width: ${printWidth};
              margin: 0 auto;
              padding: 0;
              background: #fff !important;
              color: #000 !important;
            }
          }
          * { box-sizing: border-box; color: #000 !important; font-family: 'Courier New', Courier, monospace !important; }
          body { width: ${printWidth}; margin: 0 auto; padding: 4mm 2mm; font-size: 13px; line-height: 1.3; }
          .center { text-align: center; }
          .bold { font-weight: 900; }
          .cancel-banner { border: 2px solid #000; padding: 6px; text-align: center; font-weight: 900; margin: 8px 0; }
          .meta-table { width: 100%; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin: 6px 0; font-size: 12px; }
          .meta-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .items-header { display: flex; justify-content: space-between; font-weight: 900; border-bottom: 1px solid #000; padding: 4px 0; margin-top: 8px; }
          .item-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #aaa; }
          .item-qty { border: 1.5px solid #000; padding: 1px 6px; font-weight: 900; min-width: 26px; text-align: center; }
          .footer-line { text-align: center; font-weight: 900; border-top: 1.5px dashed #000; margin-top: 14px; padding-top: 8px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 15px; text-transform: uppercase;">${outletName}</div>
        <div class="center" style="font-size: 11px; margin-bottom: 6px;">KITCHEN ORDER TICKET (KOT)</div>
        ${isCancellation
          ? '<div class="cancel-banner"><div style="font-size: 14px; font-weight: 900;">*** VOID / CANCELLED ***</div><div style="font-size: 11px; font-weight: 800; margin-top: 2px;">DO NOT PREPARE FOOD</div></div>'
          : '<div class="center bold" style="font-size: 12px; border: 1px solid #000; padding: 2px 8px; display: inline-block; margin: 4px 0;">KOT #' + maxKotNo + '</div>'
        }
        <div class="center bold" style="font-size: 15px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 6px 0;">
          ${tableDisplay.toUpperCase()} (${orderSource})
        </div>
        <div class="meta-table">
          <div class="meta-row"><span>Order #:</span><span class="bold">${orderNumber}</span></div>
          <div class="meta-row"><span>Staff:</span><span>${serverName}</span></div>
          <div class="meta-row"><span>Placed:</span><span>${timestamp}</span></div>
          ${isCancellation ? '<div class="meta-row bold"><span>Cancelled:</span><span>' + cancelTimestamp + '</span></div>' : ""}
          ${actualOrder.customerName ? '<div class="meta-row"><span>Customer:</span><span>' + actualOrder.customerName + '</span></div>' : ""}
          ${isCancellation && cancelReason ? '<div style="margin-top: 4px; padding: 4px; border-left: 2px solid #000; font-size: 11px;"><strong>Reason:</strong> ' + cancelReason + '</div>' : ""}
        </div>
        <div class="items-header"><span>ITEM</span><span>QTY</span></div>
        ${itemsList.map((item: any) => {
          const line = billItemRows(item);
          // The kitchen needs every add-on to prepare the dish (prices don't matter here)
          const addons = line.addons.map((a) => '<div style="font-size: 12px; font-weight: 800; margin-left: 10px;">+ ' + a.name + '</div>').join("");
          const note = item.notes ? '<div style="font-size: 10px; font-style: italic; margin-left: 10px;">Note: ' + item.notes + '</div>' : "";
          return `
            <div class="item-row">
              <div style="flex: 1; padding-right: 8px;"><span class="bold">${line.name}</span>${addons}${note}</div>
              <div class="item-qty">${item.quantity}</div>
            </div>
          `;
        }).join("")}
        <div class="footer-line">
          ${isCancellation ? "*** CANCELLED • DO NOT PREPARE ***" : '--- END OF KOT #' + maxKotNo + ' ---'}
        </div>
      </body>
    </html>
  `;
}

/**
 * 🧾 Builds standard thermal HTML for Customer Bill / Tax Invoice
 */
export function buildReceiptHtml(order: any, paperWidth: "80mm" | "58mm" = "80mm"): string {
  const actualOrder = (order as any)?.data || order || {};
  const outlet = actualOrder.outlet || {};
  const outletName = outlet.name || "ALAYN RESTAURANT";
  const outletAddress = outlet.address || "";
  const outletPhone = outlet.phone || "";
  const gstin = outlet.gstin || "";
  const fssai = outlet.fssai || "";

  const orderNumber = actualOrder.orderNumber || actualOrder.orderNo || (actualOrder.id ? String(actualOrder.id).slice(0, 8).toUpperCase() : "BILL-1");
  const tableDisplay = actualOrder.tableNumber || actualOrder.tableNo
    ? `Table ${actualOrder.tableNumber || actualOrder.tableNo}`
    : actualOrder.source === "COUNTER" || actualOrder.source === "POS"
    ? "Counter"
    : actualOrder.source || "Dine In";

  const cashierName = receiptCashierName(actualOrder);
  const customerName = actualOrder.customerName || "";
  const customerPhone = actualOrder.customerPhone || "";
  const printWidth = paperWidth === "80mm" ? "78mm" : "56mm";

  const timestamp = actualOrder.createdAt
    ? new Date(actualOrder.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const itemsList = actualOrder.items || actualOrder.orderItems || [];

  // Financial math (in Rupees)
  const subtotalRupees = actualOrder.subtotalPaise !== undefined
    ? actualOrder.subtotalPaise / 100
    : actualOrder.subtotal !== undefined
    ? Number(actualOrder.subtotal)
    : 0;

  const discountRupees = actualOrder.discountPaise !== undefined
    ? actualOrder.discountPaise / 100
    : actualOrder.discountAmount !== undefined
    ? Number(actualOrder.discountAmount)
    : 0;

  const grandTotalRupees = actualOrder.totalPaise !== undefined
    ? actualOrder.totalPaise / 100
    : actualOrder.totalAmount !== undefined
    ? Number(actualOrder.totalAmount)
    : 0;

  const cgstRupees = actualOrder.cgstPaise !== undefined
    ? actualOrder.cgstPaise / 100
    : actualOrder.cgstAmount !== undefined
    ? Number(actualOrder.cgstAmount)
    : 0;

  const sgstRupees = actualOrder.sgstPaise !== undefined
    ? actualOrder.sgstPaise / 100
    : actualOrder.sgstAmount !== undefined
    ? Number(actualOrder.sgstAmount)
    : 0;

  const serviceTaxRupees = actualOrder.serviceTaxPaise !== undefined
    ? actualOrder.serviceTaxPaise / 100
    : actualOrder.serviceTaxAmount !== undefined
    ? Number(actualOrder.serviceTaxAmount)
    : 0;

  const roundOffRupees = actualOrder.roundOffPaise !== undefined
    ? actualOrder.roundOffPaise / 100
    : actualOrder.roundOffAmount !== undefined
    ? Number(actualOrder.roundOffAmount)
    : 0;

  const gstType = actualOrder.gstRegistrationType || outlet.gstRegistrationType || "REGULAR";
  const invoiceTitle = gstType === "COMPOSITION"
    ? "BILL OF SUPPLY"
    : gstType === "UNREGISTERED"
    ? "RETAIL INVOICE"
    : "TAX INVOICE";

  const paymentLines = getPaymentLines(actualOrder);
  const paymentMethodLabel = paymentLines.length > 1
    ? "SPLIT"
    : (actualOrder.paymentMethod || actualOrder.payments?.[0]?.method || "PAID").toUpperCase();
  const splitRows = paymentLines.length > 1
    ? paymentLines.map((line) =>
        `<div class="summary-row"><span>${escapeHtml(line.label)}${line.reference ? ` (Ref ${escapeHtml(line.reference)})` : ""}</span><span>₹${(line.amountPaise / 100).toFixed(2)}</span></div>`
      ).join("")
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${invoiceTitle} — ${orderNumber}</title>
        <meta charset="UTF-8" />
        <style>
          @page { size: ${paperWidth} auto; margin: 0mm; }
          @media print {
            html, body {
              width: ${printWidth};
              margin: 0 auto;
              padding: 0;
              background: #fff !important;
              color: #000 !important;
            }
          }
          * { box-sizing: border-box; color: #000 !important; font-family: 'Courier New', Courier, monospace !important; }
          body { width: ${printWidth}; margin: 0 auto; padding: 4mm 2mm; font-size: 12px; line-height: 1.3; }
          .center { text-align: center; }
          .bold { font-weight: 900; }
          .meta-table { width: 100%; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 5px 0; font-size: 11px; }
          .meta-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .items-header { display: flex; justify-content: space-between; font-weight: 900; border-bottom: 1px solid #000; padding: 4px 0; margin-top: 6px; font-size: 11px; }
          .item-block { padding: 4px 0; border-bottom: 1px dotted #ccc; }
          .item-row { display: flex; justify-content: space-between; font-size: 12px; }
          .addon-row { display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px; }
          .summary-table { width: 100%; border-top: 1px dashed #000; padding: 6px 0; margin-top: 6px; font-size: 11px; }
          .summary-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total-box { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 6px 0; margin: 8px 0; font-size: 14px; font-weight: 900; display: flex; justify-content: space-between; }
          .footer-line { text-align: center; font-weight: 800; margin-top: 12px; padding-top: 6px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px; text-transform: uppercase;">${outletName}</div>
        ${outletAddress ? `<div class="center" style="font-size: 10px; margin-top: 2px;">${outletAddress}</div>` : ""}
        ${outletPhone ? `<div class="center" style="font-size: 10px;">Ph: ${outletPhone}</div>` : ""}
        ${gstin ? `<div class="center" style="font-size: 10px; font-weight: bold; margin-top: 2px;">GSTIN: ${gstin}</div>` : ""}
        ${fssai ? `<div class="center" style="font-size: 10px;">FSSAI: ${fssai}</div>` : ""}

        <div class="center bold" style="font-size: 12px; border: 1px solid #000; padding: 3px 6px; margin: 6px auto; display: inline-block;">
          ${invoiceTitle}
        </div>

        <div class="meta-table">
          <div class="meta-row"><span>Bill No:</span><span class="bold">#${orderNumber}</span></div>
          <div class="meta-row"><span>Date:</span><span>${timestamp}</span></div>
          <div class="meta-row"><span>Table:</span><span class="bold">${tableDisplay}</span></div>
          ${cashierName ? `<div class="meta-row"><span>Cashier:</span><span>${cashierName}</span></div>` : ""}
          ${customerName ? `<div class="meta-row"><span>Customer:</span><span>${customerName}</span></div>` : ""}
          ${customerPhone ? `<div class="meta-row"><span>Phone:</span><span>${customerPhone}</span></div>` : ""}
        </div>

        <div class="items-header">
          <span style="flex: 2;">ITEM</span>
          <span style="flex: 1; text-align: center;">QTY</span>
          <span style="flex: 1; text-align: right;">PRICE</span>
          <span style="flex: 1; text-align: right;">AMOUNT</span>
        </div>

        ${itemsList.map((item: any) => {
          const line = billItemRows(item);
          const addonRows = line.addons.map((a) => `
            <div class="addon-row">
              <span style="flex: 2; padding-left: 8px;">+ ${a.name}</span>
              <span style="flex: 1; text-align: center;">${line.qty}</span>
              <span style="flex: 1; text-align: right;">${a.unitRupees.toFixed(2)}</span>
              <span style="flex: 1; text-align: right;">${a.amountRupees.toFixed(2)}</span>
            </div>
          `).join("");
          return `
            <div class="item-block">
              <div class="item-row">
                <span style="flex: 2; font-weight: bold;">${line.name}</span>
                <span style="flex: 1; text-align: center;">${line.qty}</span>
                <span style="flex: 1; text-align: right;">${line.unitRupees.toFixed(2)}</span>
                <span style="flex: 1; text-align: right; font-weight: bold;">${line.amountRupees.toFixed(2)}</span>
              </div>
              ${addonRows}
            </div>
          `;
        }).join("")}

        <div class="summary-table">
          <div class="summary-row"><span>Subtotal:</span><span>₹${subtotalRupees.toFixed(2)}</span></div>
          ${discountRupees > 0 ? `<div class="summary-row"><span>Discount:</span><span>-₹${discountRupees.toFixed(2)}</span></div>` : ""}
          ${cgstRupees > 0 ? `<div class="summary-row"><span>CGST:</span><span>₹${cgstRupees.toFixed(2)}</span></div>` : ""}
          ${sgstRupees > 0 ? `<div class="summary-row"><span>SGST:</span><span>₹${sgstRupees.toFixed(2)}</span></div>` : ""}
          ${serviceTaxRupees > 0 ? `<div class="summary-row"><span>Service Tax / Charge:</span><span>₹${serviceTaxRupees.toFixed(2)}</span></div>` : ""}
          ${roundOffRupees !== 0 ? `<div class="summary-row"><span>Round Off:</span><span>${roundOffRupees > 0 ? "+" : ""}₹${roundOffRupees.toFixed(2)}</span></div>` : ""}
        </div>

        <div class="total-box">
          <span>GRAND TOTAL:</span>
          <span>₹${grandTotalRupees.toFixed(2)}</span>
        </div>

        <div class="center bold" style="font-size: 12px; margin: 4px 0;">
          PAID VIA ${paymentMethodLabel}
        </div>
        ${splitRows ? `<div class="summary-table">${splitRows}</div>` : ""}

        <div class="footer-line">
          <div>THANK YOU FOR DINING WITH US!</div>
          <div style="font-size: 9px; margin-top: 4px; color: #555;">— POWERED BY ALAYN POS —</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * 🧾 Unified Auto-Print for Customer Bill / Receipt
 * Dispatches cleanly without unwanted app redirects.
 */
export async function autoPrintReceipt(order: any, paperWidth: "80mm" | "58mm" = "80mm"): Promise<PrintResult> {
  const bytes = buildReceiptBytes(order, paperWidth);

  // Step 1: If running inside Native Android APK shell (Bluetooth SPP)
  if (isNativeApp()) {
    const success = await printViaNativeBluetooth(bytes);
    if (success) {
      return { success: true, channel: "bluetooth-native" };
    }
  }

  // Step 2: If Web Bluetooth printer is connected directly in Chrome
  if (cachedCharacteristic) {
    const success = await printViaWebBluetooth(bytes);
    if (success) {
      return { success: true, channel: "web-bluetooth" };
    }
  }

  // Step 2B: If USB Thermal Printer is connected via Web Serial
  if (cachedSerialPort) {
    const success = await printViaWebSerial(bytes);
    if (success) {
      return { success: true, channel: "web-serial" as any };
    }
  }

  // Step 3: ONLY if user explicitly enabled RawBT in settings
  const userMode = typeof window !== "undefined" ? localStorage.getItem("alayn_print_mode") : "system";
  if (userMode === "rawbt" && isAndroidDevice()) {
    const plainText = buildFormattedPlainText(order, "BILL", paperWidth);
    const success = printViaAndroidStreamIntent(bytes, plainText);
    if (success) {
      return { success: true, channel: "android-stream" };
    }
  }

  // Step 4: Direct System Thermal Fallback (Silent iframe print)
  try {
    const html = buildReceiptHtml(order, paperWidth);
    const printed = await printThermalHtml(html);
    return { success: printed, channel: "kiosk-system" };
  } catch (err: any) {
    console.error("[Alayn Printer] System receipt print failed:", err);
    return { success: false, channel: "kiosk-system", error: err?.message };
  }
}
