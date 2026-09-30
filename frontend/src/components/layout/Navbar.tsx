import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logoutUser } from "../../redux/auth/authSlice";
import { openCartDrawer, fetchCart } from "../../redux/cart/cartSlice";
import { fetchWishlist } from "../../redux/wishlist/wishlistSlice";
import { ROLES } from "../../constants/roles";
import { MESSAGES } from "../../constants/messages";
import { toast } from "react-toastify";
import { useTranslation } from "../../i18n";
import { NotificationBell } from "../common";
import { SearchAutocomplete } from "../products/SearchAutocomplete";
import { SearchByImageModal } from "../products/SearchByImageModal";

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { cart } = useAppSelector((state) => state.cart);
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const totalQuantity = cart?.summary?.totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.info(MESSAGES.AUTH.LOGOUT_SUCCESS);
    setDropdownOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80 text-slate-900 shadow-xs transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 group cursor-pointer flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                E-Commerce<span className="text-indigo-600">.</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 flex-shrink-0">
            <Link
              to="/"
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/categories"
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
            >
              <span>{t("nav.categories")}</span>
            </Link>
            <Link
              to="/products"
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {t("nav.products")}
            </Link>
            <Link
              to="/deals"
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
            >
              <span>{t("nav.deals")}</span>
            </Link>
          </nav>

          {/* Global Search Bar (Navbar Variant) */}
          <div className="hidden sm:block flex-1 max-w-xs md:max-w-sm lg:max-w-md">
            <SearchAutocomplete
              variant="navbar"
              onOpenVisualSearch={() => setIsVisualModalOpen(true)}
            />
          </div>

          {/* Auth & Profile Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Cart Quick Access Button */}
            <button
              type="button"
              onClick={() => dispatch(openCartDrawer())}
              className="relative p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 transition-all shadow-2xs flex items-center space-x-2 cursor-pointer group"
              title={t("nav.viewCart")}
            >
              <div className="relative">
                <svg
                  className="w-5 h-5 text-slate-700 group-hover:text-indigo-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {totalQuantity > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-in zoom-in-50">
                    {totalQuantity > 99 ? "99+" : totalQuantity}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold">
                {t("nav.cart")}
              </span>
            </button>

            {/* Notification Bell with Badge and Dropdown */}
            {isAuthenticated && <NotificationBell variant="customer" />}

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Admin Quick Entry Button if Admin */}
                {user.role === ROLES.SUPER_ADMIN && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span>{t("nav.adminPanel")}</span>
                  </Link>
                )}

                {/* Vendor Quick Entry Button if Vendor */}
                {user.role === ROLES.VENDOR && (
                  <Link
                    to="/vendor"
                    className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-all shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Vendor Portal</span>
                  </Link>
                )}

                {/* User Profile Pill & Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2.5 p-1.5 pl-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all cursor-pointer shadow-2xs"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-2xs flex-shrink-0 ${
                        user.role === ROLES.SUPER_ADMIN
                          ? "bg-indigo-600 shadow-indigo-500/15"
                          : user.role === ROLES.VENDOR
                          ? "bg-emerald-600 shadow-emerald-500/15"
                          : "bg-slate-800 shadow-slate-800/15"
                      }`}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-black text-slate-900 leading-tight max-w-[140px] truncate">
                        {user.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold leading-tight ${
                          user.role === ROLES.SUPER_ADMIN
                            ? "text-indigo-700"
                            : user.role === ROLES.VENDOR
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180 text-slate-700" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                          <p className="text-sm font-bold text-slate-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.email}
                          </p>
                          <span
                            className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              user.role === ROLES.SUPER_ADMIN
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : user.role === ROLES.VENDOR
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {user.role} {t("nav.account")}
                          </span>
                        </div>

                        {user.role === ROLES.SUPER_ADMIN && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                          >
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{t("nav.adminDashboard")}</span>
                          </Link>
                        )}

                        {user.role === ROLES.VENDOR && (
                          <Link
                            to="/vendor"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Vendor Portal</span>
                          </Link>
                        )}

                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>{t("nav.myAccount")}</span>
                        </Link>

                        <Link
                          to="/wishlist"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                          <span className="flex-1">{t("nav.myWishlist")}</span>
                          {wishlistCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/customer/highly-interested"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <span className="text-sm">🔥</span>
                          <span className="flex-1">{t("nav.highlyInterested", { defaultValue: "Highly Interested" })}</span>
                        </Link>

                        <Link
                          to="/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <span>{t("nav.myOrders")}</span>
                        </Link>

                        <Link
                          to="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          <span className="flex-1">Notifications & Alerts</span>
                        </Link>

                        <Link
                          to="/categories"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                            />
                          </svg>
                          <span>{t("nav.exploreCategories")}</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 text-rose-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span>{t("nav.signOut")}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-indigo-600 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {t("nav.getStarted")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Search Modal */}
      <SearchByImageModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;


