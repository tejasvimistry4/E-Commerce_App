import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../redux/notifications/notificationSlice";
import { NotificationItem, NotificationType } from "../../types/notification";
import { Breadcrumb, Button, Badge, EmptyState, getNotificationBadge } from "../../components/common";
import { formatFullDateTime } from "../../utils/date";
import { ROUTES } from "../../config/routes";
import { toast } from "react-toastify";

export const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useAppSelector(
    (state) => state.notifications
  );

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "ORDERS">("ALL");

  useEffect(() => {
    const refreshData = () => {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
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
    toast.success("All notifications marked as read.");
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all your notifications?")) {
      await dispatch(clearAllNotifications());
      toast.info("All notifications cleared.");
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
    }

    const data = item.data || {};
    if (data.link) {
      navigate(data.link);
      return;
    }
    if (data.orderId) {
      navigate(ROUTES.ORDER_DETAIL(data.orderId));
      return;
    }
    navigate(ROUTES.ORDERS);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.isRead;
    if (activeTab === "ORDERS") return n.type.startsWith("ORDER_");
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Account Dashboard", to: ROUTES.DASHBOARD },
            { label: "Notifications & Alerts" },
          ]}
        />

        {/* Page Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Notifications & Alerts
              </h1>
              {unreadCount > 0 && (
                <Badge
                  variant="primary"
                  size="md"
                  className="font-black tracking-normal normal-case bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Stay updated with your live order progress, fulfillment notices, and account alerts.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                ✓ Mark All as Read
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
            All Activity ({notifications.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "UNREAD" ? "outline" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("UNREAD")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "UNREAD"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            type="button"
            variant={activeTab === "ORDERS" ? "outline" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ORDERS")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ORDERS"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Order Updates
          </Button>
        </div>

        {/* Notifications Card List */}
        {loading && notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold">Loading your notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center">
            <EmptyState
              title="No notifications to display"
              description={
                activeTab === "UNREAD"
                  ? "You have read all your alerts."
                  : "You do not have any notification records yet."
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const meta = getNotificationBadge(item.type);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all cursor-pointer group hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    !item.isRead
                      ? "border-indigo-200 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-500/10"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Badge Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border shadow-2xs ${meta.bg}`}
                    >
                      {meta.icon}
                    </div>

                    {/* Text Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
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
                            variant="primary"
                            size="sm"
                            className="bg-indigo-600 text-white border-0 shadow-xs font-black tracking-normal"
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

                  {/* Actions */}
                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                      <span>View Details</span>
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
                      title="Delete Notification"
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
    </div>
  );
};

export default NotificationsPage;

