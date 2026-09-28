import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
  applyCoupon,
  removeCoupon,
} from "../redux/cart/cartSlice";
import { Product } from "../types/product";

export function useCart() {
  const dispatch = useAppDispatch();
  const cartState = useAppSelector((state) => state.cart);

  const items = cartState.cart?.items || [];
  const summary = cartState.cart?.summary || {
    subtotal: 0,
    savings: 0,
    shippingFee: 0,
    freeShippingThreshold: 499,
    amountNeededForFreeShipping: 499,
    isFreeShipping: false,
    estimatedTax: 0,
    grandTotal: 0,
    totalItems: 0,
    totalQuantity: 0,
  };

  const addItem = (product: Product, quantity = 1) => {
    return dispatch(
      addToCart({
        productId: product.id,
        quantity,
        product,
      })
    );
  };

  const updateQuantity = (id: string, quantity: number) => {
    return dispatch(updateCartItemQuantity({ id, quantity }));
  };

  const removeItem = (id: string) => {
    return dispatch(removeCartItem(id));
  };

  const emptyCart = () => {
    return dispatch(clearCart());
  };

  const openDrawer = () => dispatch(openCartDrawer());
  const closeDrawer = () => dispatch(closeCartDrawer());
  const toggleDrawer = () => dispatch(toggleCartDrawer());

  const applyPromo = (code: string) => dispatch(applyCoupon(code));
  const removePromo = () => dispatch(removeCoupon());
  const refreshCart = () => dispatch(fetchCart());

  return {
    cart: cartState.cart,
    items,
    summary,
    totalQuantity: summary.totalQuantity,
    isDrawerOpen: cartState.isDrawerOpen,
    loading: cartState.loading,
    actionLoading: cartState.actionLoading,
    appliedCoupon: cartState.appliedCoupon,
    addItem,
    updateQuantity,
    removeItem,
    emptyCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    applyPromo,
    removePromo,
    refreshCart,
  };
}

export default useCart;
