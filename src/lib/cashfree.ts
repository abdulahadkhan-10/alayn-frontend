declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_modal" | "_self" | "_blank" | HTMLElement;
        appearance?: {
          theme?: "light" | "dark";
          variables?: Record<string, string>;
        };
      }) => Promise<{ error?: any; paymentDetails?: any; redirect?: boolean }>;
    };
  }
}

let cashfreePromise: Promise<any> | null = null;

export const loadCashfree = (mode: "sandbox" | "production" = "sandbox"): Promise<any> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cashfree SDK cannot be loaded on the server"));
  }

  if (window.Cashfree) {
    return Promise.resolve(window.Cashfree({ mode }));
  }

  if (!cashfreePromise) {
    cashfreePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => {
        if (window.Cashfree) {
          resolve(window.Cashfree({ mode }));
        } else {
          reject(new Error("Cashfree SDK script loaded, but window.Cashfree is undefined"));
        }
      };
      script.onerror = () => {
        cashfreePromise = null;
        reject(new Error("Failed to load Cashfree JS SDK"));
      };
      document.body.appendChild(script);
    });
  }

  return cashfreePromise;
};

export const openCashfreeCheckout = async ({
  paymentSessionId,
  mode = "sandbox",
  onSuccess,
  onFailure,
}: {
  paymentSessionId: string;
  mode?: "sandbox" | "production";
  onSuccess?: (res: any) => void;
  onFailure?: (err: any) => void;
}) => {
  try {
    const cashfree = await loadCashfree(mode);
    const checkoutResult = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_modal",
    });

    if (checkoutResult?.error) {
      console.warn("[Cashfree Checkout Error]", checkoutResult.error);
      if (onFailure) onFailure(checkoutResult.error);
      return checkoutResult;
    }

    if (onSuccess) onSuccess(checkoutResult);
    return checkoutResult;
  } catch (error) {
    console.error("[Cashfree Checkout Exception]", error);
    if (onFailure) onFailure(error);
    throw error;
  }
};
