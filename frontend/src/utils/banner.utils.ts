import { Banner } from "../types/banner";
import {
  formatDateForInput,
  formatInputToIso,
  isValidDateRange,
  formatDateRange,
  getRemainingTimeText,
} from "./date";

export interface BannerScheduleStatus {
  label: "Live Now" | "Scheduled" | "Expired" | "Inactive";
  color: string;
}

/**
 * Determines the live schedule and activation status of a banner.
 */
export const getBannerScheduleStatus = (
  banner: Pick<Banner, "isActive" | "startDate" | "endDate">
): BannerScheduleStatus => {
  if (!banner.isActive) {
    return {
      label: "Inactive",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const now = Date.now();
  if (banner.startDate && new Date(banner.startDate).getTime() > now) {
    return {
      label: "Scheduled",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (banner.endDate && new Date(banner.endDate).getTime() < now) {
    return {
      label: "Expired",
      color: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }

  return {
    label: "Live Now",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
};

/**
 * Banner countdown formatter (delegates to common date utility).
 */
export const getBannerRemainingTime = getRemainingTimeText;

/**
 * Banner schedule range validator (delegates to common date utility).
 */
export const isValidBannerDateRange = isValidDateRange;

/**
 * Banner schedule text formatter (delegates to common date utility).
 */
export const formatBannerScheduleRange = formatDateRange;

// Re-export common date utilities for convenience
export { formatDateForInput, formatInputToIso, isValidDateRange, formatDateRange, getRemainingTimeText };
