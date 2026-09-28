import React, { useState } from "react";

export type StarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface StarRatingProps {
  value: number; // 0 to 5 (e.g. 4.5)
  onChange?: (rating: number) => void;
  interactive?: boolean;
  size?: StarSize;
  showScore?: boolean;
  showCount?: boolean;
  count?: number;
  showLabel?: boolean;
  className?: string;
}

const SIZE_MAP: Record<StarSize, { star: string; text: string; score: string }> = {
  xs: { star: "w-3 h-3", text: "text-[10px]", score: "text-[11px] font-bold" },
  sm: { star: "w-4 h-4", text: "text-xs", score: "text-xs font-bold" },
  md: { star: "w-5 h-5", text: "text-sm", score: "text-sm font-black" },
  lg: { star: "w-7 h-7", text: "text-base", score: "text-base font-black" },
  xl: { star: "w-9 h-9", text: "text-lg", score: "text-xl font-black" },
};

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  interactive = false,
  size = "md",
  showScore = false,
  showCount = false,
  count = 0,
  showLabel = false,
  className = "",
}) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const displayRating = interactive && hoveredValue !== null ? hoveredValue : value;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const handleStarClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex);
    }
  };

  const handleStarMouseEnter = (starIndex: number) => {
    if (interactive) {
      setHoveredValue(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredValue(null);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starNumber) => {
          // Calculate fill percentage for each star
          let fillPercentage = 0;
          if (displayRating >= starNumber) {
            fillPercentage = 100;
          } else if (displayRating > starNumber - 1) {
            fillPercentage = Math.round((displayRating - (starNumber - 1)) * 100);
          }

          const isClickable = interactive;
          const gradientId = `star-grad-${starNumber}-${displayRating.toFixed(1).replace(".", "-")}`;

          return (
            <button
              key={starNumber}
              type="button"
              disabled={!isClickable}
              onClick={() => handleStarClick(starNumber)}
              onMouseEnter={() => handleStarMouseEnter(starNumber)}
              className={`relative p-0 border-0 bg-transparent transition-transform duration-150 ${
                isClickable
                  ? "cursor-pointer hover:scale-120 active:scale-95 focus:outline-none"
                  : "cursor-default"
              }`}
              title={interactive ? `${starNumber} star${starNumber > 1 ? "s" : ""} - ${RATING_LABELS[starNumber]}` : `${value} out of 5 stars`}
            >
              <svg
                className={`${sizeConfig.star} text-slate-200 fill-slate-200 transition-colors`}
                viewBox="0 0 24 24"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset={`${fillPercentage}%`} stopColor="#F59E0B" />
                    <stop offset={`${fillPercentage}%`} stopColor="#E2E8F0" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#${gradientId})`}
                  stroke={fillPercentage > 0 ? "#D97706" : "#CBD5E1"}
                  strokeWidth="0.75"
                  strokeLinejoin="round"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className={`text-slate-900 ${sizeConfig.score}`}>
          {Number(displayRating).toFixed(1)}
        </span>
      )}

      {showCount && (
        <span className={`text-slate-500 font-medium ${sizeConfig.text}`}>
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}

      {showLabel && interactive && (
        <span className={`font-semibold ml-1.5 transition-all text-amber-600 ${sizeConfig.text}`}>
          {displayRating > 0 ? RATING_LABELS[Math.round(displayRating)] || "" : "Select Rating"}
        </span>
      )}
    </div>
  );
};

export default StarRating;
