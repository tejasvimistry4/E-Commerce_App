import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getHighlyInterestedProductsApi } from "../../api/visit.api";
import { HighlyInterestedItem } from "../../types/visit";
import { ProductCard } from "../../components/products/ProductCard";
import { Breadcrumb, Button } from "../../components/common";
import { useAppSelector } from "../../hooks/redux";

export const HighlyInterestedPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [items, setItems] = useState<HighlyInterestedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"mostVisited" | "recentlyVisited" | "priceLow" | "priceHigh">("recentlyVisited");

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchHighlyInterested = async () => {
      setLoading(true);
      try {
        const res = await getHighlyInterestedProductsApi(100);
        if (isMounted && res.success) {
          setItems(res.items || []);
        }
      } catch (err) {
        console.error("Failed to load highly interested products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHighlyInterested();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "mostVisited") {
      return b.visitCount - a.visitCount;
    }
    if (sortBy === "recentlyVisited") {
      return new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime();
    }
    if (sortBy === "priceLow") {
      return a.product.price - b.product.price;
    }
    if (sortBy === "priceHigh") {
      return b.product.price - a.product.price;
    }
    return 0;
  });

  const totalVisits = items.reduce((acc, curr) => acc + curr.visitCount, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <span className="text-4xl mb-3 block">🔒</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {t("messages.auth.loginToProceed", { defaultValue: "Please log in to view your interested items." })}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Track and rediscover items you keep eyeing across multiple visits.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            {t("auth.logIn", { defaultValue: "Log In" })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <Breadcrumb
            items={[
              { label: t("nav.home", "Home"), to: "/" },
              { label: t("nav.myAccount", "Dashboard"), to: "/dashboard" },
              { label: t("customer.highlyInterested", "Highly Interested Products"), active: true },
            ]}
          />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 sm:p-10 text-white shadow-xl shadow-orange-500/15 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider text-white">
                <span>🔥</span>
                <span>{t("customer.personalizedRadar", "Your Personalized Radar")}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {t("customer.highlyInterestedTitle", "Products You Keep Eyeing")}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
                {t(
                  "customer.highlyInterestedDesc",
                  "Items automatically tracked when you revisit them 3 or more times. Great choices you are considering buying!"
                )}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4">
              <div className="px-5 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="block text-2xl font-black">{items.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  {items.length === 1 ? "Product" : "Products"}
                </span>
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <span className="block text-2xl font-black">{totalVisits}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  Total Views
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar & Sort Filter */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <p className="text-xs font-bold text-slate-600">
              Showing <span className="text-slate-900 font-extrabold">{items.length}</span> high-interest items for{" "}
              <span className="text-indigo-600">{user?.name}</span>
            </p>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="recentlyVisited">Recently Visited</option>
                <option value="mostVisited">Most Visited (Views)</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading your interested products...</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 border border-amber-200/80 flex items-center justify-center text-3xl mx-auto shadow-2xs">
              🔥
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {t("customer.noHighInterestYet", "No High-Interest Items Yet")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                {t(
                  "customer.noHighInterestDesc",
                  "When you revisit any product 3 or more times, it will automatically appear here for quick access and price tracking!"
                )}
              </p>
            </div>
            <div className="pt-2">
              <Link to="/products">
                <Button variant="primary" size="md">
                  {t("wishlist.browseProducts", "Explore Products Catalog")}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {sortedItems.map((item) => (
              <ProductCard
                key={item.id}
                product={item.product}
                isHighlyInterested={true}
                visitCount={item.visitCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HighlyInterestedPage;
