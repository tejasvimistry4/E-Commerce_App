import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  closeCartDrawer,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../../redux/cart/cartSlice";
import { CartItemRow } from "./CartItemRow";
import { Button, ConfirmationModal } from "../common";
import { toast } from "react-toastify";

export const CartDrawer: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { cart, isDrawerOpen, actionLoading } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [showClearCartModal, setShowClearCartModal] = useState(false);

  if (!isDrawerOpen) return null;

  const items = cart?.items || [];
  const summary = cart?.summary || {
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

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    dispatch(updateCartItemQuantity({ id, quantity: newQuantity }));
  };

  const handleRemove = (id: string) => {
    dispatch(removeCartItem(id));
    toast.info(t("messages.cart.itemRemoved", "Item removed from your cart."));
  };

  const handleConfirmClear = () => {
    dispatch(clearCart());
    toast.info(t("messages.cart.cartCleared", "Your cart has been cleared."));
    setShowClearCartModal(false);
  };

  const handleCheckout = () => {
    dispatch(closeCartDrawer());
    if (!isAuthenticated) {
      toast.info(t("messages.auth.loginToProceed", "Please log in to proceed to checkout."));
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => dispatch(closeCartDrawer())}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">🛍️</span>
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">
                    {t("cart.title", "Shopping Cart")}
                  </h2>
                  <span className="text-xs font-bold text-indigo-600">
                    {summary.totalQuantity} {summary.totalQuantity === 1 ? t("common.items", "item") : t("common.items", "items")}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearCartModal(true)}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {t("cart.clearAllItems", "Clear All")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dispatch(closeCartDrawer())}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Free shipping banner */}
            {items.length > 0 && (
              <div className="px-5 py-2.5 bg-indigo-50/70 border-b border-indigo-100 text-xs font-bold flex items-center justify-between text-indigo-900">
                {summary.isFreeShipping ? (
                  <span className="text-emerald-700 flex items-center space-x-1">
                    <span>🎉</span>
                    <span>{t("products.freeShippingNotice", "You've unlocked FREE Delivery!")}</span>
                  </span>
                ) : (
                  <span>
                    Add <strong>₹{summary.amountNeededForFreeShipping.toFixed(2)}</strong> for FREE Shipping
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-extrabold font-mono">
                  {summary.isFreeShipping ? "Unlocked" : "Threshold ₹499"}
                </span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 divide-y divide-slate-100">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="pt-3.5 first:pt-0">
                    <CartItemRow
                      item={item}
                      compact
                      disabled={actionLoading}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemove}
                    />
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-4xl shadow-inner">
                    🛒
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{t("cart.emptyTitle", "Your Cart is Empty")}</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      {t("cart.emptySubtitle", "Looks like you haven't added any products to your cart yet.")}
                    </p>
                  </div>
                  <Link
                    to="/products"
                    onClick={() => dispatch(closeCartDrawer())}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all hover:scale-105"
                  >
                    {t("cart.startShopping", "Start Shopping Now →")}
                  </Link>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            {items.length > 0 && (
              <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/90 backdrop-blur-xs space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                  <span>{t("cart.subtotal", "Subtotal")} ({summary.totalQuantity} {t("common.items", "items")})</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{summary.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{t("cart.shipping", "Shipping")}</span>
                  <span>{summary.isFreeShipping ? t("cart.free", "FREE") : `₹${summary.shippingFee.toFixed(2)}`}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Link
                    to="/cart"
                    onClick={() => dispatch(closeCartDrawer())}
                    className="px-4 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs font-bold text-center transition-all hover:bg-slate-100 shadow-xs flex items-center justify-center"
                  >
                    {t("cart.viewFullCart", "View Full Cart")}
                  </Link>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full text-center justify-center font-black"
                    onClick={handleCheckout}
                  >
                    {t("cart.proceedToCheckout", "Checkout →")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        onConfirm={handleConfirmClear}
        variant="danger"
        title={t("cart.clearModalTitle", "Clear Shopping Cart")}
        confirmText={t("cart.clearAllItems", "Clear Cart")}
        message={t("cart.clearModalDesc", "Are you sure you want to remove all items from your cart? This action cannot be undone.")}
      />
    </>
  );
};

export default CartDrawer;

