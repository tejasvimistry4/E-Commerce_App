import React, { useEffect, useState } from "react";
import { Review } from "../../types/review";
import { useReviews } from "../../hooks/useReviews";
import { StarRating, Badge, Pagination, SearchInput, StatsCard, EmptyState } from "../../components/common";
import { getImageUrl } from "../../utils/image.utils";
import { useDebounce } from "../../hooks/useDebounce";

export const VendorReviewsPage: React.FC = () => {
  const {
    adminReviews,
    totalAdminReviews,
    adminStats,
    loading,
    loadAdminReviews,
    loadAdminStats,
  } = useReviews();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(1);

  const fetchData = () => {
    loadAdminStats();
    loadAdminReviews({
      page,
      limit: 15,
      search: debouncedSearchTerm || undefined,
      rating: ratingFilter,
    });
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearchTerm, ratingFilter]);

  const stats = adminStats || {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageRating: 0,
    fiveStarRatio: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Customer Feedback
            </span>
            <span className="text-xs text-slate-400">• Product Ratings & Reviews</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Store Product Reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Read customer reviews and feedback for your store's catalog items.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Average Product Rating"
          value={stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
          subtitle="Across all customer reviews"
          icon={<span className="text-lg">⭐</span>}
          iconBg="bg-amber-50 border border-amber-100"
          valueClassName="text-amber-700 font-black"
          badge={{ text: "Rating", variant: "warning" }}
          loading={loading}
        />
        <StatsCard
          title="Total Store Reviews"
          value={stats.total}
          subtitle={`${stats.approved} Approved Reviews`}
          icon={<span className="text-lg">💬</span>}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          loading={loading}
        />
        <StatsCard
          title="5-Star Ratings"
          value={`${Math.round(stats.fiveStarRatio || 0)}%`}
          subtitle="Top Rated Ratio"
          icon={<span className="text-lg">🌟</span>}
          iconBg="bg-purple-50 border border-purple-100"
          valueClassName="text-purple-700"
          loading={loading}
        />
      </div>

      {/* Rating Breakdown & Search Controls */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search by review text, product name, or reviewer..."
          />
        </div>

        {/* Rating Filter Tabs */}
        <div className="flex items-center space-x-1.5 pt-3 border-t border-slate-100 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => {
              setRatingFilter(undefined);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              ratingFilter === undefined
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
            }`}
          >
            All Ratings ({stats.total})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => {
                setRatingFilter(stars);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                ratingFilter === stars
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              <span>{stars} ★</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {adminReviews.map((review) => (
          <div
            key={review.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Product Info & Rating */}
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  {review.product?.thumbnail ? (
                    <img
                      src={getImageUrl(review.product.thumbnail)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {review.product?.name || "Product"}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-xs font-black text-slate-700">
                      {review.rating}.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviewer & Date */}
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-slate-900 block">
                  {review.user?.name || "Anonymous Customer"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                "{review.comment}"
              </p>
            )}

            {/* Photos if any */}
            {review.images && review.images.length > 0 && (
              <div className="flex items-center space-x-2 mt-3 overflow-x-auto">
                {review.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {adminReviews.length === 0 && !loading && (
          <div className="py-12 bg-white rounded-3xl border border-slate-200">
            <EmptyState
              title="No customer reviews found"
              description="No product reviews matched your active search or rating filter."
            />
          </div>
        )}

        {/* Pagination */}
        {totalAdminReviews > 15 && (
          <div className="p-4 flex justify-center">
            <Pagination
              page={page}
              totalPages={Math.ceil(totalAdminReviews / 15)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorReviewsPage;
