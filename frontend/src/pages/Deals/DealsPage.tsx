import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchProducts } from "../../redux/products/productSlice";
import { fetchCategories } from "../../redux/categories/categorySlice";
import { ProductCard } from "../../components/products/ProductCard";
import { Breadcrumb, Icon } from "../../components/common";
import { toast } from "react-toastify";

const COUPONS = [
  {
    code: "SAVINGS15",
    discount: "15% OFF",
    title: "Instant Cart Discount",
    minOrder: "Orders above ₹999",
    expiry: "Valid today only",
    category: "Site-wide",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    code: "FLAT500",
    discount: "₹500 FLAT",
    title: "Mega Order Savings",
    minOrder: "Orders above ₹2,499",
    expiry: "Limited redemptions",
    category: "All Products",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    code: "FREESHIP",
    discount: "FREE SHIPPING",
    title: "Express Delivery Pass",
    minOrder: "No minimum spend",
    expiry: "Auto-applies at checkout",
    category: "Delivery",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    code: "FESTIVE30",
    discount: "30% OFF",
    title: "Category Special",
    minOrder: "Orders above ₹1,499",
    expiry: "Valid this week",
    category: "Featured Deals",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export const DealsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.products);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Simulated countdown timer for Flash Deals
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 24, seconds: 35 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(
      fetchProducts({
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    );
  }, [dispatch]);

  // All active discounted products (or active products as fallback)
  const allDiscountedProducts = useMemo(() => {
    const discounted = products.filter(
      (p) => p.isActive && p.comparePrice && p.comparePrice > p.price
    );
    if (discounted.length > 0) return discounted;
    return products.filter((p) => p.isActive);
  }, [products]);

  // 1. Flash Deals (urgent / top markdowns)
  const flashDeals = useMemo(() => {
    return [...allDiscountedProducts]
      .sort((a, b) => {
        const discA = a.comparePrice ? (a.comparePrice - a.price) / a.comparePrice : 0;
        const discB = b.comparePrice ? (b.comparePrice - b.price) / b.comparePrice : 0;
        return discB - discA;
      })
      .slice(0, 4);
  }, [allDiscountedProducts]);

  // 2. Today's Best Deals (curated / featured)
  const todaysBestDeals = useMemo(() => {
    const featured = allDiscountedProducts.filter((p) => p.isFeatured);
    if (featured.length >= 4) return featured.slice(0, 4);
    return allDiscountedProducts.slice(0, 4);
  }, [allDiscountedProducts]);

  // 3. Biggest Discounts (highest % off)
  const biggestDiscounts = useMemo(() => {
    return [...allDiscountedProducts]
      .sort((a, b) => {
        const discA = a.comparePrice ? (a.comparePrice - a.price) / a.comparePrice : 0;
        const discB = b.comparePrice ? (b.comparePrice - b.price) / b.comparePrice : 0;
        return discB - discA;
      })
      .slice(0, 4);
  }, [allDiscountedProducts]);

  // 4. New Deals (newest items)
  const newDeals = useMemo(() => {
    return [...allDiscountedProducts]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 4);
  }, [allDiscountedProducts]);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t("deals.copiedCoupon", { code, defaultValue: `Coupon ${code} copied! Apply at checkout for discount.` }));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 pb-24 font-sans">
      
      {/* 1. LARGE PROMOTIONAL HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-rose-50/20 to-slate-50 text-slate-900 border-b border-slate-200/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative z-10">
          {/* Breadcrumbs */}
          <Breadcrumb
            className="mb-6"
            items={[
              { label: t("nav.home", "Home"), to: "/" },
              { label: t("nav.deals", "Exclusive Deals"), active: true },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider shadow-2xs">
                <Icon name="zap" className="w-3.5 h-3.5 text-rose-600" />
                <span>{t("deals.badge", "Limited-Time Markdowns & Flash Offers")}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                {t("deals.heroTitle", "Huge Markdowns.")}{" "}
                <span className="text-rose-600">
                  {t("deals.heroHighlight", "Up to 50% Off.")}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                {t("deals.heroSubtitle", "Discover limited-time price drops, verified bargains, and exclusive coupon codes across premium collections.")}
              </p>

              {/* Countdown Timer Pill & CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs">
                  <Icon name="clock" className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold">{t("deals.flashSaleEnds", "Flash Sale Ends In:")}</span>
                  <div className="flex items-center space-x-1 font-mono font-bold text-slate-900 text-sm">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100">
                      {String(timeLeft.hours).padStart(2, "0")}h
                    </span>
                    <span>:</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100">
                      {String(timeLeft.minutes).padStart(2, "0")}m
                    </span>
                    <span>:</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">
                      {String(timeLeft.seconds).padStart(2, "0")}s
                    </span>
                  </div>
                </div>

                <a
                  href="#flash-deals"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>{t("deals.browseFlashDeals", "Browse Flash Deals")}</span>
                  <Icon name="arrow-right" className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Right Spotlight Promo Card */}
            <div className="lg:col-span-5">
              <div className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                    {t("deals.vipCoupon", "VIP Coupon")}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t("deals.verifiedActive", "Verified Active")}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t("deals.extraInstantOff", "Extra 15% Instant Off")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("deals.vipCouponDesc", "Apply at checkout on any order over ₹999. Can be combined with active sale prices!")}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                      <Icon name="percent" className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-sm tracking-wider text-slate-900">
                        SAVINGS15
                      </p>
                      <p className="text-[10px] text-slate-400">{t("deals.clickToCopy", "Click to copy code")}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCoupon("SAVINGS15")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    {copiedCode === "SAVINGS15" ? (
                      <>
                        <Icon name="check" className="w-3.5 h-3.5 text-white" />
                        <span>{t("common.save", "Copied!")}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="copy" className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
                  <div>
                    <strong className="block text-slate-900 font-bold">100%</strong>
                    <span>{t("home.trust.authenticTag", "Authentic")}</span>
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-bold">{t("cart.free", "Free")}</strong>
                    <span>{t("home.trust.shippingTitle", "Fast Shipping")}</span>
                  </div>
                  <div>
                    <strong className="block text-slate-900 font-bold">7-Day</strong>
                    <span>{t("home.trust.returnsTag", "Easy Returns")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLASH DEALS ⚡ SECTION */}
      {flashDeals.length > 0 && (
        <section id="flash-deals" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Icon name="zap" className="w-3.5 h-3.5 text-rose-600" />
                <span>{t("deals.limitedStockTime", "Limited Stock & Time")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t("deals.flashDeals", "Flash Deals ⚡")}
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {t("deals.flashDealsDesc", "High discounts available while promotional stock lasts")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {flashDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 3. TODAY'S BEST DEALS SECTION */}
      {todaysBestDeals.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Icon name="star" className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t("deals.curatedTopValue", "Curated Top Value")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t("deals.todaysBest", "Today's Best Deals")}
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {t("deals.todaysBestDesc", "Handpicked top-rated products with verified discounts")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {todaysBestDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. COUPON DEALS 🎟️ SECTION */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Icon name="gift" className="w-3.5 h-3.5 text-purple-600" />
              <span>{t("deals.voucherCodes", "Checkout Voucher Codes")}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t("deals.couponDeals", "Coupon Deals 🎟️")}
            </h2>
          </div>
          <p className="text-xs font-medium text-slate-500">
            {t("deals.couponDealsDesc", "Copy voucher codes and apply at checkout for instant savings")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {COUPONS.map((coupon) => (
            <div
              key={coupon.code}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${coupon.badgeColor}`}>
                    {coupon.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {coupon.expiry}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {coupon.discount}
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {coupon.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {coupon.minOrder}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-black tracking-wider text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {coupon.code}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyCoupon(coupon.code)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Icon name="check" className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t("common.save", "Copied")}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="copy" className="w-3.5 h-3.5 text-slate-300" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. BIGGEST DISCOUNTS SECTION */}
      {biggestDiscounts.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Icon name="percent" className="w-3.5 h-3.5 text-rose-600" />
                <span>{t("deals.deepMarkdowns", "Deep Markdowns")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t("deals.biggestDiscounts", "Biggest Discounts")}
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {t("deals.biggestDiscountsDesc", "Top percentage price cuts across all departments")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {biggestDiscounts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. NEW DEALS SECTION */}
      {newDeals.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Icon name="trending-up" className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("deals.freshMarkdowns", "Fresh Markdowns")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t("deals.newDeals", "New Deals")}
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {t("deals.newDealsDesc", "Newly added promotions and seasonal drops")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 7. BOTTOM CTA: EXPLORE FULL CATALOG */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="p-8 sm:p-12 rounded-3xl bg-indigo-50/60 text-slate-900 border border-indigo-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              {t("deals.lookingForMore", "Looking for more?")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1 text-slate-900">
              {t("deals.exploreFullCatalog", "Explore Our Entire Product Catalog")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
              Browse thousands of authentic products across all departments with fast shipping and 30-day returns.
            </p>
          </div>
          <Link
            to="/products"
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all whitespace-nowrap hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center gap-2 flex-shrink-0"
          >
            <span>{t("deals.browseFullCatalog", "Browse Full Catalog")}</span>
            <Icon name="arrow-right" className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default DealsPage;

