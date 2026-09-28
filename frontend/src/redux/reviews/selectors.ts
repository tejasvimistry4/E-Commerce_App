import { RootState } from "../store";

export const selectReviewsState = (state: RootState) => state.reviews;
export const selectProductReviews = (state: RootState) => state.reviews.productReviews;
export const selectProductStats = (state: RootState) => state.reviews.productStats;
export const selectUserReview = (state: RootState) => state.reviews.userReview;
export const selectCanReview = (state: RootState) => state.reviews.canReview;
export const selectReviewPagination = (state: RootState) => state.reviews.pagination;
export const selectAdminReviews = (state: RootState) => state.reviews.adminReviews;
export const selectTotalAdminReviews = (state: RootState) => state.reviews.totalAdminReviews;
export const selectAdminReviewStats = (state: RootState) => state.reviews.adminStats;
export const selectTopReviewedProducts = (state: RootState) => state.reviews.topReviewedProducts;
export const selectTopReviewedLoading = (state: RootState) => state.reviews.topReviewedLoading;
export const selectReviewsLoading = (state: RootState) => state.reviews.loading;
export const selectProductReviewsLoading = (state: RootState) => state.reviews.reviewsLoading;
export const selectReviewEligibilityLoading = (state: RootState) => state.reviews.eligibilityLoading;
export const selectReviewsActionLoading = (state: RootState) => state.reviews.actionLoading;
export const selectReviewsError = (state: RootState) => state.reviews.error;
