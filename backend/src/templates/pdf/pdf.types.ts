export interface OrderItemDocumentData {
  id: string;
  productId?: string | null;
  variantId?: string | null;
  variantAttributes?: Record<string, string> | null;
  name: string;
  image?: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
  variant?: {
    sku?: string | null;
    attributes?: Record<string, string> | null;
  } | null;
}

export interface OrderUserDocumentData {
  id: string;
  name: string;
  email: string;
  businessName?: string | null;
}

export interface OrderAddressDocumentData {
  fullName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  [key: string]: any;
}

export interface OrderDocumentData {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shippingFee: number;
  tax: number;
  grandTotal: number;
  shippingAddress: any;
  billingAddress?: any;
  notes?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  cancelledAt?: Date | string | null;
  cancelReason?: string | null;
  deliveredAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items: OrderItemDocumentData[];
  user?: OrderUserDocumentData | null;
}

export interface StatusBadgeStyle {
  text: string;
  bg: string;
  border: string;
  color: string;
}
