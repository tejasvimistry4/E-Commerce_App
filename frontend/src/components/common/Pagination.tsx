import React from "react";
import { Icon } from "./Icon";

export type PaginationAlign = "center" | "between" | "start" | "end";
export type PaginationInfoFormat = "badge" | "page-of-total" | "fraction" | "none";
export type PaginationSize = "sm" | "md" | "lg";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  totalItems?: number;
  currentItemsCount?: number;
  itemLabel?: string;
  align?: PaginationAlign;
  infoFormat?: PaginationInfoFormat;
  size?: PaginationSize;
  className?: string;
  showAlways?: boolean;
  prevLabel?: React.ReactNode;
  nextLabel?: React.ReactNode;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  hasPrevPage,
  hasNextPage,
  isLoading = false,
  disabled = false,
  totalItems,
  currentItemsCount,
  itemLabel = "items",
  align = "center",
  infoFormat = "badge",
  size = "md",
  className = "",
  showAlways = false,
  prevLabel,
  nextLabel,
}) => {
  if (!totalPages || (totalPages <= 1 && !showAlways)) {
    return null;
  }

  const isPrevDisabled = disabled || isLoading || (hasPrevPage !== undefined ? !hasPrevPage : page <= 1);
  const isNextDisabled = disabled || isLoading || (hasNextPage !== undefined ? !hasNextPage : page >= totalPages);

  const handlePrev = () => {
    if (!isPrevDisabled) {
      onPageChange(Math.max(1, page - 1));
    }
  };

  const handleNext = () => {
    if (!isNextDisabled) {
      onPageChange(Math.min(totalPages, page + 1));
    }
  };

  const sizeClasses: Record<PaginationSize, { btn: string; info: string; icon: string }> = {
    sm: {
      btn: "px-3 py-1.5 text-xs rounded-xl",
      info: "text-xs px-2.5 py-1",
      icon: "w-3.5 h-3.5",
    },
    md: {
      btn: "px-4 py-2 text-xs rounded-xl",
      info: "text-xs px-3 py-1.5",
      icon: "w-4 h-4",
    },
    lg: {
      btn: "px-5 py-2.5 text-sm rounded-2xl",
      info: "text-sm px-4 py-2",
      icon: "w-4.5 h-4.5",
    },
  };

  const alignClasses: Record<PaginationAlign, string> = {
    center: "justify-center",
    between: "justify-between",
    start: "justify-start",
    end: "justify-end",
  };

  const renderInfo = () => {
    if (infoFormat === "none") return null;

    if (infoFormat === "fraction") {
      return (
        <span className={`font-bold text-slate-700 font-mono ${sizeClasses[size].info}`}>
          {page} / {totalPages}
        </span>
      );
    }

    if (infoFormat === "page-of-total") {
      return (
        <span className={`font-semibold text-slate-600 ${sizeClasses[size].info}`}>
          Page <strong className="font-bold text-slate-900">{page}</strong> of <strong className="font-bold text-slate-900">{totalPages}</strong>
        </span>
      );
    }

    // Default: "badge"
    return (
      <span className={`font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-2xs ${sizeClasses[size].info}`}>
        Page <span className="text-indigo-600">{page}</span> of {totalPages}
      </span>
    );
  };

  return (
    <div
      className={`flex items-center flex-wrap gap-3 ${alignClasses[align]} ${className}`}
      aria-label="Pagination navigation"
    >
      {/* Optional Left Total Items Count Summary (e.g. for Tables / Admin) */}
      {align === "between" && totalItems !== undefined && (
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong className="font-bold text-slate-700">{currentItemsCount ?? totalItems}</strong> of <strong className="font-bold text-slate-700">{totalItems}</strong> {itemLabel}
        </span>
      )}

      {/* Main Controls: Previous, Page Info, Next */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={handlePrev}
          aria-label="Previous page"
          className={`inline-flex items-center gap-1.5 font-bold transition-all bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 cursor-pointer shadow-2xs active:scale-[0.98] ${sizeClasses[size].btn}`}
        >
          {prevLabel ?? (
            <>
              <Icon name="chevron-left" className={sizeClasses[size].icon} />
              <span>Previous</span>
            </>
          )}
        </button>

        {renderInfo()}

        <button
          type="button"
          disabled={isNextDisabled}
          onClick={handleNext}
          aria-label="Next page"
          className={`inline-flex items-center gap-1.5 font-bold transition-all bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 cursor-pointer shadow-2xs active:scale-[0.98] ${sizeClasses[size].btn}`}
        >
          {nextLabel ?? (
            <>
              <span>Next</span>
              <Icon name="chevron-right" className={sizeClasses[size].icon} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
