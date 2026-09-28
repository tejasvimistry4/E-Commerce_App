import { createSlice } from "@reduxjs/toolkit";
import {
  Review,
  ReviewStats,
  TopReviewedProduct,
} from "../../types/review";
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
} from "./reviewThunk";

export * from "./reviewThunk";

export interface ReviewState {
  productReviews: Review[];
  productStats: ReviewStats | null;
  userReview: Review | null;
  canReview: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  adminReviews: Review[];
  totalAdminReviews: number;
  adminStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    averageRating: number;
    fiveStarRatio: number;
  } | null;
  topReviewedProducts: TopReviewedProduct[];
  topReviewedLoading: boolean;
  loading: boolean;
  reviewsLoading: boolean;
  eligibilityLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  productReviews: [],
  productStats: null,
  userReview: null,
  canReview: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
  adminReviews: [],
  totalAdminReviews: 0,
  adminStats: null,
  topReviewedProducts: [],
  topReviewedLoading: false,
  loading: false,
  reviewsLoading: false,
  eligibilityLoading: false,
  actionLoading: false,
  error: null,
};

export const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    clearProductReviews: (state) => {
      state.productReviews = [];
      state.productStats = null;
      state.userReview = null;
      state.canReview = false;
    },
    clearReviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProductReviews
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.productReviews = action.payload.reviews;
        state.productStats = action.payload.stats;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.error = action.payload || null;
      });

    // fetchUserReviewEligibility
    builder
      .addCase(fetchUserReviewEligibility.pending, (state) => {
        state.eligibilityLoading = true;
      })
      .addCase(fetchUserReviewEligibility.fulfilled, (state, action) => {
        state.eligibilityLoading = false;
        state.canReview = action.payload.canReview;
        state.userReview = action.payload.existingReview;
      })
      .addCase(fetchUserReviewEligibility.rejected, (state) => {
        state.eligibilityLoading = false;
      });

    // createReview
    builder
      .addCase(createReview.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.userReview = action.payload;
        // prepend to reviews if not already in list
        const exists = state.productReviews.some((r) => r.id === action.payload.id);
        if (!exists) {
          state.productReviews.unshift(action.payload);
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      });

    // updateReview
    builder
      .addCase(updateReview.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.userReview = action.payload;
        state.productReviews = state.productReviews.map((r) =>
          r.id === action.payload.id ? action.payload : r
        );
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      });

    // deleteReview
    builder
      .addCase(deleteReview.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.userReview = null;
        state.productReviews = state.productReviews.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || null;
      });

    // fetchAdminReviews
    builder
      .addCase(fetchAdminReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.adminReviews = action.payload.reviews;
        state.totalAdminReviews = action.payload.total;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });

    // fetchAdminReviewStats
    builder
      .addCase(fetchAdminReviewStats.fulfilled, (state, action) => {
        state.adminStats = action.payload;
      });

    // updateAdminReviewStatus
    builder
      .addCase(updateAdminReviewStatus.fulfilled, (state, action) => {
        state.adminReviews = state.adminReviews.map((r) =>
          r.id === action.payload.id ? action.payload : r
        );
      });

    // deleteAdminReview
    builder
      .addCase(deleteAdminReview.fulfilled, (state, action) => {
        state.adminReviews = state.adminReviews.filter((r) => r.id !== action.payload);
        state.totalAdminReviews = Math.max(0, state.totalAdminReviews - 1);
      });

    // fetchTopReviewedProducts
    builder
      .addCase(fetchTopReviewedProducts.pending, (state) => {
        state.topReviewedLoading = true;
      })
      .addCase(fetchTopReviewedProducts.fulfilled, (state, action) => {
        state.topReviewedLoading = false;
        state.topReviewedProducts = action.payload;
      })
      .addCase(fetchTopReviewedProducts.rejected, (state) => {
        state.topReviewedLoading = false;
      });
  },
});

export const { clearProductReviews, clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;
