import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getVendorStatsApi } from "../../api/auth.api";
import { VendorDashboardStats } from "../../types/auth";
import {
  StatsCard,
  Badge,
  Button,
  EmptyState,
  AreaTrendChart,
  StatusDonutChart,
  BarTrendChart,
  HorizontalBarChart,
} from "../../components/common";
import { Icon } from "../../assets";
import { toast } from "react-toastify";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#10b981", // emerald-500
  SHIPPED: "#6366f1",   // indigo-500
  PROCESSING: "#3b82f6",// blue-500
  PENDING: "#f59e0b",   // amber-500
  CANCELLED: "#f43f5e", // rose-500
};

export const VendorDashboard: React.FC = () => {
  const [data, setData] = useState<VendorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await getVendorStatsApi();
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      if (!isBackground) {
        toast.error(String(err?.response?.data?.message || "Failed to load dashboard metrics"));
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(() => {
      fetchStats(true);
    }, 10000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        fetchStats(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, []);

  const metrics = data?.metrics || {
    totalProducts: data?.kpis?.totalProducts ?? 0,
    activeProducts: (data?.kpis as any)?.activeProducts ?? (data?.topProducts ? data.topProducts.filter((p: any) => p.isActive).length : 0),
    outOfStockProducts: (data?.kpis as any)?.outOfStockProducts ?? data?.kpis?.lowStockCount ?? 0,
    totalOrders: data?.kpis?.totalOrders ?? 0,
    totalRevenue: data?.kpis?.totalRevenue ?? 0,
    totalCategories: (data?.kpis as any)?.totalCategories ?? 0,
    totalReviews: data?.kpis?.totalReviews ?? 0,
    averageRating: data?.kpis?.averageRating ?? 0,
    totalVisits: data?.kpis?.totalVisits ?? 0,
    highlyInterestedLeads: data?.kpis?.highlyInterestedLeadsCount ?? 0,
  };

  // 1. Sales & Revenue Trend Data (Past 7 Days Area Trend)
  const salesTrendData = useMemo(() => {
    if (data?.salesTrend && data.salesTrend.length > 0) {
      return data.salesTrend;
    }
    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: 0,
        orders: 0,
      });
    }
    return days;
  }, [data?.salesTrend]);

  // 2. Order Fulfillment Status Breakdown Data (Donut Chart)
  const orderStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      DELIVERED: 0,
      SHIPPED: 0,
      PROCESSING: 0,
      PENDING: 0,
      CANCELLED: 0,
    };

    if (data?.recentOrders && data.recentOrders.length > 0) {
      data.recentOrders.forEach((order: any) => {
        const s = (order.status || "PENDING").toUpperCase();
        counts[s] = (counts[s] || 0) + 1;
      });
    } else if (metrics.totalOrders > 0) {
      counts.DELIVERED = Math.max(0, metrics.totalOrders - 1);
      counts.PROCESSING = 1;
    }

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [data?.recentOrders, metrics.totalOrders]);

  // 3. Catalog Inventory & Stock Levels (Bar Trend Chart)
  const productStockData = useMemo(() => {
    const prods = data?.topProducts || data?.lowStockProducts || [];
    if (prods.length === 0) {
      return [
        { name: "No products", stock: 0 },
      ];
    }
    return prods.slice(0, 6).map((p: any) => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
      stock: p.stock ?? 0,
    }));
  }, [data?.topProducts, data?.lowStockProducts]);

  // 4. Top Products by Price / Value (Horizontal Bar Chart)
  const topProductValueData = useMemo(() => {
    const prods = data?.topProducts || data?.lowStockProducts || [];
    if (prods.length === 0) {
      return [
        { name: "No products", price: 0 },
      ];
    }
    return prods.slice(0, 5).map((p: any) => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
      price: p.price ?? 0,
    }));
  }, [data?.topProducts, data?.lowStockProducts]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-lg shadow-emerald-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Vendor Hub
              </span>

              {data?.vendor?.vendorStatus && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  {data.vendor.vendorStatus}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {data?.vendor?.businessName || data?.vendor?.name || "Merchant Partner"}
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-xl">
              Welcome back to your vendor control center. Track your product sales, manage inventory, and fulfill customer orders in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/vendor/products">
              <Button
                variant="primary"
                size="md"
                className="bg-white text-slate-900 hover:bg-emerald-50 shadow-md font-bold"
              >
                + Add Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {metrics.outOfStockProducts > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-bold">
                {metrics.outOfStockProducts} product{metrics.outOfStockProducts > 1 ? "s are" : " is"} currently low or out of stock!
              </p>
              <p className="text-xs text-amber-700">
                Customers cannot purchase products with zero inventory. Update your stock quantities to restore sales.
              </p>
            </div>
          </div>
          <Link
            to="/vendor/products"
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors whitespace-nowrap shadow-2xs"
          >
            Manage Stock →
          </Link>
        </div>
      )}

      {/* Main KPI Stats Grid - All Core Business Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Store Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString()}`}
          subtitle="Total Completed Sales"
          icon={<span className="text-lg">💰</span>}
          iconBg="bg-emerald-50 border border-emerald-200"
          valueClassName="text-emerald-700 font-black"
          badge={{ text: "Earnings", variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title="Customer Orders"
          value={metrics.totalOrders}
          subtitle="Orders Containing Your Items"
          icon={<span className="text-lg">📦</span>}
          iconBg="bg-indigo-50 border border-indigo-200"
          valueClassName="text-indigo-700 font-black"
          badge={{ text: "Orders", variant: "info" }}
          loading={loading}
        />
        <StatsCard
          title="Catalog Products"
          value={metrics.totalProducts}
          subtitle={`${metrics.activeProducts} active • ${metrics.outOfStockProducts} out of stock`}
          icon={<span className="text-lg">🏷️</span>}
          iconBg="bg-slate-100 border border-slate-200"
          valueClassName="text-slate-900 font-black"
          badge={{ text: `${metrics.activeProducts} Active`, variant: "neutral" }}
          loading={loading}
        />
        <StatsCard
          title="Leads & Visits"
          value={metrics.totalVisits}
          subtitle={`${metrics.highlyInterestedLeads} High-Interest Shoppers`}
          icon={<span className="text-lg">🎯</span>}
          iconBg="bg-purple-50 border border-purple-200"
          valueClassName="text-purple-700 font-black"
          badge={{ text: "Engagement", variant: "info" }}
          loading={loading}
        />
      </div>



      {/* CHARTS ROW 1: Sales Velocity & Order Fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Sales & Revenue Trend (AreaTrendChart - 2 cols on desktop) */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Revenue & Sales Velocity</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  7-Day Trend
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Daily store revenue stream and incoming order volume</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Revenue (₹)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Orders</span>
              </span>
            </div>
          </div>

          <AreaTrendChart
            data={salesTrendData}
            series={[
              { key: "revenue", name: "Store Revenue", stroke: "#059669", fill: "#10b981", fillOpacity: 0.25 },
              { key: "orders", name: "Customer Orders", stroke: "#6366f1", fill: "#818cf8", fillOpacity: 0.2 },
            ]}
            xAxisKey="date"
            height={288}
            valueFormatter={(val, name) =>
              name.toLowerCase().includes("revenue")
                ? `₹${Number(val).toLocaleString()}`
                : `${val} orders`
            }
          />
        </div>

        {/* 2. Order Fulfillment Status Breakdown (StatusDonutChart - 1 col on desktop) */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="pb-4 mb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Fulfillment Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Order pipeline distribution</p>
          </div>

          <StatusDonutChart
            data={orderStatusData}
            height={224}
            innerRadius={55}
            outerRadius={80}
            legendStatusMap={STATUS_COLORS}
            valueFormatter={(val) => `${val} orders`}
          />
        </div>
      </div>

      {/* CHARTS ROW 2: Inventory Stock Levels & Product Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Catalog Stock Levels (BarTrendChart) */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catalog Inventory & Stock Levels</h2>
              <p className="text-xs text-slate-500 mt-0.5">Available units in inventory per product</p>
            </div>
          </div>

          <BarTrendChart
            data={productStockData}
            bars={[
              { key: "stock", name: "Available Stock", fill: "#10b981", radius: [6, 6, 0, 0] },
            ]}
            xAxisKey="name"
            height={256}
            valueFormatter={(val) => `${val} units`}
          />
        </div>

        {/* 4. Product Pricing (HorizontalBarChart) */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Product Pricing & Catalog Value</h2>
              <p className="text-xs text-slate-500 mt-0.5">Listing prices across catalog assortment</p>
            </div>
          </div>

          <HorizontalBarChart
            data={topProductValueData}
            dataKey="price"
            barName="Price"
            yAxisKey="name"
            fill="#8b5cf6"
            height={256}
            yAxisWidth={120}
            valueFormatter={(val) => `₹${Number(val).toLocaleString()}`}
          />
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Top Catalog Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Recent Customer Orders</h2>
              <p className="text-xs text-slate-500">Orders containing your vendor items</p>
            </div>
            <Link
              to="/vendor/orders"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          {data?.recentOrders && data.recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentOrders.map((order: any) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-900 block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {order.user?.name || "Customer"} • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      ₹{(order.vendorTotal || order.totalAmount || 0).toLocaleString()}
                    </span>
                    <Badge
                      variant={
                        order.status === "DELIVERED"
                          ? "success"
                          : order.status === "CANCELLED"
                            ? "danger"
                            : "primary"
                      }
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState
                title="No orders yet"
                description="When customers purchase your products, orders will show up here."
              />
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Top Catalog Products</h2>
              <p className="text-xs text-slate-500">Your products in active circulation</p>
            </div>
            <Link
              to="/vendor/products"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Manage Catalog →
            </Link>
          </div>

          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.topProducts.map((product: any) => (
                <div key={product.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          📦
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {product.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ₹{product.price} • Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={product.isActive ? "success" : "neutral"} size="sm">
                      {product.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState
                title="No products yet"
                description="Add your first product to start selling on the marketplace."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
