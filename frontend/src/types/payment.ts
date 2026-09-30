export interface RazorpayOrderPayload {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  orderNumber: string;
  prefill?: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentFailedPayload {
  orderId: string;
  errorReason?: string;
  errorCode?: string;
  paymentId?: string;
}
