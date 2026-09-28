import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { useBanners } from "../../hooks/useBanners";
import { fetchCategories } from "../../redux/categories/categorySlice";
import {
  fetchFeaturedProducts,
  fetchProducts,
} from "../../redux/products/productSlice";
import { ProductCard } from "../../components/products/ProductCard";
import { DynamicHeroBanner } from "../../components/banners";
import { getImageUrl } from "../../utils/image.utils";
import { Icon } from "../../components/common";
import { Category } from "../../types/category";
import { Product } from "../../types/product";

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { activeBanners, activeBannersLoading, loadActiveBanners } = useBanners();
  const { categories, loading: categoriesLoading } = useAppSelector(
    (state) => state.categories
  );
  const {
    products,
    featuredProducts,
  } = useAppSelector((state) => state.products);

  useEffect(() => {
    loadActiveBanners();
    dispatch(fetchCategories());
    dispatch(fetchFeaturedProducts(8));
    dispatch(
      fetchProducts({
        limit: 12,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
    );
  }, [dispatch]);

  // Filter root / top-level active categories
  const topCategories = categories
    .filter((c: Category) => !c.parentId && c.isActive)
    .slice(0, 8);

  // Best sellers: take first 4 items from products catalog
  const bestSellers = products.slice(0, 4);

  const TRUST_BENEFITS = [
    {
      icon: "shield" as const,
      title: t("home.trust.authenticTitle", "100% Authentic Quality"),
      description: t("home.trust.authenticDesc", "Directly sourced from verified manufacturers & brands with full warranty."),
      tag: t("home.trust.authenticTag", "Verified"),
    },
    {
      icon: "truck" as const,
      title: t("home.trust.shippingTitle", "Fast Express Shipping"),
      description: t("home.trust.shippingDesc", "Prompt delivery with real-time tracking. Free on orders above ₹499."),
      tag: t("home.trust.shippingTag", "Free > ₹499"),
    },
    {
      icon: "lock" as const,
      title: t("home.trust.paymentsTitle", "Secure Razorpay Payments"),
      description: t("home.trust.paymentsDesc", "256-bit SSL encrypted transactions supporting UPI, Cards & Net Banking."),
      tag: t("home.trust.paymentsTag", "Encrypted"),
    },
    {
      icon: "rotate-ccw" as const,
      title: t("home.trust.returnsTitle", "7-Day Hassle-Free Returns"),
      description: t("home.trust.returnsDesc", "Not completely satisfied? Return or exchange with zero restocking fees."),
      tag: t("home.trust.returnsTag", "Guaranteed"),
    },
  ];

  const categoryGradients = [
    "from-slate-900/90 via-slate-900/60 to-slate-950/90",
    "from-indigo-950/90 via-indigo-900/60 to-slate-950/90",
    "from-purple-950/90 via-purple-900/60 to-slate-950/90",
    "from-slate-950/90 via-slate-900/60 to-indigo-950/90",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

      {/* 1. Dynamic Hero Banner Carousel */}
      <DynamicHeroBanner
        banners={activeBanners}
        loading={activeBannersLoading}
      />

      {/* Quick Category Jump Chips Bar */}
      {topCategories.length > 0 && (
        <section className="bg-white border-b border-slate-200/80 py-2.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>{t("home.trendingDepartments", "Trending:")}</span>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
              {topCategories.map((cat: Category) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 whitespace-nowrap transition-all shadow-2xs"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                to="/categories"
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold whitespace-nowrap transition-colors"
              >
                {t("home.allCategories", "All Categories")} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Trust & Benefits Section (Compact & Clean) */}
      <section className="py-6 sm:py-8 bg-white border-b border-slate-200/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {TRUST_BENEFITS.map((benefit, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Icon name={benefit.icon} className="w-4 h-4" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200/70 text-slate-600">
                      {benefit.tag}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Shop by Category Section */}
      <section className="py-8 sm:py-10 lg:py-12 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <div className="flex items-center space-x-1.5 text-indigo-600 mb-0.5">
              <Icon name="layers" className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {t("home.departments", "Departments")}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("home.shopByCategory", "Shop by Category")}
            </h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>{t("home.viewAll", "View All")} ({categories.length})</span>
            <Icon name="arrow-right" className="w-3 h-3" />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-36 sm:h-40 rounded-xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : topCategories.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {topCategories.map((cat: Category, idx: number) => {
              const subCount =
                cat.children?.length || cat._count?.children || 0;
              const hasCustomImage = Boolean(cat.image);
              const gradient =
                categoryGradients[idx % categoryGradients.length];

              return (
                <Link
                  to={`/categories/${cat.slug}`}
                  key={cat.id}
                  className="group relative h-36 sm:h-40 lg:h-44 rounded-xl overflow-hidden border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between p-3.5 sm:p-4 bg-white cursor-pointer"
                >
                  {/* Card Background */}
                  {hasCustomImage ? (
                    <>
                      <img
                        src={getImageUrl(cat.image)}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-950/20" />
                    </>
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
                    />
                  )}

                  {/* Top Badge & Micro Action */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md text-white border border-white/20">
                      {subCount > 0 ? `${subCount} ${t("home.subcategories", "Subs")}` : t("home.featured", "Featured")}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                      <Icon name="arrow-right" className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="relative z-10">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">
                      {cat.description || "Discover verified products & deals"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
            <p className="text-sm font-bold text-slate-700">{t("home.noCategories", "No categories created yet.")}</p>
            <p className="text-xs text-slate-400 mt-1">
              {t("home.noCategoriesDesc", "Add new categories from the Admin panel to feature them here.")}
            </p>
          </div>
        )}
      </section>

      {/* 4. Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="py-8 sm:py-10 lg:py-12 bg-white border-y border-slate-200/80">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
              <div>
                <div className="flex items-center space-x-1.5 text-amber-600 mb-0.5">
                  <Icon name="trending-up" className="w-3.5 h-3.5" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                    {t("home.customerFavorites", "Customer Favorites")}
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  {t("home.bestSellers", "Best Sellers")}
                </h2>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <span>{t("home.browseAllBestSellers", "Browse All")}</span>
                <Icon name="arrow-right" className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {bestSellers.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Featured Spotlight Products Collection */}
      {featuredProducts.length > 0 && (
        <section className="py-8 sm:py-10 lg:py-12 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <div className="flex items-center space-x-1.5 text-indigo-600 mb-0.5">
                <Icon name="star" className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  {t("home.spotlightSelection", "Spotlight Selection")}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {t("home.featuredProducts", "Featured Products")}
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <span>{t("home.exploreCatalog", "Explore Catalog")}</span>
              <Icon name="arrow-right" className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {featuredProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Compact Call-to-Action Banner */}
      <section className="py-6 sm:py-8 lg:py-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-r from-indigo-50/90 via-indigo-50/40 to-purple-50/60 border border-indigo-100/90 p-5 sm:p-7 lg:p-8 text-slate-900 overflow-hidden shadow-2xs">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 border border-indigo-200 text-indigo-700 mb-2.5">
              <span>{t("home.cta.perksBadge", "Member Perks & Savings")}</span>
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight text-slate-900">
              {t("home.cta.title", "Upgrade Your Everyday Experience")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              {t("home.cta.desc", "Explore thousands of verified in-stock items across top departments with direct warranties, fast delivery, and responsive customer support.")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link
                to="/products"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20"
              >
                {t("home.cta.startBrowsing", "Start Browsing Now →")}
              </Link>
              <Link
                to="/categories"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-all"
              >
                {t("home.cta.browseCategories", "Browse Categories")}
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
