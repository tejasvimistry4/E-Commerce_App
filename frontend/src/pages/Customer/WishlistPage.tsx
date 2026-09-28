import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWishlist } from "../../hooks/useWishlist";
import { useDebounce } from "../../hooks/useDebounce";
import { WishlistItem } from "../../types/wishlist";
import {
  Breadcrumb,
  Button,
  SearchInput,
  ConfirmationModal,
} from "../../components/common";
import { VariantBadge } from "../../components/products/VariantBadge";
import { getImageUrl } from "../../utils/image.utils";
import { ROUTES } from "../../config/routes";

export const WishlistPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    items,
    count,
    loading,
    removeItem,
    emptyWishlist,
    moveItemToCart,
    moveAllInStockToCart,
    refreshWishlist,
  } = useWishlist();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");
  const [sortBy, setSortBy] = useState<"RECENT" | "PRICE_ASC" | "PRICE_DESC" | "NAME">("RECENT");
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  const [movingAll, setMovingAll] = useState(false);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  // Derived statistics
  const stats = useMemo(() => {
    let inStockCount = 0;

    for (const item of items) {
      const stock = item.variant ? item.variant.stock : item.product.stock;
      if (!item.isOutOfStock && stock > 0) {
        inStockCount++;
      }
    }

    return {
      total: items.length,
      inStock: inStockCount,
      outOfStock: items.length - inStockCount,
    };
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter((item) => {
        const nameMatch = item.product.name.toLowerCase().includes(q);
        const catMatch = item.product.category?.name.toLowerCase().includes(q);
        const descMatch = item.product.description?.toLowerCase().includes(q);
        return nameMatch || catMatch || descMatch;
      });
    }

    // Stock status filter
    if (stockFilter === "IN_STOCK") {
      result = result.filter((item) => !item.isOutOfStock && item.product.stock > 0);
    } else if (stockFilter === "OUT_OF_STOCK") {
      result = result.filter((item) => item.isOutOfStock || item.product.stock <= 0);
    }

    // Sorting
    if (sortBy === "PRICE_ASC") {
      result.sort((a, b) => (a.product.price || 0) - (b.product.price || 0));
    } else if (sortBy === "PRICE_DESC") {
      result.sort((a, b) => (b.product.price || 0) - (a.product.price || 0));
    } else if (sortBy === "NAME") {
      result.sort((a, b) => a.product.name.localeCompare(b.product.name));
    } else {
      // RECENT (default)
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [items, debouncedSearch, stockFilter, sortBy]);

  const handleMoveToCart = async (item: WishlistItem) => {
    setMovingItemId(item.productId);
    try {
      await moveItemToCart(item);
    } finally {
      setMovingItemId(null);
    }
  };

  const handleMoveAllToCart = async () => {
    setMovingAll(true);
    try {
      await moveAllInStockToCart();
    } finally {
      setMovingAll(false);
    }
  };

  const handleClearWishlist = async () => {
    await emptyWishlist();
    setIsClearModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb
            items={[
              { label: t("nav.home", { defaultValue: "Home" }), to: ROUTES.HOME },
              { label: t("nav.myAccount", { defaultValue: "Account" }), to: ROUTES.DASHBOARD },
              { label: t("wishlist.title", { defaultValue: "My Wishlist" }) },
            ]}
          />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Wishlist Header Banner */}
        <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-rose-100/60 to-pink-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-3xl sm:text-4xl shadow-2xs shrink-0">
                ❤️
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {t("wishlist.title", { defaultValue: "My Wishlist" })}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
                    {count === 1 ? t("wishlist.itemCount", { defaultValue: "1 Item" }) : t("wishlist.itemsCount", { count, defaultValue: `${count} Items` })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {t("wishlist.subtitle", { defaultValue: "Keep track of all your favorite items and transfer them to your cart anytime." })}
                </p>
              </div>
            </div>

            {/* Quick Actions if items exist */}
            {items.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleMoveAllToCart}
                  disabled={stats.inStock === 0 || movingAll}
                  icon={
                    movingAll ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    )
                  }
                >
                  {movingAll
                    ? t("wishlist.movingToCart", { defaultValue: "Moving to Cart..." })
                    : t("wishlist.moveAllToCart", { count: stats.inStock, defaultValue: `Move All (${stats.inStock}) to Cart` })}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsClearModalOpen(true)}
                  className="!text-rose-600 hover:!bg-rose-50 !border-rose-200"
                  icon={
                    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  }
                >
                  {t("wishlist.clearAll", { defaultValue: "Clear All" })}
                </Button>
              </div>
            )}
          </div>
        </div>


        {/* Content Area */}
        {loading && items.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
            <p className="text-xs font-medium text-slate-500">{t("common.loading", { defaultValue: "Loading your wishlist..." })}</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty Wishlist State */
          <div className="rounded-3xl bg-white border border-slate-200 p-10 sm:p-16 text-center shadow-xs">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-5xl shadow-2xs">
              🤍
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              {t("wishlist.emptyTitle", { defaultValue: "Your Wishlist is Empty" })}
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
              {t("wishlist.emptySubtitle", { defaultValue: "Explore our wide range of products and tap the heart icon on any item you love to save it for later." })}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(ROUTES.PRODUCTS)}
              >
                {t("wishlist.browseProducts", { defaultValue: "Browse All Products" })}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(ROUTES.CATEGORIES)}
              >
                {t("wishlist.exploreCategories", { defaultValue: "Explore Categories" })}
              </Button>
            </div>
          </div>
        ) : (
          /* Wishlist Items Filter & Grid */
          <div className="space-y-6">
            {/* Filter / Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="w-full md:w-80">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder={t("common.searchPlaceholder", { defaultValue: "Search in wishlist..." })}
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Stock Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setStockFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${stockFilter === "ALL"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {t("common.all", { defaultValue: "All" })} ({stats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter("IN_STOCK")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${stockFilter === "IN_STOCK"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {t("wishlist.inStockTab", { count: stats.inStock, defaultValue: `In Stock (${stats.inStock})` })}
                  </button>
                  {stats.outOfStock > 0 && (
                    <button
                      type="button"
                      onClick={() => setStockFilter("OUT_OF_STOCK")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${stockFilter === "OUT_OF_STOCK"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {t("wishlist.outOfStockTab", { count: stats.outOfStock, defaultValue: `Out of Stock (${stats.outOfStock})` })}
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer"
                >
                  <option value="RECENT">{t("wishlist.recentlyAdded", { defaultValue: "Recently Added" })}</option>
                  <option value="PRICE_ASC">{t("wishlist.priceAsc", { defaultValue: "Price: Low to High" })}</option>
                  <option value="PRICE_DESC">{t("wishlist.priceDesc", { defaultValue: "Price: High to Low" })}</option>
                  <option value="NAME">{t("wishlist.nameAsc", { defaultValue: "Product Name (A-Z)" })}</option>
                </select>
              </div>
            </div>

            {/* If search yields 0 items */}
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-xs">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {t("products.noProductsFound", { defaultValue: "No matching items found" })}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {t("products.noProductsDesc", { defaultValue: "No saved products match your current search or stock filter." })}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStockFilter("ALL");
                  }}
                >
                  {t("common.reset", { defaultValue: "Reset Filters" })}
                </Button>
              </div>
            ) : (
              /* Products Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map((item) => {
                  const product = item.product;
                  const variant = item.variant;
                  const effectivePrice = variant?.price ?? product.price;
                  const effectiveComparePrice = variant?.comparePrice ?? product.comparePrice;
                  const effectiveStock = variant?.stock ?? product.stock;

                  const discountPercent =
                    effectiveComparePrice && effectiveComparePrice > effectivePrice
                      ? Math.round(
                        ((effectiveComparePrice - effectivePrice) /
                          effectiveComparePrice) *
                        100
                      )
                      : null;
                  const rawImage = variant?.images?.[0] || variant?.thumbnail || product.thumbnail || product.images?.[0];
                  const isOutOfStock =
                    item.isOutOfStock || !product.isActive || effectiveStock <= 0;
                  const isMoving = movingItemId === item.productId;

                  return (
                    <div
                      key={item.id}
                      className="group relative rounded-3xl bg-white border border-slate-200/90 hover:border-rose-200 shadow-xs hover:shadow-md hover:shadow-rose-500/5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Image Container */}
                        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                          <Link
                            to={`/products/${product.slug}`}
                            className="w-full h-full block"
                          >
                            {rawImage ? (
                              <img
                                src={getImageUrl(rawImage)}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                                <span className="text-4xl">📦</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                                  No Preview
                                </span>
                              </div>
                            )}
                          </Link>

                          {/* Discount & Featured Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                            {discountPercent && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                                -{discountPercent}% {t("common.discount", { defaultValue: "OFF" })}
                              </span>
                            )}
                            {product.isFeatured && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-sm">
                                ★ {t("common.featured", { defaultValue: "Featured" })}
                              </span>
                            )}
                          </div>

                          {/* Quick Remove Button from Wishlist */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, product.name)}
                            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                            title={t("wishlist.removeFromWishlist", { defaultValue: "Remove from wishlist" })}
                          >
                            <svg className="w-4 h-4 text-rose-500 fill-rose-500" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                              />
                            </svg>
                          </button>

                          {/* Stock Tag Overlay */}
                          <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                            {isOutOfStock ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-xs shadow-sm">
                                {t("common.outOfStock", { defaultValue: "Out of Stock" })}
                              </span>
                            ) : effectiveStock <= 5 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/95 text-white backdrop-blur-xs shadow-sm">
                                {t("common.onlyXLeft", { count: effectiveStock, defaultValue: `Only ${effectiveStock} left` })}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 pb-3">
                          {product.category && (
                            <Link
                              to={`/categories/${product.category.slug}`}
                              className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors mb-1.5"
                            >
                              {product.category.name}
                            </Link>
                          )}

                          <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                            <Link to={`/products/${product.slug}`} title={product.name}>
                              {product.name}
                            </Link>
                          </h3>

                          {/* Variant Badge */}
                          {variant?.attributes && (
                            <div className="mt-1.5">
                              <VariantBadge
                                attributes={variant.attributes as Record<string, string>}
                                sku={variant.sku}
                                compact
                              />
                            </div>
                          )}

                          {product.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Price & Actions */}
                      <div className="p-5 pt-0 mt-auto">
                        <div className="pt-3.5 border-t border-slate-100 flex flex-col space-y-3">
                          {/* Pricing Row */}
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                ₹{Number(effectivePrice).toFixed(2)}
                              </span>
                              {effectiveComparePrice && effectiveComparePrice > effectivePrice && (
                                <span className="text-xs text-slate-400 line-through font-medium">
                                  ₹{Number(effectiveComparePrice).toFixed(2)}
                                </span>
                              )}
                            </div>

                            {!isOutOfStock ? (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{t("common.inStock", { defaultValue: "In Stock" })}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-rose-500 flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>{t("common.outOfStock", { defaultValue: "Out of Stock" })}</span>
                              </span>
                            )}
                          </div>

                          {/* Move to Cart Action Button */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveToCart(item)}
                              disabled={isOutOfStock || isMoving}
                              className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer shadow-xs ${isOutOfStock
                                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]"
                                }`}
                              title={
                                isOutOfStock
                                  ? t("common.outOfStock", { defaultValue: "Out of stock" })
                                  : t("products.addToCart", { defaultValue: "Add to Cart" })
                              }
                            >
                              {isMoving ? (
                                <div className="flex items-center space-x-1.5">
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>{t("common.adding", { defaultValue: "Adding..." })}</span>
                                </div>
                              ) : isOutOfStock ? (
                                <span>{t("wishlist.unavailable", { defaultValue: "Unavailable" })}</span>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.2}
                                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                  </svg>
                                  <span>{t("products.addToCart", { defaultValue: "Add to Cart" })}</span>
                                </>
                              )}
                            </button>


                            <Link
                              to={`/products/${product.slug}`}
                              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-2xs"
                              title={t("common.details", { defaultValue: "View details" })}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing Entire Wishlist */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearWishlist}
        title={t("wishlist.clearWishlistConfirmTitle", { defaultValue: "Clear Wishlist" })}
        message={t("wishlist.clearWishlistConfirmMessage", { defaultValue: "Are you sure you want to remove all saved items from your wishlist? This action cannot be undone." })}
        confirmText={t("wishlist.clearAll", { defaultValue: "Yes, Clear All" })}
        variant="danger"
      />

    </div>
  );
};

export default WishlistPage;
