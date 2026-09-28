import { Banner, BannerType } from "../../types/banner";
import { getBannerScheduleStatus } from "../../utils/banner.utils";
import { Icon } from "./Icon";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "primary"
  | "info"
  | "neutral";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  size = "md",
  dot = false,
  icon,
  className = "",
  onClick,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80",
    warning: "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/80",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/80",
    info: "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/80",
    neutral: "bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/80",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  const interactiveStyles = onClick
    ? "cursor-pointer hover:scale-105 active:scale-95 transition-transform"
    : "";

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${interactiveStyles} ${className}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      )}
      {icon && (
        <span className="inline-flex mr-1 items-center flex-shrink-0">{icon}</span>
      )}
      {children}
    </span>
  );
};

export interface BannerStatusBadgeProps {
  banner: Pick<Banner, "isActive" | "startDate" | "endDate">;
  size?: "sm" | "md";
  className?: string;
}

export const BannerStatusBadge: React.FC<BannerStatusBadgeProps> = ({
  banner,
  size = "sm",
  className = "",
}) => {
  const statusInfo = getBannerScheduleStatus(banner);
  const sizeClasses =
    size === "sm"
      ? "px-3 py-1 text-[10px]"
      : "px-3.5 py-1.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider border shadow-2xs backdrop-blur-md ${statusInfo.color} ${sizeClasses} ${className}`}
    >
      {statusInfo.label}
    </span>
  );
};

export interface BannerTypeBadgeProps {
  type: BannerType | string;
  badgeText?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export const renderBannerTypeIcon = (type: string, className = "w-3.5 h-3.5") => {
  switch (type) {
    case "FESTIVAL":
      return <Icon name="gift" className={`${className} text-amber-400`} />;
    case "SALE":
      return <Icon name="zap" className={`${className} text-rose-400`} />;
    case "SEASONAL":
      return <Icon name="star" className={`${className} text-emerald-400`} />;
    case "PROMOTIONAL":
      return <Icon name="trending-up" className={`${className} text-indigo-400`} />;
    default:
      return <Icon name="tag" className={`${className} text-purple-400`} />;
  }
};

export const BannerTypeBadge: React.FC<BannerTypeBadgeProps> = ({
  type,
  badgeText,
  size = "md",
  className = "",
}) => {
  const displayText = badgeText || `${type} SPECIAL`;
  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-0.5 text-[10px]"
      : "px-3.5 py-1.5 text-xs";

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full font-bold uppercase tracking-wider bg-white/15 border border-white/20 backdrop-blur-md text-white shadow-xs ${sizeClasses} ${className}`}
    >
      {renderBannerTypeIcon(type, size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")}
      <span>{displayText}</span>
    </span>
  );
};

// ==========================================
// Reusable Notification Badge Meta & Helpers
// ==========================================

export interface NotificationBadgeMeta {
  icon: string;
  bg: string;
  label: string;
}

export const getNotificationBadge = (
  type: string,
  role?: string
): NotificationBadgeMeta => {
  const isVendor = role === "VENDOR" || role === "vendor";

  switch (type) {
    case "ORDER_PLACED":
      return isVendor
        ? {
            icon: "📦",
            bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
            label: "Customer Order",
          }
        : {
            icon: "🛍️",
            bg: "bg-indigo-50 border-indigo-200 text-indigo-700",
            label: "Order Placed",
          };
    case "ORDER_CONFIRMED":
      return isVendor
        ? {
            icon: "📦",
            bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
            label: "Customer Order",
          }
        : {
            icon: "💳",
            bg: "bg-blue-50 border-blue-200 text-blue-700",
            label: "Payment Confirmed",
          };
    case "ORDER_SHIPPED":
      return {
        icon: "🚚",
        bg: "bg-cyan-50 border-cyan-200 text-cyan-700",
        label: "Shipped & Dispatched",
      };
    case "ORDER_DELIVERED":
      return {
        icon: "🎁",
        bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
        label: "Delivered",
      };
    case "ORDER_CANCELLED":
      return {
        icon: "❌",
        bg: "bg-rose-50 border-rose-200 text-rose-700",
        label: "Order Cancelled",
      };
    case "ORDER_REFUNDED":
      return {
        icon: "💰",
        bg: "bg-teal-50 border-teal-200 text-teal-700",
        label: "Refund Processed",
      };
    case "LOW_STOCK":
    case "LOW_STOCK_ALERT":
    case "OUT_OF_STOCK_ALERT":
      return isVendor
        ? {
            icon: "⚠️",
            bg: "bg-amber-50 border-amber-300 text-amber-900",
            label: "Inventory Low Stock",
          }
        : {
            icon: "⚠️",
            bg: "bg-amber-50 border-amber-200 text-amber-800",
            label: "Inventory Alert",
          };
    default:
      return isVendor
        ? {
            icon: "🔔",
            bg: "bg-slate-50 border-slate-200 text-slate-700",
            label: "System Alert",
          }
        : {
            icon: "🔔",
            bg: "bg-slate-50 border-slate-200 text-slate-700",
            label: "System Update",
          };
  }
};

export const getVendorNotificationBadge = (
  type: string
): NotificationBadgeMeta => {
  return getNotificationBadge(type, "VENDOR");
};

export interface NotificationBadgeProps {
  type: string;
  role?: string;
  size?: "sm" | "md";
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  type,
  role,
  size = "sm",
  className = "",
}) => {
  const meta = getNotificationBadge(type, role);
  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-0.5 text-[10px]"
      : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider border ${meta.bg} ${sizeClasses} ${className}`}
    >
      {meta.label}
    </span>
  );
};

export default Badge;
