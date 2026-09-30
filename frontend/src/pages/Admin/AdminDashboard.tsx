import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchCategories } from "../../redux/categories/categorySlice";
import { fetchAdminProducts } from "../../redux/products/productSlice";
import { fetchAdminOrders, fetchAdminOrderStats } from "../../redux/order/orderSlice";
import { getUsersApi, AuthUser } from "../../api/auth.api";
import {
  StatsCard,
  Badge,
  AreaTrendChart,
  StatusDonutChart,
  BarTrendChart,
  HorizontalBarChart,
  Icon,
} from "../../components/common";
import { getImageUrl, formatPrice } from "../../utils";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#10b981", // emerald-500
  SHIPPED: "#6366f1",   // indigo-500
  PROCESSING: "#3b82f6",// blue-500
  PENDING: "#f59e0b",   // amber-500
  CANCELLED: "#f43f5e", // rose-500
};

const PAYMENT_COLORS: Record<string, string> = {
  RAZORPAY: "#6366f1",
  CASH_ON_DELIVERY: "#10b981",
  CARD: "#8b5cf6",
  UPI: "#ec4899",
  NET_BANKING: "#f59e0b",
};

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { categories, loading: categoriesLoading } = useAppSelector((state) => state.categories);
  const { products, loading: productsLoading } = useAppSelector((state) => state.products);
  const { adminOrders, adminStats, loading: ordersLoading } = useAppSelector((state) => state.orders);

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    const refreshDashboard = () => {
      dispatch(fetchCategories());
      dispatch(fetchAdminProducts());
      dispatch(fetchAdminOrders({ limit: 100 }));
      dispatch(fetchAdminOrderStats());
      loadUsers();
    };

    refreshDashboard();

    const interval = setInterval(refreshDashboard, 10000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [dispatch]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await getUsersApi();
      if (res.data?.users) {
        setUsers(res.data.users);
      }
    } catch {
      // Handled silently for dashboard summary
    } finally {
      setUsersLoading(false);
    }
  };

  // 1. Sales & Revenue Trend Data (Aggregated from real orders or last 7 days)
  const salesTrendData = useMemo(() => {
    const daysMap: Record<string, { date: string; revenue: number; orders: number }> = {};

    // Generate past 7 days keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      daysMap[key] = { date: key, revenue: 0, orders: 0 };
    }

    // Populate with real order data
    adminOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (daysMap[orderDate]) {
        daysMap[orderDate].revenue += order.grandTotal || 0;
        daysMap[orderDate].orders += 1;
      }
    });

    return Object.values(daysMap);
  }, [adminOrders]);

  // 2. Order Fulfillment Status Breakdown Data
  const orderStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      DELIVERED: 0,
      SHIPPED: 0,
      PROCESSING: 0,
      PENDING: 0,
      CANCELLED: 0,
    };

    adminOrders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [adminOrders]);

  // 3. Category & Products Distribution Data
  const categoryDistributionData = useMemo(() => {
    const rootCats = categories.filter((c) => !c.parentId);
    return rootCats.map((cat) => {
      // Count products belonging to this root category or its children
      const count = products.filter((p) => {
        if (p.categoryId === cat.id) return true;
        if (cat.children?.some((child) => child.id === p.categoryId)) return true;
        return false;
      }).length;

      return {
        name: cat.name,
        products: count,
        active: products.filter((p) => p.categoryId === cat.id && p.isActive).length,
      };
    }).slice(0, 6);
  }, [categories, products]);

  // 4. Payment Method Distribution Data
  const paymentMethodsData = useMemo(() => {
    const methods: Record<string, { count: number; total: number }> = {};

    adminOrders.forEach((order) => {
      const method = order.paymentMethod || "OTHER";
      if (!methods[method]) {
        methods[method] = { count: 0, total: 0 };
      }
      methods[method].count += 1;
      methods[method].total += order.grandTotal || 0;
    });

    return Object.entries(methods).map(([name, data]) => ({
      name: name === "RAZORPAY" ? "Razorpay Online" : name.replace(/_/g, " "),
      orders: data.count,
      revenue: data.total,
      color: PAYMENT_COLORS[name] || "#6366f1",
    }));
  }, [adminOrders]);

  const totalRevenue = adminStats?.totalRevenue ?? adminOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalOrdersCount = adminStats?.totalOrders ?? adminOrders.length;
  const totalProductsCount = products.length;
  const totalUsersCount = users.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs text-slate-900 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-3">
              {t("admin.console", { defaultValue: "Admin Console" })}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t("auth.welcomeBack", { defaultValue: "Welcome Back" })}, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xl">
              Real-time business intelligence across sales, customer velocity, inventory, and order fulfillment.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title={t("admin.totalRevenue", { defaultValue: "Total Revenue" })}
          value={formatPrice(totalRevenue)}
          subtitle={t("admin.netSalesProcessed", { defaultValue: "Net Sales Processed" })}
          icon={<Icon name="dollar" className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          valueClassName="text-indigo-950"
          loading={ordersLoading && adminOrders.length === 0 && !adminStats}
        />
        <StatsCard
          title={t("admin.totalOrders", { defaultValue: "Total Orders" })}
          value={totalOrdersCount}
          subtitle={t("admin.processedOrders", { defaultValue: "All Customer Orders" })}
          icon={<Icon name="shopping-bag" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          loading={ordersLoading && adminOrders.length === 0 && !adminStats}
        />
        <StatsCard
          title={t("admin.catalogProducts", { defaultValue: "Catalog Products" })}
          value={totalProductsCount}
          subtitle={t("admin.inventoryItems", { defaultValue: "Active Inventory Items" })}
          icon={<Icon name="package" className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50 border border-purple-100"
          valueClassName="text-purple-700"
          loading={productsLoading && products.length === 0}
        />
        <StatsCard
          title={t("admin.registeredUsers", { defaultValue: "Registered Users" })}
          value={totalUsersCount}
          subtitle={t("admin.customerAccounts", { defaultValue: "Registered Profiles" })}
          icon={<Icon name="users" className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50 border border-blue-100"
          valueClassName="text-blue-700"
          loading={usersLoading && users.length === 0}
        />
      </div>

      {/* CHARTS ROW 1: Sales Velocity & Order Fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sales & Revenue Trend (2 cols on desktop) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t("admin.revenueSalesVelocity", { defaultValue: "Revenue & Sales Velocity" })}</h2>
              <p className="text-xs text-slate-500 mt-0.5">7-Day revenue stream and daily order volume</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Revenue (₹)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-purple-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>{t("admin.orders", { defaultValue: "Orders" })}</span>
              </span>
            </div>
          </div>

          <AreaTrendChart
            data={salesTrendData}
            series={[
              { key: "revenue", name: "Revenue", stroke: "#6366f1", fillOpacity: 0.25 },
              { key: "orders", name: "Orders", stroke: "#a855f7", fillOpacity: 0.2 },
            ]}
            xAxisKey="date"
            height={288}
          />
        </div>

        {/* Order Fulfillment Status Breakdown (1 col on desktop) */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="pb-4 mb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">{t("admin.fulfillmentStatus", { defaultValue: "Fulfillment Status" })}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Order pipeline distribution</p>
          </div>

          <StatusDonutChart
            data={orderStatusData}
            height={224}
            innerRadius={55}
            outerRadius={80}
            legendStatusMap={STATUS_COLORS}
          />
        </div>

      </div>

      {/* CHARTS ROW 2: Category Distribution & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Products by Department (Bar Chart) */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t("admin.inventoryByDepartment", { defaultValue: "Catalog Inventory by Department" })}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Product assortment across major categories</p>
            </div>
          </div>

          <BarTrendChart
            data={categoryDistributionData}
            bars={[
              { key: "products", name: "Total Products", fill: "#6366f1", radius: [6, 6, 0, 0] },
              { key: "active", name: "Active Products", fill: "#10b981", radius: [6, 6, 0, 0] },
            ]}
            xAxisKey="name"
            height={256}
          />
        </div>

        {/* Payment Methods Breakdown (Horizontal Bar Chart) */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t("admin.revenueByGateway", { defaultValue: "Revenue by Payment Gateway" })}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Checkout method share and processed volume</p>
            </div>
          </div>

          <HorizontalBarChart
            data={paymentMethodsData}
            dataKey="revenue"
            barName="Revenue Processed"
            yAxisKey="name"
            fill="#8b5cf6"
            height={256}
            yAxisWidth={110}
          />
        </div>

      </div>

      {/* Quick Action Shortcuts */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">{t("admin.quickActions", { defaultValue: "Quick Administrative Actions" })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/categories"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group flex items-start space-x-4 shadow-sm"
          >
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 font-bold group-hover:scale-110 transition-transform">
              ➕
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                {t("admin.categories", { defaultValue: "Categories" })}
              </h3>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex items-start space-x-4 shadow-sm"
          >
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold group-hover:scale-110 transition-transform">
              👤
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                {t("admin.users", { defaultValue: "Users & Roles" })}
              </h3>
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group flex items-start space-x-4 shadow-sm"
          >
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold group-hover:scale-110 transition-transform">
              🛍️
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {t("admin.orders", { defaultValue: "Orders" })}
              </h3>
            </div>
          </Link>

          <Link
            to="/admin/products"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-pink-300 hover:shadow-md transition-all group flex items-start space-x-4 shadow-sm"
          >
            <div className="p-3 rounded-xl bg-pink-50 text-pink-600 font-bold group-hover:scale-110 transition-transform">
              📦
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-pink-700 transition-colors">
                {t("admin.products", { defaultValue: "Products" })}
              </h3>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Categories Preview Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t("admin.categories", { defaultValue: "Recent Categories" })}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top entries in the category hierarchy</p>
          </div>
          <Link
            to="/admin/categories"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t("common.exploreAll", { defaultValue: "Open Category Suite →" })}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">{t("common.category", { defaultValue: "Category Name" })}</th>
                <th className="py-3.5 px-4 sm:px-6">Slug</th>
                <th className="py-3.5 px-4 sm:px-6">{t("admin.rootDepartment", { defaultValue: "Hierarchy Level" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("admin.subcategories", { defaultValue: "Subcategories" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("common.status", { defaultValue: "Status" })}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{t("common.actions", { defaultValue: "Action" })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {categories.slice(0, 5).map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                    <div className="flex items-center space-x-3">
                      {cat.image ? (
                        <img
                          src={getImageUrl(cat.image)}
                          alt={cat.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200/80 flex-shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100/80 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate max-w-[180px]">{cat.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-500 text-[11px]">/{cat.slug}</td>
                  <td className="py-3.5 px-4 sm:px-6">
                    {cat.parent ? (
                      <Badge variant="neutral" size="sm">
                        ↳ {cat.parent.name}
                      </Badge>
                    ) : (
                      <Badge variant="primary" size="sm">
                        {t("admin.rootDepartment", { defaultValue: "Root Dept" })}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-600 font-medium">
                    {cat.children?.length || cat._count?.children || 0} {t("common.items", { defaultValue: "items" })}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    <Badge
                      variant={cat.isActive ? "success" : "warning"}
                      size="sm"
                    >
                      {cat.isActive ? t("common.active", { defaultValue: "Active" }) : t("common.inactive", { defaultValue: "Inactive" })}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <Link
                      to="/admin/categories"
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-colors shadow-2xs"
                    >
                      {t("common.edit", { defaultValue: "Manage" })}
                    </Link>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !categoriesLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                    {t("home.noCategories", { defaultValue: "No categories created yet." })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
