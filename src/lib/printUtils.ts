/**
 * Safely prints HTML content via a hidden iframe.
 *
 * Why this is essential for Mobile & Tablet POS (e.g. Samsung Galaxy Tab, iPad):
 * 1. Mobile browsers (Chrome for Android, Samsung Internet, iOS Safari) strictly block window.open() popups.
 * 2. On mobile/tablets, calling window.close() after window.print() prematurely terminates the OS print sheet.
 * 3. An iframe triggers the OS Print Spooler directly over the current page without tab flickering or popup blockers.
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
