import { OrderResponse } from "../orders/order.types";

export interface CreateRazorpayOrderParams {
  amount: number; // in INR (will be converted to paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: string;
  notes: Record<string, string>;
  createdAt: number;
}

export interface RazorpayCheckoutData {
  orderId: string; // Razorpay Order ID (e.g. order_xxx)
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

export interface CreateOrderResult {
  order: OrderResponse;
  razorpay?: RazorpayCheckoutData;
}

export interface VerifyPaymentDto {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentFailedDto {
  orderId: string;
  errorReason?: string;
  errorCode?: string;
  paymentId?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  order: OrderResponse;
}
