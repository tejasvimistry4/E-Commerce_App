import { RazorpayOrderPayload, VerifyPaymentPayload } from "../types/order";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Dynamically loads the official Razorpay Checkout JavaScript SDK
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script is already present in document
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export interface LaunchRazorpayCheckoutParams {
  razorpayData: RazorpayOrderPayload;
  orderId: string;
  onSuccess: (verificationPayload: VerifyPaymentPayload) => Promise<void> | void;
  onDismiss?: () => void;
  onFailure?: (error: { code: string; description: string; paymentId?: string }) => void;
}

/**
 * Opens Razorpay standard checkout popup with security parameters
 */
export const launchRazorpayCheckout = async ({
  razorpayData,
  orderId,
  onSuccess,
  onDismiss,
  onFailure,
}: LaunchRazorpayCheckoutParams): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection.");
  }

  const options = {
    key: razorpayData.keyId,
    amount: razorpayData.amount, // in paise
    currency: razorpayData.currency || "INR",
    name: "E-Commerce Store",
    description: `Payment for Order #${razorpayData.orderNumber}`,
    order_id: razorpayData.orderId,
    prefill: {
      name: razorpayData.prefill?.name || "",
      email: razorpayData.prefill?.email || "",
      contact: razorpayData.prefill?.contact || "",
    },
    notes: {
      orderId: orderId,
      orderNumber: razorpayData.orderNumber,
    },
    theme: {
      color: "#4f46e5", // Indigo-600 matching brand theme
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      try {
        await onSuccess({
          orderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      } catch (err) {
        console.error("Payment handler error:", err);
      }
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) {
          onDismiss();
        }
      },
      escape: true,
      backdropclose: false,
    },
  };

  const razorpayInstance = new window.Razorpay(options);

  razorpayInstance.on(
    "payment.failed",
    (response: { error: { code: string; description: string; metadata?: any } }) => {
      console.warn("Razorpay payment failed:", response.error);
      if (onFailure) {
        onFailure({
          code: response.error.code,
          description: response.error.description,
          paymentId: response.error.metadata?.payment_id,
        });
      }
    }
  );

  razorpayInstance.open();
};
