import { createSlice } from "@reduxjs/toolkit";
import { WishlistState } from "../../types/wishlist";
import { logoutUser } from "../auth/authSlice";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} from "./wishlistThunk";

export * from "./wishlistThunk";

const initialState: WishlistState = {
  items: [],
  totalItems: 0,
  loading: false,
  actionLoading: false,
  error: null,
};

export const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
    resetWishlistState: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.loading = false;
      state.actionLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.totalItems = action.payload.length;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load wishlist";
      })

      // Add to Wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = action.payload;
        state.totalItems = action.payload.length;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to add to wishlist";
      })

      // Remove from Wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = action.payload;
        state.totalItems = action.payload.length;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to remove item";
      })

      // Toggle Wishlist
      .addCase(toggleWishlist.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.items.length;
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to toggle item";
      })

      // Clear Wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(clearWishlist.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = action.payload;
        state.totalItems = action.payload.length;
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to clear wishlist";
      })

      // Reset on User Logout
      .addCase(logoutUser, (state) => {
        state.items = [];
        state.totalItems = 0;
        state.loading = false;
        state.actionLoading = false;
        state.error = null;
      });
  },
});

export const { clearWishlistError, resetWishlistState } =
  wishlistSlice.actions;

export default wishlistSlice.reducer;
