import {
  getWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  toggleWishlistApi,
  clearWishlistApi,
} from "../api/wishlist.api";
import {
  WishlistResponse,
  ToggleWishlistResponse,
  AddToWishlistPayload,
} from "../types/wishlist";

export class WishlistService {
  static async getWishlist(): Promise<WishlistResponse> {
    return getWishlistApi();
  }

  static async addToWishlist(
    payload: AddToWishlistPayload
  ): Promise<WishlistResponse> {
    return addToWishlistApi(payload);
  }

  static async removeFromWishlist(
    productId: string
  ): Promise<WishlistResponse> {
    return removeFromWishlistApi(productId);
  }

  static async toggleWishlist(
    productId: string
  ): Promise<ToggleWishlistResponse> {
    return toggleWishlistApi(productId);
  }

  static async clearWishlist(): Promise<WishlistResponse> {
    return clearWishlistApi();
  }
}

export default WishlistService;
