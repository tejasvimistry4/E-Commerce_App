import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Review,
  ReviewStats,
  ReviewFilterParams,
  AdminReviewFilterParams,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewStatus,
  TopReviewedProduct,
} from "../../types/review";
import {
  getProductReviewsApi,
  getUserReviewForProductApi,
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
  getAdminReviewsApi,
  getAdminReviewStatsApi,
  updateAdminReviewStatusApi,
  deleteAdminReviewApi,
  getTopReviewedProductsApi,
} from "../../api/review.api";
import { MESSAGES } from "../../constants/messages";

// 1. Fetch approved reviews and statistics for a product
export const fetchProductReviews = createAsyncThunk<
  { reviews: Review[]; stats: ReviewStats; pagination: any },
  { productId: string; params?: ReviewFilterParams },
  { rejectValue: string }
>("reviews/fetchProductReviews", async ({ productId, params }, { rejectWithValue }) => {
  try {
    const res = await getProductReviewsApi(productId, params);
    return {
      reviews: res.reviews,
      stats: res.stats,
      pagination: res.pagination,
    };
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.REVIEWS.LOAD_FAILED;
    return rejectWithValue(message);
  }
});

// 2. Fetch user's review eligibility for product
export const fetchUserReviewEligibility = createAsyncThunk<
  { canReview: boolean; existingReview: Review | null },
  string,
  { rejectValue: string }
>("reviews/fetchUserReviewEligibility", async (productId, { rejectWithValue }) => {
  try {
    const res = await getUserReviewForProductApi(productId);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to check review eligibility";
    return rejectWithValue(message);
  }
});

// 3. Create review
export const createReview = createAsyncThunk<
  Review,
  { productId: string; data: CreateReviewRequest },
  { rejectValue: string }
>("reviews/createReview", async ({ productId, data }, { rejectWithValue }) => {
  try {
    const res = await createReviewApi(productId, data);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.REVIEWS.SUBMIT_FAILED;
    return rejectWithValue(message);
  }
});

// 4. Update review
export const updateReview = createAsyncThunk<
  Review,
  { reviewId: string; data: UpdateReviewRequest },
  { rejectValue: string }
>("reviews/updateReview", async ({ reviewId, data }, { rejectWithValue }) => {
  try {
    const res = await updateReviewApi(reviewId, data);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update review";
    return rejectWithValue(message);
  }
});

// 5. Delete review (user)
export const deleteReview = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("reviews/deleteReview", async (reviewId, { rejectWithValue }) => {
  try {
    await deleteReviewApi(reviewId);
    return reviewId;
  } catch (error: any) {
    const message = error.response?.data?.message || MESSAGES.REVIEWS.DELETE_FAILED;
    return rejectWithValue(message);
  }
});

// 6. Admin: Fetch all reviews
export const fetchAdminReviews = createAsyncThunk<
  { reviews: Review[]; total: number; page: number; limit: number; totalPages: number },
  AdminReviewFilterParams | undefined,
  { rejectValue: string }
>("reviews/fetchAdminReviews", async (params, { rejectWithValue }) => {
  try {
    const res = await getAdminReviewsApi(params);
    return {
      reviews: res.reviews,
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch admin reviews";
    return rejectWithValue(message);
  }
});

// 8. Admin: Fetch stats
export const fetchAdminReviewStats = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("reviews/fetchAdminReviewStats", async (_, { rejectWithValue }) => {
  try {
    const res = await getAdminReviewStatsApi();
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch review metrics";
    return rejectWithValue(message);
  }
});

// 9. Admin: Update review status
export const updateAdminReviewStatus = createAsyncThunk<
  Review,
  { reviewId: string; status: ReviewStatus },
  { rejectValue: string }
>("reviews/updateAdminReviewStatus", async ({ reviewId, status }, { rejectWithValue }) => {
  try {
    const res = await updateAdminReviewStatusApi(reviewId, status);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update review status";
    return rejectWithValue(message);
  }
});

// 10. Admin: Delete review
export const deleteAdminReview = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("reviews/deleteAdminReview", async (reviewId, { rejectWithValue }) => {
  try {
    await deleteAdminReviewApi(reviewId);
    return reviewId;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete review";
    return rejectWithValue(message);
  }
});

// 11. Fetch top reviewed products
export const fetchTopReviewedProducts = createAsyncThunk<
  TopReviewedProduct[],
  number | undefined,
  { rejectValue: string }
>("reviews/fetchTopReviewedProducts", async (limit = 5, { rejectWithValue }) => {
  try {
    const res = await getTopReviewedProductsApi(limit);
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch top reviewed products";
    return rejectWithValue(message);
  }
});
