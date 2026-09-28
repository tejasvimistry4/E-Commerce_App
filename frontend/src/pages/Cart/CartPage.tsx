import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} from "../../redux/cart/cartSlice";
import { CartItemRow } from "../../components/cart/CartItemRow";
import { CartSummaryCard } from "../../components/cart/CartSummaryCard";
import { Button, ConfirmationModal, Breadcrumb } from "../../components/common";
import { toast } from "react-toastify";

export const CartPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { cart, loading, actionLoading, appliedCoupon } = useAppSelector(
    (state) => state.cart
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [showClearCartModal, setShowClearCartModal] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

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

  const handleConfirmClearCart = () => {
    dispatch(clearCart());
    toast.info(t("messages.cart.cartCleared", "Your cart has been cleared."));
    setShowClearCartModal(false);
  };

  const handleApplyCoupon = (code: string) => {
    dispatch(applyCoupon(code));
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    toast.info(t("messages.cart.promoRemoved", "Coupon removed."));
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info(t("messages.auth.loginToCheckout", "Please log in to finalize your order."));
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header Banner */}
      <section className="relative overflow-hidden pt-10 pb-12 border-b border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <Breadcrumb
            className="mb-6"
            items={[
              { label: t("nav.home", "Home"), to: "/" },
              { label: t("cart.title", "Shopping Cart"), active: true },
            ]}
          />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                {t("cart.title", "Shopping Cart")}
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                {t("cart.subtitle", "Review your items, apply special promotions, and proceed to our fast, encrypted checkout.")}
              </p>
            </div>

            {items.length > 0 && (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearCartModal(true)}
                  disabled={actionLoading}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  {t("cart.clearAllItems", "Clear All Items")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500">{t("common.loading", "Loading your shopping cart...")}</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Items List (7 cols on lg, 8 on xl) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("cart.productsInCart", { count: summary.totalQuantity, defaultValue: `${summary.totalQuantity} in Cart` })}
                </span>
                <Link
                  to="/products"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {t("cart.addMoreProducts", "+ Add More Products")}
                </Link>
              </div>

              {/* Item Rows */}
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    disabled={actionLoading}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              {/* Continue Shopping CTA */}
              <div className="pt-6 flex items-center justify-between">
                <Link
                  to="/products"
                  className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  <span>{t("cart.continueShopping", "← Continue Shopping")}</span>
                </Link>

                <Link
                  to="/categories"
                  className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <span>{t("cart.exploreDepartments", "Explore Departments →")}</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary (5 cols on lg, 4 on xl) */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
              <CartSummaryCard
                summary={summary}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                onCheckout={handleCheckout}
                isCheckoutDisabled={actionLoading}
              />
            </div>
          </div>
        ) : (
          /* Empty Cart State */
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-12 sm:p-16 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-5xl mb-6 shadow-xs">
              🛒
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              {t("cart.emptyTitle", "Your Shopping Cart is Empty")}
            </h2>
            <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
              {t("cart.emptySubtitle", "Explore our trending catalog and collections to discover electronics, accessories, and fashion merchandise.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/products"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all hover:scale-105"
              >
                {t("cart.startShopping", "Browse All Products →")}
              </Link>
              <Link
                to="/categories"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                {t("cart.exploreCategories", "Explore Categories")}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Clear Cart Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        onConfirm={handleConfirmClearCart}
        variant="danger"
        title={t("cart.clearModalTitle", "Clear Shopping Cart")}
        confirmText={t("cart.clearAllItems", "Clear Cart")}
        message={t("cart.clearModalDesc", "Are you sure you want to remove all items from your shopping cart? This action cannot be undone.")}
      />
    </div>
  );
};

export default CartPage;

