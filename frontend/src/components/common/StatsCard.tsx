import React from "react";
import { Icon } from "./Icon";

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  footer?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  loading?: boolean;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  badge?: {
    text: string;
    variant?: "success" | "warning" | "danger" | "info" | "neutral";
  };
}

const BADGE_STYLES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-indigo-50 text-indigo-700 border-indigo-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-indigo-50 text-indigo-600 border border-indigo-100",
  footer,
  className = "",
  valueClassName = "text-slate-900",
  loading = false,
  trend,
  badge,
}) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${className}`}
    >
      {/* Card Header: Title & Icon/Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate"
            title={title}
          >
            {title}
          </span>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                BADGE_STYLES[badge.variant || "neutral"]
              }`}
            >
              {badge.text}
            </span>
          )}
          {icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-transform group-hover:scale-105 shrink-0 ${iconBg}`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value Display */}
        <div className="mt-1">
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${valueClassName}`}
              >
                {value}
              </span>
              {trend && (
                <span
                  className={`inline-flex items-center text-xs font-bold ${
                    trend.isPositive !== false
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  <Icon
                    name={
                      trend.isPositive !== false
                        ? "trending-up"
                        : "trending-down"
                    }
                    className="w-3.5 h-3.5 mr-0.5"
                  />
                  <span>{trend.value}</span>
                  {trend.label && (
                    <span className="text-slate-400 font-normal ml-1">
                      {trend.label}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subtitle / Description (Rendered below value for clean vertical alignment) */}
        {subtitle && !loading && (
          <div className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
            {typeof subtitle === "string" ? (
              <p className="truncate" title={subtitle}>
                {subtitle}
              </p>
            ) : (
              subtitle
            )}
          </div>
        )}
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
