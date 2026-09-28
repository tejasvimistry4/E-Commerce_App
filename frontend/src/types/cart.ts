import { Product, ProductVariant } from "./product";

export interface CartVariantSummary {
  id: string;
  sku?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  images: string[];
  thumbnail?: string | null;
  attributes: Record<string, string>;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  variant?: CartVariantSummary | ProductVariant | null;
  quantity: number;
  price: number;
  totalPrice: number;
  product: Product;
  isOutOfStock?: boolean;
  maxAvailableQuantity?: number;
}

export interface CartCalculationSummary {
  subtotal: number;
  savings: number;
  shippingFee: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isFreeShipping: boolean;
  estimatedTax: number;
  grandTotal: number;
  totalItems: number;
  totalQuantity: number;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  summary: CartCalculationSummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: Cart;
}

export interface AddToCartPayload {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  product?: Product; // for optimistic guest cart addition
  variant?: ProductVariant | null;
}

export interface UpdateCartItemPayload {
  id: string;
  quantity: number;
}

export interface SyncCartPayload {
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
  }>;
}

export interface CartState {
  cart: Cart | null;
  isDrawerOpen: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  appliedCoupon: {
    code: string;
    discountPercent: number;
    discountAmount: number;
  } | null;
}
