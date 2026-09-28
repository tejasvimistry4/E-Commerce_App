import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} from "../redux/wishlist/wishlistThunk";
import { selectWishlistState } from "../redux/wishlist/selectors";
import { selectIsAuthenticated } from "../redux/auth/selectors";
import { addToCart } from "../redux/cart/cartThunk";
import { Product } from "../types/product";
import { WishlistItem } from "../types/wishlist";
import { MESSAGES } from "../constants/messages";
import { ROUTES } from "../config/routes";
import { toast } from "react-toastify";

export function useWishlist() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalItems, loading, actionLoading, error } = useAppSelector(
    selectWishlistState
  );
  const isAuthenticated = useAppSelector(selectIsAuthenticated);


  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return items.some((item) => item.productId === productId);
    },
    [items]
  );

  const toggleItem = useCallback(
    async (product: Product): Promise<boolean> => {
      if (!isAuthenticated) {
        toast.info(MESSAGES.WISHLIST.LOGIN_TO_WISHLIST);
        navigate(ROUTES.LOGIN);
        return false;
      }

      try {
        const resultAction = await dispatch(toggleWishlist(product.id));
        if (toggleWishlist.fulfilled.match(resultAction)) {
          const inWishlist = resultAction.payload.inWishlist;
          if (inWishlist) {
            toast.success(MESSAGES.WISHLIST.ITEM_ADDED(product.name));
          } else {
            toast.info(MESSAGES.WISHLIST.ITEM_REMOVED(product.name));
          }
          return inWishlist;
        } else {
          toast.error(
            (resultAction.payload as string) || MESSAGES.WISHLIST.ADD_FAILED
          );
          return false;
        }
      } catch (err: any) {
        toast.error(err.message || MESSAGES.WISHLIST.ADD_FAILED);
        return false;
      }
    },
    [dispatch, isAuthenticated, navigate]
  );

  const addItem = useCallback(
    async (product: Product): Promise<boolean> => {
      if (!isAuthenticated) {
        toast.info(MESSAGES.WISHLIST.LOGIN_TO_WISHLIST);
        navigate(ROUTES.LOGIN);
        return false;
      }

      try {
        const resultAction = await dispatch(
          addToWishlist({ productId: product.id, product })
        );
        if (addToWishlist.fulfilled.match(resultAction)) {
          toast.success(MESSAGES.WISHLIST.ITEM_ADDED(product.name));
          return true;
        } else {
          toast.error(
            (resultAction.payload as string) || MESSAGES.WISHLIST.ADD_FAILED
          );
          return false;
        }
      } catch (err: any) {
        toast.error(err.message || MESSAGES.WISHLIST.ADD_FAILED);
        return false;
      }
    },
    [dispatch, isAuthenticated, navigate]
  );


  const removeItem = useCallback(
    async (productId: string, productName?: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(removeFromWishlist(productId));
        if (removeFromWishlist.fulfilled.match(resultAction)) {
          toast.info(
            productName
              ? MESSAGES.WISHLIST.ITEM_REMOVED(productName)
              : "Item removed from wishlist."
          );
          return true;
        } else {
          toast.error(
            (resultAction.payload as string) || MESSAGES.WISHLIST.REMOVE_FAILED
          );
          return false;
        }
      } catch (err: any) {
        toast.error(err.message || MESSAGES.WISHLIST.REMOVE_FAILED);
        return false;
      }
    },
    [dispatch]
  );

  const emptyWishlist = useCallback(async (): Promise<boolean> => {
    try {
      const resultAction = await dispatch(clearWishlist());
      if (clearWishlist.fulfilled.match(resultAction)) {
        toast.success(MESSAGES.WISHLIST.CLEARED);
        return true;
      } else {
        toast.error(
          (resultAction.payload as string) || "Failed to clear wishlist"
        );
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to clear wishlist");
      return false;
    }
  }, [dispatch]);

  const moveItemToCart = useCallback(
    async (item: WishlistItem, quantity = 1): Promise<boolean> => {
      const effectiveStock = item.variant ? item.variant.stock : item.product.stock;
      if (item.isOutOfStock || effectiveStock <= 0) {
        toast.error(MESSAGES.CART.OUT_OF_STOCK(item.product.name));
        return false;
      }

      try {
        const cartAction = await dispatch(
          addToCart({
            productId: item.productId,
            variantId: item.variantId || undefined,
            variant: item.variant || undefined,
            quantity,
            product: item.product,
          })
        );

        if (addToCart.fulfilled.match(cartAction)) {
          toast.success(MESSAGES.WISHLIST.MOVED_TO_CART(item.product.name));
          return true;
        } else {
          toast.error(
            (cartAction.payload as string) || MESSAGES.CART.ADD_FAILED
          );
          return false;
        }
      } catch (err: any) {
        toast.error(err.message || MESSAGES.CART.ADD_FAILED);
        return false;
      }
    },
    [dispatch]
  );

  const moveAllInStockToCart = useCallback(async (): Promise<number> => {
    const inStockItems = items.filter((item) => {
      const stock = item.variant ? item.variant.stock : item.product.stock;
      return !item.isOutOfStock && stock > 0;
    });

    if (inStockItems.length === 0) {
      toast.info("No in-stock items available to move to cart.");
      return 0;
    }

    let movedCount = 0;
    for (const item of inStockItems) {
      try {
        const cartAction = await dispatch(
          addToCart({
            productId: item.productId,
            variantId: item.variantId || undefined,
            variant: item.variant || undefined,
            quantity: 1,
            product: item.product,
          })
        );
        if (addToCart.fulfilled.match(cartAction)) {
          movedCount++;
        }
      } catch {
        // Continue adding other items
      }
    }

    if (movedCount > 0) {
      toast.success(MESSAGES.WISHLIST.ALL_MOVED_TO_CART(movedCount));
    }

    return movedCount;
  }, [dispatch, items]);


  const refreshWishlist = useCallback(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  return {
    items,
    count: totalItems || items.length,
    loading,
    actionLoading,
    error,
    isInWishlist,
    toggleItem,
    addItem,
    removeItem,
    emptyWishlist,
    moveItemToCart,
    moveAllInStockToCart,
    refreshWishlist,
  };
}

export default useWishlist;
