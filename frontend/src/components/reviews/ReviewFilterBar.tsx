import { Select, Icon } from "../common";
import { useTranslation } from "react-i18next";

export interface ReviewFilterBarProps {
  ratingFilter?: number;
  onRatingChange: (rating?: number) => void;
  hasImagesOnly?: boolean;
  onHasImagesChange: (hasImages: boolean) => void;
  sortBy: "createdAt" | "rating";
  onSortByChange: (sortBy: "createdAt" | "rating") => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (order: "asc" | "desc") => void;
  totalResults: number;
}

export const ReviewFilterBar: React.FC<ReviewFilterBarProps> = ({
  ratingFilter,
  onRatingChange,
  hasImagesOnly = false,
  onHasImagesChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  totalResults,
}) => {
  const { t } = useTranslation();

  const ratingOptions: Array<{ label: string; value?: number }> = [
    { label: t("reviews.allReviews", { defaultValue: "All Reviews" }), value: undefined },
    { label: "5 ★", value: 5 },
    { label: "4 ★", value: 4 },
    { label: "3 ★", value: 3 },
    { label: "2 ★", value: 2 },
    { label: "1 ★", value: 1 },
  ];

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "newest") {
      onSortByChange("createdAt");
      onSortOrderChange("desc");
    } else if (val === "oldest") {
      onSortByChange("createdAt");
      onSortOrderChange("asc");
    } else if (val === "highest") {
      onSortByChange("rating");
      onSortOrderChange("desc");
    } else if (val === "lowest") {
      onSortByChange("rating");
      onSortOrderChange("asc");
    }
  };

  const currentSortValue =
    sortBy === "rating"
      ? sortOrder === "desc"
        ? "highest"
        : "lowest"
      : sortOrder === "asc"
      ? "oldest"
      : "newest";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-y border-slate-200/80">
      {/* Star Filter Pills & Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {ratingOptions.map((opt) => {
            const isSelected = ratingFilter === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onRatingChange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pl-0 sm:pl-2 border-l-0 sm:border-l sm:border-slate-200">
          <button
            type="button"
            onClick={() => onHasImagesChange(!hasImagesOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              hasImagesOnly
                ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
              hasImagesOnly ? "bg-indigo-600 text-white" : "border border-slate-400"
            }`}>
              {hasImagesOnly && <Icon name="check" />}
            </span>
            <span>{t("reviews.withPhotos", { defaultValue: "With Photos" })}</span>
          </button>
        </div>
      </div>

      {/* Right: Results Count & Sort Dropdown */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-xs text-slate-400 font-medium">
          {t("reviews.showingCount", { count: totalResults, defaultValue: `Showing ${totalResults} reviews` })}
        </span>

        <div className="flex items-center gap-1.5">
          <Select
            size="xs"
            variant="outline"
            leftIcon={<Icon name="sliders" className="w-3.5 h-3.5 text-slate-400" />}
            value={currentSortValue}
            onChange={handleSortChange}
            aria-label="Sort customer reviews"
          >
            <option value="newest">{t("deals.recentlyAdded", { defaultValue: "Most Recent" })}</option>
            <option value="oldest">{t("reviews.oldestFirst", { defaultValue: "Oldest First" })}</option>
            <option value="highest">{t("reviews.highestRating", { defaultValue: "Highest Rating" })}</option>
            <option value="lowest">{t("reviews.lowestRating", { defaultValue: "Lowest Rating" })}</option>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilterBar;
