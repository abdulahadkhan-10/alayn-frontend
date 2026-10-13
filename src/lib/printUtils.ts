/**
 * Safe and high-performance print utilities for ALAYN POS.
 *
 * Supports two robust modes:
 * 1. ⚡ 1-Click Direct Print via RawBT (Android Tablet / Samsung Galaxy Tab):
 *    Directly invokes RawBT package via Android Intent with Base64 HTML payload.
 *    Bypasses the entire Android System Print Spooler (no "Save as PDF", no printer dropdown, no preview taps).
 *
 * 2. 🖨️ Universal System Print via hidden iframe:
 *    Cross-platform fallback (PC, Mac, iPad) that cleanly avoids popup blockers and premature window.close issues.
 */

/**
 * UTF-8 safe Base64 encoder for browser environments.
 * Handles Unicode, ₹ currency symbol, em-dashes, and special characters cleanly.
 */
export function toBase64Utf8(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * ⚡ 1-Click Fast Direct Print via RawBT on Android tablets.
 * When Uint8Array ESC/POS data is supplied, it sends raw bytes directly to the thermal printer
 * bypassing HTML rendering, which ELIMINATES watermarks and fixes microscopic scaling.
 */
export function printViaRawBTEscPos(bytes: Uint8Array): boolean {
  if (typeof window === "undefined") return false;

  try {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Chrome Android Intent targeted at RawBT package with raw ESC/POS byte stream
    const intentUrl = `intent:base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.title=Alayn%20Order;end;`;

    const anchor = document.createElement("a");
    anchor.href = intentUrl;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
    }, 1500);

    return true;
  } catch (err) {
    console.error("RawBT ESC/POS direct stream failed:", err);
    return false;
  }
}

/**
 * Direct Print via RawBT with HTML payload fallback.
 */
export function printViaRawBTDirect(htmlContent: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const base64 = toBase64Utf8(htmlContent);

    // Chrome Android Intent targeted specifically at RawBT package
    const intentUrl = `intent:data:text/html;base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

    const anchor = document.createElement("a");
    anchor.href = intentUrl;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
    }, 1500);

    return true;
  } catch (err) {
    console.error("1-Click RawBT direct print failed:", err);
    return false;
  }
}

/**
 * Safely prints HTML content via a hidden iframe.
 * Avoids popup blockers and premature window.close race conditions.
 */
export function printThermalHtml(htmlContent: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    try {
      // Remove any leftover print frames from previous prints
      const existing = document.getElementById("alayn-thermal-print-frame");
      if (existing) {
        existing.remove();
      }

      const iframe = document.createElement("iframe");
      iframe.id = "alayn-thermal-print-frame";
      iframe.setAttribute(
        "style",
        "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;z-index:-9999;"
      );
      document.body.appendChild(iframe);

      const frameWindow = iframe.contentWindow;
      const frameDoc = frameWindow?.document || iframe.contentDocument;

      if (!frameDoc || !frameWindow) {
        // Fallback to window.open if iframe is somehow unavailable
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 250);
          resolve(true);
        } else {
          resolve(false);
        }
        return;
      }

      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      const executePrint = () => {
        try {
          frameWindow.focus();
          frameWindow.print();
          resolve(true);
        } catch (printErr) {
          console.error("Iframe print invocation failed, falling back to window.open:", printErr);
          const fallbackWin = window.open("", "_blank");
          if (fallbackWin) {
            fallbackWin.document.write(htmlContent);
            fallbackWin.document.close();
            setTimeout(() => {
              fallbackWin.focus();
              fallbackWin.print();
            }, 250);
          }
          resolve(false);
        } finally {
          // Delay removal to give Android/Samsung print spooler dialog ample time to process
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 60000);
        }
      };

      // Ensure content is parsed and rendered before calling print
      if (frameDoc.readyState === "complete") {
        setTimeout(executePrint, 150);
      } else {
        iframe.onload = () => setTimeout(executePrint, 150);
        setTimeout(executePrint, 500); // safety fallback
      }
    } catch (err) {
      console.error("Failed to execute thermal print:", err);
      resolve(false);
    }
  });
}
