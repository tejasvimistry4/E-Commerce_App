import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { CartItem } from "../../types/cart";
import { getImageUrl } from "../../utils/image.utils";
import { VariantBadge } from "../products/VariantBadge";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  compact?: boolean; // For drawer use
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  disabled = false,
  compact = false,
}) => {
  const { t } = useTranslation();
  const product = item.product;
  const variant = item.variant;

  // Resolve active image from variant first, then product fallback
  const image = variant?.images?.[0] || variant?.thumbnail || product?.thumbnail || product?.images?.[0];
  const maxStock = variant ? variant.stock : (product?.stock !== undefined ? product.stock : 99);
  const isOutOfStock = variant
    ? variant.stock <= 0 || !variant.isActive || (product ? !product.isActive : false)
    : (product ? product.stock <= 0 || !product.isActive : false);

  const comparePrice = variant?.comparePrice || product?.comparePrice;
  const discountPercent =
    comparePrice && comparePrice > item.price
      ? Math.round(((comparePrice - item.price) / comparePrice) * 100)
      : null;

  return (
    <div
      className={`group relative rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-200 transition-all p-4 shadow-xs ${
        compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex items-start space-x-3.5">
        {/* Product Thumbnail */}
        <Link
          to={`/products/${product?.slug || item.productId}`}
          className={`relative rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center ${
            compact ? "w-16 h-16 sm:w-20 sm:h-20" : "w-20 h-20 sm:w-24 sm:h-24"
          }`}
        >
          {image ? (
            <img
              src={getImageUrl(image)}
              alt={product?.name || "Product"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-2xl">📦</span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xs flex items-center justify-center p-1 text-center">
              <span className="text-[9px] font-black text-white uppercase leading-tight">
                {t("wishlist.unavailable", "Out of Stock")}
              </span>
            </div>
          )}
        </Link>

        {/* Product Info & Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {product?.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block line-clamp-1 mb-0.5">
                  {product.category.name}
                </span>
              )}
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                <Link to={`/products/${product?.slug || item.productId}`}>
                  {product?.name || "Product"}
                </Link>
              </h4>

              {/* Variant attributes badge */}
              {variant?.attributes && (
                <div className="mt-1">
                  <VariantBadge
                    attributes={variant.attributes as Record<string, string>}
                    sku={variant.sku}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Remove Item Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
              title="Remove from Cart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {/* Pricing Row */}
          <div className="mt-1.5 flex items-baseline space-x-2">
            <span className="text-sm sm:text-base font-black text-slate-900">
              ₹{Number(item.price).toFixed(2)}
            </span>
            {comparePrice && comparePrice > item.price && (
              <span className="text-xs text-slate-400 line-through font-medium">
                ₹{Number(comparePrice).toFixed(2)}
              </span>
            )}
            {discountPercent && (
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Stock Warning if low */}
          {maxStock > 0 && maxStock <= 5 && (
            <p className="text-[10px] font-bold text-amber-600 mt-1">
              ⚡ Only {maxStock} left in stock - order soon
            </p>
          )}

          {/* Bottom Actions: Stepper and Item Total */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5 shadow-2xs">
              <button
                type="button"
                disabled={disabled || item.quantity <= 1 || isOutOfStock}
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all cursor-pointer"
                title="Decrease quantity"
              >
                -
              </button>

              <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-black text-slate-900">
                {item.quantity}
              </span>

              <button
                type="button"
                disabled={disabled || item.quantity >= maxStock || isOutOfStock}
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all cursor-pointer"
                title="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Total Item Price */}
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block text-[10px]">
                {t("cart.subtotal", "Subtotal")}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemRow;

