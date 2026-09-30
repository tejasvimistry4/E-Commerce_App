import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../redux/notifications/notificationSlice";
import { NotificationItem, NotificationType } from "../../types/notification";
import { ROLES } from "../../constants/roles";
import { ROUTES } from "../../config/routes";
import { Badge, getNotificationBadge } from "./Badge";
import { Button } from "./Button";
import { formatTimeAgo } from "../../utils/date";

interface NotificationBellProps {
  variant?: "customer" | "vendor" | "admin";
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  variant = "customer",
  className = "",
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount, loading } = useAppSelector(
    (state) => state.notifications
  );

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll for live notifications and unread count every 5 seconds and on window focus
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshData = () => {
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ limit: 10 }));
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
  }, [dispatch, isAuthenticated]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleOpenDropdown = () => {
    if (!isOpen) {
      dispatch(fetchNotifications({ limit: 12 }));
      dispatch(fetchUnreadCount());
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }
    setIsOpen(false);

    // Resolve target route from notification data or type
    const data = notification.data || {};
    if (data.link) {
      navigate(data.link);
      return;
    }

    if (data.orderId) {
      if (user?.role === ROLES.VENDOR) {
        navigate(ROUTES.VENDOR.ORDERS);
      } else {
        navigate(ROUTES.ORDER_DETAIL(data.orderId));
      }
      return;
    }

    if (data.productId && user?.role === ROLES.VENDOR) {
      navigate(ROUTES.VENDOR.PRODUCTS);
      return;
    }

    // Default fallbacks
    if (user?.role === ROLES.VENDOR) {
      navigate(ROUTES.VENDOR.ROOT);
    } else {
      navigate(ROUTES.ORDERS);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(markAllAsRead());
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    return true;
  });

  const fullInboxRoute =
    user?.role === ROLES.VENDOR
      ? "/vendor/notifications"
      : "/notifications";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleOpenDropdown}
        className={`relative p-2.5 rounded-2xl transition-all shadow-2xs flex items-center justify-center cursor-pointer group h-auto ${
          isOpen
            ? "bg-indigo-50 border-indigo-300 text-indigo-600"
            : variant === "vendor"
            ? "bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700"
            : "bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600"
        }`}
        title="Notifications"
      >
        <div className="relative">
          <svg
            className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
              unreadCount > 0
                ? variant === "vendor"
                  ? "text-emerald-600"
                  : "text-indigo-600"
                : "text-slate-700"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {unreadCount > 0 && (
            <>
              <Badge
                variant={variant === "vendor" ? "success" : "primary"}
                size="sm"
                className={`absolute -top-2 -right-2.5 min-w-5 h-5 px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-in zoom-in-50 tracking-normal normal-case border-0 ${
                  variant === "vendor" ? "bg-emerald-600" : "bg-indigo-600"
                }`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping ${
                  variant === "vendor" ? "bg-emerald-400" : "bg-indigo-400"
                }`}
              />
            </>
          )}
        </div>
      </Button>

      {/* Slide-over / Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-base font-black text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <Badge
                    variant={variant === "vendor" ? "success" : "primary"}
                    size="sm"
                    className="font-black text-[10px] tracking-normal normal-case bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer hover:underline p-0 h-auto"
                >
                  Mark all read
                </Button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 mt-3">
              <Button
                type="button"
                variant={filter === "ALL" ? "outline" : "ghost"}
                size="xs"
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All ({notifications.length})
              </Button>
              <Button
                type="button"
                variant={filter === "UNREAD" ? "outline" : "ghost"}
                size="xs"
                onClick={() => setFilter("UNREAD")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === "UNREAD"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Unread ({unreadCount})
              </Button>
            </div>
          </div>

          {/* Notifications List Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-1">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto">
                  🔔
                </div>
                <p className="text-xs font-bold text-slate-700">No notifications found</p>
                <p className="text-[11px] text-slate-400">
                  {filter === "UNREAD"
                    ? "You are all caught up! No unread alerts."
                    : "Order updates and stock alerts will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const meta = getNotificationBadge(
                  item.type,
                  variant === "vendor" ? "VENDOR" : undefined
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer group flex items-start space-x-3.5 relative ${
                      !item.isRead
                        ? "bg-indigo-50/40 hover:bg-indigo-50/80"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Event Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border ${meta.bg}`}
                    >
                      {meta.icon}
                    </div>

                    {/* Notification Text */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                    </div>

                    {/* Unread Dot & Delete Action */}
                    <div className="flex flex-col items-center justify-between self-stretch">
                      {!item.isRead ? (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shadow-xs" />
                      ) : (
                        <span className="w-2 h-2" />
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all h-auto w-auto"
                        title="Dismiss"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center">
            <Link
              to={fullInboxRoute}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center space-x-1"
            >
              <span>View All Notifications</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
