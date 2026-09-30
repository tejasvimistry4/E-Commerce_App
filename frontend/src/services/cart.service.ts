import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
  syncCartApi,
} from "../api/cart.api";
import {
  Cart,
  AddToCartPayload,
  UpdateCartItemPayload,
  SyncCartPayload,
  CartResponse,
} from "../types/cart";
import {
  getToken,
  getGuestCart,
  setGuestCart,
  clearGuestCart,
} from "../utils/localStorage";

export class CartService {
  static async getCart(): Promise<CartResponse> {
    return getCartApi();
  }

  static async addToCart(payload: AddToCartPayload): Promise<CartResponse> {
    return addToCartApi(payload);
  }

  static async updateQuantity(payload: UpdateCartItemPayload): Promise<CartResponse> {
    return updateCartItemApi(payload);
  }

  static async removeItem(cartItemId: string): Promise<CartResponse> {
    return removeCartItemApi(cartItemId);
  }

  static async clearCart(): Promise<CartResponse> {
    return clearCartApi();
  }

  static async syncGuestCart(payload: SyncCartPayload): Promise<CartResponse> {
    return syncCartApi(payload);
  }

  static getGuestItems() {
    return getGuestCart();
  }

  static saveGuestItems(items: any[]) {
    setGuestCart(items);
  }

  static emptyGuestCart() {
    clearGuestCart();
  }
}

export default CartService;
