export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod =
  | "CASH_ON_DELIVERY"
  | "UPI"
  | "CARD"
  | "NET_BANKING"
  | "RAZORPAY";

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKED_UP"
  | "RECEIVED"
  | "REFUNDED";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface SavedAddress extends ShippingAddress {
  id: string;
  userId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

import { ProductVariant } from "./product";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  variantId?: string | null;
  variantAttributes?: Record<string, string> | null;
  variant?: Partial<ProductVariant> | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  details?: string | null;
  status: ReturnStatus;
  adminComment?: string | null;
  refundAmount: number;
  refundedAt?: string | null;
  pickedUpAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

import {
  RazorpayOrderPayload,
  VerifyPaymentPayload,
  PaymentFailedPayload,
} from "./payment";

export type {
  RazorpayOrderPayload,
  VerifyPaymentPayload,
  PaymentFailedPayload,
};



export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingFee: number;
  tax: number;
  grandTotal: number;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress | null;
  notes: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  deliveredAt?: string | null;
  returnUntil?: string | null;
  returnRequest?: ReturnRequest | null;
  items: OrderItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  saveAddress?: boolean;
}

export interface CreateReturnPayload {
  reason: string;
  details?: string;
}

export interface UpdateReturnStatusPayload {
  status: ReturnStatus;
  adminComment?: string;
}

export interface OrderPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  pagination: OrderPagination;
}

export interface OrderSingleResponse {
  success: boolean;
  message?: string;
  data: Order;
  razorpay?: RazorpayOrderPayload;
}

export interface ReturnListResponse {
  success: boolean;
  data: ReturnRequest[];
  pagination: OrderPagination;
}

export interface ReturnSingleResponse {
  success: boolean;
  message?: string;
  data: ReturnRequest;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

export interface OrderStatsResponse {
  success: boolean;
  data: OrderStats;
}


