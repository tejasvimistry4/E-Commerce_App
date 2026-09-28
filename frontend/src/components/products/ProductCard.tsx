import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { Product, ProductVariant } from "../../types/product";
import { getImageUrl } from "../../utils/image.utils";
import { useAppDispatch } from "../../hooks/redux";
import { addToCart } from "../../redux/cart/cartSlice";
import { Button } from "../common";
import { toast } from "react-toastify";

export interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  similarityScore?: number;
  isHighlyInterested?: boolean;
  visitCount?: number;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string, name: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  black: "#18181b",
  "onyx black": "#09090b",
  "triple black": "#000000",
  "matte black": "#18181b",
  white: "#ffffff",
  "cloud white": "#f8fafc",
  "arctic white": "#ffffff",
  navy: "#1e3a8a",
  "navy blue": "#172554",
  "nordic blue": "#1d4ed8",
  blue: "#2563eb",
  green: "#16a34a",
  "forest green": "#14532d",
  "sage green": "#4d7c0f",
  orange: "#ea580c",
  "solar orange": "#f97316",
  red: "#dc2626",
  crimson: "#b91c1c",
  terracotta: "#c2410c",
  grey: "#64748b",
  gray: "#64748b",
  tan: "#d97706",
  brown: "#78350f",
  gold: "#eab308",
  silver: "#cbd5e1",
  pink: "#ec4899",
  purple: "#9333ea",
  beige: "#f5f5dc",
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isAdmin = false,
  similarityScore,
  isHighlyInterested = false,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [activeVariantPreview, setActiveVariantPreview] = useState<ProductVariant | null>(null);

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  // Derive preview image: variant preview image -> product thumbnail -> product images[0]
  const previewImage =
    activeVariantPreview?.thumbnail ||
    activeVariantPreview?.images?.[0] ||
    product.thumbnail ||
    product.images?.[0];

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  // Extract unique color variants for mini swatch row
  const colorVariants = React.useMemo(() => {
    if (!hasVariants) return [];
    const map = new Map<string, ProductVariant>();
    variants.forEach((v) => {
      if (v.attributes) {
        const colorKey = Object.keys(v.attributes).find(
          (k) => k.toLowerCase().includes("color") || k.toLowerCase().includes("colour")
        );
        if (colorKey && v.attributes[colorKey]) {
          const col = v.attributes[colorKey];
          if (!map.has(col)) {
            map.set(col, v);
          }
        }
      }
    });
    return Array.from(map.entries()).map(([colorName, variant]) => ({
      colorName,
      variant,
      hex: COLOR_MAP[colorName.toLowerCase()] || "#64748b",
    }));
  }, [variants, hasVariants]);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetVariant = activeVariantPreview || variants[0] || null;
    const targetStock = targetVariant ? targetVariant.stock : product.stock;

    if (targetStock <= 0) {
      toast.error(
        t("messages.cart.outOfStock", {
          name: product.name,
          defaultValue: `"${product.name}" is currently out of stock.`,
        })
      );
      return;
    }

    setIsAdding(true);
    try {
      const resultAction = await dispatch(
        addToCart({
          productId: product.id,
          variantId: targetVariant?.id,
          quantity: 1,
          product,
          variant: targetVariant,
        })
      );

      if (addToCart.fulfilled.match(resultAction)) {
        setIsAdded(true);
        toast.success(
          t("messages.cart.itemAdded", {
            name: product.name,
            qty: 1,
            defaultValue: `Added "${product.name}" to your cart!`,
          })
        );
        setTimeout(() => {
          setIsAdded(false);
        }, 1800);
      } else {
        toast.error((resultAction.payload as string) || t("messages.cart.addFailed", "Failed to add to cart"));
      }
    } catch (err: any) {
      toast.error(err.message || t("messages.cart.addFailed", "Failed to add to cart"));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Product Image & Badges */}
        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
          <Link
            to={`/products/${product.slug}`}
            className="w-full h-full block"
          >
            {previewImage ? (
              <img
                src={getImageUrl(previewImage)}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <span className="text-3xl">📦</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  No Preview
                </span>
              </div>
            )}
          </Link>

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
            {isHighlyInterested && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-2xs flex items-center space-x-1 backdrop-blur-xs animate-pulse">
                <span>🔥</span>
                <span>{t("products.highlyInterestedBadge", "Hot")}</span>
              </span>
            )}
            {similarityScore !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs flex items-center space-x-1 backdrop-blur-xs">
                <span>✨</span>
                <span>{Math.round(similarityScore * 100)}% {t("visualSearch.match", "Match")}</span>
              </span>
            )}
            {discountPercent && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-2xs">
                -{discountPercent}%
              </span>
            )}
            {product.isFeatured && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                ★ {t("home.featured", "Featured")}
              </span>
            )}
          </div>

          {/* Wishlist Button Overlay (Customer only) */}
          {!isAdmin && (
            <div className="absolute top-2.5 right-2.5 z-20">
              <Button
                wishlistProduct={product}
                wishlistVariant="floating"
                size="sm"
              />
            </div>
          )}

          {/* Stock & Variant Count Overlay */}
          <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none flex items-center gap-1">
            {hasVariants && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs shadow-2xs border border-slate-200">
                {variants.length} {variants.length === 1 ? "Option" : "Options"}
              </span>
            )}
            {product.stock === 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs shadow-2xs">
                {t("wishlist.outOfStockTab", { count: 0, defaultValue: "Out of Stock" })}
              </span>
            ) : product.stock <= 5 ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/90 text-white backdrop-blur-xs shadow-2xs">
                Only {product.stock} left
              </span>
            ) : null}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 pb-2">
          {/* Category Tag */}
          {product.category && (
            <Link
              to={`/categories/${product.category.slug}`}
              className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors mb-1"
            >
              {product.category.name}
            </Link>
          )}

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            <Link to={`/products/${product.slug}`} title={product.name}>
              {product.name}
            </Link>
          </h3>

          {/* Mini Color Swatch Row for quick preview */}
          {colorVariants.length > 1 && (
            <div className="flex items-center gap-1 mt-1.5">
              {colorVariants.map(({ colorName, variant, hex }) => {
                const isActive = activeVariantPreview?.id === variant.id;
                return (
                  <button
                    key={colorName}
                    type="button"
                    title={colorName}
                    onMouseEnter={() => setActiveVariantPreview(variant)}
                    onClick={() => setActiveVariantPreview(variant)}
                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${isActive
                        ? "ring-2 ring-indigo-600 ring-offset-1 scale-110"
                        : "opacity-75 hover:opacity-100 hover:scale-105 border border-slate-300"
                      }`}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
              <span className="text-[9px] text-slate-400 font-medium ml-1">
                +{colorVariants.length}
              </span>
            </div>
          )}

          {/* Description Snippet */}
          {product.description && !colorVariants.length && (
            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer: Price and Styled Action Buttons */}
      <div className="p-3.5 sm:p-4 pt-0 mt-auto">
        <div className="pt-2.5 border-t border-slate-100 flex flex-col space-y-2">
          {/* Pricing Row */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                ₹{Number(activeVariantPreview ? activeVariantPreview.price : product.price).toFixed(2)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-[11px] text-slate-400 line-through font-medium">
                  ₹{Number(activeVariantPreview?.comparePrice || product.comparePrice).toFixed(2)}
                </span>
              )}
            </div>

            {product.stock > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{t("common.inStock", "In Stock")}</span>
              </span>
            )}
          </div>

          {/* Customer Action: Add to Cart + Details */}
          {!isAdmin ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={product.stock === 0 || isAdding}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs ${product.stock === 0
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                    : isAdded
                      ? "bg-emerald-600 text-white shadow-emerald-500/20 scale-[1.01]"
                      : "bg-slate-900 hover:bg-indigo-600 text-white hover:shadow-xs hover:scale-[1.01] active:scale-[0.98]"
                  }`}
                title={product.stock === 0 ? t("wishlist.unavailable", "Out of Stock") : t("products.addToCart", "Add to Cart")}
              >
                {product.stock === 0 ? (
                  <span>{t("wishlist.unavailable", "Out of Stock")}</span>
                ) : isAdding ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("common.loading", "Adding...")}</span>
                  </div>
                ) : isAdded ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t("common.save", "Added")}</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <span>{t("products.addToCart", "Add")}</span>
                  </>
                )}
              </button>

              <Link
                to={`/products/${product.slug}`}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-2xs"
                title="View details"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            /* Admin Actions */
            <div className="flex items-center space-x-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-white bg-slate-100 hover:bg-indigo-600 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  title="Edit Product"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <span>{t("common.edit", "Edit")}</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(product.id, product.name)}
                  className="p-1.5 rounded-xl text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Delete Product"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
