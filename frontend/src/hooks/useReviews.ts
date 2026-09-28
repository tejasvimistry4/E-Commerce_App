import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchProductReviews,
  fetchUserReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
  fetchAdminReviews,
  fetchAdminReviewStats,
  updateAdminReviewStatus,
  deleteAdminReview,
  fetchTopReviewedProducts,
} from "../redux/reviews/reviewThunk";
import {
  clearProductReviews,
  clearReviewError,
} from "../redux/reviews/reviewSlice";
import { selectReviewsState } from "../redux/reviews/selectors";
import {
  ReviewFilterParams,
  AdminReviewFilterParams,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewStatus,
} from "../types/review";

export const useReviews = () => {
  const dispatch = useAppDispatch();
  const reviewState = useAppSelector(selectReviewsState);

  return {
    ...reviewState,
    loadProductReviews: (productId: string, params?: ReviewFilterParams) =>
      dispatch(fetchProductReviews({ productId, params })),
    checkEligibility: (productId: string) =>
      dispatch(fetchUserReviewEligibility(productId)),
    submitReview: (productId: string, data: CreateReviewRequest) =>
      dispatch(createReview({ productId, data })),
    editReview: (reviewId: string, data: UpdateReviewRequest) =>
      dispatch(updateReview({ reviewId, data })),
    removeReview: (reviewId: string) => dispatch(deleteReview(reviewId)),
    loadAdminReviews: (params?: AdminReviewFilterParams) =>
      dispatch(fetchAdminReviews(params)),
    loadAdminStats: () => dispatch(fetchAdminReviewStats()),
    loadTopReviewedProducts: (limit?: number) =>
      dispatch(fetchTopReviewedProducts(limit)),
    changeReviewStatus: (reviewId: string, status: ReviewStatus) =>
      dispatch(updateAdminReviewStatus({ reviewId, status })),
    removeAdminReview: (reviewId: string) => dispatch(deleteAdminReview(reviewId)),
    resetProductReviews: () => dispatch(clearProductReviews()),
    resetError: () => dispatch(clearReviewError()),
  };
};

export default useReviews;
