import { api } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import {
  CartResponse,
  AddToCartPayload,
  UpdateCartItemPayload,
  SyncCartPayload,
} from "../types/cart";

// 1. Get user cart
export const getCartApi = async (): Promise<CartResponse> => {
  const response = await api.get<CartResponse>(API_ENDPOINTS.CART.BASE);
  return response.data;
};

// 2. Add product to cart
export const addToCartApi = async (
  payload: AddToCartPayload
): Promise<CartResponse> => {
  const response = await api.post<CartResponse>(
    API_ENDPOINTS.CART.ITEMS,
    payload
  );
  return response.data;
};

// 3. Update cart item quantity
export const updateCartItemApi = async ({
  id,
  quantity,
}: UpdateCartItemPayload): Promise<CartResponse> => {
  const response = await api.put<CartResponse>(
    API_ENDPOINTS.CART.ITEM_BY_ID(id),
    { quantity }
  );
  return response.data;
};

// 4. Remove item from cart
export const removeCartItemApi = async (
  id: string
): Promise<CartResponse> => {
  const response = await api.delete<CartResponse>(
    API_ENDPOINTS.CART.ITEM_BY_ID(id)
  );
  return response.data;
};

// 5. Clear all items in cart
export const clearCartApi = async (): Promise<CartResponse> => {
  const response = await api.delete<CartResponse>(API_ENDPOINTS.CART.CLEAR);
  return response.data;
};

// 6. Sync guest cart items on login
export const syncCartApi = async (
  payload: SyncCartPayload
): Promise<CartResponse> => {
  const response = await api.post<CartResponse>(
    API_ENDPOINTS.CART.SYNC,
    payload
  );
  return response.data;
};
