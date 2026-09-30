import React, { useEffect, useState } from "react";
import { Review, CreateReviewRequest, UpdateReviewRequest } from "../../types/review";
import { ReviewSummary } from "./ReviewSummary";
import { ReviewFilterBar } from "./ReviewFilterBar";
import { ReviewCard } from "./ReviewCard";
import { ConfirmationModal, Modal, Button, Pagination, Input, Textarea, Icon } from "../common";
import { useReviews } from "../../hooks/useReviews";
import { useAppSelector } from "../../hooks/redux";
import { MESSAGES } from "../../constants/messages";
import { handleSingleImageFileUpload, getImageUrl } from "../../utils/image.utils";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  openWriteModalTrigger?: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  openWriteModalTrigger,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const RATING_LABELS: Record<number, string> = {
    1: t("reviews.ratingTerrible", { defaultValue: "Terrible" }),
    2: t("reviews.ratingPoor", { defaultValue: "Poor" }),
    3: t("reviews.ratingAverage", { defaultValue: "Average" }),
    4: t("reviews.ratingGood", { defaultValue: "Good" }),
    5: t("reviews.ratingExcellent", { defaultValue: "Excellent" }),
  };

  const {
    productReviews,
    productStats,
    userReview,
    reviewsLoading,
    actionLoading,
    pagination,
    loadProductReviews,
    checkEligibility,
    submitReview,
    editReview,
    removeReview,
  } = useReviews();

  // Filters State
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [hasImagesOnly, setHasImagesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"createdAt" | "rating">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const [formRating, setFormRating] = useState<number>(5);
  const [formHoverRating, setFormHoverRating] = useState<number>(0);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formComment, setFormComment] = useState<string>("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Helper to fetch reviews
  const fetchReviews = (targetPage = page) => {
    if (!productId) return;
    loadProductReviews(productId, {
      page: targetPage,
      limit: 8,
      rating: ratingFilter,
      hasImages: hasImagesOnly ? true : undefined,
      sortBy,
      sortOrder,
    });
  };

  // Load reviews on filter/page change
  useEffect(() => {
    fetchReviews(page);
  }, [productId, page, ratingFilter, hasImagesOnly, sortBy, sortOrder]);

  // Check user review status when authenticated
  useEffect(() => {
    if (productId && isAuthenticated) {
      checkEligibility(productId);
    }
  }, [productId, isAuthenticated]);

  // Sync form state on modal open
  useEffect(() => {
    if (isModalOpen) {
      if (editingReview) {
        setFormRating(editingReview.rating || 5);
        setFormTitle(editingReview.title || "");
        setFormComment(editingReview.comment || "");
        setFormImages(editingReview.images || []);
      } else {
        setFormRating(5);
        setFormTitle("");
        setFormComment("");
        setFormImages([]);
      }
      setFormHoverRating(0);
    }
  }, [isModalOpen, editingReview]);

  const handleOpenWriteModal = () => {
    if (!isAuthenticated) {
      toast.info(t("messages.reviews.loginToReview", { defaultValue: MESSAGES.REVIEWS.LOGIN_TO_REVIEW }));
      navigate("/login");
      return;
    }
    setEditingReview(userReview || null);
    setIsModalOpen(true);
  };

  // Open write modal when triggered externally (e.g. from top product rating link)
  useEffect(() => {
    if (openWriteModalTrigger && openWriteModalTrigger > 0) {
      handleOpenWriteModal();
    }
  }, [openWriteModalTrigger]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formImages.length >= 5) {
      toast.warning(t("reviews.maxImagesWarning", { defaultValue: "You can upload a maximum of 5 images per review." }));
      return;
    }
    await handleSingleImageFileUpload(e, {
      onSuccess: (uploadedUrl) => {
        if (uploadedUrl) {
          setFormImages((prev) => [...prev, uploadedUrl]);
        }
      },
      setUploading: setUploadingImage,
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formRating || formRating < 1 || formRating > 5) {
      toast.error(t("reviews.validRatingRequired", { defaultValue: "Please select a valid star rating (1-5)." }));
      return;
    }

    if (!formComment.trim() || formComment.trim().length < 5) {
      toast.error(t("reviews.commentLengthRequired", { defaultValue: "Please provide a review comment with at least 5 characters." }));
      return;
    }

    const payload: CreateReviewRequest | UpdateReviewRequest = {
      rating: formRating,
      title: formTitle.trim() || undefined,
      comment: formComment.trim(),
      images: formImages.length > 0 ? formImages : undefined,
    };

    try {
      if (editingReview) {
        const resultAction = await editReview(editingReview.id, payload);
        if (resultAction && (resultAction as any).type.endsWith("fulfilled")) {
          toast.success(t("messages.reviews.updateSuccess", { defaultValue: MESSAGES.REVIEWS.UPDATE_SUCCESS }));
          setIsModalOpen(false);
          setEditingReview(null);
          fetchReviews(1);
        } else {
          toast.error(t("messages.common.genericError", { defaultValue: MESSAGES.REVIEWS.SUBMIT_FAILED }));
        }
      } else {
        const resultAction = await submitReview(productId, payload as CreateReviewRequest);
        if (resultAction && (resultAction as any).type.endsWith("fulfilled")) {
          toast.success(t("messages.reviews.submitSuccess", { defaultValue: MESSAGES.REVIEWS.SUBMIT_SUCCESS }));
          setIsModalOpen(false);
          setEditingReview(null);
          fetchReviews(1);
        } else {
          toast.error(t("messages.common.genericError", { defaultValue: MESSAGES.REVIEWS.SUBMIT_FAILED }));
        }
      }
    } catch (err: any) {
      toast.error(err?.message || t("messages.common.genericError", { defaultValue: MESSAGES.REVIEWS.SUBMIT_FAILED }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    try {
      const resultAction = await removeReview(deletingReview.id);
      if (resultAction && (resultAction as any).type.endsWith("fulfilled")) {
        toast.success(t("messages.reviews.deleteSuccess", { defaultValue: MESSAGES.REVIEWS.DELETE_SUCCESS }));
        fetchReviews(1);
      } else {
        toast.error(t("messages.common.genericError", { defaultValue: MESSAGES.REVIEWS.DELETE_FAILED }));
      }
    } catch (err: any) {
      toast.error(err?.message || t("messages.common.genericError", { defaultValue: MESSAGES.REVIEWS.DELETE_FAILED }));
    } finally {
      setDeletingReview(null);
    }
  };

  const hasReviews = Boolean(productStats && productStats.totalReviews > 0);
  const activeRating = formHoverRating || formRating;

  return (
    <section id="reviews-section" className="mt-10 pt-8 border-t border-slate-200">
      <div className="space-y-6">
        {/* Section Title & Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("reviews.title", { defaultValue: "Customer Reviews" })} {productStats?.totalReviews ? `(${productStats.totalReviews})` : ""}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t("reviews.feedbackSubtitle", { defaultValue: "Real feedback and ratings from customers" })}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenWriteModal}
          >
            {userReview ? t("reviews.editReview", { defaultValue: "Edit Your Review" }) : t("reviews.writeReview", { defaultValue: "Write a Review" })}
          </Button>
        </div>

        {reviewsLoading && !productStats ? (
          <div className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
        ) : hasReviews ? (
          <>
            {/* Aggregate Ratings & Summary */}
            <ReviewSummary
              stats={productStats}
              onWriteReview={handleOpenWriteModal}
              hasReviewed={Boolean(userReview)}
              onFilterRating={(r) => {
                setRatingFilter(r);
                setPage(1);
              }}
              activeRatingFilter={ratingFilter}
            />

            {/* Filter & Sort Controls */}
            <ReviewFilterBar
              ratingFilter={ratingFilter}
              onRatingChange={(r?: number) => {
                setRatingFilter(r);
                setPage(1);
              }}
              hasImagesOnly={hasImagesOnly}
              onHasImagesChange={(hasImages: boolean) => {
                setHasImagesOnly(hasImages);
                setPage(1);
              }}
              sortBy={sortBy}
              onSortByChange={(sort: "createdAt" | "rating") => {
                setSortBy(sort);
                setPage(1);
              }}
              sortOrder={sortOrder}
              onSortOrderChange={(order: "asc" | "desc") => {
                setSortOrder(order);
                setPage(1);
              }}
              totalResults={productStats?.totalReviews || 0}
            />

            {/* Reviews List */}
            {reviewsLoading && productReviews.length === 0 ? (
              <div className="space-y-3 py-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
                  />
                ))}
              </div>
            ) : productReviews.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  {t("reviews.noReviewsFilter", { defaultValue: "No reviews match your selected filter." })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRatingFilter(undefined);
                    setHasImagesOnly(false);
                  }}
                  className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  {t("products.clearFilters", { defaultValue: "Clear Filters" })}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {productReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={user?.id}
                    isAdmin={user?.role === "SUPER_ADMIN"}
                    onEdit={(r) => {
                      setEditingReview(r);
                      setIsModalOpen(true);
                    }}
                    onDelete={(r) => setDeletingReview(r)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
                isLoading={reviewsLoading}
                infoFormat="page-of-total"
                className="pt-4"
              />
            )}
          </>
        ) : (
          <div className="py-8 text-center text-xs font-semibold text-slate-500 bg-slate-50/80 rounded-2xl border border-slate-200/60">
            {t("reviews.noReviews", { defaultValue: "No reviews yet" })}
          </div>
        )}
      </div>

      {/* Reusable Common Modal for Customer Review */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReview(null);
        }}
        size="lg"
        isLoading={actionLoading}
        badge={
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            {editingReview ? t("reviews.updateYourReview", { defaultValue: "Update Your Review" }) : t("reviews.writeCustomerReview", { defaultValue: "Write Customer Review" })}
          </span>
        }
        title={editingReview ? t("reviews.editReview", { defaultValue: "Edit Review" }) : t("reviews.reviewProduct", { name: productName, defaultValue: `Review ${productName}` })}
        subtitle={t("reviews.formSubtitle", { defaultValue: "Share your honest feedback to help other shoppers make better decisions." })}
        bodyClassName="p-6"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setIsModalOpen(false);
                setEditingReview(null);
              }}
              disabled={actionLoading}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleFormSubmit}
              loading={actionLoading}
              disabled={uploadingImage}
            >
              {editingReview ? t("reviews.updateReview", { defaultValue: "Update Review" }) : t("reviews.submitReview", { defaultValue: "Submit Review" })}
            </Button>
          </>
        }
      >
        <form id="review-form" onSubmit={handleFormSubmit} className="space-y-5">
          {/* Rating Picker */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t("reviews.overallRating", { defaultValue: "Overall Rating" })} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormRating(star)}
                    onMouseEnter={() => setFormHoverRating(star)}
                    onMouseLeave={() => setFormHoverRating(0)}
                    className="p-1 focus:outline-none transform transition-transform hover:scale-115 active:scale-95 cursor-pointer"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Icon
                      name="star"
                      className={`w-8 h-8 transition-colors ${isFilled
                          ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                          : "text-slate-300 hover:text-amber-200"
                        }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-bold text-indigo-700 h-4">
              {RATING_LABELS[activeRating] || ""}
            </div>
          </div>

          {/* Review Title */}
          <Input
            label={t("reviews.headline", { defaultValue: "Review Headline" })}
            optional
            size="sm"
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            maxLength={100}
            placeholder={t("reviews.headlinePlaceholder", { defaultValue: "e.g., Exceeded my expectations! High quality build." })}
          />

          {/* Detailed Comment */}
          <Textarea
            label={t("reviews.yourReview", { defaultValue: "Your Review" })}
            required
            size="sm"
            rows={4}
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            maxLength={1000}
            placeholder={t("reviews.yourReviewPlaceholder", { defaultValue: "What did you like or dislike? What was the fit, feel, or quality like?" })}
            helperText={`${formComment.length} / 1000 chars`}
          />

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t("reviews.attachPhotos", { defaultValue: "Attach Product Photos (Max 5)" })}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {formImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group shadow-2xs bg-slate-100"
                >
                  <img
                    src={getImageUrl(imgUrl)}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                    aria-label="Remove image"
                  >
                    <Icon name="close" className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {formImages.length < 5 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 cursor-pointer transition-all">
                  <Icon name="upload-cloud" className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-bold">
                    {uploadingImage ? "..." : t("common.upload", { defaultValue: "Add" })}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleConfirmDelete}
        title={t("reviews.deleteReview", { defaultValue: "Delete Review" })}
        message={t("reviews.deleteConfirm", { defaultValue: MESSAGES.REVIEWS.DELETE_CONFIRM })}
        confirmText={t("reviews.deleteReview", { defaultValue: "Delete Review" })}
        variant="danger"
        isLoading={actionLoading}
      />
    </section>
  );
};

export default ProductReviewsSection;
