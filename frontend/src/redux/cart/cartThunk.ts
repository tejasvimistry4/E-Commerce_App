import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Cart,
  CartItem,
  CartCalculationSummary,
  AddToCartPayload,
  UpdateCartItemPayload,
} from "../../types/cart";
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
  syncCartApi,
} from "../../api/cart.api";
import {
  getToken,
  getGuestCart,
  setGuestCart,
  clearGuestCart,
} from "../../utils/localStorage";

export const FREE_SHIPPING_THRESHOLD = 499;
export const STANDARD_SHIPPING_FEE = 49;

/**
 * Helper: Calculate client-side cart summary (used for guest cart)
 */
export const calculateClientSummary = (
  items: CartItem[],
  couponDiscountPercent = 0
): CartCalculationSummary => {
  let subtotal = 0;
  let savings = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const effectiveStock = item.variant ? item.variant.stock : (item.product ? item.product.stock : 0);
    const isOut = item.isOutOfStock ?? effectiveStock <= 0;
    if (!isOut) {
      const price = item.variant?.price || item.price || item.product?.price || 0;
      const comparePrice = item.variant?.comparePrice || item.product?.comparePrice || null;
      const itemTotal = price * item.quantity;

      subtotal += itemTotal;
      totalQuantity += item.quantity;

      if (comparePrice && comparePrice > price) {
        savings += (comparePrice - price) * item.quantity;
      }
    }
  }

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shippingFee = subtotal === 0 ? 0 : isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const couponDiscount = couponDiscountPercent > 0 ? (subtotal * couponDiscountPercent) / 100 : 0;
  const estimatedTax = 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee + estimatedTax);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    shippingFee,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountNeededForFreeShipping: Math.round(amountNeededForFreeShipping * 100) / 100,
    isFreeShipping,
    estimatedTax,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalItems: items.length,
    totalQuantity,
  };
};

/**
 * Helper: Create an empty or initial cart object
 */
export const createEmptyCart = (items: CartItem[] = []): Cart => ({
  id: "local-cart",
  items,
  summary: calculateClientSummary(items),
});

// 1. Fetch Cart (Handles both Authenticated & Guest Cart, with auto-merge for pending guest carts)
export const fetchCart = createAsyncThunk<Cart, void, { rejectValue: string }>(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (token) {
        // Check if there are any guest items stored locally that need syncing
        const guestItems = getGuestCart();
        if (guestItems && guestItems.length > 0) {
          // Clear guest cart immediately before sync API call to prevent duplicate parallel syncs
          clearGuestCart();

          const aggregatedMap = new Map<string, { productId: string; variantId?: string | null; quantity: number }>();
          for (const item of guestItems) {
            if (item && item.productId && item.quantity > 0) {
              const key = `${item.productId}_${item.variantId || ""}`;
              const current = aggregatedMap.get(key);
              if (current) {
                current.quantity += item.quantity;
              } else {
                aggregatedMap.set(key, {
                  productId: item.productId,
                  variantId: item.variantId || null,
                  quantity: item.quantity,
                });
              }
            }
          }

          if (aggregatedMap.size > 0) {
            const payload = {
              items: Array.from(aggregatedMap.values()).map((it) => ({
                productId: it.productId,
                variantId: it.variantId || null,
                quantity: Math.min(99, Math.max(1, it.quantity)),
              })),
            };

            try {
              const syncRes = await syncCartApi(payload);
              return syncRes.data;
            } catch {
              // Fallback to restore items if sync endpoint had transient issue
              setGuestCart(guestItems);
            }
          }
        }

        const res = await getCartApi();
        return res.data;
      } else {
        const guestItems = getGuestCart();
        return createEmptyCart(guestItems);
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load cart"
      );
    }
  }
);

// 2. Add to Cart (Handles both Authenticated & Guest Cart)
export const addToCart = createAsyncThunk<
  Cart,
  AddToCartPayload,
  { rejectValue: string }
>("cart/addToCart", async (payload, { rejectWithValue }) => {
  try {
    const token = getToken();
    const qty = Math.max(1, payload.quantity || 1);

    if (token) {
      const res = await addToCartApi({
        productId: payload.productId,
        variantId: payload.variantId,
        quantity: qty,
      });
      return res.data;
    } else {
      // Guest Cart Management
      if (!payload.product) {
        return rejectWithValue("Product details required for guest cart");
      }

      const effectiveStock = payload.variant ? payload.variant.stock : payload.product.stock;
      const effectivePrice = payload.variant ? payload.variant.price : payload.product.price;
      const effectiveName = payload.product.name;

      if (effectiveStock <= 0) {
        return rejectWithValue(`"${effectiveName}" is out of stock`);
      }

      const guestItems = getGuestCart();
      const existingIndex = guestItems.findIndex(
        (i) => i.productId === payload.productId && (i.variantId || null) === (payload.variantId || null)
      );

      if (existingIndex !== -1) {
        const currentQty = guestItems[existingIndex].quantity;
        const newQty = currentQty + qty;

        if (newQty > effectiveStock) {
          return rejectWithValue(
            `Cannot add more. You have ${currentQty} in cart and only ${effectiveStock} in stock.`
          );
        }

        guestItems[existingIndex].quantity = newQty;
        guestItems[existingIndex].totalPrice =
          guestItems[existingIndex].price * newQty;
      } else {
        if (qty > effectiveStock) {
          return rejectWithValue(
            `Only ${effectiveStock} available in stock.`
          );
        }

        const guestId = `guest-${payload.productId}${payload.variantId ? `-${payload.variantId}` : ""}`;
        const newItem: CartItem = {
          id: guestId,
          productId: payload.productId,
          variantId: payload.variantId || null,
          variant: payload.variant || null,
          quantity: qty,
          price: effectivePrice,
          totalPrice: effectivePrice * qty,
          product: payload.product,
          isOutOfStock: false,
          maxAvailableQuantity: effectiveStock,
        };
        guestItems.unshift(newItem);
      }

      setGuestCart(guestItems);
      return createEmptyCart(guestItems);
    }
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || "Failed to add to cart"
    );
  }
});

// 3. Update Cart Item Quantity
export const updateCartItemQuantity = createAsyncThunk<
  Cart,
  UpdateCartItemPayload,
  { rejectValue: string }
>("cart/updateQuantity", async (payload, { rejectWithValue }) => {
  try {
    const token = getToken();

    if (token) {
      const res = await updateCartItemApi(payload);
      return res.data;
    } else {
      let guestItems = getGuestCart();

      if (payload.quantity <= 0) {
        guestItems = guestItems.filter(
          (i) => i.id !== payload.id && i.productId !== payload.id
        );
      } else {
        const item = guestItems.find(
          (i) => i.id === payload.id || i.productId === payload.id
        );
        if (item) {
          if (item.product && payload.quantity > item.product.stock) {
            return rejectWithValue(
              `Maximum available stock is ${item.product.stock}`
            );
          }
          item.quantity = payload.quantity;
          item.totalPrice = item.price * payload.quantity;
        }
      }

      setGuestCart(guestItems);
      return createEmptyCart(guestItems);
    }
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update cart item"
    );
  }
});

// 4. Remove Item from Cart
export const removeCartItem = createAsyncThunk<
  Cart,
  string,
  { rejectValue: string }
>("cart/removeItem", async (cartItemId, { rejectWithValue }) => {
  try {
    const token = getToken();

    if (token) {
      const res = await removeCartItemApi(cartItemId);
      return res.data;
    } else {
      let guestItems = getGuestCart();
      guestItems = guestItems.filter(
        (i) => i.id !== cartItemId && i.productId !== cartItemId
      );
      setGuestCart(guestItems);
      return createEmptyCart(guestItems);
    }
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to remove cart item"
    );
  }
});

// 5. Clear All Cart Items
export const clearCart = createAsyncThunk<Cart, void, { rejectValue: string }>(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();

      if (token) {
        const res = await clearCartApi();
        return res.data;
      } else {
        clearGuestCart();
        return createEmptyCart([]);
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to clear cart"
      );
    }
  }
);

// 6. Sync Guest Cart with Server upon Login / Register
export const syncGuestCartWithServer = createAsyncThunk<
  Cart | null,
  void,
  { rejectValue: string }
>("cart/syncGuestCart", async (_, { rejectWithValue }) => {
  try {
    const guestItems = getGuestCart();
    if (!guestItems || guestItems.length === 0) {
      const res = await getCartApi();
      return res.data;
    }

    // Immediately clear guest cart before network call to prevent duplicate parallel syncs
    clearGuestCart();

    // Filter and combine duplicates safely
    const aggregatedMap = new Map<string, number>();
    for (const item of guestItems) {
      if (item && item.productId && item.quantity > 0) {
        const current = aggregatedMap.get(item.productId) || 0;
        aggregatedMap.set(item.productId, current + item.quantity);
      }
    }

    if (aggregatedMap.size === 0) {
      const res = await getCartApi();
      return res.data;
    }

    const payload = {
      items: Array.from(aggregatedMap.entries()).map(([productId, quantity]) => ({
        productId,
        quantity: Math.min(99, Math.max(1, quantity)),
      })),
    };

    try {
      const res = await syncCartApi(payload);
      return res.data;
    } catch (err: any) {
      // If sync API fails, restore guest cart items so user doesn't lose them
      setGuestCart(guestItems);
      return rejectWithValue(
        err.response?.data?.message || "Failed to synchronize cart"
      );
    }
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to synchronize cart"
    );
  }
});
