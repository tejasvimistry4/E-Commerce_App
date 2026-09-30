import { OrderStatus, PaymentMethod, PaymentStatus, ReturnStatus } from "@prisma/client";

export { ReturnStatus };

export interface ShippingAddressDto {
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface CreateOrderDto {
  shippingAddress: ShippingAddressDto;
  billingAddress?: ShippingAddressDto;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  saveAddress?: boolean;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface CancelOrderDto {
  reason: string;
}

export interface CreateReturnRequestDto {
  reason: string;
  details?: string;
}

export interface UpdateReturnStatusDto {
  status: ReturnStatus;
  adminComment?: string;
}

export interface ReturnFilterParams {
  page?: number;
  limit?: number;
  status?: ReturnStatus | "ALL";
  search?: string;
}

export interface OrderFilterParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | "ALL";
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderItemResponse {
  id: string;
  orderId: string;
  productId: string | null;
  variantId?: string | null;
  variantAttributes?: Record<string, string> | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface ReturnRequestResponse {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  details: string | null;
  status: ReturnStatus;
  adminComment: string | null;
  refundAmount: number;
  refundedAt: Date | null;
  pickedUpAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order?: OrderResponse;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReturnListResponse {
  returns: ReturnRequestResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderResponse {
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
  shippingAddress: ShippingAddressDto;
  billingAddress?: ShippingAddressDto | null;
  notes: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  deliveredAt: Date | null;
  returnUntil: Date | null;
  returnRequest?: ReturnRequestResponse | null;
  items: OrderItemResponse[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type {
  RazorpayCheckoutData,
  CreateOrderResult,
  VerifyPaymentDto,
  PaymentFailedDto,
  CreateRazorpayOrderParams,
  RazorpayOrderResult,
} from "../payments/payment.types";


export interface OrderListResponse {
  orders: OrderResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderStatsResponse {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}


