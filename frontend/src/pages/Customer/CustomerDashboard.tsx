import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logoutUser } from "../../redux/auth/authSlice";
import { getHighlyInterestedProductsApi } from "../../api/visit.api";
import { HighlyInterestedItem } from "../../types/visit";
import { ProductCard } from "../../components/products/ProductCard";
import { toast } from "react-toastify";

export const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist);

  const [highlyInterestedItems, setHighlyInterestedItems] = useState<HighlyInterestedItem[]>([]);
  const [loadingInterest, setLoadingInterest] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getHighlyInterestedProductsApi(8)
      .then((res) => {
        if (isMounted && res.success) {
          setHighlyInterestedItems(res.items || []);
        }
      })
      .catch((err) => console.error("Error fetching highly interested:", err))
      .finally(() => {
        if (isMounted) setLoadingInterest(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.info(t("messages.auth.logoutSuccess", { defaultValue: "You have been logged out." }));
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4 font-medium">
            {t("messages.auth.loginToProceed", { defaultValue: "Please log in to view your account." })}
          </p>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            {t("auth.logIn", { defaultValue: "Log In" })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Profile Card */}
        <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-3xl font-black shadow-2xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2.5 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {user.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  Customer ID: {user.id}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex-1 md:flex-initial cursor-pointer"
              >
                {t("nav.signOut", { defaultValue: "Sign Out" })}
              </button>
            </div>
          </div>
        </div>

        {/* If Admin, show Quick Admin Portal Switcher */}
        {user.role === "SUPER_ADMIN" && (
          <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 text-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚡</span>
                <h2 className="text-base font-black text-slate-900">
                  {t("customer.adminDetected", { defaultValue: "Administrator Privileges Detected" })}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {t("customer.adminDetectedDesc", { defaultValue: "You have permission to manage categories, products, and platform configurations in the Admin Console." })}
              </p>
            </div>
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all flex-shrink-0 text-center"
            >
              {t("customer.openAdminConsole", { defaultValue: "Open Admin Console →" })}
            </Link>
          </div>
        )}

        {/* Account Activity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">🛍️ {t("customer.orderHistory", { defaultValue: "Order History" })}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("customer.orderHistoryDesc", { defaultValue: "Track delivery progress, review invoices, and view all your past purchases." })}
              </p>
            </div>
            <Link
              to="/orders"
              className="inline-block mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              {t("customer.viewOrders", { defaultValue: "View My Orders →" })}
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">❤️ {t("customer.wishlistSaved", { defaultValue: "Wishlist & Saved" })}</h3>
                {wishlistItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                    {wishlistItems.length === 1
                      ? t("wishlist.itemCount", { defaultValue: "1 Item" })
                      : t("wishlist.itemsCount", { count: wishlistItems.length, defaultValue: `${wishlistItems.length} items` })}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("customer.wishlistSavedDesc", { defaultValue: "Review and manage your saved items, check availability, and move them to cart." })}
              </p>
            </div>
            <Link
              to="/wishlist"
              className="inline-block mt-4 text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              {t("customer.viewWishlist", { defaultValue: "View My Wishlist →" })}
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>🔥</span>
                  <span>{t("customer.highlyInterested", { defaultValue: "Highly Interested" })}</span>
                </h3>
                {highlyInterestedItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                    {highlyInterestedItems.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("customer.highlyInterestedCardDesc", {
                  defaultValue: "Products you've revisited 3+ times. Track price updates and inventory before buying.",
                })}
              </p>
            </div>
            <Link
              to="/customer/highly-interested"
              className="inline-block mt-4 text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              {t("customer.viewInterested", { defaultValue: "Explore Interested Items →" })}
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">🔒 {t("customer.security", { defaultValue: "Security & Protection" })}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("customer.securityDesc", { defaultValue: "Your account is secured using 256-bit encryption and tokenized authentication." })}
              </p>
            </div>
            <span className="inline-block mt-4 text-xs font-bold text-emerald-600">
              ✓ {t("common.verified", { defaultValue: "Active Protected Session" })}
            </span>
          </div>
        </div>

        {/* Highly Interested Showcase Section on Dashboard */}
        {highlyInterestedItems.length > 0 && (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🔥</span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {t("customer.onYourRadar", { defaultValue: "On Your Radar" })}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                    {highlyInterestedItems.length} {t("customer.items", { defaultValue: "items" })}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {t("customer.radarSubtitle", { defaultValue: "Products you frequently check out (3+ visits)." })}
                </p>
              </div>

              <Link
                to="/customer/highly-interested"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {t("common.viewAll", { defaultValue: "View All" })} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {highlyInterestedItems.slice(0, 4).map((item) => (
                <ProductCard
                  key={item.id}
                  product={item.product}
                  isHighlyInterested={true}
                  visitCount={item.visitCount}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
