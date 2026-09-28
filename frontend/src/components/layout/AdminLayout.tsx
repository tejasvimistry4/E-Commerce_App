import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation, LanguageSelector } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logoutUser } from "../../redux/auth/authSlice";
import { NotificationBell } from "../common";
import { toast } from "react-toastify";


export const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.info(t("messages.auth.adminSessionTerminated", "Admin session terminated."));
    navigate("/login");
  };

  const navItems = [
    {
      id: "dashboard",
      name: t("admin.dashboard", "Dashboard"),
      path: "/admin",
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
      badge: "KPIs",
    },
    {
      id: "categories",
      name: t("admin.categories", "Categories"),
      path: "/admin/categories",
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
      badge: "CATALOG",
    },
    {
      id: "products",
      name: t("admin.products", "Products"),
      path: "/admin/products",
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
      badge: "Catalog",
    },
    {
      id: "visits",
      name: t("admin.visits", "Product Visits & Leads"),
      path: "/admin/visits",
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
      id: "orders",
      name: t("admin.orders", "Orders"),
      path: "/admin/orders",
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
      badge: "Orders",
    },
    {
      id: "banners",
      name: t("admin.banners", "Banners & Promos"),
      path: "/admin/banners",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      ),
      badge: "Promos",
    },
    {
      id: "users",
      name: t("admin.users", "Users & Roles"),
      path: "/admin/users",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      badge: "Access",
    },
    {
      id: "vendors",
      name: t("admin.vendors", "Vendors & Approvals"),
      path: "/admin/vendors",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      badge: "Vendors",
    },
    {
      id: "reviews",
      name: t("admin.reviews", "Reviews & Ratings"),
      path: "/admin/reviews",
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
      badge: "Reviews",
    },
  ];

  const getCurrentPageTitle = () => {
    if (location.pathname === "/admin" || location.pathname === "/admin/dashboard") {
      return t("admin.dashboard", "Executive Dashboard");
    }
    if (location.pathname.startsWith("/admin/categories")) {
      return t("admin.categories", "Category Management");
    }
    if (location.pathname.startsWith("/admin/orders")) {
      return t("admin.orders", "Customer Orders");
    }
    if (location.pathname.startsWith("/admin/banners")) {
      return t("admin.banners", "Banner Campaigns & Promotions");
    }
    if (location.pathname.startsWith("/admin/users")) {
      return t("admin.users", "User Access & Roles");
    }
    if (location.pathname.startsWith("/admin/vendors")) {
      return t("admin.vendorsTitle", "Vendor Directory & Status Management");
    }
    if (location.pathname.startsWith("/admin/reviews")) {
      return t("admin.reviews", "Customer Reviews & Moderation");
    }
    if (location.pathname.startsWith("/admin/visits")) {
      return t("admin.visitsTitle", "Product Visits & User Interest Analytics");
    }
    if (location.pathname.startsWith("/admin/products")) {
      return t("admin.products", "Product Catalog Management");
    }
    return t("admin.console", "Admin Console");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-purple-500 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out shadow-sm ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div>
          {/* Sidebar Header / Brand */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50">
            <Link to="/admin" className="flex items-center space-x-3 group">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  E-Commerce<span className="text-indigo-600">Admin</span>
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
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-indigo-600 group-hover:scale-110 transition-transform">🛍️</span>
                <span>{t("admin.customerStorefront", "Customer Storefront")}</span>
              </div>
              <span className="text-slate-400 group-hover:text-indigo-600 text-xs transition-colors">
                ↗
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t("admin.managementModules", "Management Modules")}
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActiveRoute = item.exact
                  ? location.pathname === item.path || location.pathname === "/admin/dashboard"
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all group ${isActiveRoute
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`${isActiveRoute ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
                          } transition-colors`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isActiveRoute
                          ? "bg-indigo-100/80 text-indigo-700"
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

        {/* Sidebar Footer / Admin Identity */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 mb-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Administrator"}</p>
                <p className="text-[10px] text-indigo-700 font-mono font-bold truncate">
                  {user?.role || "SUPER_ADMIN"} ACCESS
                </p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm flex-shrink-0" />
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
            <span>{t("admin.exitSession", "Exit Admin Session")}</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Header */}
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
                <span className="text-indigo-600">{t("nav.admin", "Admin")}</span>
                <span>/</span>
                <span className="text-slate-800">{location.pathname.replace("/admin/", "").toUpperCase() || "DASHBOARD"}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {getCurrentPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Language Selector */}
            <LanguageSelector />

            <NotificationBell variant="admin" />

            <a
              href="http://localhost:5000/api-docs"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
            >
              <span>Swagger API Docs</span>
              <span>↗</span>
            </a>

            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <span>{t("nav.home", "Storefront")}</span>
              <span className="text-indigo-600">↗</span>
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

export default AdminLayout;

