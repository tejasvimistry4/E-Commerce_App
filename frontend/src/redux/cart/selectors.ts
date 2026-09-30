import { RootState } from "../store";

export const selectCartState = (state: RootState) => state.cart;
export const selectCart = (state: RootState) => state.cart.cart;
export const selectCartItems = (state: RootState) => state.cart.cart?.items || [];
export const selectCartSummary = (state: RootState) => state.cart.cart?.summary;
export const selectCartTotalQuantity = (state: RootState) =>
  state.cart.cart?.summary?.totalQuantity || 0;
export const selectCartGrandTotal = (state: RootState) =>
  state.cart.cart?.summary?.grandTotal || 0;
export const selectIsCartDrawerOpen = (state: RootState) => state.cart.isDrawerOpen;
export const selectCartLoading = (state: RootState) => state.cart.loading;
export const selectCartActionLoading = (state: RootState) => state.cart.actionLoading;
export const selectAppliedCoupon = (state: RootState) => state.cart.appliedCoupon;
export const selectCartError = (state: RootState) => state.cart.error;
