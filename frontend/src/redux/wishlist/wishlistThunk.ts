import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  WishlistItem,
  AddToWishlistPayload,
} from "../../types/wishlist";
import {
  getWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  toggleWishlistApi,
  clearWishlistApi,
} from "../../api/wishlist.api";
import { getToken } from "../../utils/localStorage";

// 1. Fetch Wishlist (Authenticated only)
export const fetchWishlist = createAsyncThunk<
  WishlistItem[],
  void,
  { rejectValue: string }
>("wishlist/fetchWishlist", async (_, { rejectWithValue }) => {
  try {
    const token = getToken();
    if (!token) {
      return [];
    }

    const res = await getWishlistApi();
    return res.data.items || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to load wishlist"
    );
  }
});

// 2. Add to Wishlist
export const addToWishlist = createAsyncThunk<
  WishlistItem[],
  AddToWishlistPayload,
  { rejectValue: string }
>("wishlist/addToWishlist", async (payload, { rejectWithValue }) => {
  try {
    const res = await addToWishlistApi(payload);
    return res.data.items || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || "Failed to add to wishlist"
    );
  }
});

// 3. Remove from Wishlist
export const removeFromWishlist = createAsyncThunk<
  WishlistItem[],
  string,
  { rejectValue: string }
>("wishlist/removeFromWishlist", async (productId, { rejectWithValue }) => {
  try {
    const res = await removeFromWishlistApi(productId);
    return res.data.items || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to remove item from wishlist"
    );
  }
});

// 4. Toggle in Wishlist
export const toggleWishlist = createAsyncThunk<
  { inWishlist: boolean; productId: string; variantId?: string | null; items: WishlistItem[] },
  string | { productId: string; variantId?: string | null },
  { rejectValue: string }
>("wishlist/toggleWishlist", async (arg, { rejectWithValue }) => {
  try {
    const productId = typeof arg === "string" ? arg : arg.productId;
    const variantId = typeof arg === "object" ? arg.variantId : undefined;
    const res = await toggleWishlistApi(productId, variantId);
    return {
      inWishlist: res.data.inWishlist,
      productId: res.data.productId,
      variantId: res.data.variantId,
      items: res.data.wishlist.items || [],
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update wishlist"
    );
  }
});

// 5. Clear all Wishlist items
export const clearWishlist = createAsyncThunk<
  WishlistItem[],
  void,
  { rejectValue: string }
>("wishlist/clearWishlist", async (_, { rejectWithValue }) => {
  try {
    const res = await clearWishlistApi();
    return res.data.items || [];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to clear wishlist"
    );
  }
});
