import React from "react";
import { ReviewStats } from "../../types/review";
import { StarRating } from "../common/StarRating";
import { useTranslation } from "react-i18next";

export interface ReviewSummaryProps {
  stats: ReviewStats | null;
  onWriteReview: () => void;
  onFilterRating?: (rating: number | undefined) => void;
  activeRatingFilter?: number;
  userHasReviewed?: boolean;
  hasReviewed?: boolean;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  stats,
  onFilterRating,
  activeRatingFilter,
  userHasReviewed = false,
  hasReviewed,
}) => {
  const { t } = useTranslation();
  const isReviewed = hasReviewed !== undefined ? hasReviewed : userHasReviewed;
  if (!stats || stats.totalReviews === 0) {
    return null;
  }

  const { averageRating, totalReviews, ratingBreakdown } = stats;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Big Rating Number & Highlights (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3 lg:border-r lg:border-slate-100 lg:pr-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-400">/ 5.0</span>
          </div>

          <StarRating value={averageRating} size="lg" />

          <p className="text-xs font-semibold text-slate-500">
            {t("reviews.basedOn", { defaultValue: "Based on" })}{" "}
            <span className="font-bold text-slate-900">{totalReviews}</span>{" "}
            {totalReviews === 1 ? t("reviews.customerReview", { defaultValue: "customer review" }) : t("reviews.customerReviews", { defaultValue: "customer reviews" })}
          </p>
        </div>

        {/* Center Column: 5-Star Breakdown Bars (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = ratingBreakdown[star] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            const isActive = activeRatingFilter === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => onFilterRating && onFilterRating(isActive ? undefined : star)}
                className={`w-full flex items-center gap-3 p-1.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${isActive ? "bg-amber-50/80 ring-1 ring-amber-300" : "hover:bg-slate-50"
                  }`}
                title={`Filter by ${star} star reviews`}
              >
                <span className="w-12 text-left font-bold text-slate-700 flex items-center gap-1">
                  <span>{star}</span>
                  <span className="text-amber-500 text-sm">★</span>
                </span>

                {/* Progress bar container */}
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${star >= 4
                      ? "bg-amber-500 group-hover:bg-amber-600"
                      : star === 3
                        ? "bg-amber-400 group-hover:bg-amber-500"
                        : "bg-rose-400 group-hover:bg-rose-500"
                      }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right font-mono font-semibold text-slate-400 group-hover:text-slate-700">
                  {percentage}%
                </span>
                <span className="w-8 text-right font-mono text-slate-500 text-[11px]">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Write Review CTA (3 cols) */}
        <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center space-y-3 lg:border-l lg:border-slate-100 lg:pl-8 text-center lg:text-right">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              {t("reviews.shareYourExperience", { defaultValue: "Share Your Experience" })}
            </h4>
            <p className="text-[11px] text-slate-500 max-w-[200px]">
              {isReviewed
                ? t("reviews.alreadyReviewed", { defaultValue: "You already reviewed this item." })
                : t("reviews.helpFellowShoppers", { defaultValue: "Help fellow shoppers with your rating and review." })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
