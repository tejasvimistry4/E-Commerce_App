export interface AddToWishlistDto {
  productId: string;
  variantId?: string | null;
}

export interface WishlistItemVariant {
  id: string;
  sku?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  thumbnail?: string | null;
  images: string[];
  attributes: Record<string, string>;
  isActive: boolean;
}

export interface WishlistItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  sku?: string | null;
  thumbnail?: string | null;
  images: string[];
  isActive: boolean;
  isFeatured?: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface WishlistItemResponse {
  id: string;
  userId: string;
  productId: string;
  variantId?: string | null;
  variant?: WishlistItemVariant | null;
  product: WishlistItemProduct;
  isOutOfStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistResponse {
  items: WishlistItemResponse[];
  totalItems: number;
}

export interface ToggleWishlistResponse {
  inWishlist: boolean;
  message: string;
  productId: string;
  variantId?: string | null;
  wishlist: WishlistResponse;
}
