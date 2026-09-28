import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchProductBySlug, clearCurrentProduct } from "../../redux/products/productSlice";
import { addToCart } from "../../redux/cart/cartSlice";
import { ProductCard, ProductImageZoom, VariantSelector } from "../../components/products";
import { Badge, Button, StarRating, Breadcrumb } from "../../components/common";
import { ProductReviewsSection } from "../../components/reviews";
import { getImageUrl } from "../../utils/image.utils";
import { ProductVariant } from "../../types/product";
import { toast } from "react-toastify";
import { useTranslation } from "../../i18n";
import { useProductVisitTracker } from "../../hooks/useProductVisitTracker";

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { currentProduct, relatedProducts, loading, error } = useAppSelector(
    (state) => state.products
  );
  const { productStats } = useAppSelector((state) => state.reviews);

  // Automatic Product Visit Tracking for logged-in users with anti-spam cooldown protection
  const { isHighlyInterested, visitCount } = useProductVisitTracker(currentProduct?.id);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [openWriteModalTrigger, setOpenWriteModalTrigger] = useState<number>(0);

  const handleScrollToReviews = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("reviews-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (slug) {
      dispatch(fetchProductBySlug(slug));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, slug]);

  // When currentProduct loads or changes, pick initial default variant and set images
  useEffect(() => {
    if (currentProduct) {
      if (currentProduct.variants && currentProduct.variants.length > 0) {
        const initial =
          currentProduct.variants.find((v) => v.isDefault && v.isActive) ||
          currentProduct.variants.find((v) => v.isActive && v.stock > 0) ||
          currentProduct.variants[0];

        setSelectedVariant(initial);
        setSelectedAttributes(initial.attributes || {});

        const initialImages =
          initial.images && initial.images.length > 0
            ? initial.images
            : currentProduct.images || [];

        const firstImg =
          initial.thumbnail ||
          initialImages[0] ||
          currentProduct.thumbnail ||
          currentProduct.images?.[0] ||
          "";

        setSelectedImage(firstImg);
      } else {
        setSelectedVariant(null);
        setSelectedAttributes({});
        setSelectedImage(
          currentProduct.thumbnail || currentProduct.images?.[0] || ""
        );
      }
      setQuantity(1);
    }
  }, [currentProduct]);

  // Handle attribute selection changes with dynamic variant resolution and gallery update
  const handleSelectAttributes = (newAttributes: Record<string, string>) => {
    setSelectedAttributes(newAttributes);

    if (!currentProduct?.variants || currentProduct.variants.length === 0) return;

    // Find exact matching variant
    const match = currentProduct.variants.find((v) => {
      if (!v.attributes || !v.isActive) return false;
      return Object.entries(newAttributes).every(
        ([k, val]) => v.attributes[k] === val
      );
    });

    if (match) {
      setSelectedVariant(match);

      // Dynamic gallery update: immediately switch gallery to variant's images if available
      if (match.images && match.images.length > 0) {
        const newThumb = match.thumbnail || match.images[0];
        setSelectedImage(newThumb);
      } else if (currentProduct.images && currentProduct.images.length > 0) {
        setSelectedImage(currentProduct.thumbnail || currentProduct.images[0]);
      }
    } else {
      setSelectedVariant(null);
    }
  };

  const handleAddToCart = async () => {
    if (!currentProduct) return;

    const hasVariantsList = currentProduct.variants && currentProduct.variants.length > 0;

    if (hasVariantsList) {
      if (!selectedVariant || !selectedVariant.isActive) {
        toast.error(t("products.selectValidVariant", { defaultValue: "Please select an available variant combination." }));
        return;
      }
      if (selectedVariant.stock <= 0) {
        toast.error(t("common.outOfStock", { defaultValue: "This item is currently out of stock." }));
        return;
      }
      if (quantity > selectedVariant.stock) {
        toast.error(t("products.exceedsStock", { defaultValue: `Only ${selectedVariant.stock} units available in stock.` }));
        return;
      }
    } else {
      if (!currentProduct.isActive || currentProduct.stock <= 0) {
        toast.error(t("common.outOfStock", { defaultValue: "This item is currently out of stock." }));
        return;
      }
      if (quantity > currentProduct.stock) {
        toast.error(t("products.exceedsStock", { defaultValue: `Only ${currentProduct.stock} units available in stock.` }));
        return;
      }
    }

    try {
      const resultAction = await dispatch(
        addToCart({
          productId: currentProduct.id,
          variantId: selectedVariant?.id,
          quantity,
          product: currentProduct,
          variant: selectedVariant,
        })
      );
      if (addToCart.fulfilled.match(resultAction)) {
        const variantLabel =
          selectedVariant?.attributes && Object.keys(selectedVariant.attributes).length > 0
            ? ` (${Object.values(selectedVariant.attributes).join(", ")})`
            : "";

        toast.success(
          quantity > 1
            ? t("messages.cart.itemAddedPlural", {
              name: `${currentProduct.name}${variantLabel}`,
              qty: quantity,
              defaultValue: `Added ${quantity} units of "${currentProduct.name}${variantLabel}" to your cart!`,
            })
            : t("messages.cart.itemAdded", {
              name: `${currentProduct.name}${variantLabel}`,
              defaultValue: `Added "${currentProduct.name}${variantLabel}" to your cart!`,
            })
        );
      } else {
        toast.error((resultAction.payload as string) || t("messages.cart.addFailed", "Failed to add to cart"));
      }
    } catch (err: any) {
      toast.error(err.message || t("messages.cart.addFailed", "Failed to add to cart"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
        <p className="text-xs font-medium text-slate-500">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t("products.productNotFound")}</h2>
          <p className="text-xs text-slate-500 mb-6">
            {t("products.productNotFoundDesc")}
          </p>
          <Button variant="primary" size="md" onClick={() => navigate("/products")}>
            {t("wishlist.browseProducts", "Browse All Products")}
          </Button>
        </div>
      </div>
    );
  }

  // Dynamic values based on selected variant
  const hasVariantsList = Boolean(currentProduct.variants && currentProduct.variants.length > 0);
  const isVariantSelected = Boolean(selectedVariant && selectedVariant.isActive);
  const isCombinationAvailable = hasVariantsList ? isVariantSelected : currentProduct.isActive;
  const activeStock = hasVariantsList ? (selectedVariant ? selectedVariant.stock : 0) : currentProduct.stock;
  const activePrice = selectedVariant ? selectedVariant.price : currentProduct.price;
  const activeComparePrice = selectedVariant ? selectedVariant.comparePrice : currentProduct.comparePrice;
  const activeSku = selectedVariant?.sku || currentProduct.sku;
  const isOutOfStock = !isCombinationAvailable || activeStock <= 0;

  const discountPercent =
    activeComparePrice && activeComparePrice > activePrice
      ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100)
      : null;

  const savingsAmount =
    activeComparePrice && activeComparePrice > activePrice
      ? (activeComparePrice - activePrice).toFixed(2)
      : null;

  // Dynamic Image Gallery List: switch to selected variant's images if available
  const variantImages = [
    ...(selectedVariant?.thumbnail ? [selectedVariant.thumbnail] : []),
    ...(selectedVariant?.images || []),
  ].filter(Boolean);

  const baseImages = [
    ...(currentProduct.thumbnail ? [currentProduct.thumbnail] : []),
    ...(currentProduct.images || []),
  ].filter(Boolean);

  const allImages = (variantImages.length > 0 ? variantImages : baseImages).filter(
    (v, i, a) => Boolean(v) && a.indexOf(v) === i
  );

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xs">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <Breadcrumb
            items={[
              { label: t("nav.home", "Home"), to: "/" },
              { label: t("nav.products", "Products"), to: "/products" },
              ...(currentProduct.category
                ? [
                  {
                    label: currentProduct.category.name,
                    to: `/categories/${currentProduct.category.slug}`,
                  },
                ]
                : []),
              {
                label: currentProduct.name,
                active: true,
                className: "truncate max-w-xs",
              },
            ]}
          />
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* Left Column: Dynamic Image Gallery */}
          <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-5 sm:p-6">
              {selectedImage ? (
                <ProductImageZoom
                  src={selectedImage}
                  alt={currentProduct.name}
                  enlargedWidth={560}
                  enlargedHeight={560}
                  className="w-full h-full flex items-center justify-center transition-all duration-300"
                  imageClassName="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <span className="text-5xl">📦</span>
                  <p className="text-xs font-bold mt-2">{t("common.noData", "No Preview Available")}</p>
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 pointer-events-none z-10">
                {isHighlyInterested && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md flex items-center space-x-1 animate-pulse">
                    <span>🔥</span>
                    <span>{t("products.highlyInterestedBadge", "Highly Interested")}</span>
                  </span>
                )}
                {discountPercent && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                    -{discountPercent}% {t("common.discount", "OFF")}
                  </span>
                )}
                {currentProduct.isFeatured && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                    ★ {t("home.featured", "Featured")}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none w-full">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-18 h-18 aspect-square rounded-2xl bg-white border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${selectedImage === imgUrl
                      ? "border-indigo-600 ring-2 ring-indigo-600/20 scale-105 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Metadata & Variant Actions */}
          <div className="flex-1 w-full min-w-0 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Category, SKU & Stock Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {currentProduct.category && (
                    <Link
                      to={`/categories/${currentProduct.category.slug}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                    >
                      📁 {currentProduct.category.name}
                    </Link>
                  )}
                  {activeSku && (
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {t("products.sku", "SKU")}: {activeSku}
                    </span>
                  )}

                </div>

                <div>
                  {!isCombinationAvailable ? (
                    <Badge variant="danger" size="sm">
                      {t("products.combinationUnavailable", "Unavailable")}
                    </Badge>
                  ) : activeStock > 10 ? (
                    <Badge variant="success" size="sm" dot>
                      {t("products.inStockOnly", "In Stock")} ({activeStock} {t("common.items", "items")})
                    </Badge>
                  ) : activeStock > 0 ? (
                    <Badge variant="warning" size="sm" dot>
                      {t("common.lowStock", "Low Stock")} ({activeStock} {t("common.items", "items")})
                    </Badge>
                  ) : (
                    <Badge variant="danger" size="sm">
                      {t("common.outOfStock", "Out of Stock")}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Product Title & Ratings */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {currentProduct.name}
                </h1>

                {productStats && productStats.totalReviews > 0 ? (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleScrollToReviews}
                      className="inline-flex items-center gap-2 group cursor-pointer text-left"
                    >
                      <StarRating value={productStats.averageRating} size="sm" />
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {productStats.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-indigo-600 font-semibold group-hover:underline">
                        · {productStats.totalReviews} {t("reviews.stars", "Reviews")}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleScrollToReviews}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    <span>★ {t("reviews.writeReview", "Write a Review")}</span>
                  </button>
                )}
              </div>

              {/* Pricing Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                      ₹{Number(activePrice).toFixed(2)}
                    </span>
                    {activeComparePrice && activeComparePrice > activePrice && (
                      <span className="text-base text-slate-400 line-through font-medium">
                        ₹{Number(activeComparePrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {savingsAmount && discountPercent && (
                    <p className="text-xs font-bold text-emerald-600">
                      {t("cart.savings", "Savings")}: ₹{savingsAmount} ({discountPercent}% {t("common.discount", "OFF")})
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-slate-700">
                    {!isCombinationAvailable ? (
                      <span className="text-rose-600">
                        {t("products.combinationUnavailable", "Combination Not Available")}
                      </span>
                    ) : activeStock > 0 ? (
                      <span className="text-emerald-600">
                        {activeStock > 5
                          ? t("products.inStockOnly", "In Stock")
                          : t("products.lowStockNotice", { count: activeStock, defaultValue: `Only ${activeStock} left in stock` })}
                      </span>
                    ) : (
                      <span className="text-rose-600">
                        {t("common.outOfStock", "Out of Stock")}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t("cart.estimatedTax", "Estimated Tax Included")}</p>
                </div>
              </div>

              {/* Highly Interested Intelligence Alert */}
              {isHighlyInterested && (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-300/80 text-amber-950 flex items-start space-x-3.5 shadow-2xs animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-lg shadow-xs flex-shrink-0">
                    🔥
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs sm:text-sm font-black text-amber-900 tracking-tight">
                        {t("products.highInterestTitle", "Top Item on Your Radar")}
                      </h4>

                    </div>
                    <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                      {t(
                        "products.highInterestDesc",
                        "You've returned to this product 3+ times! Great taste — grab it before inventory runs out."
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Product Variants Selector */}
              {currentProduct.variants && currentProduct.variants.length > 0 && (
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <VariantSelector
                    variants={currentProduct.variants}
                    selectedVariant={selectedVariant}
                    selectedAttributes={selectedAttributes}
                    onSelectAttributes={handleSelectAttributes}
                  />
                </div>
              )}

              {/* Description */}
              {currentProduct.description && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("products.descriptionTab", "Description & Specifications")}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {currentProduct.description}
                  </p>
                </div>
              )}

              {/* Trust & Guarantee Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 flex items-center space-x-3 text-xs font-bold text-slate-800 shadow-2xs">
                  <span className="text-xl">🚀</span>
                  <div>
                    <p className="font-bold text-slate-900">{t("home.trust.shippingTitle", "Fast Express Shipping")}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{t("products.freeShippingNotice", "Free on orders > ₹499")}</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 flex items-center space-x-3 text-xs font-bold text-slate-800 shadow-2xs">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <p className="font-bold text-slate-900">{t("home.trust.authenticTitle", "100% Authentic Quality")}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{t("products.secureCheckoutNotice", "SSL Encrypted Payments")}</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 flex items-center space-x-3 text-xs font-bold text-slate-800 shadow-2xs">
                  <span className="text-xl">🔄</span>
                  <div>
                    <p className="font-bold text-slate-900">{t("home.trust.returnsTitle", "7-Day Hassle-Free Returns")}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{t("products.hassleFreeReturnNotice", "7-Day Replacement Policy")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Selector and CTA Actions */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-slate-200/90 rounded-2xl bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-black text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= activeStock || isOutOfStock}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={isOutOfStock || quantity > activeStock}
                  onClick={handleAddToCart}
                  className="flex-1 !h-12 !rounded-2xl font-bold shadow-xs hover:shadow-md transition-all"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  }
                >
                  {!isCombinationAvailable
                    ? t("products.combinationUnavailable", "Unavailable")
                    : activeStock > 0
                      ? t("products.addToCart")
                      : t("common.outOfStock")}
                </Button>

                <Button
                  wishlistProduct={currentProduct}
                  wishlistVariant="button"
                  size="lg"
                  showWishlistLabel={false}
                  className="h-12 w-12 !p-0 !rounded-2xl shrink-0 border border-slate-200 bg-white hover:bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews & Ratings Section */}
        <ProductReviewsSection
          productId={currentProduct.id}
          productName={currentProduct.name}
          openWriteModalTrigger={openWriteModalTrigger}
        />

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {t("products.relatedProducts")}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t("products.relatedProductsSubtitle")}
                </p>
              </div>
              <Link
                to={`/categories/${currentProduct.category?.slug}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {t("common.viewAll")} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
