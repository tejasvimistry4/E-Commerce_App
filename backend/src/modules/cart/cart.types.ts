import { ProductVariantDto } from "../products/product.types";

export interface AddToCartDto {
  productId: string;
  variantId?: string | null;
  quantity?: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface SyncCartItemDto {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface SyncCartDto {
  items: SyncCartItemDto[];
}

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

export interface CartItemSummary {
  id: string;
  productId: string;
  variantId?: string | null;
  variant?: CartVariantSummary | null;
  quantity: number;
  price: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    thumbnail: string | null;
    images: string[];
    isActive: boolean;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  isOutOfStock: boolean;
  maxAvailableQuantity: number;
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

export interface FullCartResponse {
  id: string;
  userId: string;
  items: CartItemSummary[];
  summary: CartCalculationSummary;
  createdAt: Date;
  updatedAt: Date;
}
