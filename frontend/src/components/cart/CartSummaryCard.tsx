import React, { useState } from "react";
import { useTranslation } from "../../i18n";
import { CartCalculationSummary } from "../../types/cart";
import { Button, Input } from "../common";
import { toast } from "react-toastify";

interface CartSummaryCardProps {
  summary: CartCalculationSummary;
  appliedCoupon?: {
    code: string;
    discountPercent: number;
    discountAmount: number;
  } | null;
  onApplyCoupon?: (code: string) => void;
  onRemoveCoupon?: () => void;
  onCheckout?: () => void;
  isCheckoutDisabled?: boolean;
}

export const CartSummaryCard: React.FC<CartSummaryCardProps> = ({
  summary,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  isCheckoutDisabled = false,
}) => {
  const { t } = useTranslation();
  const [couponInput, setCouponInput] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.warning(t("messages.cart.promoRequired", "Please enter a promo code."));
      return;
    }
    const code = couponInput.trim().toUpperCase();
    if (code === "SAVE10" || code === "WELCOME10" || code === "SUPER20" || code === "VIP30") {
      onApplyCoupon?.(code);
      toast.success(t("messages.cart.promoApplied", { code, defaultValue: `Promo code "${code}" applied successfully!` }));
      setCouponInput("");
    } else {
      toast.error(t("messages.cart.promoInvalid", "Invalid promo code. Try SAVE10, SUPER20, or VIP30."));
    }
  };

  // Free shipping progress calculation
  const progressPercent = Math.min(
    100,
    Math.round((summary.subtotal / summary.freeShippingThreshold) * 100)
  );

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
      <h3 className="text-lg font-black text-slate-900 tracking-tight pb-4 border-b border-slate-100">
        {t("cart.orderSummary", "Order Summary")}
      </h3>

      {/* Free Shipping Progress Indicator */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          {summary.isFreeShipping ? (
            <span className="text-emerald-700 flex items-center space-x-1.5">
              <span>🎉</span>
              <span>{t("products.freeShippingNotice", "You've unlocked FREE Delivery!")}</span>
            </span>
          ) : (
            <span className="text-indigo-900">
              Add <strong>₹{summary.amountNeededForFreeShipping.toFixed(2)}</strong> for{" "}
              <span className="text-indigo-600 font-extrabold">{t("cart.free", "FREE Delivery")}</span>
            </span>
          )}
          <span className="text-indigo-700 font-mono">{progressPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${summary.isFreeShipping
              ? "bg-emerald-500"
              : "bg-indigo-600"
              }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Price Calculations Breakdown */}
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>{t("cart.subtotal", "Subtotal")} ({summary.totalQuantity} {t("common.items", "items")})</span>
          <span className="font-bold text-slate-900">
            ₹{summary.subtotal.toFixed(2)}
          </span>
        </div>

        {summary.savings > 0 && (
          <div className="flex items-center justify-between text-emerald-600 font-medium">
            <span>{t("cart.savings", "Savings")}</span>
            <span className="font-bold">-₹{summary.savings.toFixed(2)}</span>
          </div>
        )}

        {appliedCoupon && (
          <div className="flex items-center justify-between text-indigo-700 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200 font-semibold">
            <div className="flex items-center space-x-1.5">
              <span>🏷️ Code: {appliedCoupon.code}</span>
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="text-rose-500 hover:text-rose-700 text-xs font-black cursor-pointer ml-1"
                title="Remove coupon"
              >
                ✕
              </button>
            </div>
            <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-600">
          <span>{t("cart.shipping", "Shipping")}</span>
          {summary.isFreeShipping ? (
            <span className="font-bold text-emerald-600 uppercase text-xs">
              {t("cart.free", "FREE")}
            </span>
          ) : (
            <span className="font-bold text-slate-900">
              ₹{summary.shippingFee.toFixed(2)}
            </span>
          )}
        </div>

        {/* Grand Total */}
        <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between">
          <div>
            <span className="text-base font-black text-slate-900 block leading-tight">
              {t("cart.total", "Grand Total")}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {t("cart.estimatedTax", "Estimated Tax Included")}
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{summary.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Promo Code Form */}
      {!appliedCoupon && (
        <form onSubmit={handleApplyCoupon} className="pt-2">
          <div className="flex items-center space-x-2">
            <Input
              size="sm"
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder={t("cart.promoPlaceholder", "Promo code (e.g. SAVE10)")}
              className="uppercase placeholder:normal-case placeholder:font-normal font-bold"
              fullWidth
            />
            <Button variant="secondary" size="md" type="submit">
              {t("cart.applyPromo", "Apply")}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
            Try codes: <strong className="text-indigo-600">SAVE10</strong> or{" "}
            <strong className="text-indigo-600">SUPER20</strong>
          </p>
        </form>
      )}

      {/* Checkout CTA */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full text-center justify-center font-black shadow-sm shadow-indigo-600/20"
          disabled={isCheckoutDisabled || summary.totalItems === 0}
          onClick={onCheckout}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        >
          {t("cart.proceedToCheckout", "Proceed to Checkout →")}
        </Button>
      </div>

      {/* Security & Guarantees Trust Badges */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-500">
        <div className="flex flex-col items-center">
          <span className="text-base mb-1">🔒</span>
          <span>{t("products.secureCheckoutNotice", "SSL Secured Checkout")}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-base mb-1">🔄</span>
          <span>{t("home.trust.returnsTitle", "7-Day Easy Returns")}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-base mb-1">🛡️</span>
          <span>{t("home.trust.authenticTitle", "100% Authentic")}</span>
        </div>
      </div>
    </div>
  );
};

export default CartSummaryCard;

