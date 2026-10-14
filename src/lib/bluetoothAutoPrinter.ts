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

export interface PrintResult {
  success: boolean;
  channel: "bluetooth-native" | "web-bluetooth" | "android-stream" | "kiosk-system";
  message?: string;
  error?: any;
}

// Global cached connection for Web Bluetooth
let cachedDevice: any = null;
let cachedCharacteristic: any = null;

/** Check if Web Bluetooth is supported in the current browser */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean((navigator as any).bluetooth);
}

/** Check if a Web Bluetooth printer is currently connected */
export function isPrinterConnected(): boolean {
  return Boolean(cachedCharacteristic && cachedDevice && cachedDevice.gatt?.connected);
}

/** Get the display name of the paired printer */
export function getConnectedPrinterName(): string | null {
  if (isPrinterConnected()) {
    return cachedDevice?.name || "Bluetooth Printer";
  }
  if (typeof window !== "undefined") {
    return localStorage.getItem("alayn_bt_printer_name");
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

  // Step 3: ONLY if user explicitly enabled RawBT in settings
  const userMode = typeof window !== "undefined" ? localStorage.getItem("alayn_print_mode") : "system";
  if (userMode === "rawbt" && isAndroidDevice()) {
    const plainText = buildFormattedPlainText(order, "KOT", paperWidth);
    const success = printViaAndroidStreamIntent(bytes, plainText);
    if (success) {
      return { success: true, channel: "android-stream" };
    }
  }

  // Step 4: Fallback to system print (window.print / printThermalHtml) - ZERO redirects!
  return { success: false, channel: "kiosk-system", message: "Fallback to system print" };
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

  // Step 3: ONLY if user explicitly enabled RawBT in settings
  const userMode = typeof window !== "undefined" ? localStorage.getItem("alayn_print_mode") : "system";
  if (userMode === "rawbt" && isAndroidDevice()) {
    const plainText = buildFormattedPlainText(order, "BILL", paperWidth);
    const success = printViaAndroidStreamIntent(bytes, plainText);
    if (success) {
      return { success: true, channel: "android-stream" };
    }
  }

  // Step 4: Fallback to system print (window.print / printThermalHtml) - ZERO redirects!
  return { success: false, channel: "kiosk-system", message: "Fallback to system print" };
}
