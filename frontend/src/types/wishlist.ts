import { Product, ProductVariant } from "./product";

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string | null;
  variant?: ProductVariant | null;
  product: Product;
  isOutOfStock: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WishlistData {
  items: WishlistItem[];
  totalItems: number;
}

export interface WishlistResponse {
  success: boolean;
  message?: string;
  data: WishlistData;
}

export interface ToggleWishlistData {
  inWishlist: boolean;
  message: string;
  productId: string;
  variantId?: string | null;
  wishlist: WishlistData;
}

export interface ToggleWishlistResponse {
  success: boolean;
  message: string;
  data: ToggleWishlistData;
}

export interface AddToWishlistPayload {
  productId: string;
  variantId?: string | null;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface WishlistState {
  items: WishlistItem[];
  totalItems: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}
