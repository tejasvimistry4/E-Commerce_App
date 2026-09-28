import { api } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  WishlistResponse,
  ToggleWishlistResponse,
  AddToWishlistPayload,
} from "../types/wishlist";

// 1. Get user's wishlist
export const getWishlistApi = async (): Promise<WishlistResponse> => {
  const response = await api.get<WishlistResponse>(API_ENDPOINTS.WISHLIST.BASE);
  return response.data;
};

// 2. Add product to wishlist
export const addToWishlistApi = async (
  payload: AddToWishlistPayload
): Promise<WishlistResponse> => {
  const response = await api.post<WishlistResponse>(
    API_ENDPOINTS.WISHLIST.ITEMS,
    { productId: payload.productId, variantId: payload.variantId }
  );
  return response.data;
};

// 3. Remove product from wishlist
export const removeFromWishlistApi = async (
  productId: string,
  variantId?: string | null
): Promise<WishlistResponse> => {
  const response = await api.delete<WishlistResponse>(
    API_ENDPOINTS.WISHLIST.ITEM_BY_PRODUCT_ID(productId),
    { params: { variantId } }
  );
  return response.data;
};

// 4. Toggle product in wishlist
export const toggleWishlistApi = async (
  productId: string,
  variantId?: string | null
): Promise<ToggleWishlistResponse> => {
  const response = await api.post<ToggleWishlistResponse>(
    API_ENDPOINTS.WISHLIST.TOGGLE,
    { productId, variantId }
  );
  return response.data;
};

// 5. Clear entire wishlist
export const clearWishlistApi = async (): Promise<WishlistResponse> => {
  const response = await api.delete<WishlistResponse>(
    API_ENDPOINTS.WISHLIST.CLEAR
  );
  return response.data;
};
