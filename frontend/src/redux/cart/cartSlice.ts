import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartState } from "../../types/cart";
import { getGuestCart } from "../../utils/localStorage";
import { logoutUser } from "../auth/authSlice";
import {
  fetchCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  syncGuestCartWithServer,
  createEmptyCart,
} from "./cartThunk";

export * from "./cartThunk";

const initialGuestItems = getGuestCart();
const initialCart = initialGuestItems.length > 0 ? createEmptyCart(initialGuestItems) : null;

const initialState: CartState = {
  cart: initialCart,
  isDrawerOpen: false,
  loading: false,
  actionLoading: false,
  error: null,
  appliedCoupon: null,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    openCartDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    toggleCartDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    applyCoupon: (state, action: PayloadAction<string>) => {
      const code = action.payload.trim().toUpperCase();
      if (!state.cart || state.cart.items.length === 0) return;

      let discountPercent = 0;
      if (code === "SAVE10" || code === "WELCOME10") discountPercent = 10;
      else if (code === "SUPER20" || code === "FESTIVE20") discountPercent = 20;
      else if (code === "VIP30") discountPercent = 30;

      if (discountPercent > 0) {
        const subtotal = state.cart.summary.subtotal;
        const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
        state.appliedCoupon = {
          code,
          discountPercent,
          discountAmount,
        };
        state.cart.summary.grandTotal = Math.max(
          0,
          Math.round((subtotal - discountAmount + state.cart.summary.shippingFee) * 100) / 100
        );
      }
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      if (state.cart) {
        state.cart.summary.grandTotal = Math.round(
          (state.cart.summary.subtotal + state.cart.summary.shippingFee) * 100
        ) / 100;
      }
    },
    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load cart";
      })

      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload;
        state.isDrawerOpen = true; // Automatically open cart drawer on add
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to add item to cart";
      })

      // Update Quantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload;
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update item quantity";
      })

      // Remove Item
      .addCase(removeCartItem.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to remove item";
      })

      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cart = action.payload;
        state.appliedCoupon = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to clear cart";
      })

      // Sync Guest Cart on Login
      .addCase(syncGuestCartWithServer.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(syncGuestCartWithServer.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.cart = action.payload;
        }
      })
      .addCase(syncGuestCartWithServer.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      })

      // Reset cart state on user logout
      .addCase(logoutUser, (state) => {
        const guestItems = getGuestCart();
        state.cart = guestItems.length > 0 ? createEmptyCart(guestItems) : null;
        state.appliedCoupon = null;
        state.error = null;
      });
  },
});

export const {
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
  applyCoupon,
  removeCoupon,
  clearCartError,
} = cartSlice.actions;

export default cartSlice.reducer;
