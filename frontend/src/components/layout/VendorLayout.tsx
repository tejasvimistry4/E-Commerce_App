import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation, LanguageSelector } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logoutUser } from "../../redux/auth/authSlice";
import { NotificationBell } from "../common";
import { toast } from "react-toastify";

export const VendorLayout: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.info("Vendor session closed.");
    navigate("/login");
  };

  const navItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      path: "/vendor",
      exact: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      badge: "OVERVIEW",
    },
    {
      id: "products",
      name: "My Products",
      path: "/vendor/products",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      badge: "CATALOG",
    },
    {
      id: "categories",
      name: "My Categories",
      path: "/vendor/categories",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      badge: "SECTIONS",
    },
    {
      id: "orders",
      name: "Customer Orders",
      path: "/vendor/orders",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
      badge: "SALES",
    },
    {
      id: "reviews",
      name: "Product Reviews",
      path: "/vendor/reviews",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      badge: "FEEDBACK",
    },
    {
      id: "visits",
      name: "Visits & Leads",
      path: "/vendor/visits",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      badge: "LEADS",
    },
    {
      id: "notifications",
      name: "Alerts & Notifications",
      path: "/vendor/notifications",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      badge: "ALERTS",
    },
  ];

  const getCurrentPageTitle = () => {
    if (location.pathname === "/vendor" || location.pathname === "/vendor/dashboard") {
      return "Vendor Dashboard & Performance";
    }
    if (location.pathname.startsWith("/vendor/products")) {
      return "My Product Catalog";
    }
    if (location.pathname.startsWith("/vendor/categories")) {
      return "My Categories & Classifications";
    }
    if (location.pathname.startsWith("/vendor/orders")) {
      return "My Customer Orders";
    }
    if (location.pathname.startsWith("/vendor/reviews")) {
      return "Product Reviews & Ratings";
    }
    if (location.pathname.startsWith("/vendor/visits")) {
      return "Customer Product Visits & Leads";
    }
    if (location.pathname.startsWith("/vendor/notifications")) {
      return "Vendor Alerts & Notifications";
    }
    return "Vendor Portal";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Vendor Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out shadow-sm ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Sidebar Header / Brand */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50">
            <Link to="/vendor" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200 text-white font-black text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-slate-900 leading-none">
                  {user?.businessName || user?.name || "Vendor Store"}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                  Vendor Partner
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Context Switcher: Storefront Link */}
          <div className="p-4 border-b border-slate-100">
            <Link
              to="/"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-emerald-600 group-hover:scale-110 transition-transform">🛍️</span>
                <span>View Marketplace</span>
              </div>
              <span className="text-slate-400 group-hover:text-emerald-600 text-xs transition-colors">
                ↗
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Store Management
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActiveRoute = item.exact
                  ? location.pathname === item.path || location.pathname === "/vendor/dashboard"
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all group ${
                      isActiveRoute
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs font-black"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`${
                          isActiveRoute ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"
                        } transition-colors`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActiveRoute
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer / Vendor Identity */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 mb-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "V"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Vendor"}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    {user?.vendorStatus || "APPROVED"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Exit Vendor Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Vendor Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Vendor Header */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold">
                <span className="text-emerald-700">Vendor Portal</span>
                <span>/</span>
                <span className="text-slate-800">{location.pathname.replace("/vendor/", "").toUpperCase() || "DASHBOARD"}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {getCurrentPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <LanguageSelector />

            <NotificationBell variant="vendor" />

            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <span>Marketplace</span>
              <span className="text-emerald-600">↗</span>
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
