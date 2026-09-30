import { RootState } from "../store";

export const selectWishlistState = (state: RootState) => state.wishlist;
export const selectWishlistItems = (state: RootState) => state.wishlist.items;
export const selectWishlistTotalItems = (state: RootState) => state.wishlist.totalItems;
export const selectWishlistLoading = (state: RootState) => state.wishlist.loading;
export const selectWishlistActionLoading = (state: RootState) => state.wishlist.actionLoading;
export const selectWishlistError = (state: RootState) => state.wishlist.error;
export const selectIsInWishlist = (productId: string) => (state: RootState) =>
  state.wishlist.items.some((item) => item.productId === productId);
