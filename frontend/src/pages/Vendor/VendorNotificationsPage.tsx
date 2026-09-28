import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../redux/notifications/notificationSlice";
import { NotificationItem, NotificationType } from "../../types/notification";
import { Button, Badge, EmptyState, getVendorNotificationBadge } from "../../components/common";
import { formatFullDateTime } from "../../utils/date";
import { ROUTES } from "../../config/routes";
import { toast } from "react-toastify";

export const VendorNotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useAppSelector(
    (state) => state.notifications
  );

  const [activeTab, setActiveTab] = useState<"ALL" | "LOW_STOCK" | "ORDERS">("ALL");

  useEffect(() => {
    const refreshData = () => {
      dispatch(fetchNotifications({ page: 1, limit: 30 }));
    };

    refreshData();

    const interval = setInterval(refreshData, 5000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refreshData();
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

  const handleMarkAllRead = async () => {
    await dispatch(markAllAsRead());
    toast.success("All alerts marked as read.");
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      await dispatch(clearAllNotifications());
      toast.info("All notifications cleared.");
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
    }

    const data = item.data || {};
    if (data.productId) {
      navigate(ROUTES.VENDOR.PRODUCTS);
      return;
    }
    if (data.orderId) {
      navigate(ROUTES.VENDOR.ORDERS);
      return;
    }
    navigate(ROUTES.VENDOR.ROOT);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "LOW_STOCK") {
      return (
        n.type === "LOW_STOCK" ||
        n.type === "LOW_STOCK_ALERT" ||
        n.type === "OUT_OF_STOCK_ALERT"
      );
    }
    if (activeTab === "ORDERS") {
      return n.type.startsWith("ORDER_");
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Vendor Alert Center
            </h1>
            {unreadCount > 0 && (
              <Badge
                variant="success"
                size="md"
                className="font-black tracking-normal normal-case bg-emerald-50 text-emerald-800 border-emerald-200"
              >
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time low inventory warnings, stock threshold breaches, and incoming customer order alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              ✓ Mark All Read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAll}
              className="text-xs font-bold"
            >
              Clear All
            </Button>
          )}

          <Link to="/vendor/products">
            <Button variant="primary" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold">
              Manage Inventory →
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <Button
          type="button"
          variant={activeTab === "ALL" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          All Notifications ({notifications.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === "LOW_STOCK" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("LOW_STOCK")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "LOW_STOCK"
              ? "bg-white text-amber-800 shadow-xs border border-amber-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>⚠️ Low Stock Alerts</span>
        </Button>
        <Button
          type="button"
          variant={activeTab === "ORDERS" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("ORDERS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === "ORDERS"
              ? "bg-white text-emerald-800 shadow-xs border border-emerald-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>📦 Customer Orders</span>
        </Button>
      </div>

      {/* Alerts List */}
      {loading && notifications.length === 0 ? (
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Fetching store alerts...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center">
          <EmptyState
            title="No alerts to display"
            description="Your inventory is healthy and there are no pending critical notifications."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const meta = getVendorNotificationBadge(item.type);
            const isLowStock =
              item.type === "LOW_STOCK" ||
              item.type === "LOW_STOCK_ALERT" ||
              item.type === "OUT_OF_STOCK_ALERT";

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all cursor-pointer group hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !item.isRead
                    ? isLowStock
                      ? "border-amber-300 bg-amber-50/20 shadow-xs ring-1 ring-amber-500/10"
                      : "border-emerald-200 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/10"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border shadow-2xs ${meta.bg}`}
                  >
                    {meta.icon}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h2>
                      <Badge
                        size="sm"
                        className={`font-bold uppercase tracking-wider ${meta.bg}`}
                      >
                        {meta.label}
                      </Badge>
                      {!item.isRead && (
                        <Badge
                          variant="success"
                          size="sm"
                          className="bg-emerald-600 text-white border-0 shadow-xs font-black tracking-normal"
                        >
                          NEW
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {item.message}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {formatFullDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                    <span>{isLowStock ? "Restock Product" : "View Order"}</span>
                    <span>→</span>
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deleteNotification(item.id));
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors h-auto w-auto"
                    title="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorNotificationsPage;

