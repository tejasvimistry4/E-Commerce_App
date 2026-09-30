import React, { useEffect, useState } from "react";
import { Review, ReviewStatus } from "../../types/review";
import { useReviews } from "../../hooks/useReviews";
import { StarRating, Badge, ConfirmationModal, Modal, Pagination, Input, Select, Icon, StatsCard } from "../../components/common";
import { getImageUrl } from "../../utils/image.utils";
import { useDebounce } from "../../hooks/useDebounce";
import { MESSAGES } from "../../constants/messages";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const AdminReviewsPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    adminReviews,
    totalAdminReviews,
    adminStats,
    topReviewedProducts,
    topReviewedLoading,
    loading,
    actionLoading,
    loadAdminReviews,
    loadAdminStats,
    loadTopReviewedProducts,
    changeReviewStatus,
    removeAdminReview,
  } = useReviews();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [topProductsOnly, setTopProductsOnly] = useState<boolean>(false);
  const [selectedTopProductId, setSelectedTopProductId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  // Load reviews & stats
  const fetchData = () => {
    loadAdminStats();
    loadTopReviewedProducts(5);
    loadAdminReviews({
      page,
      limit: 15,
      search: debouncedSearchTerm || undefined,
      status: statusFilter !== "ALL" ? (statusFilter as ReviewStatus) : undefined,
      rating: ratingFilter,
      topProductsOnly: topProductsOnly ? true : undefined,
      productId: selectedTopProductId || undefined,
    });
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearchTerm, statusFilter, ratingFilter, topProductsOnly, selectedTopProductId]);

  const handleStatusChange = async (review: Review, newStatus: ReviewStatus) => {
    try {
      const res = await changeReviewStatus(review.id, newStatus);
      if (res && (res as any).type.endsWith("fulfilled")) {
        toast.success(t("messages.reviews.statusUpdated", { status: newStatus, defaultValue: MESSAGES.REVIEWS.STATUS_UPDATED(newStatus) }));
        loadAdminStats();
      } else {
        toast.error(t("messages.common.genericError", { defaultValue: "Failed to update status" }));
      }
    } catch (err: any) {
      toast.error(err.message || t("messages.common.genericError", { defaultValue: "Failed to update status" }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      const res = await removeAdminReview(reviewToDelete.id);
      if (res && (res as any).type.endsWith("fulfilled")) {
        toast.success(t("messages.reviews.deleteSuccess", { defaultValue: MESSAGES.REVIEWS.DELETE_SUCCESS }));
        loadAdminStats();
      } else {
        toast.error(t("messages.common.genericError", { defaultValue: MESSAGES.REVIEWS.DELETE_FAILED }));
      }
    } catch (err: any) {
      toast.error(err.message || t("messages.common.genericError", { defaultValue: MESSAGES.REVIEWS.DELETE_FAILED }));
    } finally {
      setReviewToDelete(null);
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success" size="sm" dot>{t("admin.approved", { defaultValue: "Approved" })}</Badge>;
      case "PENDING":
        return <Badge variant="warning" size="sm" dot>{t("orders.pending", { defaultValue: "Pending" })}</Badge>;
      case "REJECTED":
        return <Badge variant="danger" size="sm" dot>{t("admin.rejected", { defaultValue: "Rejected" })}</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalAdminReviews / 15) || 1;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("admin.reviews", { defaultValue: "Reviews & Ratings" })}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t("admin.reviewsSubtitle", { defaultValue: "Monitor, moderate, and manage ratings and feedback submitted by storefront shoppers." })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Icon name="refresh" className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>{t("common.refresh", { defaultValue: "Refresh" })}</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("reviews.totalReviews", { defaultValue: "Total Reviews" })}
          value={adminStats?.total ?? totalAdminReviews}
          subtitle={t("reviews.submittedByCustomers", { defaultValue: "Submitted by Shoppers" })}
          icon={<Icon name="message-square" className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          loading={loading}
        />
        <StatsCard
          title={t("reviews.averageStoreScore", { defaultValue: "Store Rating" })}
          value={adminStats?.averageRating ? Number(adminStats.averageRating).toFixed(1) : "0.0"}
          subtitle="Out of 5.0 Stars"
          icon={<Icon name="star" className="w-5 h-5 text-amber-500 fill-amber-400" />}
          iconBg="bg-amber-50 border border-amber-100"
          valueClassName="text-amber-700"
          loading={loading}
        />
        <StatsCard
          title={t("reviews.fiveStarRatio", { defaultValue: "5-Star Ratio" })}
          value={`${adminStats?.fiveStarRatio ?? 0}%`}
          subtitle={t("reviews.highestSatisfaction", { defaultValue: "Highest Satisfaction" })}
          icon={<Icon name="check-circle" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          badge={{ text: "Top Tier", variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title={t("reviews.pendingModeration", { defaultValue: "Pending Moderation" })}
          value={adminStats?.pending ?? 0}
          subtitle={t("reviews.awaitingAdminReview", { defaultValue: "Awaiting Approval" })}
          icon={<Icon name="clock" className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50 border border-rose-100"
          valueClassName={(adminStats?.pending ?? 0) > 0 ? "text-rose-600" : "text-slate-900"}
          badge={(adminStats?.pending ?? 0) > 0 ? { text: "Action Needed", variant: "danger" } : undefined}
          loading={loading}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            size="sm"
            leftIcon={<Icon name="search" className="w-4 h-4 text-slate-400" />}
            placeholder={t("reviews.searchPlaceholder", { defaultValue: "Search by product, customer, or keyword..." })}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            fullWidth
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {["ALL", "APPROVED", "PENDING", "REJECTED"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {s === "ALL" ? t("common.allStatuses", { defaultValue: "All Statuses" }) : s}
              </button>
            ))}
          </div>

          {/* Star Rating Select */}
          <Select
            size="sm"
            value={ratingFilter ?? ""}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setRatingFilter(val);
              setPage(1);
            }}
            aria-label="Filter reviews by star rating"
          >
            <option value="">{t("reviews.allStars", { defaultValue: "All Stars" })}</option>
            <option value="5">5 {t("reviews.stars", { defaultValue: "Stars" })} ★</option>
            <option value="4">4 {t("reviews.stars", { defaultValue: "Stars" })} ★</option>
            <option value="3">3 {t("reviews.stars", { defaultValue: "Stars" })} ★</option>
            <option value="2">2 {t("reviews.stars", { defaultValue: "Stars" })} ★</option>
            <option value="1">1 {t("reviews.stars", { defaultValue: "Star" })} ★</option>
          </Select>

          {/* Top 5 Products Filter */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !topProductsOnly;
              setTopProductsOnly(nextVal);
              if (!nextVal) {
                setSelectedTopProductId(null);
              }
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              topProductsOnly
                ? "bg-amber-50 text-amber-900 border-amber-300 shadow-2xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title={t("reviews.top5ProductsTooltip", { defaultValue: "Display the 5 products with the highest number of reviews" })}
          >
            <Icon name="award" className={`w-3.5 h-3.5 ${topProductsOnly ? "text-amber-600" : "text-slate-400"}`} />
            <span>{t("reviews.top5Products", { defaultValue: "Top 5 Products" })}</span>
            {topProductsOnly && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Top 5 Products Leaderboard Showcase (Visible when Top 5 filter is active) */}
      {topProductsOnly && (
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-slate-50 p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                <Icon name="award" className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{t("reviews.top5LeaderboardTitle", { defaultValue: "Top 5 Most Reviewed Products" })}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200/80 text-amber-900 uppercase">
                    {t("reviews.rankedDesc", { defaultValue: "Ranked By Review Count" })}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {t("reviews.top5LeaderboardSubtitle", { defaultValue: "Displaying products sorted by total customer reviews in descending order." })}
                </p>
              </div>
            </div>

            {selectedTopProductId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTopProductId(null);
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <Icon name="close" className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("reviews.showAllTop5", { defaultValue: "Show All Top 5" })}</span>
              </button>
            )}
          </div>

          {topReviewedLoading && topReviewedProducts.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-slate-400">
              {t("reviews.loadingTopProducts", { defaultValue: "Calculating top reviewed product rankings..." })}
            </div>
          ) : topReviewedProducts.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-slate-500">
              {t("reviews.noTopProducts", { defaultValue: "No reviewed products available to rank." })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {topReviewedProducts.map((item) => {
                const isSelected = selectedTopProductId === item.productId;
                const rankColor =
                  item.rank === 1
                    ? "bg-amber-400 text-slate-900 shadow-amber-200"
                    : item.rank === 2
                    ? "bg-slate-300 text-slate-900 shadow-slate-200"
                    : item.rank === 3
                    ? "bg-amber-600 text-white shadow-amber-300"
                    : "bg-slate-200 text-slate-700";

                return (
                  <div
                    key={item.productId}
                    onClick={() => {
                      setSelectedTopProductId(isSelected ? null : item.productId);
                      setPage(1);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? "bg-white border-amber-500 ring-2 ring-amber-400/40 shadow-md"
                        : "bg-white/90 hover:bg-white border-slate-200/80 hover:border-amber-300 shadow-2xs"
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shadow-xs ${rankColor}`}>
                        #{item.rank}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <span>{item.totalReviews}</span>
                        <span className="text-[10px] font-medium">{item.totalReviews === 1 ? "Review" : "Reviews"}</span>
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="flex items-center gap-2.5 my-1.5">
                      {item.product?.thumbnail ? (
                        <img
                          src={getImageUrl(item.product.thumbnail)}
                          alt={item.product?.name || "Product"}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-base flex-shrink-0">
                          📦
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors" title={item.product?.name}>
                          {item.product?.name || "Product"}
                        </p>
                        {item.product?.category?.name && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.product.category.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Score & Filter Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                      <div className="flex items-center gap-1">
                        <StarRating value={item.averageRating} size="xs" />
                        <span className="font-bold text-slate-700">{item.averageRating.toFixed(1)}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${isSelected ? "text-amber-700 font-extrabold" : "text-slate-400 group-hover:text-slate-700"}`}>
                        {isSelected ? "Active Filter" : "Filter"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reviews Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full border-3 border-indigo-600/20 border-t-indigo-600 animate-spin" />
            <p className="text-xs font-medium text-slate-400">{t("reviews.loadingReviews", { defaultValue: "Loading customer reviews..." })}</p>
          </div>
        ) : adminReviews.length === 0 ? (
          <div className="py-16 text-center space-y-3 p-6">
            <div className="text-4xl">🔍</div>
            <h3 className="text-base font-bold text-slate-900">{t("reviews.noReviews", { defaultValue: "No Reviews Found" })}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t("reviews.noReviewsFilter", { defaultValue: "No customer reviews matched your search criteria. Try modifying your filters." })}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {adminReviews.map((rev) => {
              const formattedDate = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "";

              return (
                <div
                  key={rev.id}
                  className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-6"
                >
                  {/* Left: Product preview + Review details */}
                  <div className="flex-1 flex flex-col sm:flex-row items-start gap-4">
                    {/* Product Thumbnail */}
                    {rev.product && (
                      <Link
                        to={`/products/${rev.product.slug}`}
                        target="_blank"
                        className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 group block"
                        title={`View ${rev.product.name}`}
                      >
                        {rev.product.thumbnail ? (
                          <img
                            src={getImageUrl(rev.product.thumbnail)}
                            alt={rev.product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            📦
                          </div>
                        )}
                      </Link>
                    )}

                    {/* Review Body */}
                    <div className="space-y-2 flex-1">
                      {/* Product Name & Reviewer Info */}
                      <div className="flex flex-wrap items-center gap-2">
                        {rev.product && (
                          <Link
                            to={`/products/${rev.product.slug}`}
                            target="_blank"
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            {rev.product.name}
                          </Link>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {t("reviews.by", { defaultValue: "by" })} <strong>{rev.user?.name || "Customer"}</strong> ({rev.user?.email})
                        </span>
                      </div>

                      {/* Rating & Date */}
                      <div className="flex items-center gap-2">
                        <StarRating value={rev.rating} size="sm" />
                        <span className="text-xs font-bold text-slate-900">{rev.rating}.0</span>
                        <span className="text-xs text-slate-400">· {formattedDate}</span>
                      </div>

                      {/* Title & Comment */}
                      {rev.title && (
                        <h4 className="text-sm font-bold text-slate-900">{rev.title}</h4>
                      )}
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
                        {rev.comment}
                      </p>

                      {/* Attached Photos */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rev.images.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPhoto(img)}
                              className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 transition-colors cursor-pointer bg-slate-100"
                            >
                              <img
                                src={getImageUrl(img)}
                                alt={`Review photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Badge & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 flex-shrink-0">
                    <div>{getStatusBadge(rev.status)}</div>

                    <div className="flex items-center gap-1.5">
                      {rev.status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rev, "APPROVED")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Approve Review"
                        >
                          <Icon name="check" className="w-3.5 h-3.5" />
                          <span>{t("admin.approve", { defaultValue: "Approve" })}</span>
                        </button>
                      )}

                      {rev.status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rev, "REJECTED")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Reject Review"
                        >
                          <Icon name="close" className="w-3.5 h-3.5" />
                          <span>{t("admin.reject", { defaultValue: "Reject" })}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setReviewToDelete(rev)}
                        disabled={actionLoading}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              isLoading={loading}
              totalItems={totalAdminReviews}
              currentItemsCount={adminReviews.length}
              itemLabel="reviews"
              align="between"
              infoFormat="fraction"
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      <Modal
        isOpen={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        size="3xl"
        bodyClassName="p-2 flex items-center justify-center bg-slate-900/90 rounded-2xl overflow-hidden"
        className="bg-transparent border-0 shadow-none"
      >
        {selectedPhoto && (
          <div className="relative flex items-center justify-center max-h-[85vh] w-full">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close photo preview"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
            <img
              src={getImageUrl(selectedPhoto)}
              alt="Full review photo"
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("reviews.deleteReviewTitle", { defaultValue: "Delete Review Permanently" })}
        message={t("messages.reviews.deleteConfirm", { defaultValue: MESSAGES.REVIEWS.DELETE_CONFIRM })}
        confirmText={t("reviews.deleteReview", { defaultValue: "Delete Review" })}
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AdminReviewsPage;
